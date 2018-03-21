using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Driver;

namespace MoManI.Api.Infrastructure.Persistence.Migrations
{
    public class BundledParameterAndVariableDataStorage : Migration
    {
        public BundledParameterAndVariableDataStorage(IMongoDatabase database) : base(database)
        {
        }

        public override int Version => 5;
        public override string Description => "Bundling data storage for parameter and variable data items";
        
        private const int BundleSize = 10000;

        protected override async Task RunMigration()
        {
            var parameterDataCollection = Database.GetCollection<FakeParameterDataStorageModel>("ParameterData");
            var parameterDataItemCollection = Database.GetCollection<ParameterDataItemStorageModel>("ParameterDataItem");
            var parameterDataItemBundleCollection = Database.GetCollection<ParameterDataItemBundleStorageModel>("ParameterDataItemBundle");

            var variableResultCollection = Database.GetCollection<FakeVariableResultStorageModel>("VariableResult");
            var variableResultItemCollection = Database.GetCollection<VariableResultItemStorageModel>("VariableResultItem");
            var variableResultItemBundleCollection = Database.GetCollection<VariableResultItemBundleStorageModel>("VariableResultItemBundle");
            
            var userIndexes = Builders<ParameterDataItemStorageModel>.IndexKeys;
            await parameterDataItemCollection.Indexes.CreateOneAsync(userIndexes.Ascending(i => i.ParameterDataId), new CreateIndexOptions { Name = "ParameterDataId_index" });

            var parameterDatas = await parameterDataCollection.Find(x => true).ToListAsync();
            foreach (var parameterData in parameterDatas)
            {
                var parameterDataItems = await parameterDataItemCollection.Find(x => x.ParameterDataId == parameterData.Id).ToListAsync();
                var bundles = Bundle(parameterDataItems).Select(b => new ParameterDataItemBundleStorageModel
                {
                    ParameterDataId = parameterData.Id,
                    ItemBundle = b.Select(i => new ParameterDataItem {C = i.Coordinates, V = i.Value}).ToList(),
                }).ToList();
                if (bundles.Any())
                {
                    await parameterDataItemBundleCollection.InsertManyAsync(bundles);
                }
            }

            var variableResults = await variableResultCollection.Find(x => true).ToListAsync();
            foreach (var variableResult in variableResults)
            {
                var variableResultItems = await variableResultItemCollection.Find(x => x.VariableResultId == variableResult.Id).ToListAsync();
                var bundles = Bundle(variableResultItems).Select(b => new VariableResultItemBundleStorageModel
                {
                    VariableResultId = variableResult.Id,
                    ItemBundle = b.Select(i => new VariableResultItem { C = i.Coordinates, V = decimal.Parse(i.Value) }).ToList(),
                }).ToList();
                if (bundles.Any())
                {
                    await variableResultItemBundleCollection.InsertManyAsync(bundles);
                }
            }

            await Database.DropCollectionAsync("ParameterDataItem");
            await Database.DropCollectionAsync("VariableResultItem");
        }

        private IEnumerable<List<T>> Bundle<T>(IEnumerable<T> items)
        {

            return items
                .Select((val, index) => new { Index = index, Value = val })
                .GroupBy(i => i.Index / BundleSize)
                .Select(x => x.Select(v => v.Value).ToList())
                .ToList();
        }

        private class FakeParameterDataStorageModel
        {
            public Guid Id { get; set; }
        }

        private class ParameterDataItemStorageModel
        {
            public Guid ParameterDataId { get; set; }
            public List<string> Coordinates { get; set; }
            public decimal Value { get; set; }
        }

        private class ParameterDataItemBundleStorageModel
        {
            public Guid ParameterDataId { get; set; }
            public List<ParameterDataItem> ItemBundle { get; set; }
        }

        private class ParameterDataItem
        {
            public IEnumerable<string> C { get; set; }
            public decimal V { get; set; }
        }


        private class FakeVariableResultStorageModel
        {
            public Guid Id { get; set; }
        }

        private class VariableResultItemStorageModel
        {
            public Guid VariableResultId { get; set; }
            public IEnumerable<string> Coordinates { get; set; }
            public string Value { get; set; }
        }

        private class VariableResultItemBundleStorageModel
        {
            public Guid VariableResultId { get; set; }
            public IEnumerable<VariableResultItem> ItemBundle { get; set; }
        }

        private class VariableResultItem
        {
            public IEnumerable<string> C { get; set; }
            public decimal V { get; set; }
        }
    }
}
