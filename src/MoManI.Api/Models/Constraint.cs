using System;

namespace MoManI.Api.Models
{
    public class Constraint
    {
        public Guid Id { get; set; }
        public Guid? ConstraintGroupId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public EquationObject Equation { get; set; }
        public EquationObject SetConstraint { get; set; } 
    }
}