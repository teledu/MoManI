using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MoManI.Api.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace MoManI.Api.Services
{
    public class MongoResultsRepository : IResultsRepository
    {
        private readonly IMongoCollection<ComposedModel> _composedModelsCollection;
        private readonly IMongoCollection<VariableResult> _variableResultsCollection;

        public MongoResultsRepository(IMongoDatabase database)
        {
            _composedModelsCollection = database.GetCollection<ComposedModel>("ComposedModel");
            _variableResultsCollection = database.GetCollection<VariableResult>("VariableResult");
        }

        public async Task<VariableResult> GetVariableResult(Guid variableId, Guid modelId)
        {
            var builder = Builders<VariableResult>.Filter;
            var filter = builder.Eq("variableId", variableId) & builder.Eq("modelId", modelId);
            return await _variableResultsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<ModelResult>> GetModelResults()
        {
            var variableFilter = new ExpressionFilterDefinition<VariableResult>(x => true);
            var distinctIds = await _variableResultsCollection.DistinctAsync<Guid>("modelId", variableFilter);
            var modelIds = await distinctIds.ToListAsync();
            var modelResults = modelIds.Select(async m =>
            {
                var filter = Builders<ComposedModel>.Filter.Eq("_id", m);
                var model = await _composedModelsCollection.Find(filter).FirstOrDefaultAsync();
                return new ModelResult
                {
                    ModelId = m,
                    Name = model.Name,
                    Description = model.Description,
                };
            });
            return await Task.WhenAll(modelResults);
        }

        public async Task<ModelResult> GetModelResult(Guid id)
        {
            var filter = Builders<ComposedModel>.Filter.Eq("_id", id);
            var model = await _composedModelsCollection.Find(filter).FirstOrDefaultAsync();
            if (model == null) return null;
            var variableFilter = Builders<VariableResult>.Filter.Eq("modelId", model.Id);
            var variables = await _variableResultsCollection
                .Find(variableFilter)
                .Project<VariableResult>(Builders<VariableResult>.Projection.Exclude(r => r.Data))
                .ToListAsync();
            return new ModelResult
            {
                ModelId = model.Id,
                Name = model.Name,
                Description = model.Description,
                VariableResults = variables,
            };
        }

        public async Task SaveVariableResults(VariableResult data)
        {
            await _variableResultsCollection.ReplaceOneAsync(x => x.VariableId == data.VariableId && x.ModelId == data.ModelId, data, new UpdateOptions
            {
                IsUpsert = true
            });
        }
    }
}