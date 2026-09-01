const Submission = require("../models/Submission");

// Configurable default similarity threshold (exported for precision/recall experiments)
const DEFAULT_SIMILARITY_THRESHOLD = 0.8;

/**
 * Computes exact cosine similarity between two numeric vectors.
 * Formula: dot(A, B) / (norm(A) * norm(B))
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} Value between -1.0 and 1.0
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates embeddings for an array of input texts using real Voyage AI or OpenAI APIs.
 * @param {string[]} texts
 * @returns {Promise<{ embeddings: number[][], modelName: string }>}
 */
async function getEmbeddings(texts) {
  if (!texts || texts.length === 0) {
    return { embeddings: [], modelName: "none" };
  }

  // Option A: Voyage AI (Preferred for scientific/code similarity)
  const voyageKey = process.env.VOYAGE_API_KEY;
  if (voyageKey && voyageKey.trim() !== "") {
    const model = process.env.VOYAGE_MODEL || "voyage-3";
    try {
      const response = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${voyageKey.trim()}`
        },
        body: JSON.stringify({
          input: texts,
          model: model
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Voyage API returned status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("Invalid response format from Voyage AI API");
      }

      const embeddings = data.data.map((item) => item.embedding);
      return { embeddings, modelName: model };
    } catch (err) {
      throw new Error(`Voyage AI Embedding failed: ${err.message}`);
    }
  }

  // Option B: OpenAI text-embedding-3-small
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && openAiKey.trim() !== "") {
    const { OpenAI } = require("openai");
    const openai = new OpenAI({ apiKey: openAiKey.trim() });
    const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

    try {
      const response = await openai.embeddings.create({
        model: model,
        input: texts
      });

      const embeddings = response.data.map((item) => item.embedding);
      return { embeddings, modelName: model };
    } catch (err) {
      throw new Error(`OpenAI Embedding failed: ${err.message}`);
    }
  }

  // Strict Rule: No dummy or mock fallback
  throw new Error(
    "Embedding API key missing. Please set VOYAGE_API_KEY or OPENAI_API_KEY in environment variables."
  );
}

/**
 * Computes semantic similarity across all submissions in a hackathon,
 * stores bidirectional similarityFlags with model metadata on each Submission, and returns flagged pairs.
 * @param {string} hackathonId - MongoDB ObjectId of the Hackathon
 * @param {number} [threshold=0.8] - Cosine similarity threshold (0.0 to 1.0)
 * @returns {Promise<object>} Result containing flagged pairs and counts
 */
async function detectHackathonSimilarity(hackathonId, threshold) {
  const effectiveThreshold =
    typeof threshold === "number" && !isNaN(threshold) && threshold >= 0 && threshold <= 1
      ? threshold
      : parseFloat(process.env.SIMILARITY_THRESHOLD) || DEFAULT_SIMILARITY_THRESHOLD;

  const submissions = await Submission.find({
    hackathon: hackathonId,
    status: "submitted"
  }).populate("team", "name");

  if (submissions.length < 2) {
    return {
      hackathonId,
      totalSubmissions: submissions.length,
      threshold: effectiveThreshold,
      model: "none",
      flaggedPairs: []
    };
  }

  // Build real text payload from submission title, description, and links
  const texts = submissions.map((s) => {
    return `${s.title}\n\n${s.description}${s.githubLink ? `\nRepository: ${s.githubLink}` : ""}`;
  });

  const { embeddings, modelName } = await getEmbeddings(texts);

  if (embeddings.length !== submissions.length) {
    throw new Error("Mismatch between embedding count and submission count.");
  }

  // Map to store flags for each submission
  const flagsMap = new Map();
  submissions.forEach((s) => flagsMap.set(s._id.toString(), []));

  const flaggedPairs = [];
  const computedAt = new Date();

  // Compute pairwise cosine similarities
  for (let i = 0; i < submissions.length; i++) {
    for (let j = i + 1; j < submissions.length; j++) {
      const sim = cosineSimilarity(embeddings[i], embeddings[j]);
      const roundedSim = Math.round(sim * 10000) / 10000;

      if (roundedSim >= effectiveThreshold) {
        const subA = submissions[i];
        const subB = submissions[j];

        flagsMap.get(subA._id.toString()).push({
          submission: subB._id,
          score: roundedSim,
          model: modelName,
          computedAt
        });

        flagsMap.get(subB._id.toString()).push({
          submission: subA._id,
          score: roundedSim,
          model: modelName,
          computedAt
        });

        flaggedPairs.push({
          submissionA: {
            _id: subA._id,
            title: subA.title,
            team: subA.team ? subA.team.name : "N/A"
          },
          submissionB: {
            _id: subB._id,
            title: subB.title,
            team: subB.team ? subB.team.name : "N/A"
          },
          similarityScore: roundedSim,
          threshold: effectiveThreshold,
          model: modelName
        });
      }
    }
  }

  // Persist updated similarityFlags in MongoDB
  for (const sub of submissions) {
    sub.similarityFlags = flagsMap.get(sub._id.toString()) || [];
    await sub.save();
  }

  return {
    hackathonId,
    totalSubmissions: submissions.length,
    threshold: effectiveThreshold,
    model: modelName,
    flaggedPairs
  };
}

module.exports = {
  DEFAULT_SIMILARITY_THRESHOLD,
  cosineSimilarity,
  computeCosineSimilarity: cosineSimilarity,
  getEmbeddings,
  detectHackathonSimilarity
};
