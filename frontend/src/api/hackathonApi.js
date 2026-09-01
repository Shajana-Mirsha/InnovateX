import api from "./axios";

export const getHackathons = async () => {
  const response = await api.get("/hackathons");
  return response.data;
};

export const getAllHackathons = getHackathons;

export const getHackathonById = async (id) => {
  const response = await api.get(`/hackathons/${id}`);
  return response.data;
};

export const createHackathon = async (data) => {
  const response = await api.post("/hackathons", data);
  return response.data;
};

export const updateHackathon = async (id, data) => {
  const response = await api.put(`/hackathons/${id}`, data);
  return response.data;
};

export const updateHackathonCriteria = async (id, criteria) => {
  const response = await api.put(`/hackathons/${id}/criteria`, { criteria });
  return response.data;
};

export const batchAiEvaluate = async (hackathonId, options = {}) => {
  const response = await api.post(`/hackathons/${hackathonId}/ai-evaluate-all`, options);
  return response.data;
};

export const detectHackathonSimilarity = async (hackathonId, threshold) => {
  const response = await api.post(`/hackathons/${hackathonId}/detect-similarity`, { threshold });
  return response.data;
};

export const deleteHackathon = async (id) => {
  const response = await api.delete(`/hackathons/${id}`);
  return response.data;
};
