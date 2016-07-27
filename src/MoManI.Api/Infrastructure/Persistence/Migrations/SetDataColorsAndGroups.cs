using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Driver;

namespace MoManI.Api.Infrastructure.Persistence.Migrations
{
    public class SetDataColorsAndGroups : Migration
    {
        public SetDataColorsAndGroups(IMongoDatabase database) : base(database)
        {
        }

        public override int Version => 3;
        public override string Description => "SetData - colors and groups added";

        protected override async Task RunMigration()
        {
            await Task.Delay(5000);
            var collection = Database.GetCollection<SetData>("SetData");
            var setDatas = await collection.Find(x => true).ToListAsync();
            if (!setDatas.Any())
                return;
            foreach (var setData in setDatas)
            {
                var colorCreator = new ColorCreator();
                setData.Groups = new List<SetDataGroup>();
                var colors = colorCreator.ColorList().Take(setData.Items.Count()).ToArray();
                var enumerator = setData.Items.GetEnumerator();
                for (var i = 0; enumerator.MoveNext(); i++)
                {
                    enumerator.Current.Color = colors[i];
                }
                await collection.ReplaceOneAsync(x => x.ModelId == setData.ModelId && x.SetId == setData.SetId, setData);
            }
        }

        internal class SetData
        {
            public Guid SetId { get; set; }
            public Guid ModelId { get; set; }
            public IEnumerable<SetDataItem> Items { get; set; }
            public IEnumerable<SetDataGroup> Groups { get; set; }
        }

        internal class SetDataItem
        {
            public string Value { get; set; }
            public string Name { get; set; }
            public string Color { get; set; }
            public Guid? GroupId { get; set; }
        }

        internal class SetDataGroup
        {
            public Guid Id { get; set; }
            public string Name { get; set; }
        }

        internal class ColorCreator
        {
            private static readonly Random Rand = new Random();

            public IEnumerable<string> ColorList()
            {
                yield return "#000000";
                yield return "#cc9900";
                yield return "#00cc66";
                yield return "#ffffcc";
                yield return "#99ff66";
                yield return "#cc3333";
                yield return "#996666";
                yield return "#00ffff";
                yield return "#ccffff";
                yield return "#006633";
                yield return "#000099";
                yield return "#990000";
                yield return "#9966cc";
                yield return "#99cc66";
                yield return "#339900";
                yield return "#00ccff";
                yield return "#0033cc";
                yield return "#cc6699";
                yield return "#99cc00";
                yield return "#ff3366";
                yield return "#0099cc";
                yield return "#00cc00";
                yield return "#cc6633";
                yield return "#660033";
                yield return "#ff9966";
                yield return "#33cc33";
                yield return "#6699ff";
                yield return "#999900";
                yield return "#3399ff";
                yield return "#666600";
                yield return "#660000";
                yield return "#00ff33";
                yield return "#cc66cc";
                yield return "#ccff00";
                yield return "#ccccff";
                yield return "#993366";
                yield return "#0000cc";
                yield return "#000066";
                yield return "#cc66ff";
                yield return "#330066";
                yield return "#ffff33";
                yield return "#663366";
                yield return "#ff3399";
                yield return "#006600";
                yield return "#333399";
                yield return "#ff0066";
                yield return "#ff33cc";
                yield return "#993333";
                yield return "#6633cc";
                yield return "#33cccc";
                yield return "#ff9900";
                yield return "#999966";
                yield return "#009999";
                yield return "#cccc33";
                yield return "#00ff66";
                yield return "#cc9933";
                yield return "#ff9999";
                yield return "#3333cc";
                yield return "#660066";
                yield return "#66cc99";
                yield return "#ff00cc";
                yield return "#ff66ff";
                yield return "#ffff66";
                yield return "#669900";
                yield return "#3366cc";
                yield return "#000033";
                yield return "#99cc33";
                yield return "#993399";
                yield return "#3333ff";
                yield return "#cccc66";
                yield return "#66ffff";
                yield return "#339966";
                yield return "#cc00ff";
                yield return "#66cccc";
                yield return "#00cc33";
                yield return "#003333";
                yield return "#3399cc";
                yield return "#66ff99";
                yield return "#339999";
                yield return "#666699";
                yield return "#3300cc";
                yield return "#33cc66";
                yield return "#cc99ff";
                yield return "#6600cc";
                yield return "#ff3300";
                yield return "#33ffff";
                yield return "#00ff00";
                yield return "#6600ff";
                yield return "#0033ff";
                yield return "#999999";
                yield return "#cc99cc";
                yield return "#ffcccc";
                yield return "#0066cc";
                yield return "#ccff33";
                yield return "#330099";
                yield return "#ffcc66";
                yield return "#330000";
                yield return "#336666";
                yield return "#99ffff";
                yield return "#006699";
                while (true)
                {
                    var color = Color.FromArgb(Rand.Next(256), Rand.Next(256), Rand.Next(256));
                    yield return $"#{color.R:X2}{color.G:X2}{color.B:X2}";
                }
            } 
        }
    }
}
