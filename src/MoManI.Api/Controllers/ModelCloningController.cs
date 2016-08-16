using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using MoManI.Api.Services;

namespace MoManI.Api.Controllers
{
    public class ModelCloningController : ApiController
    {
        private readonly IModelRepository _modelRepository;

        public ModelCloningController(IModelRepository modelRepository)
        {
            _modelRepository = modelRepository;
        }

        public async Task<HttpResponseMessage> PostClone(Guid modelId, Guid scenarioId, string name)
        {
            var model = await _modelRepository.GetComposedModel(modelId);
            var scenario = await _modelRepository.GetScenario(scenarioId);
            if (model == null || scenario == null || scenario.ModelId != modelId)
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Invalid parameters");
            }
            await _modelRepository.CloneComposedModel(modelId, scenarioId, name);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }
}
