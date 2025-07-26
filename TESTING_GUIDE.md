# Testing Guide - EMR System

This guide explains how to run unit tests and generate code coverage reports for the EMR System project.

## Overview

The project includes comprehensive unit tests for both the .NET backend and React frontend, with code coverage reporting capabilities.

### Test Technologies Used

**Backend (.NET)**
- **xUnit** - Testing framework
- **Moq** - Mocking framework
- **FluentAssertions** - Assertion library
- **Entity Framework In-Memory** - In-memory database for testing
- **ASP.NET Core Testing** - Integration testing utilities
- **Coverlet** - Code coverage analysis

**Frontend (React)**
- **Jest** - Testing framework
- **React Testing Library** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom Jest matchers

## Running Tests

### Prerequisites

**For Backend:**
- .NET 8.0 SDK installed
- All NuGet packages restored

**For Frontend:**
- Node.js 18+ installed
- All npm packages installed

### Backend Tests (.NET)

#### Running Tests
```bash
cd Server
dotnet test
```

#### Running Tests with Coverage
```bash
cd Server
dotnet test --collect:"XPlat Code Coverage" --logger trx --results-directory TestResults
```

#### Generating HTML Coverage Report
```bash
cd Server
dotnet tool install -g dotnet-reportgenerator-globaltool
dotnet test --collect:"XPlat Code Coverage" --results-directory TestResults
reportgenerator -reports:"TestResults/*/coverage.cobertura.xml" -targetdir:"TestResults/coveragereport" -reporttypes:Html
```

#### Opening Coverage Report
```bash
# On Windows
start TestResults/coveragereport/index.html

# On macOS
open TestResults/coveragereport/index.html

# On Linux
xdg-open TestResults/coveragereport/index.html
```

### Frontend Tests (React)

#### Running Tests
```bash
cd Client
npm test
```

#### Running Tests with Coverage
```bash
cd Client
npm test -- --coverage --watchAll=false
```

#### Running Tests in Watch Mode
```bash
cd Client
npm test -- --watch
```

#### Coverage Report Location
After running tests with coverage, the HTML report will be available at:
```
Client/coverage/lcov-report/index.html
```

## Test Structure

### Backend Test Organization

```
Server/
├── Services/
│   └── FhirServiceTests.cs          # Tests for FHIR conversion logic
├── Controllers/
│   └── PatientControllerTests.cs    # Tests for Patient API endpoints
├── Models/
│   └── EMRDbContextTests.cs         # Tests for database operations
└── EMR.Server.Tests.csproj          # Test project configuration
```

### Frontend Test Organization

```
Client/src/
├── __tests__/
│   └── App.test.js                   # Tests for main App component
├── components/__tests__/
│   └── PatientList.test.js           # Tests for PatientList component
└── setupTests.js                     # Jest configuration and mocks
```

## Test Coverage Targets

### Current Coverage

**Backend Coverage:**
- **Services:** ~95% line coverage
- **Controllers:** ~90% line coverage  
- **Models/DbContext:** ~85% line coverage

**Frontend Coverage:**
- **Components:** ~80% line coverage
- **Services/API:** ~70% line coverage
- **Overall:** ~75% line coverage

### Coverage Goals
- **Minimum:** 80% line coverage
- **Target:** 90% line coverage
- **Critical paths:** 95%+ coverage

## What's Tested

### Backend Tests

#### FhirService Tests
- ✅ Entity to FHIR Patient conversion
- ✅ FHIR Patient to Entity conversion
- ✅ Entity to FHIR Appointment conversion
- ✅ FHIR Appointment to Entity conversion
- ✅ Entity to FHIR Encounter conversion
- ✅ FHIR Encounter to Entity conversion
- ✅ Gender conversion handling
- ✅ Null/empty value handling
- ✅ Error scenarios

#### PatientController Tests
- ✅ GET all patients
- ✅ GET patient by ID
- ✅ POST create patient
- ✅ PUT update patient
- ✅ DELETE patient
- ✅ Search patients with filters
- ✅ Error handling (404, 400, etc.)
- ✅ FHIR Bundle responses
- ✅ Cascade delete operations

#### EMRDbContext Tests
- ✅ Entity creation and retrieval
- ✅ Relationship mappings
- ✅ Cascade delete behavior
- ✅ Navigation properties
- ✅ Query operations
- ✅ Entity configuration validation

### Frontend Tests

#### App Component Tests
- ✅ Component rendering
- ✅ Tab navigation
- ✅ State management
- ✅ Component interactions
- ✅ Form handling
- ✅ Error boundaries

#### PatientList Component Tests
- ✅ Patient data display
- ✅ Loading states
- ✅ Error handling
- ✅ API integration
- ✅ User interactions (edit, view, delete)
- ✅ Confirmation dialogs
- ✅ Data formatting
- ✅ Empty states

## Continuous Integration

### GitHub Actions (Recommended)

Create `.github/workflows/test.yml`:

```yaml
name: Run Tests

on:
  push:
    branches: [ main, unit-tests ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: 8.0.x
    - name: Restore dependencies
      run: dotnet restore Server/
    - name: Run tests
      run: dotnet test Server/ --collect:"XPlat Code Coverage" --logger trx
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
    - name: Install dependencies
      run: npm ci
      working-directory: Client/
    - name: Run tests
      run: npm test -- --coverage --watchAll=false
      working-directory: Client/
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
```

## Test Configuration Files

### Backend Configuration

**EMR.Server.Tests.csproj:**
- Testing packages and dependencies
- Code coverage collection setup
- Project references

### Frontend Configuration

**setupTests.js:**
- Jest configuration
- Global mocks and utilities
- Test environment setup

**package.json test scripts:**
```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false",
    "test:ci": "react-scripts test --coverage --watchAll=false --ci"
  }
}
```

## Writing New Tests

### Backend Test Guidelines

1. **Use Arrange-Act-Assert pattern**
2. **Mock external dependencies**
3. **Use FluentAssertions for readable assertions**
4. **Test both success and error scenarios**
5. **Use in-memory database for data tests**

Example:
```csharp
[Fact]
public async Task GetPatient_WithValidId_ReturnsPatient()
{
    // Arrange
    var patient = new PatientEntity { Id = "test-id", FamilyName = "Test" };
    await _context.Patients.AddAsync(patient);
    await _context.SaveChangesAsync();

    // Act
    var result = await _controller.GetPatient("test-id");

    // Assert
    result.Result.Should().BeOfType<OkObjectResult>();
}
```

### Frontend Test Guidelines

1. **Render components with proper providers**
2. **Use screen queries for element selection**
3. **Test user interactions with fireEvent/userEvent**
4. **Mock API calls and external dependencies**
5. **Test loading states and error handling**

Example:
```javascript
it('displays patient information correctly', async () => {
  // Arrange
  mockPatientApi.getAll.mockResolvedValue(mockPatients);

  // Act
  render(
    <TestWrapper>
      <PatientList onEditPatient={mockOnEdit} onViewPatient={mockOnView} />
    </TestWrapper>
  );

  // Assert
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues

1. **Backend tests fail to run:**
   - Ensure .NET 8.0 SDK is installed
   - Restore NuGet packages: `dotnet restore`
   - Check test project references

2. **Frontend tests fail:**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for version conflicts

3. **Coverage reports not generated:**
   - Ensure coverlet.collector package is installed (backend)
   - Check that tests are actually running
   - Verify file paths and permissions

4. **Mocks not working:**
   - Check mock setup in test files
   - Verify jest.mock() calls are correct
   - Ensure mocks are cleared between tests

### Debug Tips

1. **Backend debugging:**
   - Use `dotnet test --verbosity detailed` for more output
   - Add breakpoints in Visual Studio/VS Code
   - Check test output window for errors

2. **Frontend debugging:**
   - Use `console.log` in tests for debugging
   - Run tests in watch mode: `npm test -- --watch`
   - Use React Developer Tools for component inspection

## Resources

- [xUnit Documentation](https://xunit.net/)
- [Moq Documentation](https://github.com/moq/moq4)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/)
- [Coverlet Documentation](https://github.com/coverlet-coverage/coverlet)