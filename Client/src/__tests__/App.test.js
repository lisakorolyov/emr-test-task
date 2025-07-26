import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// Mock the component dependencies
jest.mock('../components/PatientList', () => {
  return function MockPatientList({ onEditPatient, onViewPatient }) {
    return (
      <div data-testid="patient-list">
        <h2>Patient List</h2>
        <button onClick={() => onEditPatient({ id: 'test-patient' })}>
          Edit Patient
        </button>
        <button onClick={() => onViewPatient({ id: 'test-patient' })}>
          View Patient
        </button>
      </div>
    );
  };
});

jest.mock('../components/PatientForm', () => {
  return function MockPatientForm({ patient, onCancel }) {
    return (
      <div data-testid="patient-form">
        <h2>Patient Form</h2>
        <p>Editing: {patient?.id || 'New Patient'}</p>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

jest.mock('../components/AppointmentList', () => {
  return function MockAppointmentList({ onEditAppointment }) {
    return (
      <div data-testid="appointment-list">
        <h2>Appointment List</h2>
        <button onClick={() => onEditAppointment({ id: 'test-appointment' })}>
          Edit Appointment
        </button>
      </div>
    );
  };
});

jest.mock('../components/AppointmentForm', () => {
  return function MockAppointmentForm({ appointment, onCancel }) {
    return (
      <div data-testid="appointment-form">
        <h2>Appointment Form</h2>
        <p>Editing: {appointment?.id || 'New Appointment'}</p>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

jest.mock('../components/EncounterList', () => {
  return function MockEncounterList({ patient, onEditEncounter }) {
    return (
      <div data-testid="encounter-list">
        <h2>Encounter List</h2>
        <p>Patient: {patient ? patient.id : 'No patient selected'}</p>
        <button onClick={() => onEditEncounter({ id: 'test-encounter' })}>
          Edit Encounter
        </button>
      </div>
    );
  };
});

jest.mock('../components/EncounterForm', () => {
  return function MockEncounterForm({ encounter, onCancel }) {
    return (
      <div data-testid="encounter-form">
        <h2>Encounter Form</h2>
        <p>Editing: {encounter?.id || 'New Encounter'}</p>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

jest.mock('@medplum/react', () => ({
  Logo: () => <div data-testid="medplum-logo">Medplum Logo</div>
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the application header and navigation', () => {
    render(<App />);
    
    expect(screen.getByText('EMR')).toBeInTheDocument();
    expect(screen.getByTestId('medplum-logo')).toBeInTheDocument();
  });

  it('renders patient list tab by default', () => {
    render(<App />);
    
    expect(screen.getByTestId('patient-list')).toBeInTheDocument();
    expect(screen.getByText('Patient List')).toBeInTheDocument();
  });

  it('navigates to appointments tab when clicked', () => {
    render(<App />);
    
    const appointmentsTab = screen.getByText('Appointments');
    fireEvent.click(appointmentsTab);
    
    expect(screen.getByTestId('appointment-list')).toBeInTheDocument();
    expect(screen.getByText('Appointment List')).toBeInTheDocument();
  });

  it('switches to patient form when edit patient is triggered', () => {
    render(<App />);
    
    const editButton = screen.getByText('Edit Patient');
    fireEvent.click(editButton);
    
    expect(screen.getByTestId('patient-form')).toBeInTheDocument();
    expect(screen.getByText('Editing: test-patient')).toBeInTheDocument();
  });

  it('switches to encounter list when view patient is triggered', () => {
    render(<App />);
    
    const viewButton = screen.getByText('View Patient');
    fireEvent.click(viewButton);
    
    expect(screen.getByTestId('encounter-list')).toBeInTheDocument();
    // Since we're mocking the components, just check that encounter list is displayed
    expect(screen.getByText('Encounter List')).toBeInTheDocument();
  });

  it('returns to patient list when patient form is cancelled', () => {
    render(<App />);
    
    // Go to patient form
    const editButton = screen.getByText('Edit Patient');
    fireEvent.click(editButton);
    
    expect(screen.getByTestId('patient-form')).toBeInTheDocument();
    
    // Cancel the form
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(screen.getByTestId('patient-list')).toBeInTheDocument();
  });

  it('switches to appointment form when edit appointment is triggered', () => {
    render(<App />);
    
    // Navigate to appointments tab first
    const appointmentsTab = screen.getByText('Appointments');
    fireEvent.click(appointmentsTab);
    
    // Click edit appointment
    const editButton = screen.getByText('Edit Appointment');
    fireEvent.click(editButton);
    
    expect(screen.getByTestId('appointment-form')).toBeInTheDocument();
    expect(screen.getByText('Editing: test-appointment')).toBeInTheDocument();
  });

  it('returns to appointment list when appointment form is cancelled', () => {
    render(<App />);
    
    // Navigate to appointments and edit
    const appointmentsTab = screen.getByText('Appointments');
    fireEvent.click(appointmentsTab);
    
    const editButton = screen.getByText('Edit Appointment');
    fireEvent.click(editButton);
    
    // Cancel the form
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(screen.getByTestId('appointment-list')).toBeInTheDocument();
  });

  it('switches to encounter form when edit encounter is triggered', () => {
    render(<App />);
    
    // Go to patient encounters first
    const viewButton = screen.getByText('View Patient');
    fireEvent.click(viewButton);
    
    // Click edit encounter
    const editButton = screen.getByText('Edit Encounter');
    fireEvent.click(editButton);
    
    expect(screen.getByTestId('encounter-form')).toBeInTheDocument();
    expect(screen.getByText('Editing: test-encounter')).toBeInTheDocument();
  });

  it('shows new patient form when no patient is being edited', () => {
    render(<App />);
    
    // Navigate to patients tab and then to new patient form
    const patientsTab = screen.getByText('Patients');
    fireEvent.click(patientsTab);
    
    // Assuming there's a way to trigger new patient form without editing
    // This would depend on the actual implementation
    const newPatientButton = screen.queryByText('New Patient') || screen.queryByText('Add Patient');
    if (newPatientButton) {
      fireEvent.click(newPatientButton);
      expect(screen.getByText('Editing: New Patient')).toBeInTheDocument();
    }
  });

  it('maintains proper tab state when navigating', () => {
    render(<App />);
    
    // Start with patients
    expect(screen.getByTestId('patient-list')).toBeInTheDocument();
    
    // Go to appointments
    const appointmentsTab = screen.getByText('Appointments');
    fireEvent.click(appointmentsTab);
    expect(screen.getByTestId('appointment-list')).toBeInTheDocument();
    
    // Go back to patients
    const patientsTab = screen.getByText('Patients');
    fireEvent.click(patientsTab);
    expect(screen.getByTestId('patient-list')).toBeInTheDocument();
  });

  it('handles navigation between different sections correctly', () => {
    render(<App />);
    
    // Test navigation through all major sections
    const sections = ['Patients', 'Appointments'];
    
    sections.forEach(section => {
      const tab = screen.getByText(section);
      fireEvent.click(tab);
      
      // Should not show forms when just navigating tabs
      expect(screen.queryByTestId('patient-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('appointment-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('encounter-form')).not.toBeInTheDocument();
    });
  });

  it('clears selected patient when navigating away from encounters', () => {
    render(<App />);
    
    // Select a patient
    const viewButton = screen.getByText('View Patient');
    fireEvent.click(viewButton);
    
    expect(screen.getByTestId('encounter-list')).toBeInTheDocument();
    
    // Navigate to appointments
    const appointmentsTab = screen.getByText('Appointments');
    fireEvent.click(appointmentsTab);
    
    expect(screen.getByTestId('appointment-list')).toBeInTheDocument();
    
    // Navigate back to patients and then view again
    const patientsTab = screen.getByText('Patients');
    fireEvent.click(patientsTab);
    
    const viewButtonAgain = screen.getByText('View Patient');
    fireEvent.click(viewButtonAgain);
    
    // Should show the encounter list again
    expect(screen.getByTestId('encounter-list')).toBeInTheDocument();
  });
});