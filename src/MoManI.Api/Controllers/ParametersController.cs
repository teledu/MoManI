using System;
using System.Collections.Generic;
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
    public class ParametersController : ApiController
    {
        private readonly IComponentsRepository _componentsRepository;

        public ParametersController(IComponentsRepository componentsRepository)
        {
            _componentsRepository = componentsRepository;
        }

        public async Task<HttpResponseMessage> GetParameters()
        {
            var result = await _componentsRepository.GetParameters();
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> GetParameter(Guid id)
        {
            var result = await _componentsRepository.GetParameter(id);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> PostSet(Guid id, ParameterSaveRequest parameter)
        {
            await _componentsRepository.SaveParameter(new Parameter
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
            await _componentsRepository.DeleteParameter(id);
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
