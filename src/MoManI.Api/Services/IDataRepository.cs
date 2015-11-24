using System;
using System.Threading.Tasks;
using MoManI.Api.Models;

namespace MoManI.Api.Services
{
    public interface IDataRepository
    {
        Task<SetData> GetSetData(Guid setId, Guid modelId);
        Task SaveSetData(SetData setData);
        Task DeleteSetData(Guid setId, Guid modelId);

        Task<ParameterData> GetParameterData(Guid parameterId, Guid modelId);
        Task SaveParameterData(ParameterData parameterData);
        Task DeleteParameterData(Guid parameterId, Guid modelId);
    }
}