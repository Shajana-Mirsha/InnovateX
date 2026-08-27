import axiosInstance from "./axios";

export const createScore = async (data) => {
  const response = await axiosInstance.post("/scores", data);
  return response.data;
};

export const getAllScores = async () => {
  const response = await axiosInstance.get("/scores");
  return response.data;
};

export const getSubmissionScores = async (submissionId) => {
  const response = await axiosInstance.get(`/scores/submission/${submissionId}`);
  return response.data;
};

export const updateScore = async (id, data) => {
  const response = await axiosInstance.put(`/scores/${id}`, data);
  return response.data;
};
