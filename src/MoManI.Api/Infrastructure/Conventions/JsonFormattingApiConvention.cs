using System;
using System.Web.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;

namespace MoManI.Api.Infrastructure.Conventions
{
    public class JsonFormattingApiConvention : IApiConvention
    {
        public void ApplyTo(HttpConfiguration configuration)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));

            var jsonSettings = new JsonSerializerSettings();
            jsonSettings.Converters.Add(new StringEnumConverter());
            jsonSettings.DateTimeZoneHandling = DateTimeZoneHandling.Utc;
            jsonSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();

            configuration.Formatters.JsonFormatter.SerializerSettings = jsonSettings;
        }
    }
}
