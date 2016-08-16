using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MoManI.Api.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace MoManI.Api.Services
{
    public class MongoModelRepository : IModelRepository
    {
        private readonly IMongoCollection<ComposedModel> _composedModelsCollection;
        private readonly IMongoCollection<Scenario> _scenariosCollection;
        private readonly IMongoCollection<SetData> _setDataCollection;
        private readonly IMongoCollection<ParameterDataStorageModel> _parameterDataCollection;
        private readonly IMongoCollection<ParameterDataItemStorageModel> _parameterDataItemCollection;

        public MongoModelRepository(IMongoDatabase database)
        {
            _composedModelsCollection = database.GetCollection<ComposedModel>("ComposedModel");
            _setDataCollection = database.GetCollection<SetData>("SetData");
            _parameterDataCollection = database.GetCollection<ParameterDataStorageModel>("ParameterData");
            _parameterDataItemCollection = database.GetCollection<ParameterDataItemStorageModel>("ParameterDataItem");
            _scenariosCollection = database.GetCollection<Scenario>("Scenario");
        }

        public async Task<IEnumerable<ComposedModel>> GetComposedModels()
        {
            return await _composedModelsCollection.Find(new BsonDocument())
                .ToListAsync();
        }

        public async Task<ComposedModel> GetComposedModel(Guid id)
        {
            var filter = Builders<ComposedModel>.Filter.Eq("_id", id);
            return await _composedModelsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task SaveComposedModel(ComposedModel composedModel)
        {
            await _composedModelsCollection.ReplaceOneAsync(x => x.Id == composedModel.Id, composedModel, new UpdateOptions
            {
                IsUpsert = true
            });
        }

        public async Task DeleteComposedModel(Guid id)
        {
            await _composedModelsCollection.DeleteOneAsync(x => x.Id == id);
        }

        public async Task CloneComposedModel(Guid modelId, Guid scenarioId, string name)
        {
            var model = await CreateClonedModel(modelId, name);
            var scenario = await CreateClonedScenario(scenarioId, model);
            var sourceSetData = await GetAllModelSetData(modelId);
            var setData = sourceSetData.Select(s => s.CloneToModel(model.Id));
            foreach (var setDataValue in setData)
            {
                await SaveSetData(setDataValue);
            }
            await CloneParameterData(scenarioId, scenario.Id);
        }

        private async Task<ComposedModel> CreateClonedModel(Guid modelId, string name)
        {
            var sourceModel = await GetComposedModel(modelId);
            var model = sourceModel.Clone();
            model.Name = name;
            await SaveComposedModel(model);
            return model;
        }

        private async Task<Scenario> CreateClonedScenario(Guid scenarioId, ComposedModel model)
        {
            var sourceScenario = await GetScenario(scenarioId);
            var scenario = sourceScenario.Clone(1);
            scenario.ModelId = model.Id;
            scenario.ParentScenarioId = null;
            await SaveScenario(scenario);
            return scenario;
        }

        public async Task<IEnumerable<Scenario>> GetScenarios(Guid modelId)
        {
            var filter = Builders<Scenario>.Filter.Eq("modelId", modelId);
            return await _scenariosCollection.Find(filter)
                .ToListAsync();
        }

        public async Task<Scenario> GetScenario(Guid id)
        {
            var filter = Builders<Scenario>.Filter.Eq("_id", id);
            return await _scenariosCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task SaveScenario(Scenario scenario)
        {
            await _scenariosCollection.ReplaceOneAsync(x => x.Id == scenario.Id, scenario, new UpdateOptions
            {
                IsUpsert = true
            });
        }

        public async Task DeleteScenario(Guid scenarioId)
        {
            var childScenarios = await _scenariosCollection.Find(s => s.ParentScenarioId == scenarioId).ToListAsync();
            foreach (var childScenario in childScenarios)
            {
                await DeleteScenario(childScenario.Id);
            }
            var parameters = await _parameterDataCollection.Find(x => x.ScenarioId == scenarioId).ToListAsync();
            foreach (var parameter in parameters)
            {
                await _parameterDataItemCollection.DeleteManyAsync(x => x.ParameterDataId == parameter.Id);
            }
            await _parameterDataCollection.DeleteManyAsync(x => x.ScenarioId == scenarioId);
            await _scenariosCollection.DeleteOneAsync(x => x.Id == scenarioId);
        }

        public async Task CloneScenario(Guid id, int revision)
        {
            var source = await GetScenario(id);
            var scenario = source.Clone(revision);
            await SaveScenario(scenario);
            await CloneParameterData(id, scenario.Id);
        }

        public async Task<SetData> GetSetData(Guid setId, Guid modelId)
        {
            var builder = Builders<SetData>.Filter;
            var filter = builder.Eq("setId", setId) & builder.Eq("modelId", modelId);
            return await _setDataCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<SetData>> GetAllModelSetData(Guid modelId)
        {
            var builder = Builders<SetData>.Filter;
            var filter = builder.Eq("modelId", modelId);
            return await _setDataCollection.Find(filter).ToListAsync();
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

        public async Task DeleteModelSetData(Guid modelId)
        {
            await _setDataCollection.DeleteManyAsync(x => x.ModelId == modelId);
        }

        public async Task<ParameterData> GetParameterData(Guid parameterId, Guid scenarioId)
        {
            var data = await GetParameterDataStorageModel(parameterId, scenarioId);
            if (data == null)
            {
                return null;
            }
            var items = await GetParameterDataItemStorageModels(data.Id);
            return new ParameterData
            {
                ParameterId = data.ParameterId,
                ModelId = data.ModelId,
                ScenarioId = data.ScenarioId,
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
            var existingData = await GetParameterDataStorageModel(parameterData.ParameterId, parameterData.ScenarioId);
            var dataModel = new ParameterDataStorageModel
            {
                Id = existingData?.Id ?? Guid.NewGuid(),
                ScenarioId = parameterData.ScenarioId,
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

        public async Task DeleteParameterData(Guid parameterId, Guid scenarioId)
        {
            var existingData = await GetParameterDataStorageModel(parameterId, scenarioId);
            if (existingData == null)
                return;
            await _parameterDataItemCollection.DeleteManyAsync(x => x.ParameterDataId == existingData.Id);
            await _parameterDataCollection.DeleteOneAsync(x => x.Id == existingData.Id);
        }

        private async Task CloneParameterData(Guid sourceScenarioId, Guid scenarioId)
        {
            var filter = Builders<ParameterDataStorageModel>.Filter.Eq("scenarioId", sourceScenarioId);
            var parameterDatas = await _parameterDataCollection.Find(filter).ToListAsync();
            foreach (var parameterData in parameterDatas)
            {
                var newParameterData = parameterData.Clone(scenarioId);
                await _parameterDataCollection.InsertOneAsync(newParameterData);
                var items = await GetParameterDataItemStorageModels(parameterData.Id);
                var parameterDataItemStorageModels = items as ParameterDataItemStorageModel[] ?? items.ToArray();
                if (!parameterDataItemStorageModels.Any()) continue;
                await _parameterDataItemCollection.InsertManyAsync(parameterDataItemStorageModels.Select(i => i.Clone(newParameterData.Id)));
            }
        }

        private async Task<ParameterDataStorageModel> GetParameterDataStorageModel(Guid parameterId, Guid scenarioId)
        {
            var builder = Builders<ParameterDataStorageModel>.Filter;
            var filter = builder.Eq("parameterId", parameterId) & builder.Eq("scenarioId", scenarioId);
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
            public Guid ScenarioId { get; set; }
            public Guid ModelId { get; set; }
            public decimal DefaultValue { get; set; }
            public IEnumerable<ParameterDataSet> Sets { get; set; }

            public ParameterDataStorageModel Clone(Guid scenarioId)
            {
                return new ParameterDataStorageModel
                {
                    Id = Guid.NewGuid(),
                    ParameterId = ParameterId,
                    ScenarioId = scenarioId,
                    ModelId = ModelId,
                    DefaultValue = DefaultValue,
                    Sets = Sets.ToList(),
                };
            }
        }

        private class ParameterDataItemStorageModel
        {
            public Guid ParameterDataId { get; set; }
            public IEnumerable<string> Coordinates { get; set; }
            public decimal Value { get; set; }

            public ParameterDataItemStorageModel Clone(Guid parameterDataId)
            {
                return new ParameterDataItemStorageModel
                {
                    ParameterDataId = parameterDataId,
                    Coordinates = Coordinates.ToList(),
                    Value = Value,
                };
            }
        }
    }
}