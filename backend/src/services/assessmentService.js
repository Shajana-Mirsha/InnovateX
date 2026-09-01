const Anthropic = require("@anthropic-ai/sdk");
const Submission = require("../models/Submission");
const Score = require("../models/Score");
const Hackathon = require("../models/Hackathon");
const { getFewShotCorrectionExamples } = require("./calibrationService");
const { emitToHackathon } = require("../socket");

/**
 * Fetches repository README content via GitHub REST API if GITHUB_TOKEN is available.
 * @param {string} githubUrl - GitHub repository URL
 * @returns {Promise<string|null>} README markdown content or null
 */
async function fetchGitHubReadme(githubUrl) {
  if (!githubUrl || typeof githubUrl !== "string") return null;

  const token = process.env.GITHUB_TOKEN;
  const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/i);
  if (!match) return null;

  const owner = match[1];
  const repo = match[2];

  try {
    const headers = {
      Accept: "application/vnd.github.v3.raw",
      "User-Agent": "InnovateX-Automated-Evaluator"
    };

    if (token && token.trim() !== "") {
      headers.Authorization = `Bearer ${token.trim()}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      { headers }
    );

    if (response.ok) {
      const readmeText = await response.text();
      return readmeText.length > 8000
        ? `${readmeText.substring(0, 8000)}\n\n[...README truncated for evaluation...]`
        : readmeText;
    }
  } catch (err) {
    console.warn(`[GitHub API] Could not fetch README for ${owner}/${repo}: ${err.message}`);
  }

  return null;
}

/**
 * Validates dynamic criterionScores array against Hackathon criteria.
 * @param {object} data - Parsed model JSON payload
 * @param {Array} expectedCriteria - Array of { name, maxScore }
 * @returns {boolean}
 */
function validateDynamicEvaluationPayload(data, expectedCriteria) {
  if (!data || typeof data !== "object") return false;

  if (!Array.isArray(data.criterionScores) || data.criterionScores.length === 0) {
    return false;
  }

  const criterionMap = new Map();
  data.criterionScores.forEach((c) => {
    if (c && c.criterion) {
      criterionMap.set(c.criterion, c);
    }
  });

  for (const exp of expectedCriteria) {
    const scored = criterionMap.get(exp.name);
    if (!scored) return false;

    if (
      typeof scored.score !== "number" ||
      isNaN(scored.score) ||
      scored.score < 0 ||
      scored.score > exp.maxScore
    ) {
      return false;
    }

    if (typeof scored.rationale !== "string" || scored.rationale.trim().length === 0) {
      return false;
    }
  }

  if (typeof data.feedback !== "string") {
    return false;
  }

  if (data.confidence !== undefined && data.confidence !== null) {
    if (typeof data.confidence !== "number" || data.confidence < 0 || data.confidence > 1) {
      return false;
    }
  }

  return true;
}

/**
 * Extracts and validates JSON from model raw text response.
 * @param {string} text
 * @param {Array} expectedCriteria
 * @returns {object|null}
 */
function extractDynamicJson(text, expectedCriteria) {
  if (!text || typeof text !== "string") return null;

  try {
    const parsed = JSON.parse(text.trim());
    if (validateDynamicEvaluationPayload(parsed, expectedCriteria)) return parsed;
  } catch (e) {}

  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (validateDynamicEvaluationPayload(parsed, expectedCriteria)) return parsed;
    } catch (e) {
      return null;
    }
  }

  return null;
}

/**
 * Evaluates a real hackathon submission using Anthropic Claude API with few-shot calibration.
 * @param {string} submissionId - MongoDB ObjectId of the submission
 * @returns {Promise<object>} Created Score document
 */
async function generateAiAssessment(submissionId) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in environment variables."
    );
  }

  const submission = await Submission.findById(submissionId)
    .populate("hackathon")
    .populate("team", "name");

  if (!submission) {
    throw new Error(`Submission with ID ${submissionId} not found`);
  }

  const existingAiScore = await Score.findOne({
    submission: submissionId,
    source: "ai"
  });

  if (existingAiScore) {
    throw new Error("An AI score already exists for this submission");
  }

  const criteria = submission.hackathon?.criteria && submission.hackathon.criteria.length > 0
    ? submission.hackathon.criteria
    : [
        { name: "innovation", description: "Originality, novelty, and creative problem-solving approach.", weight: 1, maxScore: 10 },
        { name: "technicalImplementation", description: "Architecture soundness, engineering complexity, repository feasibility, and technical execution.", weight: 1, maxScore: 10 },
        { name: "impact", description: "Real-world value, scalability, market applicability, and practical problem resolution.", weight: 1, maxScore: 10 },
        { name: "presentation", description: "Documentation clarity, pitch coherence, and communication of the project value.", weight: 1, maxScore: 10 }
      ];

  let readmeContent = null;
  if (submission.githubLink) {
    readmeContent = await fetchGitHubReadme(submission.githubLink);
  }

  // Module 8: Fetch few-shot recalibration examples from real human corrections
  let calibrationSection = "";
  if (submission.hackathon?._id) {
    try {
      const correctionSamples = await getFewShotCorrectionExamples(submission.hackathon._id, 2);
      if (correctionSamples.length > 0) {
        calibrationSection = `\n### Historical Human Judge Calibration Examples (Learn from past judging standards):\n` +
          correctionSamples
            .map(
              (s, i) =>
                `Example ${i + 1}:\n- Project Context: ${s.submissionText.substring(0, 200).replace(/\n/g, " ")}...\n- Criterion "${s.criterion}": Initial AI scored ${s.aiScore}, human judge corrected to ${s.humanScore} (Rationale: "${s.humanRationale}")`
            )
            .join("\n\n") +
          `\nUse the calibration examples above to align your scoring standards with this specific competition's expert judges.\n`;
      }
    } catch (calibErr) {
      console.warn(`[Calibration] Could not fetch few-shot examples: ${calibErr.message}`);
    }
  }

  const anthropic = new Anthropic({ apiKey });
  const modelName = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";

  const rubricDescription = criteria
    .map(
      (c, idx) =>
        `${idx + 1}. "${c.name}" (Max Score: ${c.maxScore}, Weight: ${c.weight}): ${c.description || "Evaluate quality and rigor."}`
    )
    .join("\n");

  const prompt = `You are an expert, objective hackathon judge and IEEE technical reviewer.
Evaluate the following hackathon project submission strictly based on the provided real data and the specific competition rubric.

### Hackathon Context:
- Event: ${submission.hackathon?.title || "National Innovation Challenge"}
- Domain: ${submission.hackathon?.domain || "General Engineering"}
- Overview: ${submission.hackathon?.description || "N/A"}

### Submission Details:
- Project Title: ${submission.title}
- Project Description: ${submission.description}
- Team: ${submission.team?.name || "N/A"}
- GitHub Link: ${submission.githubLink || "Not provided"}
- Demo Link: ${submission.demoLink || "Not provided"}
- Presentation Link: ${submission.presentationLink || "Not provided"}
${readmeContent ? `\n### Repository README (Fetched from GitHub):\n${readmeContent}\n` : ""}${calibrationSection}

### Evaluation Rubric:
${rubricDescription}

### Instructions:
1. Score each criterion individually from 0.0 to its maxScore based purely on the technical evidence provided.
2. Use only information contained in the provided submission. Do not invent implementation details, metrics, users, technologies, or outcomes.
3. Provide a concise, highly specific rationale for each criterion score explaining the grade.
4. Provide an estimated confidence value between 0.0 (low certainty) and 1.0 (high certainty in assessment).
5. Provide constructive overall feedback.
6. Return ONLY a valid JSON object matching the exact schema below, without markdown code fences or conversational text.

Schema:
{
  "criterionScores": [
${criteria.map((c) => `    { "criterion": "${c.name}", "score": <number between 0 and ${c.maxScore}>, "rationale": "<specific justification>" }`).join(",\n")}
  ],
  "confidence": <number between 0.0 and 1.0>,
  "feedback": "<constructive feedback summary>"
}`;

  let evaluation = null;
  let rawText = "";

  try {
    const response = await anthropic.messages.create({
      model: modelName,
      max_tokens: 2000,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    });

    rawText = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    evaluation = extractDynamicJson(rawText, criteria);
  } catch (apiError) {
    throw new Error(`Anthropic API call failed: ${apiError.message}`);
  }

  // Retry once on malformed output
  if (!evaluation) {
    try {
      const retryResponse = await anthropic.messages.create({
        model: modelName,
        max_tokens: 2000,
        temperature: 0.0,
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: rawText },
          {
            role: "user",
            content: `Your previous response did not match the required JSON schema or missed one or more criteria. Output ONLY the raw JSON object containing all required criteria (${criteria.map((c) => c.name).join(", ")}). No markdown or extra text.`
          }
        ]
      });

      const retryText = retryResponse.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      evaluation = extractDynamicJson(retryText, criteria);
      if (evaluation) {
        rawText = retryText;
      }
    } catch (retryError) {
      throw new Error(`AI Assessment retry failed: ${retryError.message}`);
    }
  }

  if (!evaluation) {
    throw new Error(
      "Failed to parse and validate AI evaluation output from model after retry. No placeholder scores used."
    );
  }

  const totalScore =
    Math.round(
      evaluation.criterionScores.reduce((sum, item) => sum + item.score, 0) * 100
    ) / 100;

  const scoreData = {
    submission: submissionId,
    source: "ai",
    provider: "anthropic",
    model: modelName,
    promptVersion: "1.0.0",
    confidence: typeof evaluation.confidence === "number" ? evaluation.confidence : null,
    criterionScores: evaluation.criterionScores,
    feedback: evaluation.feedback || "",
    totalScore,
    rawModelResponse: rawText
  };

  evaluation.criterionScores.forEach((item) => {
    if (["innovation", "technicalImplementation", "impact", "presentation"].includes(item.criterion)) {
      scoreData[item.criterion] = item.score;
      if (!scoreData.criterionRationale) scoreData.criterionRationale = {};
      scoreData.criterionRationale[item.criterion] = item.rationale;
    }
  });

  const score = await Score.create(scoreData);

  // Emit score created event
  emitToHackathon(submission.hackathon?._id || submission.hackathon, "score:created", {
    submissionId,
    score
  });

  return score;
}

/**
 * Batch evaluates all real submissions for a hackathon.
 * @param {string} hackathonId
 * @param {object} options - { force: boolean, rateLimitDelayMs: number }
 * @returns {Promise<object>}
 */
async function batchEvaluateHackathon(hackathonId, options = {}) {
  const { force = false, rateLimitDelayMs = 600 } = options;

  const submissions = await Submission.find({
    hackathon: hackathonId,
    status: "submitted"
  });

  const results = {
    totalSubmissions: submissions.length,
    evaluatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    details: []
  };

  for (let idx = 0; idx < submissions.length; idx++) {
    const submission = submissions[idx];

    // Emit live status: scoring
    emitToHackathon(hackathonId, "ai-evaluate:progress", {
      hackathonId,
      submissionId: submission._id,
      title: submission.title,
      status: "scoring",
      index: idx + 1,
      total: submissions.length
    });

    const existingScore = await Score.findOne({
      submission: submission._id,
      source: "ai"
    });

    if (existingScore && !force) {
      results.skippedCount++;
      results.details.push({
        submissionId: submission._id,
        title: submission.title,
        status: "skipped",
        reason: "Already AI evaluated"
      });

      emitToHackathon(hackathonId, "ai-evaluate:progress", {
        hackathonId,
        submissionId: submission._id,
        title: submission.title,
        status: "skipped",
        index: idx + 1,
        total: submissions.length,
        score: existingScore
      });
      continue;
    }

    if (existingScore && force) {
      await Score.deleteOne({ _id: existingScore._id });
    }

    try {
      const score = await generateAiAssessment(submission._id);
      results.evaluatedCount++;
      results.details.push({
        submissionId: submission._id,
        title: submission.title,
        status: "evaluated",
        scoreId: score._id,
        totalScore: score.totalScore,
        confidence: score.confidence
      });

      emitToHackathon(hackathonId, "ai-evaluate:progress", {
        hackathonId,
        submissionId: submission._id,
        title: submission.title,
        status: "scored",
        index: idx + 1,
        total: submissions.length,
        score
      });

      if (rateLimitDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, rateLimitDelayMs));
      }
    } catch (err) {
      results.failedCount++;
      results.details.push({
        submissionId: submission._id,
        title: submission.title,
        status: "failed",
        error: err.message
      });

      emitToHackathon(hackathonId, "ai-evaluate:progress", {
        hackathonId,
        submissionId: submission._id,
        title: submission.title,
        status: "failed",
        index: idx + 1,
        total: submissions.length,
        error: err.message
      });
    }
  }

  return results;
}

module.exports = {
  fetchGitHubReadme,
  validateDynamicEvaluationPayload,
  extractDynamicJson,
  generateAiAssessment,
  batchEvaluateHackathon
};
