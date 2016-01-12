using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using MoManI.WinExecApp.Models;

namespace MoManI.WinExecApp
{
    public static class MetadataReader
    {
        public static Metadata Read(string fileName)
        {
            var metadataLines = File.ReadAllLines(fileName).Where(l => l.Any()).ToList();
            Guid scenarioId;
            if (!Guid.TryParse(metadataLines.Skip(1).First(), out scenarioId))
            {
                throw new Exception("Old data format, please redownload executable files");
            }
            return new Metadata
            {
                ApiAddress = new Uri(metadataLines.First()),
                ScenarioId = scenarioId,
                ModelId = Guid.Parse(metadataLines.Skip(2).First()),
                Variables = metadataLines.Skip(3).Select(l =>
                {
                    var varRecords = l.Split(',');
                    var name = varRecords.First();
                    var variableId = Guid.Parse(varRecords.Skip(1).First());
                    var sets = new List<Set>();
                    foreach (var set in varRecords.Skip(2).Select(Guid.Parse).Select(setId => new Set(setId, sets.Count(s => s.Id == setId))))
                    {
                        sets.Add(set);
                    }
                    return new Variable
                    {
                        Name = name,
                        Id = variableId,
                        Sets = sets,
                    };
                }),
            };
        }
    }
}
