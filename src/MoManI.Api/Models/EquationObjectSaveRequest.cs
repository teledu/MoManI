using System;
using System.Collections.Generic;
using System.Linq;

namespace MoManI.Api.Models
{
    public class EquationObjectSaveRequest
    {
        public string Type { get; set; }
        public string Value { get; set; }
        public EquationObjectSaveRequest InnerEquation1 { get; set; }
        public EquationObjectSaveRequest InnerEquation2 { get; set; }
        public EquationObjectSaveRequest InnerEquation3 { get; set; }
        public IEnumerable<SetChangesSaveRequest> SetChanges { get; set; }
        public IEnumerable<EnumeratingSetSaveRequest> EnumeratingSets { get; set; }
    }

    public class SetChangesSaveRequest
    {
        public Guid SetId { get; set; }
        public IEnumerable<SetChangeItemSaveRequest> Changes { get; set; }
    }

    public class EnumeratingSetSaveRequest
    {
        public Guid SetId { get; set; }
        public string Abbreviation { get; set; }
    }

    public class SetChangeItemSaveRequest
    {
        public string ChangeType { get; set; }
        public string ChangeValue { get; set; }
    }

    public static class EquationObjectSaveRequestExtensions
    {
        public static EquationObject ToEquationObject(this EquationObjectSaveRequest request)
        {
            if (request == null)
                return null;
            return new EquationObject
            {
                Type = (EquationObjectType)Enum.Parse(typeof(EquationObjectType), request.Type),
                Value = request.Value,
                InnerEquation1 = ToEquationObject(request.InnerEquation1),
                InnerEquation2 = ToEquationObject(request.InnerEquation2),
                InnerEquation3 = ToEquationObject(request.InnerEquation3),
                SetChanges = request.SetChanges?.Select(ToSetChangesObject),
                EnumeratingSets = request.EnumeratingSets?.Select(ToEnumeratingSetObject),
            };
        }

        public static SetChanges ToSetChangesObject(this SetChangesSaveRequest request)
        {
            return new SetChanges
            {
                SetId = request.SetId,
                Changes = request.Changes?.Select(ToSetChangeItemObject),
            };
        }

        public static SetChangeItem ToSetChangeItemObject(this SetChangeItemSaveRequest request)
        {
            return new SetChangeItem
            {
                ChangeType = (SetChangeType)Enum.Parse(typeof(SetChangeType), request.ChangeType),
                ChangeValue = request.ChangeValue,
            };
        }

        public static EnumeratingSet ToEnumeratingSetObject(this EnumeratingSetSaveRequest request)
        {
            return new EnumeratingSet
            {
                SetId = request.SetId,
                Abbreviation = request.Abbreviation,
            };
        }
    }
}
