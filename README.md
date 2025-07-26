# EMR System

A full-stack Electronic Medical Records system built with modern web technologies.

## Tech Stack

**Frontend**
- React 18
- Mantine UI Components
- Bootstrap 5
- Medplum (FHIR support)

**Backend**
- .NET 8.0 (ASP.NET Core Web API)
- Entity Framework Core
- SQL Server
- FHIR R4 (HL7)
- Swagger/OpenAPI

**Infrastructure**
- Docker & Docker Compose
- SQL Server 2022

## Getting Started

### Prerequisites
- Docker and Docker Compose
- .NET 8.0 SDK (for local development)
- Node.js 18+ (for local development)

### Setup & Run

1. **Clone the repository**
   ```bash
   git clone https://github.com/lisakorolyov/emr-test-task
   cd emr-test-task
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/swagger

### Local Development

**Backend**
```bash
cd Server
dotnet restore
dotnet run
```

**Frontend**
```bash
cd Client
npm install
npm start
```

## Running Tests

**Backend Tests**
```bash
cd Server
dotnet test
```

**Frontend Tests**
```bash
cd Client
npm test
```

**Run All Tests**
```bash
# Backend with coverage
cd Server && dotnet test --collect:"XPlat Code Coverage"

# Frontend with coverage
cd Client && npm run test:coverage
```
