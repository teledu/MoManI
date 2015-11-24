using System;
using System.Web.Http;

namespace MoManI.Api.Infrastructure.Conventions
{
    public class DefaultRouteApiConvention : IApiConvention
    {
        public void ApplyTo(HttpConfiguration configuration)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));

            configuration.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "{controller}/{id}",
                defaults: new
                {
                    id = RouteParameter.Optional
                }
            );
        }
    }
}