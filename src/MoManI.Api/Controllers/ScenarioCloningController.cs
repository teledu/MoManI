using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using MoManI.Api.Services;

namespace MoManI.Api.Controllers
{
    public class ScenarioCloningController : ApiController
    {
        private readonly IModelRepository _modelRepository;

        public ScenarioCloningController(IModelRepository modelRepository)
        {
            _modelRepository = modelRepository;
        }

        public async Task<HttpResponseMessage> PostClone(Guid id)
        {
            var scenario = await _modelRepository.GetScenario(id);
            if (scenario == null)
            {
                return Request.CreateErrorResponse(HttpStatusCode.NotFound, "Scenario does not exist");
            }
            var model = await _modelRepository.GetComposedModel(scenario.ModelId);
            model.LastRevision++;
            await _modelRepository.SaveComposedModel(model);
            await _modelRepository.CloneScenario(id, model.LastRevision);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }
}
