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
    public class ComposedModelsController : ApiController
    {
        private readonly IModelRepository _modelRepository;
        private readonly IDataRepository _dataRepository;

        public ComposedModelsController(IModelRepository modelRepository, IDataRepository dataRepository)
        {
            _modelRepository = modelRepository;
            _dataRepository = dataRepository;
        }

        public async Task<HttpResponseMessage> GetComposedModels()
        {
            var result = await _modelRepository.GetComposedModels();
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> GetComposedModel(Guid id)
        {
            var result = await _modelRepository.GetComposedModel(id);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> PostComposedModel(Guid id, ComposedModelSaveRequest composedModel)
        {
            var model = await _modelRepository.GetComposedModel(id);
            var isNew = model == null;
            await _modelRepository.SaveComposedModel(new ComposedModel
            {
                Id = id,
                Name = composedModel.Name,
                Description = composedModel.Description,
                Sets = composedModel.Sets,
                Parameters = composedModel.Parameters,
                Variables = composedModel.Variables,
                ObjectiveFunction = composedModel.ObjectiveFunction,
                Constraints = composedModel.Constraints,
                LastRevision = isNew ? 1 : model.LastRevision,
            });
            if (isNew)
            {
                var scenario = new Scenario
                {
                    Id = Guid.NewGuid(),
                    ModelId = id,
                    Name = composedModel.Name,
                    Description = composedModel.Description,
                    Revision = 1,
                };
                await _dataRepository.SaveScenario(scenario);
            }
            return Request.CreateResponse(HttpStatusCode.OK);
        }

        public async Task<HttpResponseMessage> DeleteComposedModel(Guid id)
        {
            await _modelRepository.DeleteComposedModel(id);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }

    public class ComposedModelSaveRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public IEnumerable<Guid> Sets { get; set; }
        public IEnumerable<Guid> Parameters { get; set; }
        public IEnumerable<Guid> Variables { get; set; }
        public Guid? ObjectiveFunction { get; set; }
        public IEnumerable<Guid> Constraints { get; set; }
    }
}
