using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MoManI.Api.Models;

namespace MoManI.Api.Services
{
    public interface IResultsRepository
    {
        Task<IEnumerable<VariableResult>> GetVariableResults(Guid scenarioId);
        Task<VariableResult> GetVariableResult(Guid variableId, Guid scenarioId);
        Task SaveVariableResults(VariableResult variableResults);
        Task<bool> HasResultsForScenario(Guid scenarioId);
    }
}