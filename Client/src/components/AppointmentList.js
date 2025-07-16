import React, { useState, useEffect } from 'react';
import { appointmentApi, patientApi } from '../services/fhirApi';

const AppointmentList = ({ onEditAppointment }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentApi.getAll();
      
      // Extract appointments from FHIR Bundle
      const appointmentList = response.entry ? response.entry.map(entry => entry.resource) : [];
      setAppointments(appointmentList);
      setError(null);
    } catch (err) {
      setError('Failed to load appointments');
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (appointment) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await appointmentApi.delete(appointment.id);
        loadAppointments(); // Refresh the list
      } catch (err) {
        setError('Failed to delete appointment');
        console.error('Error deleting appointment:', err);
      }
    }
  };

  const getPatientId = (appointment) => {
    const participant = appointment.participant?.find(p => 
      p.actor?.reference?.startsWith('Patient/')
    );
    return participant?.actor?.reference?.replace('Patient/', '') || '';
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    return new Date(dateTimeString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
        <button 
          className="btn btn-link" 
          onClick={loadAppointments}
          style={{ marginLeft: '10px' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Appointments</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => onEditAppointment(null)}
        >
          Schedule New Appointment
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="alert alert-info">
          No appointments found. <button className="btn btn-link" onClick={() => onEditAppointment(null)}>Schedule the first appointment</button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{getPatientId(appointment)}</td>
                  <td>{formatDateTime(appointment.start)}</td>
                  <td>{formatDateTime(appointment.end)}</td>
                  <td>
                    <span className={`badge ${
                      appointment.status === 'booked' ? 'bg-success' :
                      appointment.status === 'cancelled' ? 'bg-danger' :
                      appointment.status === 'fulfilled' ? 'bg-primary' :
                      'bg-secondary'
                    }`}>
                      {appointment.status || 'Unknown'}
                    </span>
                  </td>
                  <td>{appointment.description || 'No description'}</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => onEditAppointment(appointment)}
                        title="Edit Appointment"
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDelete(appointment)}
                        title="Delete Appointment"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;