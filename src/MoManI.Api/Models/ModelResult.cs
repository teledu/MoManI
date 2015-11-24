using System;
using System.Collections.Generic;

namespace MoManI.Api.Models
{
    public class ModelResult
    {
        public Guid ModelId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public IEnumerable<VariableResult> VariableResults { get; set; } 
    }
}