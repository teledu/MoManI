using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using MoManI.Api.Infrastructure;
using MoManI.Api.Models;
using MoManI.Api.Services;

namespace MoManI.Api.Controllers
{
    [LimitedWriteModel]
    public class ObjectiveFunctionsController : ApiController
    {
        private readonly IModelRepository _modelRepository;

        public ObjectiveFunctionsController(IModelRepository modelRepository)
        {
            _modelRepository = modelRepository;
        }

        public async Task<HttpResponseMessage> GetObjectiveFunctions()
        {
            var result = await _modelRepository.GetObjectiveFunctions();
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> GetObjectiveFunction(Guid id)
        {
            var result = await _modelRepository.GetObjectiveFunction(id);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> PostVariable(Guid id, ObjectiveFunctionSaveRequest objectiveFunction)
        {
            await _modelRepository.SaveObjectiveFunction(new ObjectiveFunction
            {
                Id = id,
                Name = objectiveFunction.Name,
                Description = objectiveFunction.Description,
                Function = (ObjectiveFunctionFunction)Enum.Parse(typeof(ObjectiveFunctionFunction), objectiveFunction.Function),
                Equation = objectiveFunction.Equation.ToEquationObject(),
            });
            return Request.CreateResponse(HttpStatusCode.OK);
        }

        public async Task<HttpResponseMessage> DeleteObjectiveFunction(Guid id)
        {
            await _modelRepository.DeleteObjectiveFunction(id);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }

    public class ObjectiveFunctionSaveRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string Function { get; set; }
        public EquationObjectSaveRequest Equation { get; set; }
    }
}