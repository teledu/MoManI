using System.Threading.Tasks;
using MoManI.Api.Models;
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
            var userIndexes = Builders<VariableResultItemStorageModel>.IndexKeys;
            var variableResultItemCollection = Database.GetCollection<VariableResultItemStorageModel>("VariableResultItem");
            await variableResultItemCollection.Indexes.CreateOneAsync(userIndexes.Ascending(i => i.VariableResultId), new CreateIndexOptions { Name = "VariableResultId_index" });
        }
    }
}
