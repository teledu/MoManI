using System;
using System.Collections.Generic;

namespace MoManI.Api.Models
{
    public class EquationObject
    {
        public EquationObjectType Type { get; set; }
        public string Value { get; set; }
        public EquationObject InnerEquation1 { get; set; }
        public EquationObject InnerEquation2 { get; set; }
        public EquationObject InnerEquation3 { get; set; }
        public IEnumerable<SetChanges> SetChanges { get; set; } 
        public IEnumerable<EnumeratingSet> EnumeratingSets { get; set; } 
    }

    public enum EquationObjectType
    {
        Empty,
        Number,
        Parameter,
        Variable,
        Operator,
        Set,
        SetEnumerator,
    }

    public class SetChanges
    {
        public Guid SetId { get; set; }
        public IEnumerable<SetChangeItem> Changes { get; set; }
    }

    public class SetChangeItem
    {
        public SetChangeType ChangeType { get; set; }
        public string ChangeValue { get; set; }
    }

    public enum SetChangeType
    {
        Rename,
        Increment,
    }

    public class EnumeratingSet
    {
        public Guid SetId { get; set; }
        public string Abbreviation { get; set; }
    }
}