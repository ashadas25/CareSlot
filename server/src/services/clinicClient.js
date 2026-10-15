const baseUrl = () => (process.env.CLINIC_SERVICE_URL || 'http://localhost:5001/api').replace(/\/$/, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...options,
      headers: {
        'content-type': 'application/json',
        'x-service-key': process.env.SERVICE_API_KEY || '',
        ...options.headers
      },
      signal: AbortSignal.timeout(7000)
    });
  } catch {
    const error = new Error('Clinic Directory Service is unavailable. Start the clinic service and try again.');
    error.status = 503;
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Clinic Directory Service request failed.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export const getHospital = async (id) => (await request(`/internal/hospitals/${id}`)).hospital;
export const getDoctor = async (id, params) => {
  const query = new URLSearchParams(params).toString();
  return (await request(`/internal/doctors/${id}?${query}`)).doctor;
};
export const listAvailableDoctors = async (params) => {
  const query = new URLSearchParams(params).toString();
  return (await request(`/internal/doctors?${query}`)).doctors;
};
export const lookupDirectoryRecords = (hospitalIds, doctorIds) =>
  request('/internal/lookup', { method: 'POST', body: JSON.stringify({ hospitalIds, doctorIds }) });

export const getAdminDirectoryOverview = () => request('/internal/admin/overview');
export const listAdminHospitals = () => request('/internal/admin/hospitals');
export const listAdminDoctors = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/internal/admin/doctors${query ? `?${query}` : ''}`);
};
export const createAdminHospital = (values) => request('/internal/admin/hospitals', { method: 'POST', body: JSON.stringify(values) });
export const updateAdminHospital = (id, values) => request(`/internal/admin/hospitals/${id}`, { method: 'PATCH', body: JSON.stringify(values) });
export const deactivateAdminHospital = (id) => request(`/internal/admin/hospitals/${id}`, { method: 'DELETE' });
export const createAdminDoctor = (values) => request('/internal/admin/doctors', { method: 'POST', body: JSON.stringify(values) });
export const updateAdminDoctor = (id, values) => request(`/internal/admin/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(values) });
export const deactivateAdminDoctor = (id) => request(`/internal/admin/doctors/${id}`, { method: 'DELETE' });

