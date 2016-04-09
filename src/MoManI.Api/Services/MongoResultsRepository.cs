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
        private readonly IMongoCollection<VariableResultStorageModel> _variableResultsCollection;
        private readonly IMongoCollection<VariableResultItemStorageModel> _variableResultItemsCollection;

        public MongoResultsRepository(IMongoDatabase database)
        {
            _variableResultsCollection = database.GetCollection<VariableResultStorageModel>("VariableResult");
            _variableResultItemsCollection = database.GetCollection<VariableResultItemStorageModel>("VariableResultItem");
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
            var items = await GetVariableResultItemStorageModels(data.Id);
            return new VariableResult
            {
                VariableId = data.VariableId,
                ModelId = data.ModelId,
                ScenarioId = data.ScenarioId,
                Sets = data.Sets,
                Data = items.Select(i => new VariableResultItem
                {
                    C = i.Coordinates,
                    V = i.Value,
                })
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
            var itemsModel = data.Data.Select(d => new VariableResultItemStorageModel
            {
                VariableResultId = dataModel.Id,
                Coordinates = d.C,
                Value = d.V,
            }).ToList();
            await _variableResultsCollection.ReplaceOneAsync(x => x.Id == dataModel.Id, dataModel, new UpdateOptions
            {
                IsUpsert = true,
            });
            await _variableResultItemsCollection.DeleteManyAsync(x => x.VariableResultId == dataModel.Id);
            if (itemsModel.Any())
            {
                await _variableResultItemsCollection.InsertManyAsync(itemsModel);
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
                await _variableResultItemsCollection.DeleteManyAsync(vri => vri.VariableResultId == variableResultStorageModel.Id);
            }
            await _variableResultsCollection.DeleteManyAsync(x => x.ScenarioId == scenarioId);
        }

        private async Task<VariableResultStorageModel> GetVariableResultStorageModel(Guid variableId, Guid scenarioId)
        {
            return await _variableResultsCollection.Find(vr => vr.VariableId == variableId && vr.ScenarioId == scenarioId).FirstOrDefaultAsync();
        }

        private async Task<IEnumerable<VariableResultItemStorageModel>> GetVariableResultItemStorageModels(Guid variableResultId)
        {
            return await _variableResultItemsCollection.Find(vri => vri.VariableResultId == variableResultId).ToListAsync();
        }

        private class VariableResultStorageModel
        {
            public Guid Id { get; set; }
            public Guid VariableId { get; set; }
            public Guid ScenarioId { get; set; }
            public Guid ModelId { get; set; }
            public IEnumerable<VariableSet> Sets { get; set; }
        }

        private class VariableResultItemStorageModel
        {
            public Guid VariableResultId { get; set; }
            public IEnumerable<string> Coordinates { get; set; }
            public decimal Value { get; set; }
        }
    }
}