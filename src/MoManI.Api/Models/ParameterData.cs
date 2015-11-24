using System;
using System.Collections.Generic;

namespace MoManI.Api.Models
{
    public class ParameterData
    {
        public Guid ParameterId { get; set; }
        public Guid ModelId { get; set; }
        public decimal DefaultValue { get; set; }
        public IEnumerable<ParameterDataSet> Sets { get; set; }
        public IEnumerable<ParameterDataItem> Data { get; set; }
    }

    public class ParameterDataSet
    {
        public Guid Id { get; set; }
        public int Index { get; set; }
    }

    public class ParameterDataItem
    {
        public IEnumerable<string> C { get; set; }
        public decimal V { get; set; }
    }
}
