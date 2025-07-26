using Xunit;
using Moq;
using Microsoft.Extensions.Logging;
using EMR.Server.Services;
using EMR.Server.Models;
using Hl7.Fhir.Model;
using FluentAssertions;

namespace EMR.Server.Tests.Services
{
    public class FhirServiceTests
    {
        private readonly Mock<ILogger<FhirService>> _mockLogger;
        private readonly FhirService _fhirService;

        public FhirServiceTests()
        {
            _mockLogger = new Mock<ILogger<FhirService>>();
            _fhirService = new FhirService(_mockLogger.Object);
        }

        [Fact]
        public void EntityToPatient_ShouldConvertPatientEntityToFhirPatient()
        {
            // Arrange
            var entity = new PatientEntity
            {
                Id = "test-patient-id",
                FamilyName = "Doe",
                GivenName = "John",
                BirthDate = new DateTime(1990, 5, 15),
                Gender = "male",
                Phone = "+1234567890",
                Email = "john.doe@example.com",
                AddressLines = "[\"123 Main St\", \"Apt 4B\"]",
                AddressCity = "New York",
                AddressState = "NY",
                AddressPostalCode = "10001",
                AddressCountry = "US",
                UpdatedAt = DateTime.UtcNow
            };

            // Act
            var patient = _fhirService.EntityToPatient(entity);

            // Assert
            patient.Should().NotBeNull();
            patient.Id.Should().Be("test-patient-id");
            patient.Name.Should().HaveCount(1);
            patient.Name[0].Family.Should().Be("Doe");
            patient.Name[0].Given.Should().Contain("John");
            patient.BirthDate.Should().Be("1990-05-15");
            patient.Gender.Should().Be(AdministrativeGender.Male);
            patient.Telecom.Should().HaveCount(2);
            
            var phoneContact = patient.Telecom.FirstOrDefault(t => t.System == ContactPoint.ContactPointSystem.Phone);
            phoneContact.Should().NotBeNull();
            phoneContact.Value.Should().Be("+1234567890");
            
            var emailContact = patient.Telecom.FirstOrDefault(t => t.System == ContactPoint.ContactPointSystem.Email);
            emailContact.Should().NotBeNull();
            emailContact.Value.Should().Be("john.doe@example.com");
            
            patient.Address.Should().HaveCount(1);
            patient.Address[0].City.Should().Be("New York");
            patient.Address[0].State.Should().Be("NY");
            patient.Address[0].PostalCode.Should().Be("10001");
            patient.Address[0].Country.Should().Be("US");
        }

        [Fact]
        public void PatientToEntity_ShouldConvertFhirPatientToPatientEntity()
        {
            // Arrange
            var patient = new Patient
            {
                Id = "fhir-patient-id",
                Name = new List<HumanName>
                {
                    new HumanName
                    {
                        Use = HumanName.NameUse.Official,
                        Family = "Smith",
                        Given = new[] { "Jane" }
                    }
                },
                BirthDate = "1985-12-25",
                Gender = AdministrativeGender.Female,
                Telecom = new List<ContactPoint>
                {
                    new ContactPoint
                    {
                        System = ContactPoint.ContactPointSystem.Phone,
                        Value = "+0987654321",
                        Use = ContactPoint.ContactPointUse.Mobile
                    },
                    new ContactPoint
                    {
                        System = ContactPoint.ContactPointSystem.Email,
                        Value = "jane.smith@example.com"
                    }
                },
                Address = new List<Address>
                {
                    new Address
                    {
                        Use = Address.AddressUse.Home,
                        Line = new[] { "456 Oak Ave", "Suite 7" },
                        City = "Los Angeles",
                        State = "CA",
                        PostalCode = "90210",
                        Country = "US"
                    }
                }
            };

            // Act
            var entity = _fhirService.PatientToEntity(patient);

            // Assert
            entity.Should().NotBeNull();
            entity.Id.Should().Be("fhir-patient-id");
            entity.FamilyName.Should().Be("Smith");
            entity.GivenName.Should().Be("Jane");
            entity.BirthDate.Should().Be(new DateTime(1985, 12, 25));
            entity.Gender.Should().Be("female");
            entity.Phone.Should().Be("+0987654321");
            entity.Email.Should().Be("jane.smith@example.com");
            entity.AddressCity.Should().Be("Los Angeles");
            entity.AddressState.Should().Be("CA");
            entity.AddressPostalCode.Should().Be("90210");
            entity.AddressCountry.Should().Be("US");
        }

        [Fact]
        public void EntityToAppointment_ShouldConvertAppointmentEntityToFhirAppointment()
        {
            // Arrange
            var entity = new AppointmentEntity
            {
                Id = "appointment-id",
                PatientId = "patient-id",
                Start = DateTime.UtcNow.AddDays(1),
                End = DateTime.UtcNow.AddDays(1).AddHours(1),
                Status = "booked",
                AppointmentType = "consultation",
                Description = "Annual checkup",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Act
            var appointment = _fhirService.EntityToAppointment(entity);

            // Assert
            appointment.Should().NotBeNull();
            appointment.Id.Should().Be("appointment-id");
            appointment.Status.Should().Be(Appointment.AppointmentStatus.Booked);
            appointment.Start.Should().Be(entity.Start);
            appointment.End.Should().Be(entity.End);
            appointment.Description.Should().Be("Annual checkup");
        }

        [Fact]
        public void AppointmentToEntity_ShouldConvertFhirAppointmentToAppointmentEntity()
        {
            // Arrange
            var appointment = new Appointment
            {
                Id = "fhir-appointment-id",
                Status = Appointment.AppointmentStatus.Confirmed,
                Start = DateTimeOffset.UtcNow.AddDays(2),
                End = DateTimeOffset.UtcNow.AddDays(2).AddMinutes(30),
                Description = "Follow-up visit",
                AppointmentType = new CodeableConcept
                {
                    Coding = new List<Coding>
                    {
                        new Coding { Code = "follow-up" }
                    }
                }
            };

            // Act
            var entity = _fhirService.AppointmentToEntity(appointment);

            // Assert
            entity.Should().NotBeNull();
            entity.Id.Should().Be("fhir-appointment-id");
            entity.Status.Should().Be("confirmed");
            entity.Start.Should().Be(appointment.Start.Value.DateTime);
            entity.End.Should().Be(appointment.End.Value.DateTime);
            entity.Description.Should().Be("Follow-up visit");
        }

        [Fact]
        public void EntityToEncounter_ShouldConvertEncounterEntityToFhirEncounter()
        {
            // Arrange
            var entity = new EncounterEntity
            {
                Id = "encounter-id",
                PatientId = "patient-id",
                Status = "finished",
                Class = "inpatient",
                EncounterType = "emergency",
                Start = DateTime.UtcNow.AddDays(-1),
                End = DateTime.UtcNow,
                ReasonCode = "chest-pain",
                ReasonDisplay = "Chest Pain",
                Notes = "Patient presented with chest pain",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow
            };

            // Act
            var encounter = _fhirService.EntityToEncounter(entity);

            // Assert
            encounter.Should().NotBeNull();
            encounter.Id.Should().Be("encounter-id");
            encounter.Status.Should().Be(Encounter.EncounterStatus.Finished);
            encounter.Period.Start.Should().Be(entity.Start);
            encounter.Period.End.Should().Be(entity.End);
        }

        [Fact]
        public void EncounterToEntity_ShouldConvertFhirEncounterToEncounterEntity()
        {
            // Arrange
            var encounter = new Encounter
            {
                Id = "fhir-encounter-id",
                Status = Encounter.EncounterStatus.InProgress,
                Class = new Coding { Code = "outpatient" },
                Type = new List<CodeableConcept>
                {
                    new CodeableConcept
                    {
                        Coding = new List<Coding>
                        {
                            new Coding { Code = "routine", Display = "Routine Visit" }
                        }
                    }
                },
                Period = new Period
                {
                    Start = DateTimeOffset.UtcNow.AddHours(-2),
                    End = DateTimeOffset.UtcNow
                },
                ReasonCode = new List<CodeableConcept>
                {
                    new CodeableConcept
                    {
                        Coding = new List<Coding>
                        {
                            new Coding { Code = "headache", Display = "Headache" }
                        }
                    }
                }
            };

            // Act
            var entity = _fhirService.EncounterToEntity(encounter);

            // Assert
            entity.Should().NotBeNull();
            entity.Id.Should().Be("fhir-encounter-id");
            entity.Status.Should().Be("in-progress");
            entity.Class.Should().Be("outpatient");
            entity.Start.Should().Be(encounter.Period.Start.Value.DateTime);
            entity.End.Should().Be(encounter.Period.End.Value.DateTime);
        }

        [Theory]
        [InlineData("male", AdministrativeGender.Male)]
        [InlineData("female", AdministrativeGender.Female)]
        [InlineData("other", AdministrativeGender.Other)]
        [InlineData("unknown", AdministrativeGender.Unknown)]
        [InlineData("invalid", AdministrativeGender.Unknown)]
        public void EntityToPatient_ShouldHandleGenderConversionCorrectly(string entityGender, AdministrativeGender expectedFhirGender)
        {
            // Arrange
            var entity = new PatientEntity
            {
                Id = "test-id",
                FamilyName = "Test",
                GivenName = "Patient",
                Gender = entityGender,
                BirthDate = DateTime.UtcNow.AddYears(-30),
                UpdatedAt = DateTime.UtcNow
            };

            // Act
            var patient = _fhirService.EntityToPatient(entity);

            // Assert
            patient.Gender.Should().Be(expectedFhirGender);
        }

        [Fact]
        public void EntityToPatient_WithNullOrEmptyValues_ShouldHandleGracefully()
        {
            // Arrange
            var entity = new PatientEntity
            {
                Id = "minimal-patient",
                FamilyName = "",
                GivenName = "",
                Phone = "",
                Email = "",
                AddressLines = "",
                UpdatedAt = DateTime.UtcNow
            };

            // Act
            var patient = _fhirService.EntityToPatient(entity);

            // Assert
            patient.Should().NotBeNull();
            patient.Id.Should().Be("minimal-patient");
            patient.Name.Should().HaveCount(1);
            patient.Telecom.Should().BeEmpty();
            patient.Address.Should().BeEmpty();
        }
    }
}