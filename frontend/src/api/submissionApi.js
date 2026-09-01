import api from "./axios";

export const getSubmissions = async () => {
  const response = await api.get("/submissions");
  return response.data;
};

export const getAllSubmissions = getSubmissions;

export const getSubmissionById = async (id) => {
  const response = await api.get(`/submissions/${id}`);
  return response.data;
};

export const getSubmissionFeedback = async (id) => {
  const response = await api.get(`/submissions/${id}/feedback`);
  return response.data;
};

export const createSubmission = async (data) => {
  const response = await api.post("/submissions", data);
  return response.data;
};

export const updateSubmission = async (id, data) => {
  const response = await api.put(`/submissions/${id}`, data);
  return response.data;
};
