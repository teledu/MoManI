using System.Threading.Tasks;
using MoManI.Api.Models;
using MongoDB.Driver;

namespace MoManI.Api.Infrastructure.Persistence
{
    public abstract class Migration
    {
        protected readonly IMongoDatabase Database;
        private readonly IMongoCollection<DbVersion> _versionCollection; 

        protected Migration(IMongoDatabase database)
        {
            Database = database;
            _versionCollection = database.GetCollection<DbVersion>("DbVersion");
        }

        public abstract int Version { get; }
        public abstract string Description { get; }

        public async Task Migrate()
        {
            await RunMigration();
            await UpdateVersion();
        }

        protected abstract Task RunMigration();

        private async Task UpdateVersion()
        {
            var versionRecord = new DbVersion
            {
                Version = Version,
                Description = Description,
            };
            await _versionCollection.InsertOneAsync(versionRecord);
        }
    }
}