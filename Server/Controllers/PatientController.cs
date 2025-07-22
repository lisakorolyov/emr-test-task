using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EMR.Server.Models;
using EMR.Server.Services;
using Hl7.Fhir.Model;
using Hl7.Fhir.Serialization;
using System.Text.Json;

namespace EMR.Server.Controllers
{
    [ApiController]
    [Route("fhir/Patient")]
    public class PatientController : ControllerBase
    {
        private readonly EMRDbContext _context;
        private readonly IFhirService _fhirService;
        private readonly FhirJsonSerializer _jsonSerializer;
        private readonly ILogger<PatientController> _logger;

        public PatientController(EMRDbContext context, IFhirService fhirService, ILogger<PatientController> logger)
        {
            _context = context;
            _fhirService = fhirService;
            _jsonSerializer = new FhirJsonSerializer();
            _logger = logger;
        }

        // GET: fhir/Patient
        [HttpGet]
        public async Task<ActionResult<string>> GetPatients()
        {
            var entities = await _context.Patients.ToListAsync();
            
            var bundle = new Bundle
            {
                Id = Guid.NewGuid().ToString(),
                Type = Bundle.BundleType.Searchset,
                Total = entities.Count
            };

            foreach (var entity in entities)
            {
                var patient = _fhirService.EntityToPatient(entity);
                bundle.Entry.Add(new Bundle.EntryComponent
                {
                    Resource = patient,
                    FullUrl = $"{Request.Scheme}://{Request.Host}/fhir/Patient/{patient.Id}"
                });
            }

            var json = _jsonSerializer.SerializeToString(bundle);
            return Ok(json);
        }

        // GET: fhir/Patient/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<string>> GetPatient(string id)
        {
            var entity = await _context.Patients.FindAsync(id);
            
            if (entity == null)
            {
                return NotFound();
            }

            var patient = _fhirService.EntityToPatient(entity);
            var json = _jsonSerializer.SerializeToString(patient);
            
            return Ok(json);
        }

        // POST: fhir/Patient
        [HttpPost]
        public async Task<ActionResult<string>> CreatePatient([FromBody] JsonElement patientJsonElement)
        {
            try
            {
                _logger.LogDebug("In PATIENT CONTROLLER -------------------------------------------------------");
                var patientJson = patientJsonElement.GetRawText();
                var parser = new FhirJsonParser();
                var patient = parser.Parse<Patient>(patientJson);
                
                var entity = _fhirService.PatientToEntity(patient);
                entity.Id = Guid.NewGuid().ToString();
                entity.CreatedAt = DateTime.UtcNow;
                entity.UpdatedAt = DateTime.UtcNow;

                _context.Patients.Add(entity);
                await _context.SaveChangesAsync();

                var createdPatient = _fhirService.EntityToPatient(entity);
                var json = _jsonSerializer.SerializeToString(createdPatient);

                return CreatedAtAction(nameof(GetPatient), new { id = entity.Id }, json);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Invalid FHIR Patient resource", details = ex.Message });
            }
        }

        // PUT: fhir/Patient/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<string>> UpdatePatient(string id, [FromBody] JsonElement patientJsonElement)
        {
            try
            {
                var entity = await _context.Patients.FindAsync(id);
                if (entity == null)
                {
                    return NotFound();
                }

                var patientJson = patientJsonElement.GetRawText();
                var parser = new FhirJsonParser();
                var patient = parser.Parse<Patient>(patientJson);
                patient.Id = id; // Ensure the ID matches

                var updatedEntity = _fhirService.PatientToEntity(patient);
                updatedEntity.Id = id;
                updatedEntity.CreatedAt = entity.CreatedAt;
                updatedEntity.UpdatedAt = DateTime.UtcNow;

                _context.Entry(entity).CurrentValues.SetValues(updatedEntity);
                await _context.SaveChangesAsync();

                var updatedPatient = _fhirService.EntityToPatient(updatedEntity);
                var json = _jsonSerializer.SerializeToString(updatedPatient);

                return Ok(json);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Invalid FHIR Patient resource", details = ex.Message });
            }
        }

        // DELETE: fhir/Patient/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeletePatient(string id)
        {
            var entity = await _context.Patients.FindAsync(id);
            if (entity == null)
            {
                return NotFound();
            }

            _context.Patients.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: fhir/Patient/{id}/Appointment
        [HttpGet("{id}/Appointment")]
        public async Task<ActionResult<string>> GetPatientAppointments(string id)
        {
            var patient = await _context.Patients.FindAsync(id);
            if (patient == null)
            {
                return NotFound();
            }

            var appointments = await _context.Appointments
                .Where(a => a.PatientId == id)
                .ToListAsync();

            var bundle = new Bundle
            {
                Id = Guid.NewGuid().ToString(),
                Type = Bundle.BundleType.Searchset,
                Total = appointments.Count
            };

            foreach (var appointment in appointments)
            {
                var fhirAppointment = _fhirService.EntityToAppointment(appointment);
                bundle.Entry.Add(new Bundle.EntryComponent
                {
                    Resource = fhirAppointment,
                    FullUrl = $"{Request.Scheme}://{Request.Host}/fhir/Appointment/{fhirAppointment.Id}"
                });
            }

            var json = _jsonSerializer.SerializeToString(bundle);
            return Ok(json);
        }

        // GET: fhir/Patient/{id}/Encounter
        [HttpGet("{id}/Encounter")]
        public async Task<ActionResult<string>> GetPatientEncounters(string id)
        {
            var patient = await _context.Patients.FindAsync(id);
            if (patient == null)
            {
                return NotFound();
            }

            var encounters = await _context.Encounters
                .Where(e => e.PatientId == id)
                .OrderByDescending(e => e.Date)
                .ToListAsync();

            var bundle = new Bundle
            {
                Id = Guid.NewGuid().ToString(),
                Type = Bundle.BundleType.Searchset,
                Total = encounters.Count
            };

            foreach (var encounter in encounters)
            {
                var fhirEncounter = _fhirService.EntityToEncounter(encounter);
                bundle.Entry.Add(new Bundle.EntryComponent
                {
                    Resource = fhirEncounter,
                    FullUrl = $"{Request.Scheme}://{Request.Host}/fhir/Encounter/{fhirEncounter.Id}"
                });
            }

            var json = _jsonSerializer.SerializeToString(bundle);
            return Ok(json);
        }
    }
}