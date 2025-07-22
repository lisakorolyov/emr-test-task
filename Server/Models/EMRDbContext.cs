using Microsoft.EntityFrameworkCore;
using Hl7.Fhir.Model;
using System.ComponentModel.DataAnnotations;

namespace EMR.Server.Models
{
    public class EMRDbContext : DbContext
    {
        public EMRDbContext(DbContextOptions<EMRDbContext> options) : base(options)
        {
        }

        public DbSet<PatientEntity> Patients { get; set; }
        public DbSet<AppointmentEntity> Appointments { get; set; }
        public DbSet<EncounterEntity> Encounters { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure Patient entity
            modelBuilder.Entity<PatientEntity>()
                .HasKey(p => p.Id);
            
            modelBuilder.Entity<PatientEntity>()
                .Property(p => p.Id)
                .HasMaxLength(64);

            // Configure Appointment entity
            modelBuilder.Entity<AppointmentEntity>()
                .HasKey(a => a.Id);
            
            modelBuilder.Entity<AppointmentEntity>()
                .Property(a => a.Id)
                .HasMaxLength(64);

            // Configure Encounter entity
            modelBuilder.Entity<EncounterEntity>()
                .HasKey(e => e.Id);
            
            modelBuilder.Entity<EncounterEntity>()
                .Property(e => e.Id)
                .HasMaxLength(64);

            // Configure relationships
            modelBuilder.Entity<AppointmentEntity>()
                .HasOne(a => a.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EncounterEntity>()
                .HasOne(e => e.Patient)
                .WithMany(p => p.Encounters)
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            base.OnModelCreating(modelBuilder);
        }
    }

    // Patient Entity
    public class PatientEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string FamilyName { get; set; } = string.Empty;
        public string GivenName { get; set; } = string.Empty;
        public DateTime BirthDate { get; set; }
        public string Gender { get; set; } = "unknown";
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        
        // FHIR Address fields - matching Medplum AddressInput exactly
        public string AddressUse { get; set; } = string.Empty;        // home | work | temp | old | billing
        public string AddressType { get; set; } = string.Empty;       // postal | physical | both
        public string AddressText { get; set; } = string.Empty;       // complete address as text
        public string AddressLine { get; set; } = string.Empty;       // street address (first line)
        public string AddressCity { get; set; } = string.Empty;       // city
        public string AddressDistrict { get; set; } = string.Empty;   // district/county
        public string AddressState { get; set; } = string.Empty;      // state/region
        public string AddressPostalCode { get; set; } = string.Empty; // postal/zip code
        public string AddressCountry { get; set; } = string.Empty;    // country
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual List<AppointmentEntity> Appointments { get; set; } = new();
        public virtual List<EncounterEntity> Encounters { get; set; } = new();
    }

    // Appointment Entity
    public class AppointmentEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string PatientId { get; set; } = string.Empty;
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
        public string Status { get; set; } = "booked";
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual PatientEntity Patient { get; set; } = null!;
    }

    // Encounter Entity  
    public class EncounterEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string PatientId { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Status { get; set; } = "in-progress";
        public string Notes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual PatientEntity Patient { get; set; } = null!;
    }
}