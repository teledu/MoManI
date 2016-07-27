using System;
using System.Collections.Generic;

namespace MoManI.Api.Models
{
    public class SetData
    {
        public Guid SetId { get; set; }
        public Guid ModelId { get; set; }
        public IEnumerable<SetDataItem> Items { get; set; }
        public IEnumerable<SetDataGroup> Groups { get; set; } 
    }

    public class SetDataItem
    {
        public string Value { get; set; }
        public string Name { get; set; }
        public string Color { get; set; }
        public Guid? GroupId { get; set; }
    }

    public class SetDataGroup
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }
}
