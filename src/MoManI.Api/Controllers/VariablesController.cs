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
    public class VariablesController : ApiController
    {
        private readonly IModelRepository _modelRepository;

        public VariablesController(IModelRepository modelRepository)
        {
            _modelRepository = modelRepository;
        }

        public async Task<HttpResponseMessage> GetVariables()
        {
            var result = await _modelRepository.GetVariables();
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> GetVariable(Guid id)
        {
            var result = await _modelRepository.GetVariable(id);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> PostVariable(Guid id, VariableSaveRequest variable)
        {
            await _modelRepository.SaveVariable(new Variable
            {
                Id = id,
                Name = variable.Name,
                Description = variable.Description,
                Sets = variable.Sets,
                Constraint = variable.Constraint == null ? null : new VariableContstraint
                {
                    Operator = (VariableContstraintOperator)Enum.Parse(typeof(VariableContstraintOperator), variable.Constraint.Operator),
                    Value = variable.Constraint.Value
                },
                Integer = variable.Integer,
            });
            return Request.CreateResponse(HttpStatusCode.OK);
        }

        public async Task<HttpResponseMessage> DeleteVariable(Guid id)
        {
            await _modelRepository.DeleteVariable(id);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }

    public class VariableSaveRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public IEnumerable<Guid> Sets { get; set; }
        public VariableSaveRequestConstraint Constraint { get; set; }
        public bool Integer { get; set; }
    }

    public class VariableSaveRequestConstraint
    {
        public string Operator { get; set; }
        public decimal Value { get; set; }
    }
}
