using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MoManI.Api.Models;
using MongoDB.Driver;

namespace MoManI.Api.Services
{
    public class MongoResultsRepository : IResultsRepository
    {
        private const int ItemStorageBundleSize = 10000;

        private readonly IMongoCollection<VariableResultStorageModel> _variableResultsCollection;
        private readonly IMongoCollection<VariableResultItemBundleStorageModel> _variableResultItemsBundleCollection;

        public MongoResultsRepository(IMongoDatabase database)
        {
            _variableResultsCollection = database.GetCollection<VariableResultStorageModel>("VariableResult");
            _variableResultItemsBundleCollection = database.GetCollection<VariableResultItemBundleStorageModel>("VariableResultItemBundle");
        }

        public async Task<IEnumerable<VariableResult>> GetVariableResults(Guid scenarioId)
        {
            var variableResultsStorageModels = await _variableResultsCollection.Find(vr => vr.ScenarioId == scenarioId).ToListAsync();
            return variableResultsStorageModels.Select(vr => new VariableResult
            {
                VariableId = vr.VariableId,
                ScenarioId = vr.ScenarioId,
                ModelId = vr.ModelId,
                Sets = vr.Sets,
            });
        }

        public async Task<VariableResult> GetVariableResult(Guid variableId, Guid scenarioId)
        {
            var data = await GetVariableResultStorageModel(variableId, scenarioId);
            if (data == null)
            {
                return null;
            }
            var itemBundles = await GetVariableResultItemStorageModels(data.Id);
            var items = itemBundles.SelectMany(b => b.ItemBundle);
            return new VariableResult
            {
                VariableId = data.VariableId,
                ModelId = data.ModelId,
                ScenarioId = data.ScenarioId,
                Sets = data.Sets,
                Data = items,
            };
        }

        public async Task SaveVariableResults(VariableResult data)
        {
            var existingData = await GetVariableResultStorageModel(data.VariableId, data.ScenarioId);
            var dataModel = new VariableResultStorageModel
            {
                Id = existingData?.Id ?? Guid.NewGuid(),
                ScenarioId = data.ScenarioId,
                ModelId = data.ModelId,
                VariableId = data.VariableId,
                Sets = data.Sets,
            };
            var itemBundles = data.Data
                .Select((val, index) => new { Index = index, Value = val })
                .GroupBy(i => i.Index / ItemStorageBundleSize)
                .Select(x => new VariableResultItemBundleStorageModel
                {
                    VariableResultId = dataModel.Id,
                    ItemBundle = x.Select(v => v.Value).ToList(),
                })
                .ToList();
            await _variableResultsCollection.ReplaceOneAsync(x => x.Id == dataModel.Id, dataModel, new UpdateOptions
            {
                IsUpsert = true,
            });
            await _variableResultItemsBundleCollection.DeleteManyAsync(x => x.VariableResultId == dataModel.Id);
            if (itemBundles.Any())
            {
                await _variableResultItemsBundleCollection.InsertManyAsync(itemBundles);
            }
        }

        public async Task<bool> HasResultsForScenario(Guid scenarioId)
        {
            var count = await _variableResultsCollection.CountAsync(vr => vr.ScenarioId == scenarioId);
            return count > 0;
        }

        public async Task DeleteScenarioResults(Guid scenarioId)
        {
            var variableResults = await _variableResultsCollection.Find(vr => vr.ScenarioId == scenarioId).ToListAsync();
            foreach (var variableResultStorageModel in variableResults)
            {
                await _variableResultItemsBundleCollection.DeleteManyAsync(vri => vri.VariableResultId == variableResultStorageModel.Id);
            }
            await _variableResultsCollection.DeleteManyAsync(x => x.ScenarioId == scenarioId);
        }

        private async Task<VariableResultStorageModel> GetVariableResultStorageModel(Guid variableId, Guid scenarioId)
        {
            return await _variableResultsCollection.Find(vr => vr.VariableId == variableId && vr.ScenarioId == scenarioId).FirstOrDefaultAsync();
        }

        private async Task<IEnumerable<VariableResultItemBundleStorageModel>> GetVariableResultItemStorageModels(Guid variableResultId)
        {
            return await _variableResultItemsBundleCollection.Find(vri => vri.VariableResultId == variableResultId).ToListAsync();
        }


        private class VariableResultStorageModel
        {
            public Guid Id { get; set; }
            public Guid VariableId { get; set; }
            public Guid ScenarioId { get; set; }
            public Guid ModelId { get; set; }
            public IEnumerable<VariableSet> Sets { get; set; }
            public decimal DefaultValue { get; set; }
        }

        private class VariableResultItemBundleStorageModel
        {
            public Guid VariableResultId { get; set; }
            public IEnumerable<VariableResultItem> ItemBundle { get; set; }
        }
    }
}