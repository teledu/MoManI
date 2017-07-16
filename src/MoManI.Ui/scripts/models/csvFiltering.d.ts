interface ISetValueFilter {
    id: string;
    query: RegExp;
}

interface IFilterDescription {
    filterType: string;
    filteredItemId: string;
    filterValue: string;
}