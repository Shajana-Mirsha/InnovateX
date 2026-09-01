import api from "./axios";

export const getCalibrationReport = async (hackathonId, fresh = false) => {
  const response = await api.get(`/calibration/${hackathonId}/report${fresh ? "?fresh=true" : ""}`);
  return response.data;
};

export const runCalibration = async (hackathonId) => {
  const response = await api.post(`/calibration/${hackathonId}/run-calibration`);
  return response.data;
};
