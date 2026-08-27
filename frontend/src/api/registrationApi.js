import axiosInstance from "./axios";

export const registerTeam = async (hackathonId, teamId) => {
  const response = await axiosInstance.post("/registrations", {
    hackathonId,
    teamId,
  });
  return response.data;
};

export const getAllRegistrations = async () => {
  const response = await axiosInstance.get("/registrations");
  return response.data;
};

export const getMyRegistrations = async () => {
  const response = await axiosInstance.get("/registrations/my");
  return response.data;
};

export const updateRegistrationStatus = async (id, status) => {
  const response = await axiosInstance.put(`/registrations/${id}/status`, {
    status,
  });
  return response.data;
};
