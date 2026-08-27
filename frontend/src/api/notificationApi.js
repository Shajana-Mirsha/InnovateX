import axiosInstance from "./axios";

export const getMyNotifications = async () => {
  const response = await axiosInstance.get("/notifications");
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await axiosInstance.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await axiosInstance.put("/notifications/read-all");
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await axiosInstance.delete(`/notifications/${id}`);
  return response.data;
};
