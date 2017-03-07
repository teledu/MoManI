using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using MoManI.Api.Services;

namespace MoManI.Api.Controllers
{
    public class ParameterDataForSetController : ApiController
    {
        private readonly IModelRepository _modelRepository;

        public ParameterDataForSetController(IModelRepository modelRepository)
        {
            _modelRepository = modelRepository;
        }

        public async Task<HttpResponseMessage> GetParameterData(Guid scenarioId, Guid setId, string setValue)
        {
            var result = await _modelRepository.GetParameterDataForSet(scenarioId, setId, setValue);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }
    }
}
