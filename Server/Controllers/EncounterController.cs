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
    [Route("fhir/Encounter")]
    public class EncounterController : ControllerBase
    {
        private readonly EMRDbContext _context;
        private readonly IFhirService _fhirService;
        private readonly FhirJsonSerializer _jsonSerializer;

        public EncounterController(EMRDbContext context, IFhirService fhirService)
        {
            _context = context;
            _fhirService = fhirService;
            _jsonSerializer = new FhirJsonSerializer();
        }

        // GET: fhir/Encounter
        [HttpGet]
        public async Task<ActionResult<string>> GetEncounters()
        {
            var entities = await _context.Encounters
                .Include(e => e.Patient)
                .OrderByDescending(e => e.Date)
                .ToListAsync();
            
            var bundle = new Bundle
            {
                Id = Guid.NewGuid().ToString(),
                Type = Bundle.BundleType.Searchset,
                Total = entities.Count
            };

            foreach (var entity in entities)
            {
                var encounter = _fhirService.EntityToEncounter(entity);
                bundle.Entry.Add(new Bundle.EntryComponent
                {
                    Resource = encounter,
                    FullUrl = $"{Request.Scheme}://{Request.Host}/fhir/Encounter/{encounter.Id}"
                });
            }

            var json = _jsonSerializer.SerializeToString(bundle);
            return Ok(json);
        }

        // GET: fhir/Encounter/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<string>> GetEncounter(string id)
        {
            var entity = await _context.Encounters
                .Include(e => e.Patient)
                .FirstOrDefaultAsync(e => e.Id == id);
            
            if (entity == null)
            {
                return NotFound();
            }

            var encounter = _fhirService.EntityToEncounter(entity);
            var json = _jsonSerializer.SerializeToString(encounter);
            
            return Ok(json);
        }

        // POST: fhir/Encounter
        [HttpPost]
        public async Task<ActionResult<string>> CreateEncounter([FromBody] JsonElement encounterJsonElement)
        {
            try
            {
                var encounterJson = encounterJsonElement.GetRawText();
                var parser = new FhirJsonParser();
                var encounter = parser.Parse<Encounter>(encounterJson);
                
                var entity = _fhirService.EncounterToEntity(encounter);
                entity.Id = Guid.NewGuid().ToString();
                entity.CreatedAt = DateTime.UtcNow;
                entity.UpdatedAt = DateTime.UtcNow;

                // Verify patient exists
                var patient = await _context.Patients.FindAsync(entity.PatientId);
                if (patient == null)
                {
                    return BadRequest(new { error = "Patient not found", patientId = entity.PatientId });
                }

                _context.Encounters.Add(entity);
                await _context.SaveChangesAsync();

                var createdEncounter = _fhirService.EntityToEncounter(entity);
                var json = _jsonSerializer.SerializeToString(createdEncounter);

                return CreatedAtAction(nameof(GetEncounter), new { id = entity.Id }, json);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Invalid FHIR Encounter resource", details = ex.Message });
            }
        }

        // PUT: fhir/Encounter/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<string>> UpdateEncounter(string id, [FromBody] JsonElement encounterJsonElement)
        {
            try
            {
                var entity = await _context.Encounters.FindAsync(id);
                if (entity == null)
                {
                    return NotFound();
                }

                var encounterJson = encounterJsonElement.GetRawText();
                var parser = new FhirJsonParser();
                var encounter = parser.Parse<Encounter>(encounterJson);
                encounter.Id = id; // Ensure the ID matches

                var updatedEntity = _fhirService.EncounterToEntity(encounter);
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

                var updatedEncounter = _fhirService.EntityToEncounter(updatedEntity);
                var json = _jsonSerializer.SerializeToString(updatedEncounter);

                return Ok(json);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Invalid FHIR Encounter resource", details = ex.Message });
            }
        }

        // DELETE: fhir/Encounter/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteEncounter(string id)
        {
            var entity = await _context.Encounters.FindAsync(id);
            if (entity == null)
            {
                return NotFound();
            }

            _context.Encounters.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: fhir/Encounter?patient={patientId}
        [HttpGet("search")]
        public async Task<ActionResult<string>> SearchEncounters([FromQuery] string? patient)
        {
            var query = _context.Encounters.Include(e => e.Patient).AsQueryable();

            if (!string.IsNullOrEmpty(patient))
            {
                query = query.Where(e => e.PatientId == patient);
            }

            var entities = await query.OrderByDescending(e => e.Date).ToListAsync();

            var bundle = new Bundle
            {
                Id = Guid.NewGuid().ToString(),
                Type = Bundle.BundleType.Searchset,
                Total = entities.Count
            };

            foreach (var entity in entities)
            {
                var encounter = _fhirService.EntityToEncounter(entity);
                bundle.Entry.Add(new Bundle.EntryComponent
                {
                    Resource = encounter,
                    FullUrl = $"{Request.Scheme}://{Request.Host}/fhir/Encounter/{encounter.Id}"
                });
            }

            var json = _jsonSerializer.SerializeToString(bundle);
            return Ok(json);
        }
    }
}