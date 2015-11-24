using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MoManI.Api.Models;

namespace MoManI.Api.Services
{
    public interface IResultsRepository
    {
        Task<VariableResult> GetVariableResult(Guid variableId, Guid modelId);
        Task SaveVariableResults(VariableResult variableResults);
        Task<IEnumerable<ModelResult>> GetModelResults();
        Task<ModelResult> GetModelResult(Guid id);
    }
}