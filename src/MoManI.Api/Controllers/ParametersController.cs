using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using MoManI.Api.Models;
using MoManI.Api.Services;

namespace MoManI.Api.Controllers
{
    public class ParametersController : ApiController
    {
        private readonly IModelRepository _modelRepository;

        public ParametersController(IModelRepository modelRepository)
        {
            _modelRepository = modelRepository;
        }

        public async Task<HttpResponseMessage> GetParameters()
        {
            var result = await _modelRepository.GetParameters();
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> GetParameter(Guid id)
        {
            var result = await _modelRepository.GetParameter(id);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> PostSet(Guid id, ParameterSaveRequest parameter)
        {
            await _modelRepository.SaveParameter(new Parameter
            {
                Id = id,
                Name = parameter.Name,
                Description = parameter.Description,
                Sets = parameter.Sets,
            });
            return Request.CreateResponse(HttpStatusCode.OK);
        }

        public async Task<HttpResponseMessage> DeleteParameter(Guid id)
        {
            await _modelRepository.DeleteParameter(id);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }

    public class ParameterSaveRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public IEnumerable<Guid> Sets { get; set; }
    }
}
