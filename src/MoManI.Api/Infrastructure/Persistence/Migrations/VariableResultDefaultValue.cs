using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Driver;

namespace MoManI.Api.Infrastructure.Persistence.Migrations
{
    public class VariableResultDefaultValue : Migration
    {
        public VariableResultDefaultValue(IMongoDatabase database) : base(database)
        {
        }

        public override int Version => 4;
        public override string Description => "Default value of 0 added to variable result, items cleaned up";

        protected override async Task RunMigration()
        {
            var variableResultCollection = Database.GetCollection<VariableResultStorageModel>("VariableResult");
            var variableResultItemCollection = Database.GetCollection<VariableResultItemStorageModel>("VariableResultItem");
            var variableResults = await variableResultCollection.Find(x => true).ToListAsync();
            foreach (var variableResult in variableResults)
            {
                if (!variableResult.DefaultValue.HasValue)
                    variableResult.DefaultValue = 0;
                await variableResultCollection.ReplaceOneAsync(x => x.Id == variableResult.Id, variableResult);
                await variableResultItemCollection.DeleteManyAsync(v => v.VariableResultId == variableResult.Id && (v.Value == "0" || v.Value == "0.0"));
            }
        }

        internal class VariableResultStorageModel
        {
            public Guid Id { get; set; }
            public Guid VariableId { get; set; }
            public Guid ScenarioId { get; set; }
            public Guid ModelId { get; set; }
            public IEnumerable<VariableSet> Sets { get; set; }
            public decimal? DefaultValue { get; set; }
        }

        internal class VariableSet
        {
            public Guid Id { get; set; }
            public int Index { get; set; }
        }

        internal class VariableResultItemStorageModel
        {
            public Guid VariableResultId { get; set; }
            public IEnumerable<string> Coordinates { get; set; }
            public string Value { get; set; }
        }
    }
}
