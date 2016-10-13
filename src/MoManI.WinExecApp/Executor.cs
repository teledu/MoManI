using System;
using System.Diagnostics;
using System.Threading.Tasks;
using MoManI.WinExecApp.Models;

namespace MoManI.WinExecApp
{
    public class Executor
    {
        public async Task<bool> Run()
        {
            try
            {
                var solver = SelectSolver();
                switch (solver)
                {
                    case SolverType.Cplex:
                        RunCplex();
                        await UploadCplex();
                        return true;
                    case SolverType.Glpk:
                        RunGlpk();
                        await UploadGlpk();
                        return true;
                }
            }
            catch (Exception e)
            {
                ReportError(e);
                return false;
            }
            ReportSuccess();
            return true;
        }

        private static void ReportSuccess()
        {
            Console.WriteLine("Success!");
            Console.WriteLine("Press ENTER to exit");
            Console.ReadLine();
        }

        private static void ReportError(Exception e)
        {
            Console.WriteLine($"ERROR: {e.Message}");
            Console.WriteLine("Aborting. No results will be uploaded");
            Console.WriteLine("Press ENTER to exit");
            Console.ReadLine();
        }

        private async Task UploadGlpk()
        {
            var metadata = MetadataReader.Read("metadata.txt");
            var results = ResultReader.ReadGlpk(metadata);
            var uploader = new Uploader(metadata.ApiAddress);
            foreach (var result in results)
            {
                await uploader.Upload(result);
            }
        }

        private void RunGlpk()
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
            OutputReader.VerifyCompleted("res/output.txt");
        }

        private async Task UploadCplex()
        {
            var metadata = MetadataReader.Read("metadata.txt");
            var results = ResultReader.ReadCplex(metadata);
            var uploader = new Uploader(metadata.ApiAddress);
            foreach (var result in results)
            {
                await uploader.Upload(result);
            }
        }

        private void RunCplex()
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
            RunCplexPreparation();
            RunCplexSimulation();
        }

        private void RunCplexPreparation()
        {
            Console.WriteLine("Running preparation in a separate window, please wait");
            var process = Process.Start("CMD.exe", @"/C glpsol -m model.txt -d data.txt --wlp res/cplexinput.lp");
            process?.WaitForExit();
            if (process == null || process.ExitCode != 0)
            {
                throw new Exception("Preparation did not complete successfully");
            }
            OutputReader.VerifyFileCreated("res/cplexinput.lp");
        }

        private static void RunCplexSimulation()
        {
            Console.WriteLine("Running simulation in a separate window, please wait");
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
            cmd.StandardInput.WriteLine("cplex -c \"read res/cplexinput.lp\" \"optimize\" \"write res/cplexoutput.sol\" \"quit\"");
            cmd.StandardInput.Flush();
            cmd.StandardInput.Close();
            Console.WriteLine(cmd.StandardOutput.ReadToEnd());
            //cplex -c "read res/cplexinput.lp" "optimize" "write res/cplexoutput.sol" "quit"
            //cplex -c \"read res/cplexinput.lp\" \"optimize\" \"write res/cplexoutput.sol\" \"quit\"
            //var process = Process.Start("CMD.exe", "/C cplex -c \"read res/cplexinput.lp\" \"optimize\" \"write res/cplexoutput.sol\" \"quit\"");
            //process?.WaitForExit();
            //if (process == null || process.ExitCode != 0)
            //{
            //    throw new Exception("Simulation did not complete successfully");
            //}
            OutputReader.VerifyFileCreated("res/cplexoutput.sol");
        }

        private static SolverType SelectSolver()
        {
            string selected = null;
            while (selected != "g" && selected != "c")
            {
                Console.WriteLine("Choose solver: press G for GLPK or C for Cplex");
                selected = Console.ReadLine()?.ToLower();
            }
            switch (selected)
            {
                case "c":
                    return SolverType.Cplex;
                case "g":
                default:
                    return SolverType.Glpk;
            }
        }
    }
}
