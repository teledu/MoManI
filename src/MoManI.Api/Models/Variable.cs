using System;
using System.Collections.Generic;

namespace MoManI.Api.Models
{
    public class Variable
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public IEnumerable<Guid> Sets { get; set; }
        public VariableContstraint Constraint { get; set; }
        public bool Integer { get; set; }
    }

    public class VariableContstraint
    {
        public VariableContstraintOperator Operator { get; set; }
        public decimal Value { get; set; }
    }

    public enum VariableContstraintOperator
    {
        Eq,
        Ne,
        Gt,
        Gte,
        Lt,
        Lte,
    }
}