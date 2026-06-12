import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8081",
});

export function getPatients() {
  return api.get("/api/patients");
}

export function getPatient(patientId) {
  return api.get(`/api/patients/${patientId}`);
}

export function getPatientMessages(patientId) {
  return api.get(`/api/patients/${patientId}/messages`);
}

export function getFollowUps() {
  return api.get("/api/followups");
}

export function getFollowUpPatientsByDate(date) {
  return api.get("/api/patients/followup", {
    params: { date },
  });
}

export function getPatientAnalysisByPhone(phoneNumber) {
  return api.get(`/api/patients/search/${phoneNumber}`);
}

export function generatePatientAnalysis(patientId, payload) {
  return api.post(`/api/ai/generate/${patientId}`, payload);
}

export function completePatientFollowUp(patientId) {
  return api.put(`/api/patients/${patientId}/complete`);
}

export function uploadPatientsAndMessages(patientFile, messageFile, onUploadProgress) {
  const formData = new FormData();
  formData.append("patientFile", patientFile);
  formData.append("messageFile", messageFile);

  return api.post("/api/upload/all", formData, {
    onUploadProgress,
  });
}

export default api;
