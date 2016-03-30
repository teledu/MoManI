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
    public class ConstraintGroupsController : ApiController
    {
        private readonly IModelRepository _modelRepository;

        public ConstraintGroupsController(IModelRepository modelRepository)
        {
            _modelRepository = modelRepository;
        }

        public async Task<HttpResponseMessage> GetConstraintGroups()
        {
            var result = await _modelRepository.GetConstraintGroups();
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> GetConstraintGroup(Guid id)
        {
            var result = await _modelRepository.GetConstraintGroup(id);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> PostConstraintGroup(Guid id, ConstraintGroupSaveRequest constraintGroup)
        {
            await _modelRepository.SaveConstraintGroup(new ConstraintGroup
            {
                Id = id,
                Name = constraintGroup.Name,
                Description = constraintGroup.Description,
            });
            return Request.CreateResponse(HttpStatusCode.OK);
        }

        public async Task<HttpResponseMessage> DeleteConstraintGroup(Guid id)
        {
            await _modelRepository.DeleteConstraintGroup(id);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }

    public class ConstraintGroupSaveRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }
}