# EMR System - FHIR-based Electronic Medical Records

A simplified Electronic Medical Records (EMR) system built with .NET Core backend and React frontend, implementing FHIR R4 standards for healthcare data interoperability.

## Features

- **Patient Management**: Create, read, update, and delete patient records
- **Appointment Scheduling**: Schedule and manage patient appointments
- **Encounter Management**: Create and manage patient encounters with clinical notes
- **FHIR Compliance**: All APIs follow FHIR R4 standards
- **Cross-Platform**: Works on Windows, macOS, and Linux using Docker

## Architecture

- **Backend**: .NET Core 8.0 WebAPI with Entity Framework Core
- **Frontend**: React 18 with Bootstrap for styling
- **Database**: SQL Server Express
- **FHIR Library**: Firely SDK (Hl7.Fhir.R4)
- **Deployment**: Docker containers with Docker Compose

## Prerequisites

### Option 1: Using Docker (Recommended)
- Docker Desktop installed on your system
- Docker Compose (included with Docker Desktop)

### Option 2: Manual Setup
- .NET 8.0 SDK
- Node.js 18 or later
- SQL Server Express or SQL Server Developer Edition

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd emr-test-task
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Swagger UI: http://localhost:5000/swagger

4. **Stop the application**
   ```bash
   docker-compose down
   ```

## Manual Setup Instructions

### Backend Setup

1. **Navigate to the Server directory**
   ```bash
   cd Server
   ```

2. **Restore dependencies**
   ```bash
   dotnet restore
   ```

3. **Update the connection string** in `appsettings.json` if needed:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=EMRDatabase;Trusted_Connection=true;TrustServerCertificate=true;"
     }
   }
   ```

4. **Run the backend**
   ```bash
   dotnet run
   ```

The backend will be available at http://localhost:5000

### Frontend Setup

1. **Navigate to the Client directory**
   ```bash
   cd Client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

The frontend will be available at http://localhost:3000

## API Endpoints

### Patient Resources
- `GET /fhir/Patient` - Get all patients
- `GET /fhir/Patient/{id}` - Get specific patient
- `POST /fhir/Patient` - Create new patient
- `PUT /fhir/Patient/{id}` - Update patient
- `DELETE /fhir/Patient/{id}` - Delete patient
- `GET /fhir/Patient/{id}/Appointment` - Get patient appointments
- `GET /fhir/Patient/{id}/Encounter` - Get patient encounters

### Appointment Resources
- `GET /fhir/Appointment` - Get all appointments
- `GET /fhir/Appointment/{id}` - Get specific appointment
- `POST /fhir/Appointment` - Create new appointment
- `PUT /fhir/Appointment/{id}` - Update appointment
- `DELETE /fhir/Appointment/{id}` - Delete appointment
- `GET /fhir/Appointment/search?patient={patientId}` - Search appointments by patient

### Encounter Resources
- `GET /fhir/Encounter` - Get all encounters
- `GET /fhir/Encounter/{id}` - Get specific encounter
- `POST /fhir/Encounter` - Create new encounter
- `PUT /fhir/Encounter/{id}` - Update encounter
- `DELETE /fhir/Encounter/{id}` - Delete encounter
- `GET /fhir/Encounter/search?patient={patientId}` - Search encounters by patient

## Sample FHIR Resources

### Patient Resource
```json
{
  "resourceType": "Patient",
  "name": [
    {
      "use": "official",
      "family": "Doe",
      "given": ["John"]
    }
  ],
  "gender": "male",
  "birthDate": "1990-01-01",
  "telecom": [
    {
      "system": "phone",
      "value": "555-0123",
      "use": "mobile"
    }
  ],
  "address": [
    {
      "use": "home",
      "text": "123 Main St, Anytown, USA",
      "type": "physical"
    }
  ]
}
```

### Appointment Resource
```json
{
  "resourceType": "Appointment",
  "status": "booked",
  "start": "2024-01-15T10:00:00Z",
  "end": "2024-01-15T11:00:00Z",
  "description": "Regular checkup",
  "participant": [
    {
      "actor": {
        "reference": "Patient/123"
      },
      "status": "accepted"
    }
  ]
}
```

### Encounter Resource
```json
{
  "resourceType": "Encounter",
  "status": "finished",
  "subject": {
    "reference": "Patient/123"
  },
  "period": {
    "start": "2024-01-15T10:00:00Z",
    "end": "2024-01-15T11:00:00Z"
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\">Patient presented with mild headache. Prescribed rest and hydration.</div>"
  }
}
```

## Using the Application

1. **Managing Patients**
   - Navigate to the "Patients" tab
   - Click "Add New Patient" to create a patient
   - Use "Edit" to modify patient information
   - Use "Delete" to remove a patient
   - Use "View" to see patient encounters

2. **Scheduling Appointments**
   - Navigate to the "Appointments" tab
   - Click "Schedule New Appointment"
   - Select a patient and set date/time
   - Add description if needed

3. **Managing Encounters**
   - Navigate to the "Encounters" tab to see all encounters
   - Or view patient-specific encounters from the patient list
   - Click "Create New Encounter" to document a patient visit
   - Add detailed notes about the encounter

## Development Notes

- The application uses Entity Framework Code First approach
- Database is created automatically on first run
- All APIs return FHIR-compliant JSON responses
- Frontend uses Bootstrap for responsive design
- No authentication is implemented (as per requirements)

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Ensure SQL Server is running
   - Check connection string in appsettings.json
   - For Docker: The database container needs time to start

2. **CORS Issues**
   - Backend is configured to allow requests from localhost:3000
   - Check that both frontend and backend are running on correct ports

3. **Port Conflicts**
   - Backend uses port 5000
   - Frontend uses port 3000
   - Change ports in docker-compose.yml if needed

### Docker Issues

1. **Containers not starting**
   ```bash
   docker-compose logs
   ```

2. **Database initialization**
   ```bash
   docker-compose exec sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P EMR_Password123!
   ```

3. **Reset everything**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

## Testing

The application includes:
- FHIR-compliant API endpoints
- Proper error handling
- Input validation
- Responsive UI design

For production use, consider adding:
- Unit tests for backend services
- Integration tests for API endpoints
- Component tests for React components
- End-to-end testing with tools like Cypress
