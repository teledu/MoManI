using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using MoManI.Api.Models;
using MoManI.Api.Services;

namespace MoManI.Api.Controllers
{
    public class ScenariosController : ApiController
    {
        private readonly IModelRepository _modelRepository;
        private readonly IResultsRepository _resultsRepository;

        public ScenariosController(IModelRepository modelRepository, IResultsRepository resultsRepository)
        {
            _modelRepository = modelRepository;
            _resultsRepository = resultsRepository;
        }

        public async Task<HttpResponseMessage> GetScenarios(Guid modelId)
        {
            var scenarios = await _modelRepository.GetScenarios(modelId);
            var results = await Task.WhenAll(scenarios.Select(async s => new ScenarioViewModel(s, await _resultsRepository.HasResultsForScenario(s.Id))));
            return Request.CreateResponse(HttpStatusCode.OK, results);
        }

        public async Task<HttpResponseMessage> GetScenario(Guid modelId, Guid id)
        {
            var scenario = await _modelRepository.GetScenario(id);
            var hasResults = await _resultsRepository.HasResultsForScenario(id);
            var result = new ScenarioViewModel(scenario, hasResults);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> PostScenario(Guid id, ScenarioSaveRequest request)
        {
            var scenario = await _modelRepository.GetScenario(id);
            if (scenario == null)
            {
                return Request.CreateErrorResponse(HttpStatusCode.NotFound, "Non-existing scenario");
            }
            scenario.Name = request.Name;
            scenario.Description = request.Description;
            await _modelRepository.SaveScenario(scenario);
            return Request.CreateResponse(HttpStatusCode.OK);
        }

        public async Task<HttpResponseMessage> DeleteScenario(Guid id)
        {
            await _resultsRepository.DeleteScenarioResults(id);
            await _modelRepository.DeleteScenario(id);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }

    public class ScenarioSaveRequest
    {
        public Guid Id { get; set; }
        public Guid ModelId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int Revision { get; set; }
    }

    public class ScenarioViewModel
    {
        public ScenarioViewModel(Scenario scenario, bool hasResults)
        {
            Id = scenario.Id;
            ParentScenarioId = scenario.ParentScenarioId;
            ModelId = scenario.ModelId;
            Name = scenario.Name;
            Description = scenario.Description;
            Revision = scenario.Revision;
            HasResults = hasResults;
        }

        public Guid Id { get; set; }
        public Guid? ParentScenarioId { get; set; }
        public Guid ModelId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int Revision { get; set; }
        public bool HasResults { get; set; }
    }
}
