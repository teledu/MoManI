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
    public class VariableResultsController : ApiController
    {
        private readonly IResultsRepository _resultsRepository;

        public VariableResultsController(IResultsRepository resultsRepository)
        {
            _resultsRepository = resultsRepository;
        }

        public async Task<HttpResponseMessage> GetVariableResult(Guid variableId, Guid modelId)
        {
            var result = await _resultsRepository.GetVariableResult(variableId, modelId);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> PostVariable(VariableResultSaveRequest request)
        {
            System.Diagnostics.Trace.TraceError($"{DateTime.Now}: saving result data for variable {request.VariableId} in {request.ModelId}, {request.Data?.Count() ?? 0} data items, request size {Request.Content.Headers.ContentLength}");
            await _resultsRepository.SaveVariableResults(new VariableResult
            {
                VariableId = request.VariableId,
                ModelId = request.ModelId,
                Sets = request.Sets?.Select(s => new VariableSet { Id = s.Id, Index = s.Index }),
                Data = request.Data?.Select(d => new VariableResultItem {C = d.C, V = d.V}),
            });
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }

    public class VariableResultSaveRequest
    {
        public Guid VariableId { get; set; }
        public Guid ModelId { get; set; }
        public IEnumerable<VariableResultSetSaveRequest> Sets { get; set; }
        public IEnumerable<VariableResultItemSaveRequest> Data { get; set; }
    }

    public class VariableResultSetSaveRequest
    {
        public Guid Id { get; set; }
        public int Index { get; set; }
    }

    public class VariableResultItemSaveRequest
    {
        public IEnumerable<string> C { get; set; }
        public decimal V { get; set; }
    }
}
