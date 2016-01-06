using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace MoManI.Api.Infrastructure
{
    public class LimitedWriteModelAttribute : ActionFilterAttribute
    {
        private static readonly IEnumerable<HttpMethod> IllegalMethods = new List<HttpMethod>
        {
            HttpMethod.Post,
            HttpMethod.Delete
        };

        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            if (ShouldPrevent(actionContext.Request.Method))
            {
                actionContext.Response = new HttpResponseMessage(HttpStatusCode.Unauthorized);
            }

            base.OnActionExecuting(actionContext);
        }

        private static bool ShouldPrevent(HttpMethod method)
        {
            bool modelReadonly;
            bool.TryParse(ConfigurationManager.AppSettings["modelReadonly"], out modelReadonly);
            return modelReadonly && IllegalMethods.Contains(method);
        }
    }
}