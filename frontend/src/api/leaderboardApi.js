import axiosInstance from "./axios";

export const getLeaderboard = async (hackathonId) => {
  const response = await axiosInstance.get(`/leaderboard/${hackathonId}`);
  return response.data;
};
