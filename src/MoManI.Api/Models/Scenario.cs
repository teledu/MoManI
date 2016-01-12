using System;

namespace MoManI.Api.Models
{
    public class Scenario
    {
        public Guid Id { get; set; }
        public Guid ModelId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int Revision { get; set; }

        public Scenario Clone(int revision)
        {
            return new Scenario
            {
                Id = Guid.NewGuid(),
                ModelId = ModelId,
                Name = Name,
                Description = Description,
                Revision = revision,
            };
        }
    }
}
