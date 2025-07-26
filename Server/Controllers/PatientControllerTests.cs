using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using EMR.Server.Controllers;
using EMR.Server.Models;
using EMR.Server.Services;
using Hl7.Fhir.Model;
using Hl7.Fhir.Serialization;
using FluentAssertions;
using System.Text.Json;

namespace EMR.Server.Tests.Controllers
{
    public class PatientControllerTests : IDisposable
    {
        private readonly EMRDbContext _context;
        private readonly Mock<IFhirService> _mockFhirService;
        private readonly Mock<ILogger<PatientController>> _mockLogger;
        private readonly PatientController _controller;

        public PatientControllerTests()
        {
            var options = new DbContextOptionsBuilder<EMRDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            
            _context = new EMRDbContext(options);
            _mockFhirService = new Mock<IFhirService>();
            _mockLogger = new Mock<ILogger<PatientController>>();
            _controller = new PatientController(_context, _mockFhirService.Object, _mockLogger.Object);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        [Fact]
        public async Task GetPatients_ReturnsAllPatients_AsFhirBundle()
        {
            // Arrange
            var patients = new List<PatientEntity>
            {
                new PatientEntity 
                { 
                    Id = "patient1", 
                    FamilyName = "Doe", 
                    GivenName = "John",
                    UpdatedAt = DateTime.UtcNow
                },
                new PatientEntity 
                { 
                    Id = "patient2", 
                    FamilyName = "Smith", 
                    GivenName = "Jane",
                    UpdatedAt = DateTime.UtcNow
                }
            };

            await _context.Patients.AddRangeAsync(patients);
            await _context.SaveChangesAsync();

            var fhirPatient1 = new Patient { Id = "patient1" };
            var fhirPatient2 = new Patient { Id = "patient2" };

            _mockFhirService.Setup(x => x.EntityToPatient(patients[0])).Returns(fhirPatient1);
            _mockFhirService.Setup(x => x.EntityToPatient(patients[1])).Returns(fhirPatient2);

            // Act
            var result = await _controller.GetPatients();

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult.Value.Should().BeOfType<string>();
            
            var bundleJson = okResult.Value as string;
            bundleJson.Should().NotBeNull();
            bundleJson.Should().Contain("\"resourceType\":\"Bundle\"");
            bundleJson.Should().Contain("patient1");
            bundleJson.Should().Contain("patient2");
        }

        [Fact]
        public async Task GetPatient_WithExistingId_ReturnsPatient()
        {
            // Arrange
            var patientEntity = new PatientEntity
            {
                Id = "existing-patient",
                FamilyName = "Test",
                GivenName = "Patient",
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Patients.AddAsync(patientEntity);
            await _context.SaveChangesAsync();

            var fhirPatient = new Patient { Id = "existing-patient", Name = new List<HumanName> { new HumanName { Family = "Test" } } };
            _mockFhirService.Setup(x => x.EntityToPatient(patientEntity)).Returns(fhirPatient);

            // Act
            var result = await _controller.GetPatient("existing-patient");

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var patientJson = okResult.Value as string;
            patientJson.Should().Contain("existing-patient");
            patientJson.Should().Contain("Test");
        }

        [Fact]
        public async Task GetPatient_WithNonExistingId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetPatient("non-existing-id");

            // Assert
            result.Result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task CreatePatient_WithValidPatient_ReturnsCreatedResult()
        {
            // Arrange
            var fhirPatient = new Patient
            {
                Name = new List<HumanName>
                {
                    new HumanName { Family = "NewPatient", Given = new[] { "Test" } }
                },
                Gender = AdministrativeGender.Male,
                BirthDate = "1990-01-01"
            };

            var patientEntity = new PatientEntity
            {
                Id = "new-patient-id",
                FamilyName = "NewPatient",
                GivenName = "Test",
                Gender = "male",
                BirthDate = new DateTime(1990, 1, 1),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _mockFhirService.Setup(x => x.PatientToEntity(It.IsAny<Patient>())).Returns(patientEntity);
            _mockFhirService.Setup(x => x.EntityToPatient(It.IsAny<PatientEntity>())).Returns(fhirPatient);

            var jsonSerializer = new FhirJsonSerializer();
            var patientJson = jsonSerializer.SerializeToString(fhirPatient);

            // Act
            var result = await _controller.CreatePatient(patientJson);

            // Assert
            result.Result.Should().BeOfType<CreatedAtActionResult>();
            var createdResult = result.Result as CreatedAtActionResult;
            createdResult.ActionName.Should().Be("GetPatient");
            
            var savedPatient = await _context.Patients.FindAsync("new-patient-id");
            savedPatient.Should().NotBeNull();
            savedPatient.FamilyName.Should().Be("NewPatient");
        }

        [Fact]
        public async Task CreatePatient_WithInvalidJson_ReturnsBadRequest()
        {
            // Arrange
            var invalidJson = "{ invalid json }";

            // Act
            var result = await _controller.CreatePatient(invalidJson);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task UpdatePatient_WithExistingPatient_ReturnsOkResult()
        {
            // Arrange
            var existingEntity = new PatientEntity
            {
                Id = "update-patient",
                FamilyName = "OldName",
                GivenName = "Test",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow.AddMinutes(-10)
            };

            await _context.Patients.AddAsync(existingEntity);
            await _context.SaveChangesAsync();

            var updatedFhirPatient = new Patient
            {
                Id = "update-patient",
                Name = new List<HumanName>
                {
                    new HumanName { Family = "NewName", Given = new[] { "Test" } }
                }
            };

            var updatedEntity = new PatientEntity
            {
                Id = "update-patient",
                FamilyName = "NewName",
                GivenName = "Test",
                CreatedAt = existingEntity.CreatedAt,
                UpdatedAt = DateTime.UtcNow
            };

            _mockFhirService.Setup(x => x.PatientToEntity(It.IsAny<Patient>())).Returns(updatedEntity);
            _mockFhirService.Setup(x => x.EntityToPatient(It.IsAny<PatientEntity>())).Returns(updatedFhirPatient);

            var jsonSerializer = new FhirJsonSerializer();
            var patientJson = jsonSerializer.SerializeToString(updatedFhirPatient);

            // Act
            var result = await _controller.UpdatePatient("update-patient", patientJson);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            
            var updatedPatientInDb = await _context.Patients.FindAsync("update-patient");
            updatedPatientInDb.Should().NotBeNull();
            updatedPatientInDb.FamilyName.Should().Be("NewName");
        }

        [Fact]
        public async Task UpdatePatient_WithNonExistingPatient_ReturnsNotFound()
        {
            // Arrange
            var fhirPatient = new Patient { Id = "non-existing" };
            var jsonSerializer = new FhirJsonSerializer();
            var patientJson = jsonSerializer.SerializeToString(fhirPatient);

            // Act
            var result = await _controller.UpdatePatient("non-existing", patientJson);

            // Assert
            result.Result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task UpdatePatient_WithMismatchedId_ReturnsBadRequest()
        {
            // Arrange
            var fhirPatient = new Patient { Id = "different-id" };
            var jsonSerializer = new FhirJsonSerializer();
            var patientJson = jsonSerializer.SerializeToString(fhirPatient);

            // Act
            var result = await _controller.UpdatePatient("original-id", patientJson);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task DeletePatient_WithExistingPatient_ReturnsNoContent()
        {
            // Arrange
            var patientEntity = new PatientEntity
            {
                Id = "delete-patient",
                FamilyName = "ToDelete",
                GivenName = "Patient",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Patients.AddAsync(patientEntity);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.DeletePatient("delete-patient");

            // Assert
            result.Should().BeOfType<NoContentResult>();
            
            var deletedPatient = await _context.Patients.FindAsync("delete-patient");
            deletedPatient.Should().BeNull();
        }

        [Fact]
        public async Task DeletePatient_WithNonExistingPatient_ReturnsNotFound()
        {
            // Act
            var result = await _controller.DeletePatient("non-existing");

            // Assert
            result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task DeletePatient_WithRelatedAppointments_DeletesCascade()
        {
            // Arrange
            var patientEntity = new PatientEntity
            {
                Id = "patient-with-appointments",
                FamilyName = "Test",
                GivenName = "Patient",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var appointmentEntity = new AppointmentEntity
            {
                Id = "appointment-1",
                PatientId = "patient-with-appointments",
                Start = DateTime.UtcNow.AddDays(1),
                End = DateTime.UtcNow.AddDays(1).AddHours(1),
                Status = "booked",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Patients.AddAsync(patientEntity);
            await _context.Appointments.AddAsync(appointmentEntity);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.DeletePatient("patient-with-appointments");

            // Assert
            result.Should().BeOfType<NoContentResult>();
            
            var deletedPatient = await _context.Patients.FindAsync("patient-with-appointments");
            deletedPatient.Should().BeNull();
            
            var deletedAppointment = await _context.Appointments.FindAsync("appointment-1");
            deletedAppointment.Should().BeNull();
        }

        [Fact]
        public async Task SearchPatients_WithFamilyNameParameter_ReturnsFilteredResults()
        {
            // Arrange
            var patients = new List<PatientEntity>
            {
                new PatientEntity 
                { 
                    Id = "patient1", 
                    FamilyName = "Smith", 
                    GivenName = "John",
                    UpdatedAt = DateTime.UtcNow
                },
                new PatientEntity 
                { 
                    Id = "patient2", 
                    FamilyName = "Jones", 
                    GivenName = "Jane",
                    UpdatedAt = DateTime.UtcNow
                }
            };

            await _context.Patients.AddRangeAsync(patients);
            await _context.SaveChangesAsync();

            var fhirPatient = new Patient { Id = "patient1" };
            _mockFhirService.Setup(x => x.EntityToPatient(patients[0])).Returns(fhirPatient);

            // Act
            var result = await _controller.SearchPatients("Smith", null, null, null);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var bundleJson = okResult.Value as string;
            bundleJson.Should().Contain("patient1");
            bundleJson.Should().NotContain("patient2");
        }
    }
}