using System;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Dispatcher;
using System.Web.Http.ExceptionHandling;
using MoManI.Api.Infrastructure;
using MoManI.Api.Infrastructure.Conventions;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Conventions;

namespace MoManI.Api
{
    public class Bootstrapper
    {
        public static void StartWith(HttpConfiguration configuration)
        {
            configuration.MapHttpAttributeRoutes();

            configuration.ApplyConvention(new CompositeApiConvention(
                new DefaultRouteApiConvention(),
                new JsonFormattingApiConvention()
                ));

            
            configuration.Services.Add(typeof(IExceptionLogger), new NLogExceptionLogger());
            configuration.Services.Replace(typeof(IHttpControllerActivator), new CompositionRoot());
        }

        public static async Task InstallDatabase()
        {
            var mongoConventions = new ConventionPack();
            mongoConventions.Add(new CamelCaseElementNameConvention());
            mongoConventions.Add(new IgnoreExtraElementsConvention(true));
            mongoConventions.Add(new StringEnumConvention());
            ConventionRegistry.Register("camel case", mongoConventions, t => true);

            BsonDefaults.GuidRepresentation = GuidRepresentation.Standard;
            
            await Task.Delay(0);
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
