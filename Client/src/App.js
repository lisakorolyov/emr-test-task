import React, { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { Logo } from '@medplum/react';
import PatientList from './components/PatientList';
import PatientForm from './components/PatientForm';
import AppointmentList from './components/AppointmentList';
import AppointmentForm from './components/AppointmentForm';
import EncounterList from './components/EncounterList';
import EncounterForm from './components/EncounterForm';

function App() {
  const [activeTab, setActiveTab] = useState('patients');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editingEncounter, setEditingEncounter] = useState(null);

  const handlePatientEdit = (patient) => {
    setEditingPatient(patient);
    setActiveTab('patient-form');
  };

  const handlePatientView = (patient) => {
    setSelectedPatient(patient);
    setActiveTab('patient-encounters');
  };

  const handleAppointmentEdit = (appointment) => {
    setEditingAppointment(appointment);
    setActiveTab('appointment-form');
  };

  const handleEncounterEdit = (encounter) => {
    setEditingEncounter(encounter);
    setActiveTab('encounter-form');
  };

  const handlePatientFormCancel = () => {
    setEditingPatient(null);
    setSelectedPatient(null);
    setActiveTab('patients');
  };

  const handleAppointmentFormCancel = () => {
    setEditingAppointment(null);
    setActiveTab('appointments');
  };

  const handleEncounterFormCancel = () => {
    setEditingEncounter(null);
    setActiveTab('encounters');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'patients':
        return (
          <PatientList
            onEditPatient={handlePatientEdit}
            onViewPatient={handlePatientView}
          />
        );
      case 'patient-form':
        return (
          <PatientForm
            patient={editingPatient}
            onCancel={handlePatientFormCancel}
            onSave={handlePatientFormCancel}
          />
        );
      case 'appointments':
        return (
          <AppointmentList
            onEditAppointment={handleAppointmentEdit}
          />
        );
      case 'appointment-form':
        return (
          <AppointmentForm
            appointment={editingAppointment}
            onCancel={handleAppointmentFormCancel}
            onSave={handleAppointmentFormCancel}
          />
        );
      case 'encounters':
        return (
          <EncounterList
            onEditEncounter={handleEncounterEdit}
          />
        );
      case 'encounter-form':
        return (
          <EncounterForm
            encounter={editingEncounter}
            onCancel={handleEncounterFormCancel}
            onSave={handleEncounterFormCancel}
          />
        );
      case 'patient-encounters':
        return (
          <EncounterList
            patientId={selectedPatient?.id}
            patientName={selectedPatient?.name?.[0]?.given?.[0] + ' ' + selectedPatient?.name?.[0]?.family}
            onEditEncounter={handleEncounterEdit}
          />
        );
      default:
        return <PatientList onEditPatient={handlePatientEdit} onViewPatient={handlePatientView} />;
    }
  };

  return (
    <MantineProvider>
      <div className="container-fluid p-0">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 position-relative">
          <div className="navbar-brand d-flex align-items-center ms-3">
            <Logo size={32} />
            <span className="ms-3">EMR</span>
          </div>
          <div className="position-absolute top-50 start-50 translate-middle">
            <div className="navbar-nav d-flex flex-row gap-3">
              <button
                className={`nav-link btn btn-link ${activeTab === 'patients' ? 'active' : ''}`}
                onClick={() => setActiveTab('patients')}
              >
                Patients
              </button>
              <button
                className={`nav-link btn btn-link ${activeTab === 'appointments' ? 'active' : ''}`}
                onClick={() => setActiveTab('appointments')}
              >
                Appointments
              </button>
              <button
                className={`nav-link btn btn-link ${activeTab === 'encounters' ? 'active' : ''}`}
                onClick={() => setActiveTab('encounters')}
              >
                Encounters
              </button>
            </div>
          </div>
        </nav>

        <div className="container">
          <div className="row">
            <div className="col-12">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </MantineProvider>
  );
}

export default App;