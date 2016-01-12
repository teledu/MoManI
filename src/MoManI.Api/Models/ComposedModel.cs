using System;
using System.Collections.Generic;

namespace MoManI.Api.Models
{
    public class ComposedModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public IEnumerable<Guid> Sets { get; set; }
        public IEnumerable<Guid> Parameters { get; set; }
        public IEnumerable<Guid> Variables { get; set; }
        public Guid? ObjectiveFunction { get; set; }
        public IEnumerable<Guid> Constraints { get; set; }
        public int LastRevision { get; set; }
    }
}
