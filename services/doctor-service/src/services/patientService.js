const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:5002';

const getPatientReports = async (patientId, token) => {
  const response = await fetch(
    `${PATIENT_SERVICE_URL}/api/patient/doctor-access/patients/${patientId}/reports`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Failed to fetch patient reports: ${response.status}`);
  }

  return data;
};

const getPatientPrescriptions = async (patientId, token) => {
  const response = await fetch(
    `${PATIENT_SERVICE_URL}/api/patient/doctor-access/patients/${patientId}/prescriptions`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Failed to fetch patient prescriptions: ${response.status}`);
  }

  return data;
};

const issuePrescription = async (patientId, token, payload) => {
  const response = await fetch(
    `${PATIENT_SERVICE_URL}/api/patient/doctor-access/patients/${patientId}/prescriptions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Failed to issue prescription: ${response.status}`);
  }

  return data;
};

module.exports = {
  getPatientReports,
  getPatientPrescriptions,
  issuePrescription
};
