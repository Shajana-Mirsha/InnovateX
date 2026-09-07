# InnovateX — Full System Audit (Phase 1)
**Project:** National Innovation Challenge & Hackathon Management Portal with Adaptive Human-in-the-Loop AI Evaluation  
**Date:** September 2, 2026  
**Auditor:** DeepMind Antigravity Pair-Programming Agent  
**Standard:** IEEE Conference / Presentation Readiness, Zero Synthetic Data, Strict Role Boundaries  

---

## Executive Summary

A comprehensive, end-to-end code and architecture audit was conducted across all four platform roles (**Admin**, **Organizer**, **Judge**, **Participant**) and the entire evaluation pipeline:
$$\text{Real Submission} \longrightarrow \text{Dynamic Rubric AI (Claude)} \longrightarrow \text{Cosine Similarity Screening (Embeddings)} \longrightarrow \text{Expert Judge Review} \longrightarrow \text{Human Validation} \longrightarrow \text{Calibration (OLS Regression)} \longrightarrow \text{Weighted Ranking} \longrightarrow \text{Participant Feedback}$$

While the foundational AI scoring (Anthropic Claude 3.5 Sonnet), semantic embeddings (Voyage-3/OpenAI), and linear regression calibration math are implemented with high fidelity, this audit identified **14 critical issues** spanning:
1. **Synthetic / Placeholder Metric Leaks** (direct violation of the empirical research standard)
2. **Role Boundary Violations & Security / IDOR Flaws** (Admin scoring permissions, cross-organizer data manipulation)
3. **Data Pipeline & State Synchronization Defects** (frontend queries expecting nonexistent document fields, missing socket subscriptions)
4. **Participant Workflow & Authorization Gaps** (team member registration blindness, post-deadline submission editing, client-side data leaks)
5. **UI / UX Inconsistencies & Legacy Code Artifacts** (hardcoded 4-criteria forms lingering on details pages, contrast issues)

**No code changes have been made.** This document details the exact role, screen/module, expected vs. actual behavior, severity, and root cause for each finding.

---

## Audit Findings Matrix

| ID | Category | Module / Screen | Affected Roles | Severity | Root Cause |
|---|---|---|---|---|---|
| **ISSUE-01** | Research Integrity | `metricsService.js` (`getConsistencyMetrics`) | Organizer, Admin | **CRITICAL** | Hardcoded synthetic metrics (`variance: 0.05`, `stdDev: 0.22`, `meanScore: 8.2`) instead of empirical calculation or honest empty state |
| **ISSUE-02** | Research Integrity | `metricsService.js` (`getEvaluationPipelineIntelligence`) | Organizer, Admin | **HIGH** | Hardcoded `failed: 0` in Stage 2 telemetry rather than real failure counting |
| **ISSUE-03** | Security / Auth | `scoreRoutes.js` & `scoreController.js` | Admin, Judge | **CRITICAL** | Admin is authorized to score (`POST /api/scores`), validate (`POST /:id/validate`), and edit judge scores (`PUT /:id`), violating judge independence |
| **ISSUE-04** | Security / Auth | `registrationController.js` (`getAllRegistrations`, `updateRegistrationStatus`) | Organizer | **HIGH** | Cross-organizer IDOR: Organizers can view, approve, and reject registrations for hackathons created by other organizers |
| **ISSUE-05** | Security / Auth | `resultController.js` (`declareResult`, `deleteResult`) | Organizer | **HIGH** | Missing hackathon ownership check: any organizer can declare or delete winners for another organizer's hackathon |
| **ISSUE-06** | Security / Auth | `hackathonController.js` (`batchAiEvaluate`) & `similarityController.js` | Organizer | **HIGH** | Batch AI evaluation and similarity screening endpoints lack ownership validation against `hackathon.createdBy` |
| **ISSUE-07** | Data Privacy | `submissionController.js` (`getAllSubmissions`) | Participant | **HIGH** | `GET /api/submissions` returns all submissions across all teams and hackathons to any authenticated user; filtered only in client-side JS |
| **ISSUE-08** | Business Logic | `submissionController.js` (`createSubmission`, `updateSubmission`) | Participant | **MEDIUM** | Submissions can be created and edited after the hackathon deadline has passed (`hackathon.endDate < Date.now()`) |
| **ISSUE-09** | Workflow Bug | `registrationController.js` (`getMyRegistrations`) | Participant | **HIGH** | Only searches `registeredBy: req.user._id`; non-leader team members see empty registration status (`[]`) |
| **ISSUE-10** | Frontend Bug | `SimilarityReviewPage.jsx` (`loadSimilarityData`) | Organizer, Judge | **HIGH** | Frontend assumes `hRes.hackathon.submissions` exists, which is undefined in Mongoose; flagged pairs list initializes empty until re-run |
| **ISSUE-11** | Legacy Artifact | `SubmissionDetailsPage.jsx` | Judge | **MEDIUM** | Hardcoded 4-criteria score inputs (`innovation`, `tech`, `impact`, `presentation`) instead of reading dynamic hackathon rubric criteria |
| **ISSUE-12** | Data Consistency| `scoreController.js` (`validateScore: edit`) | Judge, Organizer | **MEDIUM** | When editing scores with standard criteria names, `criterionScores` is updated but legacy top-level score fields remain out of sync |
| **ISSUE-13** | Real-Time Sync | `SocketContext.jsx` & Dashboard Pages | All Roles | **MEDIUM** | Evaluation Intelligence, Admin Dashboard, and Registrations pages lack socket subscriptions for live pipeline progress events |
| **ISSUE-14** | UI / Polish | Design System, Spacing & Color System | All Roles | **MEDIUM** | Typography inconsistency across pages; minor contrast and spacing defects on empty and loading states |

---

## Detailed Audit Descriptions

### ISSUE-01: Hardcoded Synthetic Consistency Metrics
* **Role:** Organizer, Admin
* **Screen / Module:** `backend/src/services/metricsService.js` (lines 198–206), `frontend/src/pages/Research/ResearchMetricsPage.jsx`
* **Expected Behavior:** `getConsistencyMetrics` must either run real repeated evaluation runs through the model and compute actual sample variance and standard deviation across those runs, or return an honest `insufficient_data` state indicating that multiple evaluation runs have not yet been recorded.
* **Actual Behavior:** The service fabricates return values:
  ```javascript
  const variances = existingScores.map(() => ({
    variance: 0.05,
    stdDev: 0.22,
    meanScore: 8.2
  }));
  const avgVariance = 0.05;
  const avgStdDev = 0.22;
  ```
* **Root Cause:** A temporary placeholder was left in `metricsService.js` during initial endpoint prototyping and was never wired to actual repeated execution records.
* **Impact:** Direct breach of IEEE conference submission rules prohibiting synthetic data.

---

### ISSUE-02: Hardcoded AI Failure Metric in Telemetry
* **Role:** Organizer, Admin
* **Screen / Module:** `backend/src/services/metricsService.js` (line 457), `EvaluationIntelligencePage.jsx`
* **Expected Behavior:** Stage 2 AI Evaluation telemetry must report actual failed runs (e.g. API timeouts, parsing failures, rate limits) stored in a failure log or error field.
* **Actual Behavior:** `failed: 0` is hardcoded in the response payload.
* **Root Cause:** No schema or tracking mechanism was in place to record failed evaluation attempts per submission.

---

### ISSUE-03: Admin Privilege Intrusion into Judge Scoring
* **Role:** Admin, Judge
* **Screen / Module:** `backend/src/routes/scoreRoutes.js` (lines 22, 38, 78), `scoreController.js`
* **Expected Behavior:** Admin role is purely managerial and governance-oriented. Admin must NOT be authorized to submit scores, validate judge scores, or overwrite evaluations. Only `judge` role (or designated evaluators) should have access to evaluation endpoints.
* **Actual Behavior:** 
  ```javascript
  router.post("/", protect, authorize("judge", "admin"), createScore);
  router.post("/:id/validate", protect, authorize("admin", "judge"), validateScore);
  router.put("/:id", protect, authorize("admin", "judge"), updateScore);
  ```
  Admins can masquerade as judges, corrupting inter-rater agreement ($\kappa$) and calibration regression datasets.
* **Root Cause:** Overly permissive middleware `authorize("admin", ...)` applied indiscriminately across scoring routes.

---

### ISSUE-04: Cross-Organizer IDOR on Registrations
* **Role:** Organizer
* **Screen / Module:** `backend/src/controllers/registrationController.js` (`getAllRegistrations`, `updateRegistrationStatus`), `ManageRegistrationsPage.jsx`
* **Expected Behavior:** An organizer must only view and manage registrations for hackathons they personally created (`hackathon.createdBy == req.user._id`). Admins can view all.
* **Actual Behavior:** `getAllRegistrations` executes `Registration.find()` with zero filtering, returning all registrations on the platform. Any organizer can call `PUT /api/registrations/:id/status` and approve/reject registrations for competitions hosted by other organizers.
* **Root Cause:** Missing tenant/organizer scoping in query filters and mutation authorization checks.

---

### ISSUE-05: Missing Hackathon Creator Check on Declaring & Deleting Results
* **Role:** Organizer
* **Screen / Module:** `backend/src/controllers/resultController.js` (`declareResult`, `deleteResult`), `ManageResultsPage.jsx`
* **Expected Behavior:** Only the organizer who created the hackathon (or an Admin) may declare podium positions or delete existing results.
* **Actual Behavior:** `declareResult` verifies the hackathon exists, but does not verify `hackathon.createdBy.toString() === req.user._id.toString()`. `deleteResult` allows any organizer to delete any result on the platform.
* **Root Cause:** Authorization middleware checks `authorize("admin", "organizer")` without checking entity ownership in the controller.

---

### ISSUE-06: Batch AI & Similarity Screening Ownership Gap
* **Role:** Organizer
* **Screen / Module:** `backend/src/controllers/hackathonController.js` (`batchAiEvaluate`), `similarityController.js` (`detectHackathonSimilarityEndpoint`)
* **Expected Behavior:** Only the hackathon creator or an admin can trigger batch Claude evaluations or Voyage embedding similarity calculations.
* **Actual Behavior:** Any organizer can invoke `POST /api/hackathons/:hackathonId/ai-evaluate-all` or `POST /api/hackathons/:hackathonId/detect-similarity`, generating billing and compute overhead on other organizers' events.
* **Root Cause:** Controller checks hackathon existence, but does not assert creator ownership.

---

### ISSUE-07: Participant Data Privacy Exposure via `GET /api/submissions`
* **Role:** Participant
* **Screen / Module:** `backend/src/controllers/submissionController.js` (`getAllSubmissions`), `frontend/src/pages/Submissions/SubmissionsPage.jsx`
* **Expected Behavior:** When a participant calls `GET /api/submissions`, the backend should return only submissions belonging to that participant's teams, or a sanitized public list.
* **Actual Behavior:** The backend queries all `Submission.find()` with populated repository links and similarity flags. The frontend `SubmissionsPage.jsx` receives all records over the wire and filters them using `userTeamIds.includes(s.team?._id)`. Any participant opening DevTools can inspect competing submissions before results are declared.
* **Root Cause:** Client-side filtering instead of role-scoped database query in `submissionController.js`.

---

### ISSUE-08: Unrestricted Post-Deadline Submissions & Edits
* **Role:** Participant
* **Screen / Module:** `backend/src/controllers/submissionController.js` (`createSubmission`, `updateSubmission`), `CreateSubmissionPage.jsx`
* **Expected Behavior:** If the hackathon's `endDate` has passed (`new Date(hackathon.endDate) < new Date()`) or `hackathon.status === "completed"`, submission creation and updating must be blocked with HTTP 403 / "Submission deadline has closed". The frontend should display a clear "Submissions Closed" state.
* **Actual Behavior:** Neither backend controller checks the hackathon dates or status. Submissions can be altered after the competition concludes.
* **Root Cause:** Omission of deadline validation logic in `submissionController.js`.

---

### ISSUE-09: Team Member Registration Invisibility
* **Role:** Participant
* **Screen / Module:** `backend/src/controllers/registrationController.js` (`getMyRegistrations`), `MyRegistrationsPage.jsx`
* **Expected Behavior:** All members of a registered team should see the team's registration status in their "My Event Registrations" page.
* **Actual Behavior:** `getMyRegistrations` executes:
  ```javascript
  const registrations = await Registration.find({ registeredBy: req.user._id });
  ```
  Only the leader who physically clicked "Register" has `registeredBy: req.user._id`. The other 1–3 members see an empty state and cannot access the submission portal.
* **Root Cause:** Query filters exclusively by `registeredBy` rather than checking whether `req.user._id` is in the associated team's membership array.

---

### ISSUE-10: Broken Initial Similarity Pairs Loading
* **Role:** Organizer, Judge
* **Screen / Module:** `frontend/src/pages/Similarity/SimilarityReviewPage.jsx` (`loadSimilarityData`)
* **Expected Behavior:** Opening the Similarity Review page should immediately display any previously computed similarity flags stored on submissions for that hackathon.
* **Actual Behavior:** Line 75 executes `(hRes.hackathon?.submissions || []).forEach(...)`. The `Hackathon` model does not store a `submissions` array. Consequently, `flaggedPairs` defaults to `[]` on initial page load, and the table appears empty even when similarity flags exist in the database.
* **Root Cause:** Frontend expects a virtual or populated `submissions` field on the `Hackathon` document that does not exist in Mongoose.

---

### ISSUE-11: Hardcoded Rubric Form on Submission Details
* **Role:** Judge
* **Screen / Module:** `frontend/src/pages/Submissions/SubmissionDetailsPage.jsx` (lines 50–54, 84–88, 114–121)
* **Expected Behavior:** Evaluation rubrics must dynamically adapt to the criteria defined for the specific hackathon (`submission.hackathon.criteria`).
* **Actual Behavior:** The grading form on `SubmissionDetailsPage.jsx` hardcodes the legacy 4 criteria (`innovation`, `technicalImplementation`, `impact`, `presentation`). If a hackathon defines custom criteria (e.g., "Feasibility", "UI/UX", "Social Impact"), the judge cannot grade them from this screen.
* **Root Cause:** Legacy scoring form from pre-dynamic rubric versions was left in `SubmissionDetailsPage.jsx` while `JudgeScoreReviewModal.jsx` was modernized.

---

### ISSUE-12: Legacy Score Fields Out-of-Sync on Validation Edit
* **Role:** Judge, Organizer
* **Screen / Module:** `backend/src/controllers/scoreController.js` (`validateScore: action === 'edit'`)
* **Expected Behavior:** When a judge updates scores during human validation, both the dynamic `criterionScores` array and any matching legacy top-level fields (`innovation`, `impact`, etc.) should remain synchronized for backward compatibility.
* **Actual Behavior:** Line 413 updates `score.criterionScores = criterionScores`, but does not synchronize top-level fields. Consumers reading top-level fields read stale AI baseline values.
* **Root Cause:** Partial update implementation in `validateScore`.

---

### ISSUE-13: Missing Real-Time Socket Listeners on Dashboards
* **Role:** All Roles
* **Screen / Module:** `EvaluationIntelligencePage.jsx`, `AdminDashboard.jsx`, `MyRegistrationsPage.jsx`
* **Expected Behavior:** When scores are validated, similarity detection completes, or registrations are updated, dashboards should dynamically refresh via Socket.io without requiring manual page reloads.
* **Actual Behavior:** While `LeaderboardPage.jsx` listens to `score:created` and `score:validated`, `EvaluationIntelligencePage.jsx` and `AdminDashboard.jsx` do not subscribe to socket events, remaining static until manually refreshed.
* **Root Cause:** Incomplete integration of `useSocket()` hooks across management views.

---

### ISSUE-14: UI Polish, Typography & Accessibility Discrepancies
* **Role:** All Roles
* **Screen / Module:** Entire Frontend Design System
* **Expected Behavior:** A unified visual design system featuring:
  - Font pairings: Space Grotesk / Sora for headlines, Inter for body/interface
  - Strict semantic color hierarchy (Brand Indigo, Emerald, Amber, Rose, Slate)
  - Clear empty/insufficient-data states with explanatory context
  - Framer Motion page transitions and clean card padding
* **Actual Behavior:** Minor inconsistent font weights, uneven table padding in mobile views, and sparse empty states that lack helpful onboarding prompts.
* **Root Cause:** Incremental feature additions across different sprints with varying component styling.

---

## Conclusion & Proposed Next Steps

This audit establishes the definitive baseline of defects across the InnovateX platform. All issues have clear root causes and isolated blast radiuses that can be systematically addressed in **Phase 2 (Targeted Bug Fixes)** and **Phase 3 (Pipeline & Feedback Completion)** without architectural disruptions.

**Execution is currently paused pending user review of this document.**
