using Xunit;
using Microsoft.EntityFrameworkCore;
using EMR.Server.Models;
using FluentAssertions;

namespace EMR.Server.Tests.Models
{
    public class EMRDbContextTests : IDisposable
    {
        private readonly EMRDbContext _context;

        public EMRDbContextTests()
        {
            var options = new DbContextOptionsBuilder<EMRDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            
            _context = new EMRDbContext(options);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        [Fact]
        public async Task Patient_CanBeCreatedAndRetrieved()
        {
            // Arrange
            var patient = new PatientEntity
            {
                Id = "test-patient",
                FamilyName = "Doe",
                GivenName = "John",
                BirthDate = new DateTime(1990, 1, 1),
                Gender = "male",
                Phone = "+1234567890",
                Email = "john.doe@example.com",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Act
            await _context.Patients.AddAsync(patient);
            await _context.SaveChangesAsync();

            var retrievedPatient = await _context.Patients.FindAsync("test-patient");

            // Assert
            retrievedPatient.Should().NotBeNull();
            retrievedPatient.FamilyName.Should().Be("Doe");
            retrievedPatient.GivenName.Should().Be("John");
            retrievedPatient.Email.Should().Be("john.doe@example.com");
        }

        [Fact]
        public async Task Appointment_WithPatient_CanBeCreatedAndRetrieved()
        {
            // Arrange
            var patient = new PatientEntity
            {
                Id = "patient-for-appointment",
                FamilyName = "Test",
                GivenName = "Patient",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var appointment = new AppointmentEntity
            {
                Id = "test-appointment",
                PatientId = "patient-for-appointment",
                Start = DateTime.UtcNow.AddDays(1),
                End = DateTime.UtcNow.AddDays(1).AddHours(1),
                Status = "booked",
                AppointmentType = "consultation",
                Description = "Regular checkup",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Act
            await _context.Patients.AddAsync(patient);
            await _context.Appointments.AddAsync(appointment);
            await _context.SaveChangesAsync();

            var retrievedAppointment = await _context.Appointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == "test-appointment");

            // Assert
            retrievedAppointment.Should().NotBeNull();
            retrievedAppointment.PatientId.Should().Be("patient-for-appointment");
            retrievedAppointment.Patient.Should().NotBeNull();
            retrievedAppointment.Patient.FamilyName.Should().Be("Test");
            retrievedAppointment.Description.Should().Be("Regular checkup");
        }

        [Fact]
        public async Task Encounter_WithPatient_CanBeCreatedAndRetrieved()
        {
            // Arrange
            var patient = new PatientEntity
            {
                Id = "patient-for-encounter",
                FamilyName = "Test",
                GivenName = "Patient",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var encounter = new EncounterEntity
            {
                Id = "test-encounter",
                PatientId = "patient-for-encounter",
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
            await _context.Patients.AddAsync(patient);
            await _context.Encounters.AddAsync(encounter);
            await _context.SaveChangesAsync();

            var retrievedEncounter = await _context.Encounters
                .Include(e => e.Patient)
                .FirstOrDefaultAsync(e => e.Id == "test-encounter");

            // Assert
            retrievedEncounter.Should().NotBeNull();
            retrievedEncounter.PatientId.Should().Be("patient-for-encounter");
            retrievedEncounter.Patient.Should().NotBeNull();
            retrievedEncounter.Patient.FamilyName.Should().Be("Test");
            retrievedEncounter.Notes.Should().Be("Patient presented with chest pain");
        }

        [Fact]
        public async Task PatientDeletion_CascadesAppointments()
        {
            // Arrange
            var patient = new PatientEntity
            {
                Id = "patient-cascade-test",
                FamilyName = "Test",
                GivenName = "Patient",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var appointment = new AppointmentEntity
            {
                Id = "appointment-cascade-test",
                PatientId = "patient-cascade-test",
                Start = DateTime.UtcNow.AddDays(1),
                End = DateTime.UtcNow.AddDays(1).AddHours(1),
                Status = "booked",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Patients.AddAsync(patient);
            await _context.Appointments.AddAsync(appointment);
            await _context.SaveChangesAsync();

            // Act
            _context.Patients.Remove(patient);
            await _context.SaveChangesAsync();

            // Assert
            var deletedPatient = await _context.Patients.FindAsync("patient-cascade-test");
            var deletedAppointment = await _context.Appointments.FindAsync("appointment-cascade-test");

            deletedPatient.Should().BeNull();
            deletedAppointment.Should().BeNull();
        }

        [Fact]
        public async Task PatientDeletion_CascadesEncounters()
        {
            // Arrange
            var patient = new PatientEntity
            {
                Id = "patient-encounter-cascade",
                FamilyName = "Test",
                GivenName = "Patient",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var encounter = new EncounterEntity
            {
                Id = "encounter-cascade-test",
                PatientId = "patient-encounter-cascade",
                Status = "finished",
                Class = "outpatient",
                Start = DateTime.UtcNow.AddDays(-1),
                End = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Patients.AddAsync(patient);
            await _context.Encounters.AddAsync(encounter);
            await _context.SaveChangesAsync();

            // Act
            _context.Patients.Remove(patient);
            await _context.SaveChangesAsync();

            // Assert
            var deletedPatient = await _context.Patients.FindAsync("patient-encounter-cascade");
            var deletedEncounter = await _context.Encounters.FindAsync("encounter-cascade-test");

            deletedPatient.Should().BeNull();
            deletedEncounter.Should().BeNull();
        }

        [Fact]
        public async Task Patient_WithMultipleAppointmentsAndEncounters_NavigationPropertiesWork()
        {
            // Arrange
            var patient = new PatientEntity
            {
                Id = "patient-navigation-test",
                FamilyName = "Navigation",
                GivenName = "Test",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var appointment1 = new AppointmentEntity
            {
                Id = "appointment-1",
                PatientId = "patient-navigation-test",
                Start = DateTime.UtcNow.AddDays(1),
                End = DateTime.UtcNow.AddDays(1).AddHours(1),
                Status = "booked",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var appointment2 = new AppointmentEntity
            {
                Id = "appointment-2",
                PatientId = "patient-navigation-test",
                Start = DateTime.UtcNow.AddDays(2),
                End = DateTime.UtcNow.AddDays(2).AddHours(1),
                Status = "confirmed",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var encounter = new EncounterEntity
            {
                Id = "encounter-1",
                PatientId = "patient-navigation-test",
                Status = "finished",
                Class = "outpatient",
                Start = DateTime.UtcNow.AddDays(-1),
                End = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow
            };

            // Act
            await _context.Patients.AddAsync(patient);
            await _context.Appointments.AddRangeAsync(appointment1, appointment2);
            await _context.Encounters.AddAsync(encounter);
            await _context.SaveChangesAsync();

            var patientWithRelations = await _context.Patients
                .Include(p => p.Appointments)
                .Include(p => p.Encounters)
                .FirstOrDefaultAsync(p => p.Id == "patient-navigation-test");

            // Assert
            patientWithRelations.Should().NotBeNull();
            patientWithRelations.Appointments.Should().HaveCount(2);
            patientWithRelations.Encounters.Should().HaveCount(1);
            patientWithRelations.Appointments.Should().Contain(a => a.Id == "appointment-1");
            patientWithRelations.Appointments.Should().Contain(a => a.Id == "appointment-2");
            patientWithRelations.Encounters.Should().Contain(e => e.Id == "encounter-1");
        }

        [Fact]
        public async Task EntityConfiguration_KeysAreConfiguredCorrectly()
        {
            // Arrange & Act
            var patientEntityType = _context.Model.FindEntityType(typeof(PatientEntity));
            var appointmentEntityType = _context.Model.FindEntityType(typeof(AppointmentEntity));
            var encounterEntityType = _context.Model.FindEntityType(typeof(EncounterEntity));

            // Assert
            patientEntityType.FindPrimaryKey().Properties.Should().HaveCount(1);
            patientEntityType.FindPrimaryKey().Properties[0].Name.Should().Be("Id");
            
            appointmentEntityType.FindPrimaryKey().Properties.Should().HaveCount(1);
            appointmentEntityType.FindPrimaryKey().Properties[0].Name.Should().Be("Id");
            
            encounterEntityType.FindPrimaryKey().Properties.Should().HaveCount(1);
            encounterEntityType.FindPrimaryKey().Properties[0].Name.Should().Be("Id");
        }

        [Fact]
        public async Task QueryPatients_ByMultipleCriteria_WorksCorrectly()
        {
            // Arrange
            var patients = new List<PatientEntity>
            {
                new PatientEntity
                {
                    Id = "patient-1",
                    FamilyName = "Smith",
                    GivenName = "John",
                    Gender = "male",
                    BirthDate = new DateTime(1990, 1, 1),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new PatientEntity
                {
                    Id = "patient-2",
                    FamilyName = "Smith",
                    GivenName = "Jane",
                    Gender = "female",
                    BirthDate = new DateTime(1985, 5, 15),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new PatientEntity
                {
                    Id = "patient-3",
                    FamilyName = "Doe",
                    GivenName = "Bob",
                    Gender = "male",
                    BirthDate = new DateTime(1990, 1, 1),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            await _context.Patients.AddRangeAsync(patients);
            await _context.SaveChangesAsync();

            // Act
            var smithFamily = await _context.Patients
                .Where(p => p.FamilyName == "Smith")
                .ToListAsync();

            var malePatients = await _context.Patients
                .Where(p => p.Gender == "male")
                .ToListAsync();

            var bornIn1990 = await _context.Patients
                .Where(p => p.BirthDate.Year == 1990)
                .ToListAsync();

            // Assert
            smithFamily.Should().HaveCount(2);
            smithFamily.Should().Contain(p => p.GivenName == "John");
            smithFamily.Should().Contain(p => p.GivenName == "Jane");

            malePatients.Should().HaveCount(2);
            malePatients.Should().Contain(p => p.FamilyName == "Smith");
            malePatients.Should().Contain(p => p.FamilyName == "Doe");

            bornIn1990.Should().HaveCount(2);
            bornIn1990.Should().Contain(p => p.FamilyName == "Smith");
            bornIn1990.Should().Contain(p => p.FamilyName == "Doe");
        }
    }
}