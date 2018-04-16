using System;
using System.Collections.Generic;
using System.Linq;
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

        public async Task<HttpResponseMessage> PostClone(CloningParameters parameters) //ICloneElement scenarios
        {

            var model = await _modelRepository.GetComposedModel(parameters.ModelId);

            var modelScenarios = await _modelRepository.GetScenarios(parameters.ModelId);
            var scenariosToClone = modelScenarios.Where(s => parameters.ScenarioIds.Any(x => x == s.Id));

            if (model == null || !scenariosToClone.Any()) //|| scenario.ModelId != parameters.ModelId nebereik, nes traukiam pagal model id
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Invalid parameters");
            }
            await _modelRepository.CloneComposedModel(parameters);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }

    public class CloningParameters
    {
        public Guid ModelId { get; set; }
        public IEnumerable<Guid> ScenarioIds { get; set; }//[] paziuret kad butu consistent tipas
        public string Name { get; set; }
    }


}
