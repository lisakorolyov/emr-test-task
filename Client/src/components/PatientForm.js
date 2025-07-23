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

  useEffect(() => {
    if (patient) {
      // Populate form with existing patient data
      const name = patient.name?.[0] || {};
      const phone = patient.telecom?.find(t => t.system === 'phone')?.value || '';
      const email = patient.telecom?.find(t => t.system === 'email')?.value || '';
      const addressData = patient.address?.[0];
      
      // For AddressInput to work properly, ensure we have a properly structured address object
      // If addressData is null/undefined, pass undefined instead of null
      const address = addressData ? {
        use: addressData.use || 'home',
        type: addressData.type || 'physical',
        text: addressData.text || formatAddressText(addressData), // Auto-generate if missing
        line: addressData.line || [],
        city: addressData.city || '',
        district: addressData.district || '',
        state: addressData.state || '',
        postalCode: addressData.postalCode || '',
        country: addressData.country || '',
      } : undefined;

      //let logged = false;
      //if (!logged) {
      //  console.log('--- Patient Info ---');
      //  console.log(`Given Name: ${name.given} - ${typeof name.given}`);
      //  console.log(`Family Name: ${name.family} - ${typeof name.family}`);
      //  console.log(`Phone: ${phone} - ${typeof phone}`);
      //  console.log(`Phone: ${phone} - ${typeof phone}`);
      //  console.log(`Email: ${email} - ${typeof email}`);

      //  console.log('--- Address Info ---');
      //  console.log(`Use: ${address.use} - ${typeof address.use}`);
      //  console.log(`Type: ${address.type} - ${typeof address.type}`);
      //  console.log(`Text: ${address.text} - ${typeof address.text}`);
      //  console.log(`Line 1: ${address.line[0] || ''} - ${typeof address.line[0]}`);
      //  console.log(`Line 2: ${address.line[1] || ''} - ${typeof address.line[1]}`);
      //  console.log(`City: ${address.city} - ${typeof address.city}`);
      //  console.log(`District: ${address.district} - ${typeof address.district}`);
      //  console.log(`State: ${address.state} - ${typeof address.state}`);
      //  console.log(`Postal Code: ${address.postalCode} - ${typeof address.postalCode}`);
      //  console.log(`Country: ${address.country} - ${typeof address.country}`);
      //  console.log('--------------------');

      //  logged = true;
      //}

      // Debug logging before setting formData
      console.log('--- Patient Data Debug ---');
      console.log('Patient object:', patient);
      console.log('Patient address array:', patient.address);
      console.log('First address element:', addressData);
      console.log('Processed address object:', address);
      console.log('---------------------------');

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

      // Debug logging after creating the new form data object
      console.log('--- New Form Data ---');
      console.log(`Given Name: ${newFormData.givenName} - ${typeof newFormData.givenName}`);
      console.log(`Family Name: ${newFormData.familyName} - ${typeof newFormData.familyName}`);
      console.log(`Gender: ${newFormData.gender} - ${typeof newFormData.gender}`);
      console.log(`Birth Date: ${newFormData.birthDate} - ${typeof newFormData.birthDate}`);
      console.log(`Phone: ${newFormData.phone} - ${typeof newFormData.phone}`);
      console.log(`Email: ${newFormData.email} - ${typeof newFormData.email}`);

      if (newFormData.address) {
          console.log('--- Address (newFormData.address) ---');
          console.log(`Use: ${newFormData.address.use} - ${typeof newFormData.address.use}`);
          console.log(`Type: ${newFormData.address.type} - ${typeof newFormData.address.type}`);
          console.log(`Text: ${newFormData.address.text} - ${typeof newFormData.address.text}`);
          console.log(`Line 1: ${newFormData.address.line[0] || ''} - ${typeof newFormData.address.line[0]}`);
          console.log(`Line 2: ${newFormData.address.line[1] || ''} - ${typeof newFormData.address.line[1]}`);
          console.log(`City: ${newFormData.address.city} - ${typeof newFormData.address.city}`);
          console.log(`District: ${newFormData.address.district} - ${typeof newFormData.address.district}`);
          console.log(`State: ${newFormData.address.state} - ${typeof newFormData.address.state}`);
          console.log(`Postal Code: ${newFormData.address.postalCode} - ${typeof newFormData.address.postalCode}`);
          console.log(`Country: ${newFormData.address.country} - ${typeof newFormData.address.country}`);
          console.log('-----------------------------');
      } else {
          console.log('--- Address is null/undefined ---');
          console.log('addressData was:', addressData);
          console.log('address was:', address);
          console.log('----------------------------------');
      }




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
            key={patient?.id || 'new-patient'}
            name="address"
            value={formData.address}
            onChange={(value) => {
              // Automatically generate formatted address text
              const updatedAddress = value ? {
                ...value,
                text: formatAddressText(value)
              } : undefined;
              setFormData(prev => ({ ...prev, address: updatedAddress }));
            }}
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