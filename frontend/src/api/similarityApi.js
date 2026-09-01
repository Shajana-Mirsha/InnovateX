import api from "./axios";

export const createSimilarityLabel = async (data) => {
  const response = await api.post("/similarity-labels", data);
  return response.data;
};

export const getSimilarityLabels = async (hackathonId) => {
  const response = await api.get(`/similarity-labels/${hackathonId}`);
  return response.data;
};
