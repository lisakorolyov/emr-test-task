import React, { useState, useEffect } from 'react';
import { appointmentApi, patientApi, createFhirAppointment } from '../services/fhirApi';

const AppointmentForm = ({ appointment, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    start: '',
    end: '',
    status: 'booked',
    description: '',
  });
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPatients();
    
    if (appointment) {
      // Extract patient ID from appointment
      const participant = appointment.participant?.find(p => 
        p.actor?.reference?.startsWith('Patient/')
      );
      const patientId = participant?.actor?.reference?.replace('Patient/', '') || '';
      
      setFormData({
        patientId: patientId,
        start: appointment.start ? new Date(appointment.start).toISOString().slice(0, 16) : '',
        end: appointment.end ? new Date(appointment.end).toISOString().slice(0, 16) : '',
        status: appointment.status || 'booked',
        description: appointment.description || '',
      });
    }
  }, [appointment]);

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
      const appointmentData = {
        ...formData,
        start: new Date(formData.start).toISOString(),
        end: new Date(formData.end).toISOString(),
      };

      const fhirAppointment = createFhirAppointment(appointmentData);
      
      if (appointment) {
        // Update existing appointment
        await appointmentApi.update(appointment.id, fhirAppointment);
      } else {
        // Create new appointment
        await appointmentApi.create(fhirAppointment);
      }
      
      onSave();
    } catch (err) {
      setError('Failed to save appointment');
      console.error('Error saving appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (patient) => {
    if (!patient.name || patient.name.length === 0) return 'Unknown';
    const name = patient.name[0];
    return `${name.given?.[0] || ''} ${name.family || ''}`.trim();
  };

  const isEditing = !!appointment;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>{isEditing ? 'Edit Appointment' : 'Schedule New Appointment'}</h2>
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
              <label htmlFor="start" className="form-label">Start Date & Time *</label>
              <input
                type="datetime-local"
                className="form-control"
                              id="start"
                              name="start"
                value={formData.start}
                onChange={handleChange}
                              required
                              disabled={loading}
                          />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="end" className="form-label">End Date & Time *</label>
              <input
                type="datetime-local"
                className="form-control"
                id="end"
                name="end"
                value={formData.end}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>
        </div>

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
            <option value="booked">Booked</option>
            <option value="cancelled">Cancelled</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="noshow">No Show</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            className="form-control"
            id="description"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
            placeholder="Enter appointment description"
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
                {isEditing ? 'Updating...' : 'Scheduling...'}
              </>
            ) : (
              isEditing ? 'Update Appointment' : 'Schedule Appointment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;