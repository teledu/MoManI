using System;
using System.Net.Http;
using System.Threading.Tasks;
using MoManI.WinExecApp.Models;

namespace MoManI.WinExecApp
{
    public class Uploader : IDisposable
    {
        private readonly HttpClient _client;

        public Uploader(Uri address)
        {
            _client = new HttpClient
            {
                BaseAddress = address,
            };
        }

        public async Task Upload(Result data)
        {
            Console.WriteLine("Uploading data to server");
            var res = await _client.PostAsJsonAsync("VariableResults", data);
            if (!res.IsSuccessStatusCode)
                throw new Exception(res.StatusCode.ToString());
        }

        public void Dispose()
        {
            _client.Dispose();
        }
    }
}
