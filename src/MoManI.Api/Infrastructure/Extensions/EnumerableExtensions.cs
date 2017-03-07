using System;
using System.Collections.Generic;
using System.Linq;

namespace MoManI.Api.Infrastructure.Extensions
{
    public static class EnumerableExtensions
    {
        public static int IndexOf<T>(this IEnumerable<T> obj, Func<T, bool> predicate)
        {
            var found = obj
                .Select((a, i) => new {a, i})
                .FirstOrDefault(x => predicate(x.a));
            return found?.i ?? -1;
        }
    }
}