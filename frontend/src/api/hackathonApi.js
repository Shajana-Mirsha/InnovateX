import axiosInstance from "./axios";

export const getAllHackathons = async () => {
  const response = await axiosInstance.get("/hackathons");
  return response.data;
};

export const getHackathonById = async (id) => {
  const response = await axiosInstance.get(`/hackathons/${id}`);
  return response.data;
};

export const createHackathon = async (data) => {
  const response = await axiosInstance.post("/hackathons", data);
  return response.data;
};

export const updateHackathon = async (id, data) => {
  const response = await axiosInstance.put(`/hackathons/${id}`, data);
  return response.data;
};

export const deleteHackathon = async (id) => {
  const response = await axiosInstance.delete(`/hackathons/${id}`);
  return response.data;
};
