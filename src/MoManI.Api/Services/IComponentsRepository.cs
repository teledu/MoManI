﻿using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MoManI.Api.Models;

namespace MoManI.Api.Services
{
    public interface IComponentsRepository
    {
        Task<IEnumerable<Set>> GetSets();
        Task<Set> GetSet(Guid id);
        Task SaveSet(Set set);
        Task DeleteSet(Guid id);

        Task<IEnumerable<Parameter>> GetParameters();
        Task<Parameter> GetParameter(Guid id);
        Task SaveParameter(Parameter parameter);
        Task DeleteParameter(Guid id);

        Task<IEnumerable<Variable>> GetVariables();
        Task<Variable> GetVariable(Guid id);
        Task SaveVariable(Variable variable);
        Task DeleteVariable(Guid id);

        Task<IEnumerable<ObjectiveFunction>> GetObjectiveFunctions();
        Task<ObjectiveFunction> GetObjectiveFunction(Guid id);
        Task SaveObjectiveFunction(ObjectiveFunction objectiveFunction);
        Task DeleteObjectiveFunction(Guid id);

        Task<IEnumerable<ConstraintGroup>> GetConstraintGroups();
        Task<ConstraintGroup> GetConstraintGroup(Guid id);
        Task SaveConstraintGroup(ConstraintGroup constraintGroup);
        Task DeleteConstraintGroup(Guid id);

        Task<IEnumerable<Constraint>> GetConstraints();
        Task<Constraint> GetConstraint(Guid id);
        Task SaveConstraint(Constraint constraint);
        Task DeleteConstraint(Guid id);
    }
}