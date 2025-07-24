import React, { useState, useEffect } from 'react';
import { encounterApi, patientApi, createFhirEncounter } from '../services/fhirApi';

const EncounterForm = ({ encounter, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    status: 'in-progress',
    notes: '',
  });
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPatients();
    
    if (encounter) {
      // Extract data from encounter
      const patientId = encounter.subject?.reference?.replace('Patient/', '') || '';
      const notes = encounter.text?.div 
        ? encounter.text.div
            .replace('<div xmlns="http://www.w3.org/1999/xhtml">', '')
            .replace('</div>', '')
        : '';
      
      setFormData({
        patientId: patientId,
        date: encounter.period?.start ? new Date(encounter.period.start).toISOString().slice(0, 16) : '',
        status: encounter.status || 'in-progress',
        notes: notes,
      });
    }
  }, [encounter]);

  const loadPatients = async () => {
    try {
      const response = await patientApi.getAll();
      const patientList = response.entry ? response.entry.map(entry => entry.resource) : [];
      setPatients(patientList);
    } catch (err) {
      console.error('Error loading patients:', err);
    }
  };

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
      // Convert datetime-local to ISO string
      const encounterData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
      };

      const fhirEncounter = createFhirEncounter(encounterData);
      
      if (encounter) {
        // Update existing encounter
        await encounterApi.update(encounter.id, fhirEncounter);
      } else {
        // Create new encounter
        await encounterApi.create(fhirEncounter);
      }
      
      onSave();
    } catch (err) {
      setError('Failed to save encounter');
      console.error('Error saving encounter:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (patient) => {
    if (!patient.name || patient.name.length === 0) return 'Unknown';
    const name = patient.name[0];
    return `${name.given?.[0] || ''} ${name.family || ''}`.trim();
  };

  const isEditing = !!encounter;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>{isEditing ? 'Edit Encounter' : 'Create New Encounter'}</h2>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="patientId" className="form-label">Patient *</label>
          <select
            className="form-select"
            id="patientId"
            name="patientId"
            value={formData.patientId}
            onChange={handleChange}
            required
            disabled={loading}
          >
            <option value="">Select a patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {getPatientName(patient)}
              </option>
            ))}
          </select>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="date" className="form-label">Date & Time *</label>
              <input
                type="datetime-local"
                className="form-control"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="status" className="form-label">Status</label>
              <select
                className="form-select"
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="planned">Planned</option>
                <option value="arrived">Arrived</option>
                <option value="in-progress">In Progress</option>
                <option value="finished">Finished</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="notes" className="form-label">Notes *</label>
          <textarea
            className="form-control"
            id="notes"
            name="notes"
            rows="8"
            value={formData.notes}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter encounter notes, observations, and clinical details..."
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
              isEditing ? 'Update Encounter' : 'Create Encounter'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EncounterForm;