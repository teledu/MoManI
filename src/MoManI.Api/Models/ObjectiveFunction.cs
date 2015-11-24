using System;

namespace MoManI.Api.Models
{
    public class ObjectiveFunction
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public ObjectiveFunctionFunction Function { get; set; }
        public EquationObject Equation { get; set; }
    }

    public enum ObjectiveFunctionFunction
    {
        Minimize,
        Maximize,
    }
}