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
    public class ConstraintsController : ApiController
    {
        private readonly IModelRepository _modelRepository;

        public ConstraintsController(IModelRepository modelRepository)
        {
            _modelRepository = modelRepository;
        }

        public async Task<HttpResponseMessage> GetConstraints()
        {
            var result = await _modelRepository.GetConstraints();
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> GetConstraint(Guid id)
        {
            var result = await _modelRepository.GetConstraint(id);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> PostConstraint(Guid id, ConstraintSaveRequest constraint)
        {
            await _modelRepository.SaveConstraint(new Constraint
            {
                Id = id,
                ConstraintGroupId = constraint.ConstraintGroupId,
                Name = constraint.Name,
                Description = constraint.Description,
                Equation = constraint.Equation.ToEquationObject(),
                SetConstraint = constraint.SetConstraint.ToEquationObject(),
            });
            return Request.CreateResponse(HttpStatusCode.OK);
        }

        public async Task<HttpResponseMessage> DeleteConstraint(Guid id)
        {
            await _modelRepository.DeleteConstraint(id);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }

    public class ConstraintSaveRequest
    {
        public Guid? ConstraintGroupId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Function { get; set; }
        public EquationObjectSaveRequest Equation { get; set; }
        public EquationObjectSaveRequest SetConstraint { get; set; }
    }
}