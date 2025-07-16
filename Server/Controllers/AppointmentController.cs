using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EMR.Server.Models;
using EMR.Server.Services;
using Hl7.Fhir.Model;
using Hl7.Fhir.Serialization;

namespace EMR.Server.Controllers
{
    [ApiController]
    [Route("fhir/Appointment")]
    public class AppointmentController : ControllerBase
    {
        private readonly EMRDbContext _context;
        private readonly IFhirService _fhirService;
        private readonly FhirJsonSerializer _jsonSerializer;

        public AppointmentController(EMRDbContext context, IFhirService fhirService)
        {
            _context = context;
            _fhirService = fhirService;
            _jsonSerializer = new FhirJsonSerializer();
        }

        // GET: fhir/Appointment
        [HttpGet]
        public async Task<ActionResult<string>> GetAppointments()
        {
            var entities = await _context.Appointments
                .Include(a => a.Patient)
                .ToListAsync();
            
            var bundle = new Bundle
            {
                Id = Guid.NewGuid().ToString(),
                Type = Bundle.BundleType.Searchset,
                Total = entities.Count
            };

            foreach (var entity in entities)
            {
                var appointment = _fhirService.EntityToAppointment(entity);
                bundle.Entry.Add(new Bundle.EntryComponent
                {
                    Resource = appointment,
                    FullUrl = $"{Request.Scheme}://{Request.Host}/fhir/Appointment/{appointment.Id}"
                });
            }

            var json = _jsonSerializer.SerializeToString(bundle);
            return Ok(json);
        }

        // GET: fhir/Appointment/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<string>> GetAppointment(string id)
        {
            var entity = await _context.Appointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == id);
            
            if (entity == null)
            {
                return NotFound();
            }

            var appointment = _fhirService.EntityToAppointment(entity);
            var json = _jsonSerializer.SerializeToString(appointment);
            
            return Ok(json);
        }

        // POST: fhir/Appointment
        [HttpPost]
        public async Task<ActionResult<string>> CreateAppointment([FromBody] string appointmentJson)
        {
            try
            {
                var parser = new FhirJsonParser();
                var appointment = parser.Parse<Appointment>(appointmentJson);
                
                var entity = _fhirService.AppointmentToEntity(appointment);
                entity.Id = Guid.NewGuid().ToString();
                entity.CreatedAt = DateTime.UtcNow;
                entity.UpdatedAt = DateTime.UtcNow;

                // Verify patient exists
                var patient = await _context.Patients.FindAsync(entity.PatientId);
                if (patient == null)
                {
                    return BadRequest(new { error = "Patient not found", patientId = entity.PatientId });
                }

                _context.Appointments.Add(entity);
                await _context.SaveChangesAsync();

                var createdAppointment = _fhirService.EntityToAppointment(entity);
                var json = _jsonSerializer.SerializeToString(createdAppointment);

                return CreatedAtAction(nameof(GetAppointment), new { id = entity.Id }, json);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Invalid FHIR Appointment resource", details = ex.Message });
            }
        }

        // PUT: fhir/Appointment/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<string>> UpdateAppointment(string id, [FromBody] string appointmentJson)
        {
            try
            {
                var entity = await _context.Appointments.FindAsync(id);
                if (entity == null)
                {
                    return NotFound();
                }

                var parser = new FhirJsonParser();
                var appointment = parser.Parse<Appointment>(appointmentJson);
                appointment.Id = id; // Ensure the ID matches

                var updatedEntity = _fhirService.AppointmentToEntity(appointment);
                updatedEntity.Id = id;
                updatedEntity.CreatedAt = entity.CreatedAt;
                updatedEntity.UpdatedAt = DateTime.UtcNow;

                // Verify patient exists
                var patient = await _context.Patients.FindAsync(updatedEntity.PatientId);
                if (patient == null)
                {
                    return BadRequest(new { error = "Patient not found", patientId = updatedEntity.PatientId });
                }

                _context.Entry(entity).CurrentValues.SetValues(updatedEntity);
                await _context.SaveChangesAsync();

                var updatedAppointment = _fhirService.EntityToAppointment(updatedEntity);
                var json = _jsonSerializer.SerializeToString(updatedAppointment);

                return Ok(json);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Invalid FHIR Appointment resource", details = ex.Message });
            }
        }

        // DELETE: fhir/Appointment/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteAppointment(string id)
        {
            var entity = await _context.Appointments.FindAsync(id);
            if (entity == null)
            {
                return NotFound();
            }

            _context.Appointments.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: fhir/Appointment?patient={patientId}
        [HttpGet("search")]
        public async Task<ActionResult<string>> SearchAppointments([FromQuery] string? patient)
        {
            var query = _context.Appointments.Include(a => a.Patient).AsQueryable();

            if (!string.IsNullOrEmpty(patient))
            {
                query = query.Where(a => a.PatientId == patient);
            }

            var entities = await query.ToListAsync();

            var bundle = new Bundle
            {
                Id = Guid.NewGuid().ToString(),
                Type = Bundle.BundleType.Searchset,
                Total = entities.Count
            };

            foreach (var entity in entities)
            {
                var appointment = _fhirService.EntityToAppointment(entity);
                bundle.Entry.Add(new Bundle.EntryComponent
                {
                    Resource = appointment,
                    FullUrl = $"{Request.Scheme}://{Request.Host}/fhir/Appointment/{appointment.Id}"
                });
            }

            var json = _jsonSerializer.SerializeToString(bundle);
            return Ok(json);
        }
    }
}