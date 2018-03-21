using System;
using System.Threading.Tasks;
using MongoDB.Driver;

namespace MoManI.Api.Infrastructure.Persistence.Migrations
{
    public class VariableResultItemIndex : Migration
    {
        public VariableResultItemIndex(IMongoDatabase database) : base(database)
        {
        }

        public override int Version => 1;
        public override string Description => "VariableResultItems - index added on variableResultId";

        protected override async Task RunMigration()
        {
            var userIndexes = Builders<FakeVariableResultItemStorageModel>.IndexKeys;
            var variableResultItemCollection = Database.GetCollection<FakeVariableResultItemStorageModel>("VariableResultItem");
            await variableResultItemCollection.Indexes.CreateOneAsync(userIndexes.Ascending(i => i.VariableResultId), new CreateIndexOptions { Name = "VariableResultId_index" });
        }

        private class FakeVariableResultItemStorageModel
        {
            public Guid VariableResultId { get; set; }
        }
    }
}
