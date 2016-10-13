using System;
using System.IO;
using System.Linq;

namespace MoManI.WinExecApp
{
    public static class OutputReader
    {
        public static void VerifyCompleted(string fileName)
        {
            var statusLine = File.ReadLines(fileName).First(l => l.StartsWith("Status"));
            var status = statusLine.Split(':').Skip(1).First().Trim();
            if (status == "UNDEFINED")
            {
                throw new Exception("Problem has no promary feasible solution");
            }
        }

        public static void VerifyFileCreated(string fileName)
        {
            try
            {
                var lines = File.ReadLines(fileName);
                if (!lines.Any())
                {
                    throw new Exception($"File {fileName} is empty");
                }
            }
            catch (Exception e)
            {
                throw new Exception($"Error reading file {fileName}: {e}");
            }
        }
    }
}
