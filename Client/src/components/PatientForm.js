import React, { useState, useEffect } from 'react';
import { AddressInput } from '@medplum/react';
import { patientApi, createFhirPatient } from '../services/fhirApi';
import { formatAddressText } from '../utils/addressFormatter';

const PatientForm = ({ patient, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    givenName: '',
    familyName: '',
    gender: 'unknown',
    birthDate: '',
    phone: '',
    email: '',
    address: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

    const defaultAddress = {
        use: '',
        type: '',
        text: '',
        line: [],
        city: '',
        district: '',
        state: '',
        postalCode: '',
        country: ''
    };

  useEffect(() => {
    if (patient) {
      const name = patient.name?.[0] || {};
      const phone = patient.telecom?.find(t => t.system === 'phone')?.value || '';
      const email = patient.telecom?.find(t => t.system === 'email')?.value || '';
      const addressData = patient.address?.[0];
      
        const address = addressData
            ? {
                ...defaultAddress,
                ...addressData,
                text: addressData.text || formatAddressText(addressData),
                line: Array.isArray(addressData.line) ? addressData.line.filter(line => typeof line === 'string') : [],
            }
            : { ...defaultAddress };

      const newFormData = {
        givenName: name.given?.[0] || '',
        familyName: name.family || '',
        gender: patient.gender || 'unknown',
        birthDate: patient.birthDate || '',
        phone: phone,
        email: email,
        address: address,
      };

      setFormData(newFormData);
    }
  }, [patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    };

    const handleAddressChange = (updated) => {
        const updatedAddress = {
            ...formData.address,
            ...updated,
            text: formatAddressText({ ...formData.address, ...updated }),
        };
        setFormData((prev) => ({
            ...prev,
            address: updatedAddress,
        }));
    };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const fhirPatient = createFhirPatient(formData);
      
      if (patient) {
        await patientApi.update(patient.id, fhirPatient);
      } else {
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
      <h2 className="mb-3">{isEditing ? 'Edit Patient' : 'Add New Patient'}</h2>

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
        { (formData.address || !isEditing) && // Do not remove. This (formData.address null check) fixed the AddressInput fields not populating bug
            <div className="mb-3">
              <label className="form-label">Address</label>
                <AddressInput
                    defaultValue={formData.address}
                    key={ patient?.id || 'new' }
                    name="address"
                    value={formData.address}
                    onChange={handleAddressChange}
                    disabled={loading}
                />
            </div>
        }
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