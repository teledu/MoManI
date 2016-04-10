using System.Configuration;
using System.Web.Http;
using System.Web.Http.Dispatcher;
using System.Web.Http.ExceptionHandling;
using MoManI.Api.Infrastructure;
using MoManI.Api.Infrastructure.Conventions;
using MoManI.Api.Infrastructure.Persistence;

namespace MoManI.Api
{
    public class Bootstrapper
    {
        public static void StartWith(HttpConfiguration configuration)
        {
            configuration.MapHttpAttributeRoutes();

            configuration.ApplyConvention(new CompositeApiConvention(
                new DefaultRouteApiConvention(),
                new JsonFormattingApiConvention()
                ));

            
            configuration.Services.Add(typeof(IExceptionLogger), new NLogExceptionLogger());
            configuration.Services.Replace(typeof(IHttpControllerActivator), new CompositionRoot());
        }

        public static void InstallDatabase()
        {
            var connectionString = ConfigurationManager.ConnectionStrings["momani"].ConnectionString;
            var databaseName = ConfigurationManager.AppSettings["momaniDatabaseName"];
            var database = new MongoDatabase(connectionString, databaseName);
            database.InstallDatabase().Wait();
        }
    }
}
