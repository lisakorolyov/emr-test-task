import React, { useState, useEffect } from 'react';
import { encounterApi, patientApi } from '../services/fhirApi';

const EncounterList = ({ onEditEncounter, patientId, patientName }) => {
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEncounters();
  }, [patientId]);

  const loadEncounters = async () => {
    try {
      setLoading(true);
      let response;
      
      if (patientId) {
        // Load encounters for specific patient
        response = await encounterApi.searchByPatient(patientId);
      } else {
        // Load all encounters
        response = await encounterApi.getAll();
      }
      
      // Extract encounters from FHIR Bundle
      const encounterList = response.entry ? response.entry.map(entry => entry.resource) : [];
      setEncounters(encounterList);
      setError(null);
    } catch (err) {
      setError('Failed to load encounters');
      console.error('Error loading encounters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (encounter) => {
    if (window.confirm('Are you sure you want to delete this encounter?')) {
      try {
        await encounterApi.delete(encounter.id);
        loadEncounters(); // Refresh the list
      } catch (err) {
        setError('Failed to delete encounter');
        console.error('Error deleting encounter:', err);
      }
    }
  };

  const getPatientId = (encounter) => {
    return encounter.subject?.reference?.replace('Patient/', '') || '';
  };

  const getEncounterNotes = (encounter) => {
    if (!encounter.text || !encounter.text.div) return 'No notes';
    return encounter.text.div
      .replace('<div xmlns="http://www.w3.org/1999/xhtml">', '')
      .replace('</div>', '');
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
          onClick={loadEncounters}
          style={{ marginLeft: '10px' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  const title = patientId ? `Encounters for ${patientName}` : 'All Encounters';

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>{title}</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => onEditEncounter(null)}
        >
          Create New Encounter
        </button>
      </div>

      {encounters.length === 0 ? (
        <div className="alert alert-info">
          No encounters found. <button className="btn btn-link" onClick={() => onEditEncounter(null)}>Create the first encounter</button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                {!patientId && <th>Patient ID</th>}
                <th>Date</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {encounters.map((encounter) => (
                <tr key={encounter.id}>
                  {!patientId && <td>{getPatientId(encounter)}</td>}
                  <td>{formatDateTime(encounter.period?.start)}</td>
                  <td>
                    <span className={`badge ${
                      encounter.status === 'finished' ? 'bg-success' :
                      encounter.status === 'in-progress' ? 'bg-primary' :
                      encounter.status === 'cancelled' ? 'bg-danger' :
                      'bg-secondary'
                    }`}>
                      {encounter.status || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getEncounterNotes(encounter)}
                    </div>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => onEditEncounter(encounter)}
                        title="Edit Encounter"
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDelete(encounter)}
                        title="Delete Encounter"
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

export default EncounterList;