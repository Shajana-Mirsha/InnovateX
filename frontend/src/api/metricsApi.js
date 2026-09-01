import api from "./axios";

export const getPipelineIntelligence = async (hackathonId) => {
  const response = await api.get(`/metrics/pipeline-intelligence/${hackathonId}`);
  return response.data;
};

export const getAgreementMetrics = async (hackathonId) => {
  const response = await api.get(`/metrics/agreement/${hackathonId}`);
  return response.data;
};

export const getConsistencyMetrics = async (hackathonId, runs = 2) => {
  const response = await api.get(`/metrics/consistency/${hackathonId}?runs=${runs}`);
  return response.data;
};

export const getSimilarityPerformanceMetrics = async (hackathonId, threshold = 0.8) => {
  const response = await api.get(`/metrics/similarity-performance/${hackathonId}?threshold=${threshold}`);
  return response.data;
};

export const getTimeSavedMetrics = async (hackathonId) => {
  const response = await api.get(`/metrics/time-saved/${hackathonId}`);
  return response.data;
};

export const exportResearchMetrics = async (hackathonId) => {
  const response = await api.get(`/metrics/export/${hackathonId}`);
  return response.data;
};
