using System;
using System.Collections.Generic;

namespace MoManI.Api.Models
{
    public class SetData
    {
        public Guid SetId { get; set; }
        public Guid ModelId { get; set; }
        public IEnumerable<string> Values { get; set; }
    }
}
