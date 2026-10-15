import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' }
});

export const clinicApi = axios.create({
  baseURL: import.meta.env.VITE_CLINIC_API_URL || 'http://localhost:5001/api',
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('careslot_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getErrorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'The request took too long. Check that the CareSlot services are running, then try again.';
  if (!error.response && (error.code === 'ERR_NETWORK' || error.request)) {
    const serviceUrl = error.config?.baseURL || '';
    const serviceName = serviceUrl.includes(':5001') ? 'Clinic Directory Service (port 5001)' : 'CareSlot API (port 5000)';
    return `${serviceName} is not responding. In the CareSlot project folder, run “npm run dev” and keep that terminal open, then try again.`;
  }
  return 'CareSlot could not complete that request. Please try again.';
}

export const isApiUnavailable = (error) => !error.response && (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED');
