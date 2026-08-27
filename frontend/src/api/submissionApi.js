import axiosInstance from "./axios";

export const createSubmission = async (data) => {
  const response = await axiosInstance.post("/submissions", data);
  return response.data;
};

export const getAllSubmissions = async () => {
  const response = await axiosInstance.get("/submissions");
  return response.data;
};

export const getSubmissionById = async (id) => {
  const response = await axiosInstance.get(`/submissions/${id}`);
  return response.data;
};

export const updateSubmission = async (id, data) => {
  const response = await axiosInstance.put(`/submissions/${id}`, data);
  return response.data;
};
