using System;
using System.Collections.Generic;

namespace MoManI.Api.Models
{
    public class Constraint
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public EquationObject Equation { get; set; }
        public EquationObject SetConstraint { get; set; } 
    }
}