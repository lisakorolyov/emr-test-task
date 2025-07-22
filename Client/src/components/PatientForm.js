import React, { useState, useEffect } from 'react';
import { AddressInput } from '@medplum/react';
import { patientApi, createFhirPatient } from '../services/fhirApi';

const PatientForm = ({ patient, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    givenName: '',
    familyName: '',
    gender: 'unknown',
    birthDate: '',
    phone: '',
    email: '',
    address: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patient) {
      // Populate form with existing patient data
      const name = patient.name?.[0] || {};
      const phone = patient.telecom?.find(t => t.system === 'phone')?.value || '';
      const email = patient.telecom?.find(t => t.system === 'email')?.value || '';
      const addressData = patient.address?.[0];
      
      // Convert our separate line1/line2 fields back to FHIR format for AddressInput
      let address = null;
      if (addressData) {
        address = {
          use: addressData.use,
          type: addressData.type,
          text: addressData.text,
          // Convert separate line1/line2 back to line array for AddressInput component
          line: [
            addressData.line1 || '',
            addressData.line2 || ''
          ].filter(line => line.trim() !== ''), // Remove empty lines
          city: addressData.city,
          district: addressData.district,
          state: addressData.state,
          postalCode: addressData.postalCode,
          country: addressData.country,
        };
      }

      setFormData({
        givenName: name.given?.[0] || '',
        familyName: name.family || '',
        gender: patient.gender || 'unknown',
        birthDate: patient.birthDate || '',
        phone: phone,
        email: email,
        address: address,
      });
    }
  }, [patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const fhirPatient = createFhirPatient(formData);
      
      if (patient) {
        // Update existing patient
        await patientApi.update(patient.id, fhirPatient);
      } else {
        // Create new patient
        await patientApi.create(fhirPatient);
      }
      
      onSave();
    } catch (err) {
      setError('Failed to save patient');
      console.error('Error saving patient:', err);
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!patient;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>{isEditing ? 'Edit Patient' : 'Add New Patient'}</h2>
        <button 
          className="btn btn-secondary" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="givenName" className="form-label">First Name *</label>
              <input
                type="text"
                className="form-control"
                id="givenName"
                name="givenName"
                value={formData.givenName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="familyName" className="form-label">Last Name *</label>
              <input
                type="text"
                className="form-control"
                id="familyName"
                name="familyName"
                value={formData.familyName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="gender" className="form-label">Gender</label>
              <select
                className="form-select"
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="unknown">Unknown</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="birthDate" className="form-label">Birth Date</label>
              <input
                type="date"
                className="form-control"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="phone" className="form-label">Phone</label>
              <input
                type="tel"
                className="form-control"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Address</label>
          <AddressInput
            name="address"
            value={formData.address}
            onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
            disabled={loading}
          />
        </div>

        <div className="d-grid gap-2 d-md-flex justify-content-md-end">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Patient' : 'Create Patient'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;