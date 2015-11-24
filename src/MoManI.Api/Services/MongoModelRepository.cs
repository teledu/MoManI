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
        private readonly IMongoCollection<Set> _setsCollection;
        private readonly IMongoCollection<Parameter> _parametersCollection;
        private readonly IMongoCollection<Variable> _variablesCollection;
        private readonly IMongoCollection<ObjectiveFunction> _objectiveFunctionsCollection;
        private readonly IMongoCollection<Constraint> _constraintsCollection;
        private readonly IMongoCollection<ComposedModel> _composedModelsCollection;

        public MongoModelRepository(IMongoDatabase database)
        {
            _setsCollection = database.GetCollection<Set>("Sets");
            _parametersCollection = database.GetCollection<Parameter>("Parameters");
            _variablesCollection = database.GetCollection<Variable>("Variables");
            _objectiveFunctionsCollection = database.GetCollection<ObjectiveFunction>("ObjectiveFunction");
            _constraintsCollection = database.GetCollection<Constraint>("Constraint");
            _composedModelsCollection = database.GetCollection<ComposedModel>("ComposedModel");
        }

        public async Task<IEnumerable<Set>> GetSets()
        {
            return await _setsCollection.Find(new BsonDocument())
                .ToListAsync();
        }

        public async Task<Set> GetSet(Guid id)
        {
            var filter = Builders<Set>.Filter.Eq("_id", id);
            return await _setsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task SaveSet(Set set)
        {
            await _setsCollection.ReplaceOneAsync(x => x.Id == set.Id, set, new UpdateOptions
            {
                IsUpsert = true
            });
        }

        public async Task DeleteSet(Guid id)
        {
            await _setsCollection.DeleteOneAsync(x => x.Id == id);
        }

        public async Task<IEnumerable<Parameter>> GetParameters()
        {
            return await _parametersCollection.Find(new BsonDocument())
                .ToListAsync();
        }

        public async Task<Parameter> GetParameter(Guid id)
        {
            var filter = Builders<Parameter>.Filter.Eq("_id", id);
            return await _parametersCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task SaveParameter(Parameter parameter)
        {
            await _parametersCollection.ReplaceOneAsync(x => x.Id == parameter.Id, parameter, new UpdateOptions
            {
                IsUpsert = true
            });
        }

        public async Task DeleteParameter(Guid id)
        {
            await _parametersCollection.DeleteOneAsync(x => x.Id == id);
        }

        public async Task<IEnumerable<Variable>> GetVariables()
        {
            return await _variablesCollection.Find(new BsonDocument())
                .ToListAsync();
        }

        public async Task<Variable> GetVariable(Guid id)
        {
            var filter = Builders<Variable>.Filter.Eq("_id", id);
            return await _variablesCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task SaveVariable(Variable variable)
        {
            await _variablesCollection.ReplaceOneAsync(x => x.Id == variable.Id, variable, new UpdateOptions
            {
                IsUpsert = true
            });
        }

        public async Task DeleteVariable(Guid id)
        {
            await _variablesCollection.DeleteOneAsync(x => x.Id == id);
        }

        public async Task<IEnumerable<ObjectiveFunction>> GetObjectiveFunctions()
        {
            return await _objectiveFunctionsCollection.Find(new BsonDocument()).ToListAsync();
        }

        public async Task<ObjectiveFunction> GetObjectiveFunction(Guid id)
        {
            var filter = Builders<ObjectiveFunction>.Filter.Eq("_id", id);
            return await _objectiveFunctionsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task SaveObjectiveFunction(ObjectiveFunction objectiveFunction)
        {
            await _objectiveFunctionsCollection.ReplaceOneAsync(x => x.Id == objectiveFunction.Id, objectiveFunction, new UpdateOptions
            {
                IsUpsert = true
            });
        }

        public async Task DeleteObjectiveFunction(Guid id)
        {
            await _objectiveFunctionsCollection.DeleteOneAsync(x => x.Id == id);
        }

        public async Task<IEnumerable<Constraint>> GetConstraints()
        {
            return await _constraintsCollection.Find(new BsonDocument())
                .ToListAsync();
        }

        public async Task<Constraint> GetConstraint(Guid id)
        {
            var filter = Builders<Constraint>.Filter.Eq("_id", id);
            return await _constraintsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task SaveConstraint(Constraint constraint)
        {
            await _constraintsCollection.ReplaceOneAsync(x => x.Id == constraint.Id, constraint, new UpdateOptions
            {
                IsUpsert = true
            });
        }

        public async Task DeleteConstraint(Guid id)
        {
            await _constraintsCollection.DeleteOneAsync(x => x.Id == id);
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
    }
}