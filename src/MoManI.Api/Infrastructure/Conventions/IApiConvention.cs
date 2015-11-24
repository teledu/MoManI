using System.Web.Http;

namespace MoManI.Api.Infrastructure.Conventions
{
    public interface IApiConvention
    {
        void ApplyTo(HttpConfiguration configuration);
    }
}
