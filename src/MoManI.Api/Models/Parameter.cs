using System;
using System.Collections.Generic;

namespace MoManI.Api.Models
{
    public class Parameter
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public IEnumerable<Guid> Sets { get; set; }
        public decimal DefaultValue { get; set; }
        public string Unit { get; set; }
    }
}