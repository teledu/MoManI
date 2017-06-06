using System;
using System.Collections.Generic;

namespace MoManI.Api.Models
{
    public class VariableResult
    {
        public Guid VariableId { get; set; }
        public Guid ModelId { get; set; }
        public Guid ScenarioId { get; set; }
        public decimal DefaultValue { get; set; }
        public IEnumerable<VariableSet> Sets { get; set; } 
        public IEnumerable<VariableResultItem> Data { get; set; }
    }

    public class VariableSet
    {
        public Guid Id { get; set; }
        public int Index { get; set; }
    }

    public class VariableResultItem
    {
        public IEnumerable<string> C { get; set; }
        public decimal V { get; set; }
    }
}