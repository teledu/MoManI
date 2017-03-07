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
        private readonly IComponentsRepository _componentsRepository;
        private readonly IModelRepository _modelRepository;
        private readonly IResultsRepository _resultsRepository;

        public CompositionRoot()
        {
            var mongoClient = new MongoClient(ConfigurationManager.ConnectionStrings["momani"].ConnectionString);
            _database = mongoClient.GetDatabase(ConfigurationManager.AppSettings["momaniDatabaseName"]);
            _componentsRepository = new MongoComponentsRepository(_database);
            _modelRepository = new MongoModelRepository(_database);
            _resultsRepository = new MongoResultsRepository(_database);
            
        }

        public IHttpController Create(HttpRequestMessage request, HttpControllerDescriptor controllerDescriptor, Type controllerType)
        {
            var principal = ClaimsPrincipal.Current;
            if (controllerType == typeof (SetsController))
            {
                return new SetsController(_componentsRepository, principal);
            }
            if (controllerType == typeof(ParametersController))
            {
                return new ParametersController(_componentsRepository);
            }
            if (controllerType == typeof(VariablesController))
            {
                return new VariablesController(_componentsRepository);
            }
            if (controllerType == typeof(ObjectiveFunctionsController))
            {
                return new ObjectiveFunctionsController(_componentsRepository);
            }
            if (controllerType == typeof(ConstraintGroupsController))
            {
                return new ConstraintGroupsController(_componentsRepository);
            }
            if (controllerType == typeof(ConstraintsController))
            {
                return new ConstraintsController(_componentsRepository);
            }
            if (controllerType == typeof(ComposedModelsController))
            {
                return new ComposedModelsController(_modelRepository, _resultsRepository);
            }
            if (controllerType == typeof(ModelCloningController))
            {
                return new ModelCloningController(_modelRepository);
            }
            if (controllerType == typeof(ScenariosController))
            {
                return new ScenariosController(_modelRepository, _resultsRepository);
            }
            if (controllerType == typeof(ScenarioCloningController))
            {
                return new ScenarioCloningController(_modelRepository);
            }
            if (controllerType == typeof(SetDataController))
            {
                return new SetDataController(_modelRepository);
            }
            if (controllerType == typeof(ParameterDataController))
            {
                return new ParameterDataController(_modelRepository);
            }
            if (controllerType == typeof(ParameterDataForSetController))
            {
                return new ParameterDataForSetController(_modelRepository);
            }
            if (controllerType == typeof(VariableResultsController))
            {
                return new VariableResultsController(_resultsRepository);
            }
            if (controllerType == typeof(ExecutableController))
            {
                return new ExecutableController();
            }

            throw new Exception("Unknown controller type " + controllerType);
        }
    }
}
