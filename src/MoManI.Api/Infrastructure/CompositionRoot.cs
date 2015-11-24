using System;
using System.Configuration;
using System.Net.Http;
using System.Security.Claims;
using System.Web.Http.Controllers;
using System.Web.Http.Dispatcher;
using MoManI.Api.Controllers;
using MoManI.Api.Services;
using MongoDB.Driver;

namespace MoManI.Api.Infrastructure
{
    public class CompositionRoot : IHttpControllerActivator
    {
        private readonly IMongoDatabase _database;
        private readonly IModelRepository _modelRepository;
        private readonly IDataRepository _dataRepository;
        private readonly IResultsRepository _resultsRepository;

        public CompositionRoot()
        {
            var mongoClient = new MongoClient(ConfigurationManager.ConnectionStrings["momani"].ConnectionString);
            _database = mongoClient.GetDatabase(ConfigurationManager.AppSettings["momaniDatabaseName"]);
            _modelRepository = new MongoModelRepository(_database);
            _dataRepository = new MongoDataRepository(_database);
            _resultsRepository = new MongoResultsRepository(_database);
            
        }

        public IHttpController Create(HttpRequestMessage request, HttpControllerDescriptor controllerDescriptor, Type controllerType)
        {
            var principal = ClaimsPrincipal.Current;
            if (controllerType == typeof (SetsController))
            {
                return new SetsController(_modelRepository, principal);
            }
            if (controllerType == typeof(ParametersController))
            {
                return new ParametersController(_modelRepository);
            }
            if (controllerType == typeof(VariablesController))
            {
                return new VariablesController(_modelRepository);
            }
            if (controllerType == typeof(ObjectiveFunctionsController))
            {
                return new ObjectiveFunctionsController(_modelRepository);
            }
            if (controllerType == typeof(ConstraintsController))
            {
                return new ConstraintsController(_modelRepository);
            }
            if (controllerType == typeof(ComposedModelsController))
            {
                return new ComposedModelsController(_modelRepository);
            }
            if (controllerType == typeof(SetDataController))
            {
                return new SetDataController(_dataRepository);
            }
            if (controllerType == typeof(ParameterDataController))
            {
                return new ParameterDataController(_dataRepository);
            }
            if (controllerType == typeof(VariableResultsController))
            {
                return new VariableResultsController(_resultsRepository);
            }
            if (controllerType == typeof(ExecutableController))
            {
                return new ExecutableController();
            }
            if (controllerType == typeof (ModelResultsController))
            {
                return new ModelResultsController(_resultsRepository);
            }

            throw new Exception("Unknown controller type " + controllerType);
        }
    }
}
