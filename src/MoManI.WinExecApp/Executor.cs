using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace MoManI.WinExecApp
{
    public class Executor
    {
        public async Task<bool> Run()
        {
            var success = true;
            try
            {
                RunCommands();
                var metadata = MetadataReader.Read("metadata.txt");
                var results = ResultReader.Read(metadata);
                var uploader = new Uploader(metadata.ApiAddress);
                foreach (var result in results)
                {
                    await uploader.Upload(result);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine($"An error has occured: {e.Message}");
                success = false;
            }
            Console.WriteLine("Success!");
            Console.WriteLine("Press ENTER to exit");
            Console.ReadLine();
            return success;
        }

        private void RunCommands()
        {
            var cmd = new Process
            {
                StartInfo =
                {
                    FileName = "cmd.exe",
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true,
                    UseShellExecute = false
                }
            };
            cmd.Start();
            cmd.StandardInput.WriteLine(@"del /s /q res");
            cmd.StandardInput.WriteLine(@"rmdir /s /q res");
            cmd.StandardInput.WriteLine(@"mkdir res\csv");
            cmd.StandardInput.WriteLine(@"glpsol -m model.txt -d data.txt -o res/output.txt");
            cmd.StandardInput.Flush();
            cmd.StandardInput.Close();
            Console.WriteLine(cmd.StandardOutput.ReadToEnd());
        }
    }
}
