using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using MoManI.WinExecApp.Models;

namespace MoManI.WinExecApp
{
    public static class ResultReader
    {
        public static IEnumerable<Result> Read(Metadata metadata)
        {
            foreach (var variable in metadata.Variables)
            {
                var path = Path.Combine(@"res\csv", $"{variable.Name}.csv");
                Console.WriteLine($"Reading results from {path}");
                var lines = File.ReadAllLines(path).Skip(1);
                var resultItems = lines.Select(l =>
                {
                    var values = l.Split(',').Select(v => v.Trim('"')).ToList();
                    return new VariableResultItem
                    {
                        C = values.Take(variable.Sets.Count()),
                        V = decimal.Parse(values.Last(), NumberStyles.Float, new NumberFormatInfo {NumberDecimalSeparator = "."}),
                    };
                });
                yield return new Result
                {
                    ScenarioId = metadata.ScenarioId,
                    ModelId = metadata.ModelId,
                    VariableId = variable.Id,
                    Sets = variable.Sets.Select(s => new VariableSet {Id = s.Id, Index = s.Index}),
                    Data = resultItems,
                };
            }
        }
    }
}
