using System;
using System.Web.Http;

namespace MoManI.Api.Infrastructure.Conventions
{
    public class CompositeApiConvention : IApiConvention
    {
        private readonly IApiConvention[] _conventions;

        public CompositeApiConvention(params IApiConvention[] conventions)
        {
            if (conventions == null) throw new ArgumentNullException();
            _conventions = conventions;
        }

        public void ApplyTo(HttpConfiguration configuration)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));

            foreach (var apiConvention in _conventions)
            {
                apiConvention.ApplyTo(configuration);
            }
        }
    }
}
