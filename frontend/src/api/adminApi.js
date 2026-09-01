import api from "./axios";

export const getAdminUsers = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/auth/users${query ? `?${query}` : ""}`);
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await api.put(`/auth/users/${userId}/role`, { role });
  return response.data;
};

export const updateUserStatus = async (userId, isActive) => {
  const response = await api.put(`/auth/users/${userId}/status`, { isActive });
  return response.data;
};

export const deleteAdminUser = async (userId) => {
  const response = await api.delete(`/auth/users/${userId}`);
  return response.data;
};

export const getSystemStats = async () => {
  const response = await api.get("/auth/system-stats");
  return response.data;
};

export const getSystemActivity = async (limit = 30) => {
  const response = await api.get(`/auth/activity?limit=${limit}`);
  return response.data;
};
