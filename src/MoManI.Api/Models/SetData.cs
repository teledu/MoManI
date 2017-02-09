using System;
using System.Collections.Generic;
using System.Linq;

namespace MoManI.Api.Models
{
    public class SetData
    {
        public Guid SetId { get; set; }
        public Guid ModelId { get; set; }

        private IEnumerable<SetDataItem> _items; 
        public IEnumerable<SetDataItem> Items
        {
            get { return _items.OrderBy(i => i.Value); }
            set { _items = value; }
        }

        public IEnumerable<SetDataGroup> Groups { get; set; }

        public SetData CloneToModel(Guid modelId)
        {
            var groupIdMap = Groups.ToDictionary(g => g.Id, g => Guid.NewGuid());
            return new SetData
            {
                SetId = SetId,
                ModelId = modelId,
                Items = Items.Select(i => new SetDataItem { Value = i.Value, Name = i.Name, Color = i.Color, GroupId = i.GroupId.HasValue ? groupIdMap[i.GroupId.Value] : (Guid?)null }),
                Groups = Groups.Select(g => new SetDataGroup { Id = groupIdMap[g.Id], Name = g.Name })
            };
        }
    }

    public class SetDataItem
    {
        public string Value { get; set; }
        public string Name { get; set; }
        public string Color { get; set; }
        public Guid? GroupId { get; set; }
    }

    public class SetDataGroup
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }
}
