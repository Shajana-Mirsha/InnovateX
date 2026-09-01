import api from "./axios";

export const getScores = async () => {
  const response = await api.get("/scores");
  return response.data;
};

export const getAllScores = getScores;

export const getSubmissionScores = async (submissionId) => {
  const response = await api.get(`/scores/submission/${submissionId}`);
  return response.data;
};

export const getExpertReferenceScore = async (submissionId) => {
  const response = await api.get(`/scores/submission/${submissionId}/expert-reference`);
  return response.data;
};

export const createScore = async (data) => {
  const response = await api.post("/scores", data);
  return response.data;
};

export const generateAiScore = async (submissionId, force = false) => {
  const response = await api.post(`/scores/ai/${submissionId}${force ? "?force=true" : ""}`);
  return response.data;
};

export const validateScore = async (scoreId, data) => {
  const response = await api.post(`/scores/${scoreId}/validate`, data);
  return response.data;
};

export const getValidationLogs = async (hackathonId) => {
  const response = await api.get(`/scores/validation-logs/${hackathonId}`);
  return response.data;
};

export const updateScore = async (id, data) => {
  const response = await api.put(`/scores/${id}`, data);
  return response.data;
};
