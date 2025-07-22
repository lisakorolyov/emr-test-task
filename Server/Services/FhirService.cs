using Hl7.Fhir.Model;
using EMR.Server.Models;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace EMR.Server.Services
{
    public interface IFhirService
    {
        Patient EntityToPatient(PatientEntity entity);
        PatientEntity PatientToEntity(Patient patient);
        Appointment EntityToAppointment(AppointmentEntity entity);
        AppointmentEntity AppointmentToEntity(Appointment appointment);
        Encounter EntityToEncounter(EncounterEntity entity);
        EncounterEntity EncounterToEntity(Encounter encounter);
    }

    public class FhirService : IFhirService
    {
        private readonly ILogger<FhirService> _logger;

        public FhirService(ILogger<FhirService> logger)
        {
            _logger = logger;
        }

        public Patient EntityToPatient(PatientEntity entity)
        {
            _logger.LogDebug($"{nameof(entity.AddressLines)}: {entity.AddressLines}\n" +
                $"{nameof(entity.BirthDate)}: {entity.BirthDate}\n" +
                $"{nameof(entity.Email)}: {entity.Email}\n" +
                $"{nameof(entity.FamilyName)}: {entity.FamilyName}\n" +
                $"{nameof(entity.Gender)}: {entity.Gender}\n" +
                $"{nameof(entity.GivenName)}: {entity.GivenName}\n" +
                $"{nameof(entity.Phone)}: {entity.Phone}\n");

            var patient = new Patient
            {
                Id = entity.Id,
                Meta = new Meta
                {
                    LastUpdated = entity.UpdatedAt
                }
            };

            patient.Name.Add(new HumanName
            {
                Use = HumanName.NameUse.Official,
                Family = entity.FamilyName,
                Given = new[] { entity.GivenName }
            });
            _logger.LogDebug($"{nameof(patient.Name)}: {patient.Name}");

            if (DateTime.TryParse(entity.BirthDate.ToString("yyyy-MM-dd"), out var birthDate))
            {
                patient.BirthDate = entity.BirthDate.ToString("yyyy-MM-dd");
            }
            _logger.LogDebug($"{nameof(patient.BirthDate)}: {patient.BirthDate}");

            if (Enum.TryParse<AdministrativeGender>(entity.Gender, true, out var gender))
            {
                patient.Gender = gender;
            }
            _logger.LogDebug($"{nameof(patient.Gender)}: {patient.Gender}");

            if (!string.IsNullOrEmpty(entity.Phone))
            {
                patient.Telecom.Add(new ContactPoint
                {
                    System = ContactPoint.ContactPointSystem.Phone,
                    Value = entity.Phone,
                    Use = ContactPoint.ContactPointUse.Mobile
                });
            }
            _logger.LogDebug($"{nameof(patient.Telecom)}: {patient.Telecom}");

            if (!string.IsNullOrEmpty(entity.Email))
            {
                patient.Telecom.Add(new ContactPoint
                {
                    System = ContactPoint.ContactPointSystem.Email,
                    Value = entity.Email,
                    Use = ContactPoint.ContactPointUse.Home
                });
            }
            _logger.LogDebug($"{nameof(patient.Telecom)}: {patient.Telecom}");

            // Create address from structured fields
            if (!string.IsNullOrEmpty(entity.AddressLines) || !string.IsNullOrEmpty(entity.AddressCity) || 
                !string.IsNullOrEmpty(entity.AddressState) || !string.IsNullOrEmpty(entity.AddressPostalCode) ||
                !string.IsNullOrEmpty(entity.AddressText))
            {
                var address = new Address();
                
                // Set use
                if (!string.IsNullOrEmpty(entity.AddressUse) && Enum.TryParse<Address.AddressUse>(entity.AddressUse, true, out var use))
                {
                    address.Use = use;
                }
                else
                {
                    address.Use = Address.AddressUse.Home;
                }
                
                // Set type
                if (!string.IsNullOrEmpty(entity.AddressType) && Enum.TryParse<Address.AddressType>(entity.AddressType, true, out var type))
                {
                    address.Type = type;
                }
                else
                {
                    address.Type = Address.AddressType.Physical;
                }
                
                // Set structured fields following FHIR specification
                if (!string.IsNullOrEmpty(entity.AddressText))
                    address.Text = entity.AddressText;
                
                // Handle address lines as proper FHIR array
                if (!string.IsNullOrEmpty(entity.AddressLines))
                {
                    try
                    {
                        var lines = JsonSerializer.Deserialize<List<string>>(entity.AddressLines);
                        if (lines != null && lines.Any(line => !string.IsNullOrEmpty(line)))
                        {
                            address.Line = lines;
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogWarning($"Failed to deserialize address lines: {ex.Message}");
                    }
                }
                
                if (!string.IsNullOrEmpty(entity.AddressCity))
                    address.City = entity.AddressCity;
                
                if (!string.IsNullOrEmpty(entity.AddressDistrict))
                    address.District = entity.AddressDistrict;
                
                if (!string.IsNullOrEmpty(entity.AddressState))
                    address.State = entity.AddressState;
                
                if (!string.IsNullOrEmpty(entity.AddressPostalCode))
                    address.PostalCode = entity.AddressPostalCode;
                
                if (!string.IsNullOrEmpty(entity.AddressCountry))
                    address.Country = entity.AddressCountry;
                
                patient.Address.Add(address);
            }
            _logger.LogDebug($"{nameof(patient.Address)}: {patient.Address}");

            return patient;
        }

        public PatientEntity PatientToEntity(Patient patient)
        {
            var entity = new PatientEntity
            {
                Id = patient.Id ?? Guid.NewGuid().ToString(),
                UpdatedAt = DateTime.UtcNow
            };

            var name = patient.Name.FirstOrDefault();
            if (name != null)
            {
                entity.FamilyName = name.Family ?? string.Empty;
                entity.GivenName = name.Given?.FirstOrDefault() ?? string.Empty;
            }

            if (DateTime.TryParse(patient.BirthDate, out var birthDate))
            {
                entity.BirthDate = birthDate;
            }

            entity.Gender = patient.Gender?.ToString().ToLower() ?? "unknown";

            var phone = patient.Telecom?.FirstOrDefault(t => t.System == ContactPoint.ContactPointSystem.Phone);
            if (phone != null)
            {
                entity.Phone = phone.Value ?? string.Empty;
            }

            var email = patient.Telecom?.FirstOrDefault(t => t.System == ContactPoint.ContactPointSystem.Email);
            if (email != null)
            {
                entity.Email = email.Value ?? string.Empty;
            }

            var address = patient.Address?.FirstOrDefault();
            if (address != null)
            {
                entity.AddressUse = address.Use?.ToString() ?? string.Empty;
                entity.AddressType = address.Type?.ToString() ?? string.Empty;
                entity.AddressText = address.Text ?? string.Empty;
                entity.AddressCity = address.City ?? string.Empty;
                entity.AddressDistrict = address.District ?? string.Empty;
                entity.AddressState = address.State ?? string.Empty;
                entity.AddressPostalCode = address.PostalCode ?? string.Empty;
                entity.AddressCountry = address.Country ?? string.Empty;
                
                // Store address lines as JSON array following FHIR specification
                if (address.Line != null && address.Line.Count > 0)
                {
                    entity.AddressLines = JsonSerializer.Serialize(address.Line.Where(line => !string.IsNullOrEmpty(line)).ToList());
                }
                else
                {
                    entity.AddressLines = string.Empty;
                }
            }

            return entity;
        }

        public Appointment EntityToAppointment(AppointmentEntity entity)
        {
            var appointment = new Appointment
            {
                Id = entity.Id,
                Meta = new Meta
                {
                    LastUpdated = entity.UpdatedAt
                },
                Status = ParseAppointmentStatus(entity.Status),
                Start = new DateTimeOffset(entity.Start),
                End = new DateTimeOffset(entity.End),
                Description = entity.Description
            };

            appointment.Participant.Add(new Appointment.ParticipantComponent
            {
                Actor = new ResourceReference($"Patient/{entity.PatientId}")
            });

            return appointment;
        }

        public AppointmentEntity AppointmentToEntity(Appointment appointment)
        {
            var entity = new AppointmentEntity
            {
                Id = appointment.Id ?? Guid.NewGuid().ToString(),
                Status = appointment.Status?.ToString().ToLower() ?? "booked",
                Start = appointment.Start?.DateTime ?? DateTime.UtcNow,
                End = appointment.End?.DateTime ?? DateTime.UtcNow.AddHours(1),
                Description = appointment.Description ?? string.Empty,
                UpdatedAt = DateTime.UtcNow
            };

            var patientParticipant = appointment.Participant?.FirstOrDefault(p => 
                p.Actor?.Reference?.StartsWith("Patient/") == true);
            if (patientParticipant != null)
            {
                entity.PatientId = patientParticipant.Actor.Reference.Replace("Patient/", "");
            }

            return entity;
        }

        public Encounter EntityToEncounter(EncounterEntity entity)
        {
            var encounter = new Encounter
            {
                Id = entity.Id,
                Meta = new Meta
                {
                    LastUpdated = entity.UpdatedAt
                },
                Status = ParseEncounterStatus(entity.Status),
                Subject = new ResourceReference($"Patient/{entity.PatientId}"),
                Period = new Period
                {
                    Start = entity.Date.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    End = entity.Date.AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                }
            };

            if (!string.IsNullOrEmpty(entity.Notes))
            {
                encounter.Text = new Narrative
                {
                    Status = Narrative.NarrativeStatus.Generated,
                    Div = $"<div xmlns=\"http://www.w3.org/1999/xhtml\">{entity.Notes}</div>"
                };
            }

            return encounter;
        }

        public EncounterEntity EncounterToEntity(Encounter encounter)
        {
            var entity = new EncounterEntity
            {
                Id = encounter.Id ?? Guid.NewGuid().ToString(),
                Status = encounter.Status?.ToString().ToLower() ?? "in-progress",
                UpdatedAt = DateTime.UtcNow
            };

            if (DateTime.TryParse(encounter.Period?.Start, out var startDate))
            {
                entity.Date = startDate;
            }
            else
            {
                entity.Date = DateTime.UtcNow;
            }

            if (encounter.Subject?.Reference?.StartsWith("Patient/") == true)
            {
                entity.PatientId = encounter.Subject.Reference.Replace("Patient/", "");
            }

            if (encounter.Text?.Div != null)
            {
                entity.Notes = encounter.Text.Div.Replace("<div xmlns=\"http://www.w3.org/1999/xhtml\">", "")
                                                .Replace("</div>", "");
            }

            return entity;
        }

        private static Appointment.AppointmentStatus ParseAppointmentStatus(string status)
        {
            return status.ToLower() switch
            {
                "booked" => Appointment.AppointmentStatus.Booked,
                "cancelled" => Appointment.AppointmentStatus.Cancelled,
                "fulfilled" => Appointment.AppointmentStatus.Fulfilled,
                "noshow" => Appointment.AppointmentStatus.Noshow,
                _ => Appointment.AppointmentStatus.Booked
            };
        }

        private static Encounter.EncounterStatus ParseEncounterStatus(string status)
        {
            return status.ToLower() switch
            {
                "planned" => Encounter.EncounterStatus.Planned,
                "arrived" => Encounter.EncounterStatus.Arrived,
                "in-progress" => Encounter.EncounterStatus.InProgress,
                "finished" => Encounter.EncounterStatus.Finished,
                "cancelled" => Encounter.EncounterStatus.Cancelled,
                _ => Encounter.EncounterStatus.InProgress
            };
        }
    }
}