using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Xml;
using MoManI.WinExecApp.Models;

namespace MoManI.WinExecApp
{
    public static class ResultReader
    {
        public static IEnumerable<Result> ReadGlpk(Metadata metadata)
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
                var defaultValue = 0;
                yield return new Result
                {
                    ScenarioId = metadata.ScenarioId,
                    ModelId = metadata.ModelId,
                    VariableId = variable.Id,
                    DefaultValue = defaultValue,
                    Sets = variable.Sets.Select(s => new VariableSet {Id = s.Id, Index = s.Index}),
                    Data = resultItems.Where(i => i.V != defaultValue).ToList(),
                };
            }
        }

        public static IEnumerable<Result> ReadCplex(Metadata metadata)
        {
            var path = Path.Combine(@"res", "cplexoutput.sol");
            Console.WriteLine($"Reading results from {path}");
            var lines = File.ReadAllLines(path).Where(l => l.StartsWith("  <variable")).Select(l => l.Trim());
            var variableResults = metadata.Variables.ToDictionary(v => v.Name, v => new Result
            {
                ScenarioId = metadata.ScenarioId,
                ModelId = metadata.ModelId,
                VariableId = v.Id,
                DefaultValue = 0,
                Sets = v.Sets.Select(s => new VariableSet { Id = s.Id, Index = s.Index }),
                Data = new List<VariableResultItem>(),
            });

            var doc = new XmlDocument();
            doc.LoadXml($"<variables>\n{string.Join("\n", lines)}\n</variables>");
            var mainNode = doc.ChildNodes.Item(0);
            if (mainNode == null)
            {
                throw new Exception("Can not parse Cplex result xml file - no main variable node");
            }
            foreach (XmlNode node in mainNode.ChildNodes)
            {
                if (node.Attributes == null)
                {
                    throw new Exception("Can not parse Cplex result xml file - variable child node does not contain any attributes with informations");
                }
                var location = node.Attributes["name"].Value;
                var value = decimal.Parse(node.Attributes["value"].Value, NumberStyles.Float, new NumberFormatInfo {NumberDecimalSeparator = "."});
                var name = location.Split('(').First();
                if (value == variableResults[name].DefaultValue)
                    continue;
                var coordinates = location.Split('(').Last().TrimEnd(')').Split(',');
                variableResults[name].Data.Add(new VariableResultItem
                {
                    C = coordinates,
                    V = value,
                });
            }
            return variableResults.Values;
        }
    }
}
