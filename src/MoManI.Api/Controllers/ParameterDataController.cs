using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using MoManI.Api.Models;
using MoManI.Api.Services;

namespace MoManI.Api.Controllers
{
    public class ParameterDataController : ApiController
    {
        private readonly IDataRepository _dataRepository;

        public ParameterDataController(IDataRepository dataRepository)
        {
            _dataRepository = dataRepository;
        }

        public async Task<HttpResponseMessage> GetParameterData(Guid parameterId, Guid modelId)
        {
            var result = await _dataRepository.GetParameterData(parameterId, modelId);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> PostParameterData(ParameterDataSaveRequest parameterData)
        {
            System.Diagnostics.Trace.TraceError($"{DateTime.Now}: saving data for parameter {parameterData.ParameterId} in {parameterData.ModelId}, {parameterData.Data?.Count() ?? 0} data items, request size {Request.Content.Headers.ContentLength}");
            await _dataRepository.SaveParameterData(new ParameterData
            {
                ParameterId = parameterData.ParameterId,
                ModelId = parameterData.ModelId,
                DefaultValue = parameterData.DefaultValue,
                Sets = parameterData.Sets?.Select(s => new ParameterDataSet {Id = s.Id, Index = s.Index}),
                Data = parameterData.Data?.Select(i => new ParameterDataItem {C = i.C, V = i.V}),
            });
            return Request.CreateResponse(HttpStatusCode.OK);
        }

        public async Task<HttpResponseMessage> DeleteParameterData(Guid parameterId, Guid modelId)
        {
            await _dataRepository.DeleteParameterData(parameterId, modelId);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }

    public class ParameterDataSaveRequest
    {
        public Guid ParameterId { get; set; }
        public Guid ModelId { get; set; }
        public decimal DefaultValue { get; set; }
        public IEnumerable<ParameterDataSetSaveRequest> Sets { get; set; }
        public IEnumerable<ParameterDataItemSaveRequest> Data { get; set; }
    }

    public class ParameterDataSetSaveRequest
    {
        public Guid Id { get; set; }
        public int Index { get; set; }
    }

    public class ParameterDataItemSaveRequest
    {
        public IEnumerable<string> C { get; set; }
        public decimal V { get; set; }
    }
}
