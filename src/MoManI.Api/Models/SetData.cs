using System;
using System.Collections.Generic;
using System.Linq;

namespace MoManI.Api.Models
{
    public class SetData
    {
        public Guid SetId { get; set; }
        public Guid ModelId { get; set; }
        public Guid ScenarioId { get; set; }
        public IEnumerable<string> Values { get; set; }

        public SetData Clone(Guid scenarioId)
        {
            return new SetData
            {
                SetId = SetId,
                ModelId = ModelId,
                ScenarioId = scenarioId,
                Values = Values.ToList(),
            };
        }
    }
}
