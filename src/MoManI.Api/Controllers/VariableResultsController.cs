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

        public async Task<HttpResponseMessage> GetVariableResults(Guid scenarioId)
        {
            var result = await _resultsRepository.GetVariableResults(scenarioId);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> GetVariableResult(Guid id, Guid scenarioId)
        {
            var result = await _resultsRepository.GetVariableResult(id, scenarioId);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> PostVariable(VariableResultSaveRequest request)
        {
            if (request.ScenarioId == Guid.Empty)
            {
                return Request.CreateErrorResponse(HttpStatusCode.UpgradeRequired, "Request no longer supported, please redownload executable file");
            }
            await _resultsRepository.SaveVariableResults(new VariableResult
            {
                VariableId = request.VariableId,
                ScenarioId = request.ScenarioId,
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
        public Guid ScenarioId { get; set; }
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
