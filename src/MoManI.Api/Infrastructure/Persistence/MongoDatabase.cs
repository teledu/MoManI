using System;
using System.Threading.Tasks;
using MoManI.Api.Infrastructure.Persistence.Migrations;
using MoManI.Api.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Conventions;
using MongoDB.Driver;

namespace MoManI.Api.Infrastructure.Persistence
{
    public class MongoDatabase
    {
        private readonly IMongoDatabase _database;

        public MongoDatabase(string connectionString, string databaseName)
        {
            var mongoClient = new MongoClient(connectionString);
            _database = mongoClient.GetDatabase(databaseName);
        }

        public async Task InstallDatabase()
        {
            var mongoConventions = new ConventionPack();
            mongoConventions.Add(new CamelCaseElementNameConvention());
            mongoConventions.Add(new IgnoreExtraElementsConvention(true));
            mongoConventions.Add(new StringEnumConvention());
            ConventionRegistry.Register("camel case", mongoConventions, t => true);
            BsonDefaults.GuidRepresentation = GuidRepresentation.Standard;
            await RunMigrations();
        }

        private async Task RunMigrations()
        {
            var versionCollection = _database.GetCollection<DbVersion>("DbVersion");
            var recordCount = await versionCollection.Find(x => true).CountAsync();
            var latestVersionRecord = recordCount > 0
                ? await versionCollection.Find(x => true).SortByDescending(x => x.Version).FirstOrDefaultAsync()
                : null;
            var latestVersion = latestVersionRecord?.Version;
            if (latestVersion == null)
            {
                var migrator = new VariableResultItemIndex(_database);
                await migrator.Migrate();
                latestVersion = migrator.Version;
            }
        }
    }

    public class StringEnumConvention : ConventionBase, IMemberMapConvention
    {
        public void Apply(BsonMemberMap memberMap)
        {
            if (!memberMap.MemberType.IsEnum) return;
            memberMap.SetSerializer(new StringEnumBsonSerializer(memberMap.MemberType));
        }
    }

    public class StringEnumBsonSerializer : IBsonSerializer
    {
        public StringEnumBsonSerializer(Type valueType)
        {
            ValueType = valueType;
        }

        public object Deserialize(BsonDeserializationContext context, BsonDeserializationArgs args)
        {
            return Enum.Parse(ValueType, context.Reader.ReadString());
        }

        public void Serialize(BsonSerializationContext context, BsonSerializationArgs args, object value)
        {
            context.Writer.WriteString(value.ToString());
        }

        public Type ValueType { get; }
    }
}
