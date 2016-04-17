using System;
using System.Collections.Generic;

namespace MoManI.Api.Models
{
    public class SetData
    {
        public Guid SetId { get; set; }
        public Guid ModelId { get; set; }
        public IEnumerable<SetDataItem> Items { get; set; }
    }

    public class SetDataItem
    {
        public string Value { get; set; }
        public string Name { get; set; }
    }
}
