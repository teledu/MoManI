using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using MoManI.Api.Services;

namespace MoManI.Api.Controllers
{
    public class ModelResultsController : ApiController
    {
        private readonly IResultsRepository _resultsRepository;

        public ModelResultsController(IResultsRepository resultsRepository)
        {
            _resultsRepository = resultsRepository;
        }

        public async Task<HttpResponseMessage> GetModelResults()
        {
            var results = await _resultsRepository.GetModelResults();
            return Request.CreateResponse(HttpStatusCode.OK, results);
        }

        public async Task<HttpResponseMessage> GetModelResult(Guid id)
        {
            var result = await _resultsRepository.GetModelResult(id);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }
    }
}
