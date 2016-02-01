using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace MoManI.WinExecApp
{
    public class Executor
    {
        public async Task<bool> Run()
        {
            try
            {
                RunCommands();
                OutputReader.VerifyCompleted("res/output.txt");
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
                Console.WriteLine($"ERROR: {e.Message}");
                Console.WriteLine("Aborting. No results will be uploaded");
                Console.WriteLine("Press ENTER to exit");
                Console.ReadLine();
                return false;
            }
            Console.WriteLine("Success!");
            Console.WriteLine("Press ENTER to exit");
            Console.ReadLine();
            return true;
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
            cmd.StandardInput.Flush();
            cmd.StandardInput.Close();
            Console.WriteLine(cmd.StandardOutput.ReadToEnd());
            Console.WriteLine();
            Console.WriteLine("Running simulation in a separate window, please wait");
            var process = Process.Start("CMD.exe", @"/C glpsol -m model.txt -d data.txt -o res/output.txt");
            process?.WaitForExit();
            if (process == null || process.ExitCode != 0)
            {
                throw new Exception("Simulation did not complete successfully");
            }
        }
    }
}
