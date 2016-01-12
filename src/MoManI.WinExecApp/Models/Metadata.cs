using System;
using System.Collections.Generic;

namespace MoManI.WinExecApp.Models
{
    public class Metadata
    {
        public Guid ScenarioId { get; set; }
        public Guid ModelId { get; set; }
        public Uri ApiAddress { get; set; }
        public IEnumerable<Variable> Variables { get; set; }
    }

    public class Variable
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public IEnumerable<Set> Sets { get; set; }
    }

    public class Set
    {
        public Guid Id { get; }
        public int Index { get; }

        public Set(Guid id, int index)
        {
            Id = id;
            Index = index;
        }
    }
}