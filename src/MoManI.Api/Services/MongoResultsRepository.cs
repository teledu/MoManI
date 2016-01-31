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
        private readonly IMongoCollection<VariableResult> _variableResultsCollection;

        public MongoResultsRepository(IMongoDatabase database)
        {
            _variableResultsCollection = database.GetCollection<VariableResult>("VariableResult");
        }

        public async Task<IEnumerable<VariableResult>> GetVariableResults(Guid scenarioId)
        {
            var filter = Builders<VariableResult>.Filter.Eq("scenarioId", scenarioId);
            return await _variableResultsCollection.Find(filter).Project(x => x.WithoutData()).ToListAsync();
        }

        public async Task<VariableResult> GetVariableResult(Guid variableId, Guid scenarioId)
        {
            var builder = Builders<VariableResult>.Filter;
            var filter = builder.Eq("variableId", variableId) & builder.Eq("scenarioId", scenarioId);
            return await _variableResultsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task SaveVariableResults(VariableResult data)
        {
            await _variableResultsCollection.ReplaceOneAsync(x => x.VariableId == data.VariableId && x.ScenarioId == data.ScenarioId, data, new UpdateOptions
            {
                IsUpsert = true
            });
        }

        public async Task<bool> HasResultsForScenario(Guid scenarioId)
        {
            var filter = Builders<VariableResult>.Filter.Eq("scenarioId", scenarioId);
            var count = await _variableResultsCollection.CountAsync(filter);
            return count > 0;
        }

        public async Task DeleteScenarioResults(Guid scenarioId)
        {
            await _variableResultsCollection.DeleteManyAsync(x => x.ScenarioId == scenarioId);
        }
    }
}