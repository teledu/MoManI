using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using MoManI.Api.Models;
using MoManI.Api.Services;

namespace MoManI.Api.Controllers
{
    public class SetDataController : ApiController
    {
        private readonly IDataRepository _dataRepository;

        public SetDataController(IDataRepository dataRepository)
        {
            _dataRepository = dataRepository;
        }

        public async Task<HttpResponseMessage> GetSetData(Guid setId, Guid modelId)
        {
            var result = await _dataRepository.GetSetData(setId, modelId);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> GetSetData(Guid modelId)
        {
            var result = await _dataRepository.GetAllModelSetData(modelId);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        public async Task<HttpResponseMessage> PostSetData(SetDataSaveRequest setData)
        {
            await _dataRepository.SaveSetData(new SetData
            {
                SetId = setData.SetId,
                ModelId = setData.ModelId,
                Items = setData.Items.Select(i => new SetDataItem
                {
                    Value = i.Value,
                    Name = i.Name,
                    Color = i.Color,
                    GroupId = i.GroupId,
                }),
                Groups = setData.Groups?.Select(g => new SetDataGroup
                {
                    Id = g.Id,
                    Name = g.Name,
                })
            });
            return Request.CreateResponse(HttpStatusCode.OK);
        }

        public async Task<HttpResponseMessage> DeleteSetData(Guid setId, Guid modelId)
        {
            await _dataRepository.DeleteSetData(setId, modelId);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }

    public class SetDataSaveRequest
    {
        public Guid SetId { get; set; }
        public Guid ModelId { get; set; }
        public IEnumerable<SetDataItemSaveRequest> Items { get; set; }
        public IEnumerable<SetDataGroupSaveRequest> Groups { get; set; }
    }

    public class SetDataItemSaveRequest
    {
        public string Value { get; set; }
        public string Name { get; set; }
        public string Color { get; set; }
        public Guid? GroupId { get; set; }
    }

    public class SetDataGroupSaveRequest
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }
}
