using System;
using System.Web.Http;

namespace MoManI.Api.Infrastructure.Conventions
{
    public static class HttpConfigurationExtensions
    {
        public static HttpConfiguration ApplyConvention(this HttpConfiguration configuration, IApiConvention convention)
        {
            if (convention == null) throw new ArgumentNullException(nameof(convention));
            convention.ApplyTo(configuration);

            return configuration;
        }
    }
}