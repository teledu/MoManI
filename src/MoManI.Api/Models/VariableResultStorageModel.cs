using System;
using System.Collections.Generic;

namespace MoManI.Api.Models
{
    public class VariableResultStorageModel
    {
        public Guid Id { get; set; }
        public Guid VariableId { get; set; }
        public Guid ScenarioId { get; set; }
        public Guid ModelId { get; set; }
        public IEnumerable<VariableSet> Sets { get; set; }
        public decimal DefaultValue { get; set; }
    }
}
