import api from "./axios";

export const getLeaderboard = async (hackathonId) => {
  const response = await api.get(`/leaderboard/${hackathonId}`);
  return response.data;
};

export const getRankingComparison = async (hackathonId) => {
  const response = await api.get(`/leaderboard/${hackathonId}/ranking-comparison`);
  return response.data;
};
