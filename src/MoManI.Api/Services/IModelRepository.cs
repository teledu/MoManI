using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MoManI.Api.Controllers;
using MoManI.Api.Models;

namespace MoManI.Api.Services
{
    public interface IModelRepository
    {
        Task<IEnumerable<ComposedModel>> GetComposedModels();
        Task<ComposedModel> GetComposedModel(Guid id);
        Task SaveComposedModel(ComposedModel composedModel);
        Task DeleteComposedModel(Guid id);
        Task CloneComposedModel(CloningParameters parameters);

        Task<IEnumerable<Scenario>> GetScenarios(Guid modelId);
        Task<Scenario> GetScenario(Guid scenarioId);
        Task SaveScenario(Scenario scenario);
        Task DeleteScenario(Guid scenarioId);
        Task CloneScenario(Guid scenarioId, int revision);

        Task<SetData> GetSetData(Guid setId, Guid modelId);
        Task<IEnumerable<SetData>> GetAllModelSetData(Guid modelId);
        Task SaveSetData(SetData setData);
        Task DeleteSetData(Guid setId, Guid modelId);
        Task DeleteModelSetData(Guid modelId);

        Task<ParameterData> GetParameterData(Guid parameterId, Guid scenarioId);
        Task SaveParameterData(ParameterData parameterData);
        Task DeleteParameterData(Guid parameterId, Guid scenarioId);
    }
}