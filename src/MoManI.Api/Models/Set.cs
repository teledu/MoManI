using System;

namespace MoManI.Api.Models
{
    public class Set
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Abbreviation { get; set; }
        public string Description { get; set; }
        public bool Numeric { get; set; }
    }
}