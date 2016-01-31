using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MoManI.Api.Models;

namespace MoManI.Api.Services
{
    public interface IDataRepository
    {
        Task<IEnumerable<Scenario>> GetScenarios(Guid modelId);
        Task<Scenario> GetScenario(Guid scenarioId);
        Task SaveScenario(Scenario scenario);
        Task DeleteScenario(Guid scenarioId);
        Task CloneScenario(Guid scenarioId, int revision);

        Task<SetData> GetSetData(Guid setId, Guid scenarioId);
        Task SaveSetData(SetData setData);
        Task DeleteSetData(Guid setId, Guid scenarioId);

        Task<ParameterData> GetParameterData(Guid parameterId, Guid scenarioId);
        Task SaveParameterData(ParameterData parameterData);
        Task DeleteParameterData(Guid parameterId, Guid scenarioId);
    }
}