import axiosInstance from "./axios";

export const declareResult = async (hackathonId, submissionId, position) => {
  const response = await axiosInstance.post("/results", {
    hackathonId,
    submissionId,
    position,
  });
  return response.data;
};

export const getHackathonResults = async (hackathonId) => {
  const response = await axiosInstance.get(`/results/hackathon/${hackathonId}`);
  return response.data;
};

export const deleteResult = async (id) => {
  const response = await axiosInstance.delete(`/results/${id}`);
  return response.data;
};
