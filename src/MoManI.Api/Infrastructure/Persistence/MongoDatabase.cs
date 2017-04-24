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
        private readonly string _connectionString;
        private readonly string _databaseName;

        public MongoDatabase(string connectionString, string databaseName)
        {
            _connectionString = connectionString;
            _databaseName = databaseName;
        }

        public async Task InstallDatabase()
        {
            var mongoConventions = new ConventionPack();
            mongoConventions.Add(new CamelCaseElementNameConvention());
            mongoConventions.Add(new IgnoreExtraElementsConvention(true));
            mongoConventions.Add(new StringEnumConvention());
            mongoConventions.Add(new IgnoreIfNullConvention(true));
            ConventionRegistry.Register("camel case", mongoConventions, t => true);
            BsonDefaults.GuidRepresentation = GuidRepresentation.Standard;
            var mongoClient = new MongoClient(_connectionString);
            var database = mongoClient.GetDatabase(_databaseName);
            await RunMigrations(database);
        }

        private async Task RunMigrations(IMongoDatabase database)
        {
            var versionCollection = database.GetCollection<DbVersion>("DbVersion");
            var recordCount = await versionCollection.Find(x => true).CountAsync();
            var latestVersionRecord = recordCount > 0
                ? await versionCollection.Find(x => true).SortByDescending(x => x.Version).FirstOrDefaultAsync()
                : null;
            var latestVersion = latestVersionRecord?.Version;
            if (latestVersion == null)
            {
                var migrator = new VariableResultItemIndex(database);
                await migrator.Migrate();
                latestVersion = migrator.Version;
            }
            if (latestVersion == 1)
            {
                var migrator = new SetDataNames(database);
                await migrator.Migrate();
                latestVersion = migrator.Version;
            }
            if (latestVersion == 2)
            {
                var migrator = new SetDataColorsAndGroups(database);
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
