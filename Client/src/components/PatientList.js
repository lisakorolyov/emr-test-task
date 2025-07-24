import React, { useState, useEffect } from 'react';
import { patientApi } from '../services/fhirApi';

const PatientList = ({ onEditPatient, onViewPatient }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await patientApi.getAll();
      
      // Extract patients from FHIR Bundle
      const patientList = response.entry ? response.entry.map(entry => entry.resource) : [];
      setPatients(patientList);
      setError(null);
    } catch (err) {
      setError('Failed to load patients');
      console.error('Error loading patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (patient) => {
    if (window.confirm(`Are you sure you want to delete patient ${getPatientName(patient)}?`)) {
      try {
        await patientApi.delete(patient.id);
        loadPatients(); // Refresh the list
      } catch (err) {
        setError('Failed to delete patient');
        console.error('Error deleting patient:', err);
      }
    }
  };

  const getPatientName = (patient) => {
    if (!patient.name || patient.name.length === 0) return 'Unknown';
    const name = patient.name[0];
    return `${name.given?.[0] || ''} ${name.family || ''}`.trim();
  };

  const getPatientPhone = (patient) => {
    if (!patient.telecom) return '';
    const phone = patient.telecom.find(t => t.system === 'phone');
    return phone ? phone.value : '';
  };

  const getPatientEmail = (patient) => {
    if (!patient.telecom) return '';
    const email = patient.telecom.find(t => t.system === 'email');
    return email ? email.value : '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
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
          onClick={loadPatients}
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
        <h2>Patients</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => onEditPatient(null)}
        >
          Add New Patient
        </button>
      </div>

      {patients.length === 0 ? (
        <div className="alert alert-info">
          No patients found. <button className="btn btn-link" onClick={() => onEditPatient(null)}>Add the first patient</button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Gender</th>
                <th>Birth Date</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td>{getPatientName(patient)}</td>
                  <td className="text-capitalize">{patient.gender || 'Unknown'}</td>
                  <td>{formatDate(patient.birthDate)}</td>
                  <td>{getPatientPhone(patient)}</td>
                  <td>{getPatientEmail(patient)}</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => onViewPatient(patient)}
                        title="View Encounters"
                      >
                        View
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => onEditPatient(patient)}
                        title="Edit Patient"
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDelete(patient)}
                        title="Delete Patient"
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

export default PatientList;