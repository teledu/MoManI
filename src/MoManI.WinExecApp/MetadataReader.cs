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
            return new Metadata
            {
                ApiAddress = new Uri(metadataLines.First()),
                ModelId = Guid.Parse(metadataLines.Skip(1).First()),
                Variables = metadataLines.Skip(2).Select(l =>
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
