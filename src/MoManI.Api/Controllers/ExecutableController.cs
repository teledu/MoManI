using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Threading.Tasks;
using System.Web.Http;

namespace MoManI.Api.Controllers
{
    public class ExecutableController : ApiController
    {
        public async Task<HttpResponseMessage> GetExecutable()
        {
            var assembly = Assembly.GetExecutingAssembly();
            var resourceName = string.Concat("MoManI.Api.Resources.", "MoManI.WinExecApp.exe");
            var result = new HttpResponseMessage(HttpStatusCode.OK);
            using (var resFilestream = assembly.GetManifestResourceStream(resourceName))
            {
                if (resFilestream == null) return null;
                var bytes = new byte[resFilestream.Length];
                await resFilestream.ReadAsync(bytes, 0, bytes.Length);
                result.Content = new ByteArrayContent(bytes);
                return result;
            }
        }
    }
}
