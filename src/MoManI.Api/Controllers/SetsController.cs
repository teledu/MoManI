using System;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web.Http;
using MoManI.Api.Infrastructure;
using MoManI.Api.Models;
using MoManI.Api.Services;

namespace MoManI.Api.Controllers
{
    //[Authorize]
    [LimitedWriteModel]
    public class SetsController : ApiController
    {
        private readonly IComponentsRepository _componentsRepository;
        private readonly ClaimsPrincipal _principal;

        public SetsController(IComponentsRepository componentsRepository, ClaimsPrincipal principal)
        {
            _componentsRepository = componentsRepository;
            _principal = principal;
        }

        public async Task<HttpResponseMessage> GetSets()
        {
            //var asdf = _principal;
            var result = await _componentsRepository.GetSets();
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> GetSet(Guid id)
        {
            var result = await _componentsRepository.GetSet(id);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> PostSet(Guid id, SetSaveRequest set)
        {
            await _componentsRepository.SaveSet(new Set
            {
                Id = id,
                Name = set.Name,
                Abbreviation = set.Abbreviation,
                Description = set.Description,
                Numeric = set.Numeric
            });
            return Request.CreateResponse(HttpStatusCode.OK);
        }

        public async Task<HttpResponseMessage> DeleteSet(Guid id)
        {
            await _componentsRepository.DeleteSet(id);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }

    public class SetSaveRequest
    {
        public string Name { get; set; }
        public string Abbreviation { get; set; }
        public string Description { get; set; }
        public bool Numeric { get; set; }
    }
}
