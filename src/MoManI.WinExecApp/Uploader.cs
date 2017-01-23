using System;
using System.Net.Http;
using System.Threading.Tasks;
using MoManI.WinExecApp.Models;

namespace MoManI.WinExecApp
{
    public class Uploader : IDisposable
    {
        private readonly HttpClient _client;
        private const int RetryCount = 5;

        public Uploader(Uri address)
        {
            _client = new HttpClient
            {
                BaseAddress = address,
            };
        }

        public async Task Upload(Result data)
        {
            var uploaded = false;
            var attempt = 0;
            while (!uploaded && attempt < RetryCount)
            {
                attempt++;
                Console.WriteLine(attempt > 1 ? $"Uploading data to server (attempt {attempt})" : "Uploading data to server");
                try
                {
                    var res = await _client.PostAsJsonAsync("VariableResults", data);
                    if (res.IsSuccessStatusCode)
                    {
                        uploaded = true;
                    }
                    else
                    {
                        Console.WriteLine(res.StatusCode);
                    }
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                }
            }
            if (!uploaded)
                throw new Exception($"Unable to upload results for variable {data.VariableId} in {RetryCount} attempts, aborting");
        }

        public void Dispose()
        {
            _client.Dispose();
        }
    }
}
