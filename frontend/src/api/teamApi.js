import axiosInstance from "./axios";

export const getAllTeams = async () => {
  const response = await axiosInstance.get("/teams");
  return response.data;
};

export const getTeamById = async (id) => {
  const response = await axiosInstance.get(`/teams/${id}`);
  return response.data;
};

export const createTeam = async (data) => {
  const response = await axiosInstance.post("/teams", data);
  return response.data;
};

export const joinTeam = async (id) => {
  const response = await axiosInstance.post(`/teams/${id}/join`);
  return response.data;
};

export const leaveTeam = async (id) => {
  const response = await axiosInstance.post(`/teams/${id}/leave`);
  return response.data;
};
