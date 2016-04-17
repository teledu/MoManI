using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MoManI.Api.Models;
using MongoDB.Driver;

namespace MoManI.Api.Infrastructure.Persistence.Migrations
{
    public class SetDataNames : Migration
    {
        public SetDataNames(IMongoDatabase database) : base(database)
        {
        }

        public override int Version => 2;
        public override string Description => "SetData - values changed to support naming them";

        protected override async Task RunMigration()
        {
            var oldCollection = Database.GetCollection<OldSetData>("SetData");
            var oldSetDatas = await oldCollection.Find(x => true).ToListAsync();
            if (!oldSetDatas.Any())
                return;
            var newSetDatas = oldSetDatas.Select(s => new NewSetData
            {
                ModelId = s.ModelId,
                SetId = s.SetId,
                Items = s.Values.Select(v => new NewSetDataItem
                {
                    Value = v,
                    Name = v,
                })
            });
            var newCollection = Database.GetCollection<NewSetData>("NewSetData");
            await newCollection.InsertManyAsync(newSetDatas);
            await Database.RenameCollectionAsync("NewSetData", "SetData", new RenameCollectionOptions {DropTarget = true});
        }

        private class OldSetData
        {
            public Guid SetId { get; set; }
            public Guid ModelId { get; set; }
            public IEnumerable<string> Values { get; set; }
        }

        private class NewSetData
        {
            public Guid SetId { get; set; }
            public Guid ModelId { get; set; }
            public IEnumerable<NewSetDataItem> Items { get; set; }
        }

        public class NewSetDataItem
        {
            public string Value { get; set; }
            public string Name { get; set; }
        }
    }
}
