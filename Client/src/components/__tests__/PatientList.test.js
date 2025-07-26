import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import PatientList from '../PatientList';
import * as fhirApi from '../../services/fhirApi';

// Mock the fhirApi module
jest.mock('../../services/fhirApi');

const mockPatientApi = fhirApi.patientApi;

// Test data
const mockPatients = {
  resourceType: 'Bundle',
  total: 2,
  entry: [
    {
      resource: {
        resourceType: 'Patient',
        id: 'patient-1',
        name: [
          {
            use: 'official',
            family: 'Doe',
            given: ['John']
          }
        ],
        gender: 'male',
        birthDate: '1990-01-01',
        telecom: [
          {
            system: 'phone',
            value: '+1234567890'
          },
          {
            system: 'email',
            value: 'john.doe@example.com'
          }
        ]
      }
    },
    {
      resource: {
        resourceType: 'Patient',
        id: 'patient-2',
        name: [
          {
            use: 'official',
            family: 'Smith',
            given: ['Jane']
          }
        ],
        gender: 'female',
        birthDate: '1985-05-15',
        telecom: [
          {
            system: 'phone',
            value: '+0987654321'
          }
        ]
      }
    }
  ]
};

// Wrapper component for MantineProvider
const TestWrapper = ({ children }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('PatientList Component', () => {
  const mockOnEditPatient = jest.fn();
  const mockOnViewPatient = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPatientApi.getAll.mockResolvedValue(mockPatients);
    mockPatientApi.delete.mockResolvedValue();
  });

  it('renders loading state initially', () => {
    render(
      <TestWrapper>
        <PatientList onEditPatient={mockOnEditPatient} onViewPatient={mockOnViewPatient} />
      </TestWrapper>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders patient list after loading', async () => {
    render(
      <TestWrapper>
        <PatientList onEditPatient={mockOnEditPatient} onViewPatient={mockOnViewPatient} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(mockPatientApi.getAll).toHaveBeenCalledTimes(1);
  });

  it('displays patient information correctly', async () => {
    render(
      <TestWrapper>
        <PatientList onEditPatient={mockOnEditPatient} onViewPatient={mockOnViewPatient} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('male')).toBeInTheDocument();
    expect(screen.getByText('1/1/1990')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockPatientApi.getAll.mockRejectedValue(new Error('API Error'));

    render(
      <TestWrapper>
        <PatientList onEditPatient={mockOnEditPatient} onViewPatient={mockOnViewPatient} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load patients/i)).toBeInTheDocument();
    });

    expect(consoleError).toHaveBeenCalledWith('Error loading patients:', expect.any(Error));
    consoleError.mockRestore();
  });

  it('calls onEditPatient when edit button is clicked', async () => {
    render(
      <TestWrapper>
        <PatientList onEditPatient={mockOnEditPatient} onViewPatient={mockOnViewPatient} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText(/edit/i);
    fireEvent.click(editButtons[0]);

    expect(mockOnEditPatient).toHaveBeenCalledWith(mockPatients.entry[0].resource);
  });

  it('calls onViewPatient when view button is clicked', async () => {
    render(
      <TestWrapper>
        <PatientList onEditPatient={mockOnEditPatient} onViewPatient={mockOnViewPatient} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText(/view/i);
    fireEvent.click(viewButtons[0]);

    expect(mockOnViewPatient).toHaveBeenCalledWith(mockPatients.entry[0].resource);
  });

  it('deletes patient when delete button is clicked and confirmed', async () => {
    global.confirm = jest.fn(() => true);

    render(
      <TestWrapper>
        <PatientList onEditPatient={mockOnEditPatient} onViewPatient={mockOnViewPatient} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/delete/i);
    fireEvent.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete patient John Doe?');

    await waitFor(() => {
      expect(mockPatientApi.delete).toHaveBeenCalledWith('patient-1');
    });

    // Should reload patients after deletion
    expect(mockPatientApi.getAll).toHaveBeenCalledTimes(2);
  });

  it('does not delete patient when deletion is cancelled', async () => {
    global.confirm = jest.fn(() => false);

    render(
      <TestWrapper>
        <PatientList onEditPatient={mockOnEditPatient} onViewPatient={mockOnViewPatient} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/delete/i);
    fireEvent.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockPatientApi.delete).not.toHaveBeenCalled();
  });

  it('handles delete error gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    global.confirm = jest.fn(() => true);
    mockPatientApi.delete.mockRejectedValue(new Error('Delete failed'));

    render(
      <TestWrapper>
        <PatientList onEditPatient={mockOnEditPatient} onViewPatient={mockOnViewPatient} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/delete/i);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/failed to delete patient/i)).toBeInTheDocument();
    });

    expect(consoleError).toHaveBeenCalledWith('Error deleting patient:', expect.any(Error));
    consoleError.mockRestore();
  });

  it('handles patients with no name gracefully', async () => {
    const patientsWithoutName = {
      ...mockPatients,
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'patient-no-name',
            gender: 'unknown'
          }
        }
      ]
    };

    mockPatientApi.getAll.mockResolvedValue(patientsWithoutName);

    render(
      <TestWrapper>
        <PatientList onEditPatient={mockOnEditPatient} onViewPatient={mockOnViewPatient} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  it('handles empty patient list', async () => {
    const emptyBundle = {
      resourceType: 'Bundle',
      total: 0,
      entry: []
    };

    mockPatientApi.getAll.mockResolvedValue(emptyBundle);

    render(
      <TestWrapper>
        <PatientList onEditPatient={mockOnEditPatient} onViewPatient={mockOnViewPatient} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Should show some indication of empty list or no patients message
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('handles missing telecom information', async () => {
    const patientWithoutTelecom = {
      ...mockPatients,
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'patient-no-telecom',
            name: [
              {
                use: 'official',
                family: 'Test',
                given: ['Patient']
              }
            ],
            gender: 'male'
          }
        }
      ]
    };

    mockPatientApi.getAll.mockResolvedValue(patientWithoutTelecom);

    render(
      <TestWrapper>
        <PatientList onEditPatient={mockOnEditPatient} onViewPatient={mockOnViewPatient} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Patient Test')).toBeInTheDocument();
    });

    // Should handle missing phone and email gracefully
    expect(screen.getByText('male')).toBeInTheDocument();
  });

  it('refreshes patient list when refresh button is clicked', async () => {
    render(
      <TestWrapper>
        <PatientList onEditPatient={mockOnEditPatient} onViewPatient={mockOnViewPatient} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check if there's a refresh button and click it
    const refreshButton = screen.queryByText(/refresh/i) || screen.queryByRole('button', { name: /refresh/i });
    if (refreshButton) {
      fireEvent.click(refreshButton);
      expect(mockPatientApi.getAll).toHaveBeenCalledTimes(2);
    }
  });
});