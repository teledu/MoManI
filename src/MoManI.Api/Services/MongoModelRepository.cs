using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MoManI.Api.Controllers;
using MoManI.Api.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace MoManI.Api.Services
{
    public class MongoModelRepository : IModelRepository
    {
        private const int ItemStorageBundleSize = 10000;

        private readonly IMongoCollection<ComposedModel> _composedModelsCollection;
        private readonly IMongoCollection<Scenario> _scenariosCollection;
        private readonly IMongoCollection<SetData> _setDataCollection;
        private readonly IMongoCollection<ParameterDataStorageModel> _parameterDataCollection;
        private readonly IMongoCollection<ParameterDataItemBundleStorageModel> _parameterDataItemBundleCollection;

        public MongoModelRepository(IMongoDatabase database)
        {
            _composedModelsCollection = database.GetCollection<ComposedModel>("ComposedModel");
            _setDataCollection = database.GetCollection<SetData>("SetData");
            _parameterDataCollection = database.GetCollection<ParameterDataStorageModel>("ParameterData");
            _parameterDataItemBundleCollection = database.GetCollection<ParameterDataItemBundleStorageModel>("ParameterDataItemBundle");
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

        public async Task CloneComposedModel(CloningParameters parameters)
        {
            var model = await CreateClonedModel(parameters.ModelId, parameters.Name);
            var sourceSetData = await GetAllModelSetData(parameters.ModelId);
            var setData = sourceSetData.Select(s => s.CloneToModel(model.Id));//model specific
            foreach (var setDataValue in setData)
            {
                await SaveSetData(setDataValue);
            }
            
            foreach (var scenarioId in parameters.ScenarioIds)
            {
                var scenario = await CreateClonedScenario(scenarioId, model);//
                await CloneParameterData(scenarioId, scenario.Id);
            }

            //KITAS VARIANTAS //var scenarios = await CreateClonedScenarios(parameters.ScenarioIds, model);
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
            var scenario = sourceScenario.Clone(1);//paziuret // manau kad ok, nes klonuoji scenarijus pagal skirtingus ID
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
                await _parameterDataItemBundleCollection.DeleteManyAsync(x => x.ParameterDataId == parameter.Id);
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
            var itemBundles = await GetParameterDataItemStorageModels(data.Id);
            var items = itemBundles.SelectMany(i => i.ItemBundle).ToList();
            return new ParameterData
            {
                ParameterId = data.ParameterId,
                ModelId = data.ModelId,
                ScenarioId = data.ScenarioId,
                DefaultValue = data.DefaultValue,
                Sets = data.Sets,
                Data = items,
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
            var itemBundles = parameterData.Data
                .Select((val, index) => new {Index = index, Value = val})
                .GroupBy(i => i.Index / ItemStorageBundleSize)
                .Select(x => new ParameterDataItemBundleStorageModel
                {
                    ParameterDataId = dataModel.Id,
                    ItemBundle = x.Select(v => v.Value).ToList(),
                })
                .ToList();
            await _parameterDataCollection.ReplaceOneAsync(x => x.Id == dataModel.Id, dataModel, new UpdateOptions
            {
                IsUpsert = true,
            });
            await _parameterDataItemBundleCollection.DeleteManyAsync(x => x.ParameterDataId == dataModel.Id);
            if (itemBundles.Any())
            {
                await _parameterDataItemBundleCollection.InsertManyAsync(itemBundles);
            }
        }

        public async Task DeleteParameterData(Guid parameterId, Guid scenarioId)
        {
            var existingData = await GetParameterDataStorageModel(parameterId, scenarioId);
            if (existingData == null)
                return;
            await _parameterDataItemBundleCollection.DeleteManyAsync(x => x.ParameterDataId == existingData.Id);
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
                var parameterDataItemStorageModels = await GetParameterDataItemStorageModels(parameterData.Id);
                if (!parameterDataItemStorageModels.Any()) continue;
                await _parameterDataItemBundleCollection.InsertManyAsync(parameterDataItemStorageModels.Select(i => i.Clone(newParameterData.Id)));
            }
        }

        private async Task<ParameterDataStorageModel> GetParameterDataStorageModel(Guid parameterId, Guid scenarioId)
        {
            var builder = Builders<ParameterDataStorageModel>.Filter;
            var filter = builder.Eq("parameterId", parameterId) & builder.Eq("scenarioId", scenarioId);
            return await _parameterDataCollection.Find(filter).FirstOrDefaultAsync();
        }

        private async Task<List<ParameterDataItemBundleStorageModel>> GetParameterDataItemStorageModels(Guid parameterDataId)
        {
            var builder = Builders<ParameterDataItemBundleStorageModel>.Filter;
            var filter = builder.Eq("parameterDataId", parameterDataId);
            return await _parameterDataItemBundleCollection.Find(filter).ToListAsync();
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

        private class ParameterDataItemBundleStorageModel
        {
            public Guid ParameterDataId { get; set; }
            public IEnumerable<ParameterDataItem> ItemBundle { get; set; }

            public ParameterDataItemBundleStorageModel Clone(Guid parameterDataId)
            {
                return new ParameterDataItemBundleStorageModel
                {
                    ParameterDataId = parameterDataId,
                    ItemBundle = ItemBundle.ToList(),
                };
            }
        }
    }
}