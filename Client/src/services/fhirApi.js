// Use different API URLs based on environment
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:5000/fhir'  // For Docker environment
  : 'http://localhost:5000/fhir'; // For development

// Helper function to make API requests
const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Patient API
export const patientApi = {
  // Get all patients
  getAll: () => apiRequest(`${API_BASE_URL}/Patient`),
  
  // Get patient by ID
  getById: (id) => apiRequest(`${API_BASE_URL}/Patient/${id}`),
  
  // Create new patient
  create: (patient) => apiRequest(`${API_BASE_URL}/Patient`, {
    method: 'POST',
    body: JSON.stringify(patient),
  }),
  
  // Update patient
  update: (id, patient) => apiRequest(`${API_BASE_URL}/Patient/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patient),
  }),
  
  // Delete patient
  delete: (id) => apiRequest(`${API_BASE_URL}/Patient/${id}`, {
    method: 'DELETE',
  }),
  
  // Get patient appointments
  getAppointments: (id) => apiRequest(`${API_BASE_URL}/Patient/${id}/Appointment`),
  
  // Get patient encounters
  getEncounters: (id) => apiRequest(`${API_BASE_URL}/Patient/${id}/Encounter`),
};

// Appointment API
export const appointmentApi = {
  // Get all appointments
  getAll: () => apiRequest(`${API_BASE_URL}/Appointment`),
  
  // Get appointment by ID
  getById: (id) => apiRequest(`${API_BASE_URL}/Appointment/${id}`),
  
  // Create new appointment
  create: (appointment) => apiRequest(`${API_BASE_URL}/Appointment`, {
    method: 'POST',
    body: JSON.stringify(appointment),
  }),
  
  // Update appointment
  update: (id, appointment) => apiRequest(`${API_BASE_URL}/Appointment/${id}`, {
    method: 'PUT',
    body: JSON.stringify(appointment),
  }),
  
  // Delete appointment
  delete: (id) => apiRequest(`${API_BASE_URL}/Appointment/${id}`, {
    method: 'DELETE',
  }),
  
  // Search appointments by patient
  searchByPatient: (patientId) => apiRequest(`${API_BASE_URL}/Appointment/search?patient=${patientId}`),
};

// Encounter API
export const encounterApi = {
  // Get all encounters
  getAll: () => apiRequest(`${API_BASE_URL}/Encounter`),
  
  // Get encounter by ID
  getById: (id) => apiRequest(`${API_BASE_URL}/Encounter/${id}`),
  
  // Create new encounter
  create: (encounter) => apiRequest(`${API_BASE_URL}/Encounter`, {
    method: 'POST',
    body: JSON.stringify(encounter),
  }),
  
  // Update encounter
  update: (id, encounter) => apiRequest(`${API_BASE_URL}/Encounter/${id}`, {
    method: 'PUT',
    body: JSON.stringify(encounter),
  }),
  
  // Delete encounter
  delete: (id) => apiRequest(`${API_BASE_URL}/Encounter/${id}`, {
    method: 'DELETE',
  }),
  
  // Search encounters by patient
  searchByPatient: (patientId) => apiRequest(`${API_BASE_URL}/Encounter/search?patient=${patientId}`),
};

// Helper functions to create FHIR resources
export const createFhirPatient = (formData) => ({
  resourceType: 'Patient',
  name: [
    {
      use: 'official',
      family: formData.familyName,
      given: [formData.givenName],
    },
  ],
  gender: formData.gender,
  birthDate: formData.birthDate,
  telecom: [
    ...(formData.phone ? [{
      system: 'phone',
      value: formData.phone,
      use: 'mobile',
    }] : []),
    ...(formData.email ? [{
      system: 'email',
      value: formData.email,
      use: 'home',
    }] : []),
  ],
  address: formData.address ? [
    {
      use: formData.address.use || 'home',
      type: formData.address.type || 'physical',
      text: formData.address.text || '',
      // Use standard FHIR line array but ensure exactly 2 elements for our separate fields
      line: [
        formData.address.line?.[0] || '',  // AddressLine1
        formData.address.line?.[1] || ''   // AddressLine2
      ],
      city: formData.address.city || '',
      district: formData.address.district || '',
      state: formData.address.state || '',
      postalCode: formData.address.postalCode || '',
      country: formData.address.country || '',
    },
  ] : [],
});

export const createFhirAppointment = (formData) => ({
  resourceType: 'Appointment',
  status: formData.status || 'booked',
  start: formData.start,
  end: formData.end,
  description: formData.description,
  participant: [
    {
      actor: {
        reference: `Patient/${formData.patientId}`,
      },
      status: 'accepted',
    },
  ],
});

export const createFhirEncounter = (formData) => ({
  resourceType: 'Encounter',
  status: formData.status || 'in-progress',
  subject: {
    reference: `Patient/${formData.patientId}`,
  },
  period: {
    start: formData.date,
    end: new Date(new Date(formData.date).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
  },
  text: formData.notes ? {
    status: 'generated',
    div: `<div xmlns="http://www.w3.org/1999/xhtml">${formData.notes}</div>`,
  } : undefined,
});