using System;
using System.Collections.Generic;

namespace MoManI.Api.Models
{
    public class VariableResultItemStorageModel
    {
        public Guid VariableResultId { get; set; }
        public IEnumerable<string> Coordinates { get; set; }
        public decimal Value { get; set; }
    }
}
