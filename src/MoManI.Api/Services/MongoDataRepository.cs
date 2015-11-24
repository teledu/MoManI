using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MoManI.Api.Models;
using MongoDB.Driver;

namespace MoManI.Api.Services
{
    public class MongoDataRepository : IDataRepository
    {
        private readonly IMongoCollection<SetData> _setDataCollection;
        private readonly IMongoCollection<ParameterDataStorageModel> _parameterDataCollection;
        private readonly IMongoCollection<ParameterDataItemStorageModel> _parameterDataItemCollection;

        public MongoDataRepository(IMongoDatabase database)
        {
            _setDataCollection = database.GetCollection<SetData>("SetData");
            _parameterDataCollection = database.GetCollection<ParameterDataStorageModel>("ParameterData");
            _parameterDataItemCollection = database.GetCollection<ParameterDataItemStorageModel>("ParameterDataItem");
        }

        public async Task<SetData> GetSetData(Guid setId, Guid modelId)
        {
            var builder = Builders<SetData>.Filter;
            var filter = builder.Eq("setId", setId) & builder.Eq("modelId", modelId);
            return await _setDataCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task SaveSetData(SetData setData)
        {
            await _setDataCollection.ReplaceOneAsync(x => x.SetId == setData.SetId && x.ModelId == setData.ModelId, setData, new UpdateOptions
            {
                IsUpsert = true
            });
        }

        public async Task DeleteSetData(Guid setId, Guid modelId)
        {
            await _setDataCollection.DeleteOneAsync(x => x.SetId == setId && x.ModelId == modelId);
        }

        public async Task<ParameterData> GetParameterData(Guid parameterId, Guid modelId)
        {
            var data = await GetParameterDataStorageModel(parameterId, modelId);
            if (data == null)
            {
                return null;
            }
            var items = await GetParameterDataItemStorageModels(data.Id);
            return new ParameterData
            {
                ParameterId = data.ParameterId,
                ModelId = data.ModelId,
                DefaultValue = data.DefaultValue,
                Sets = data.Sets,
                Data = items.Select(i => new ParameterDataItem
                {
                    C = i.Coordinates,
                    V = i.Value,
                })
            };
        }

        public async Task SaveParameterData(ParameterData parameterData)
        {
            var existingData = await GetParameterDataStorageModel(parameterData.ParameterId, parameterData.ModelId);
            var dataModel = new ParameterDataStorageModel
            {
                Id = existingData?.Id ?? Guid.NewGuid(),
                ModelId = parameterData.ModelId,
                ParameterId = parameterData.ParameterId,
                DefaultValue = parameterData.DefaultValue,
                Sets = parameterData.Sets,
            };
            var itemsModel = parameterData.Data.Select(d => new ParameterDataItemStorageModel
            {
                ParameterDataId = dataModel.Id,
                Coordinates = d.C,
                Value = d.V,
            }).ToList();
            await _parameterDataCollection.ReplaceOneAsync(x => x.Id == dataModel.Id, dataModel, new UpdateOptions
            {
                IsUpsert = true,
            });
            await _parameterDataItemCollection.DeleteManyAsync(x => x.ParameterDataId == dataModel.Id);
            if (itemsModel.Any())
            {
                await _parameterDataItemCollection.InsertManyAsync(itemsModel);
            }
        }

        public async Task DeleteParameterData(Guid parameterId, Guid modelId)
        {
            var existingData = await GetParameterDataStorageModel(parameterId, modelId);
            if (existingData == null)
                return;
            await _parameterDataItemCollection.DeleteManyAsync(x => x.ParameterDataId == existingData.Id);
            await _parameterDataCollection.DeleteOneAsync(x => x.Id == existingData.Id);
        }

        private async Task<ParameterDataStorageModel> GetParameterDataStorageModel(Guid parameterId, Guid modelId)
        {
            var builder = Builders<ParameterDataStorageModel>.Filter;
            var filter = builder.Eq("parameterId", parameterId) & builder.Eq("modelId", modelId);
            return await _parameterDataCollection.Find(filter).FirstOrDefaultAsync();
        }

        private async Task<IEnumerable<ParameterDataItemStorageModel>> GetParameterDataItemStorageModels(Guid parameterDataId)
        {
            var builder = Builders<ParameterDataItemStorageModel>.Filter;
            var filter = builder.Eq("parameterDataId", parameterDataId);
            return await _parameterDataItemCollection.Find(filter).ToListAsync();
        }

        private class ParameterDataStorageModel
        {
            public Guid Id { get; set; }
            public Guid ParameterId { get; set; }
            public Guid ModelId { get; set; }
            public decimal DefaultValue { get; set; }
            public IEnumerable<ParameterDataSet> Sets { get; set; }
        }

        private class ParameterDataItemStorageModel
        {
            public Guid ParameterDataId { get; set; }
            public IEnumerable<string> Coordinates { get; set; }
            public decimal Value { get; set; }
        }
    }
}