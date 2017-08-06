import _ = require('lodash');

export class Filter {
    setId: string;
    query: string;
    
    constructor(id?: string, query?: string) {
        this.setId = id;
        this.query = query;
    }
}

export class CsvRegexFiltering {     //legacy
    readonly sets: ISet[];
    filters: Filter[];

    private readonly components: IDimensionalComponent[];
    private readonly filterCallback: (filteredComponents: IDimensionalComponent[], setFilters: ISetValueFilter[]) => void;

    constructor(sets: ISet[], components: IDimensionalComponent[], componentType: string, filterCallback: (filteredComponents: IDimensionalComponent[], setFilters: ISetValueFilter[]) => void, initialFilter?: IFilterDescription) {
        this.sets = sets;
        this.components = components;
        this.sets.unshift({
            id: 'Component',
            name: componentType,
            abbreviation: null,
            description: null,
            numeric: null,
        });
        this.filters = [];
        this.filterCallback = filterCallback;
        if (initialFilter) {
            if (initialFilter.filterType.toLowerCase() === componentType.toLowerCase()) {
                const filteredComponent = _.find(this.components, c => c.id === initialFilter.filteredItemId);
                if (filteredComponent) {
                    this.filters.push(new Filter('Component', `^${filteredComponent.name}$`));
                }
            }
            if (initialFilter.filterType.toLowerCase() === 'set' && _.some(this.sets, s => s.id === initialFilter.filteredItemId)) {
                this.filters.push(new Filter(initialFilter.filteredItemId, initialFilter.filterValue));
            }
            if (this.filters.length) {
                this.apply();
            }
        }
    }

    addFilter = () => {
        this.filters.push(new Filter());
    }

    removeFilter = (filter: Filter) => {
        _.remove(this.filters, filter);
    }

    apply = () => {
        var filteredComponents = this.components;
        const componentFilters = _.filter(this.filters, f => f.setId === 'Component');
        if (componentFilters.length) {
            var componentRegexQueries = _.map(componentFilters, cf => new RegExp(cf.query, 'i'));
            filteredComponents = _.filter(this.components, c => _.some(componentRegexQueries, crq => c.name.search(crq) !== -1));
        }
        const setFilters = _.filter(this.filters, f => f.setId !== 'Component');
        const setFilterQueries: ISetValueFilter[] = _.map(setFilters, f => {
            return {
                id: f.setId,
                query: new RegExp(f.query, 'i'),
            }
        });
        this.filterCallback(filteredComponents, setFilterQueries);
    }

    clear = () => {
        this.filters = [];
        this.filterCallback(this.components, []);
    }
}

interface IIdName {
    id: string;
    name: string;
}

class DropdownFilter {
    setDatas: ISetData[];
    components: IDimensionalComponent[];
    selectedComponentId: string;
    queryItems: IIdName[];
    selectedQuery: string;

    constructor(setDatas: ISetData[], components: IDimensionalComponent[], initialComponentId?: string, initialQuery?: string) {
        this.setDatas = setDatas;
        this.components = components;
        this.selectedComponentId = initialComponentId;
        this.queryItems = [];
        this.selectedQuery = null;
        if (initialComponentId) {
            this.selectComponent(initialComponentId);
            if (initialQuery) {
                this.selectedQuery = initialQuery;
            }
        }
    }

    selectComponent = (componentId: string) => {
        this.selectedQuery = null;
        if (componentId === 'Component') {
            this.queryItems = _.map(this.components, c => {
                return {
                    id: c.id,
                    name: c.name,
                };
            });
        } else {
            const actualSetData = _.find(this.setDatas, sd => sd.setId === componentId);
            if (!actualSetData)
                return;
            this.queryItems = _.map(actualSetData.items, sdi => {
                var onlyDisplayValue = sdi.value === sdi.name || !sdi.name;
                return {
                    id: sdi.value,
                    name: onlyDisplayValue ? sdi.value : `${sdi.value} (${sdi.name})`,
                };
            });
        }
    }
}

export class CsvDropdownFiltering {
    readonly sets: ISet[];
    readonly setDatas: ISetData[];
    private filters: DropdownFilter[];

    private readonly components: IDimensionalComponent[];
    private readonly filterCallback: (filteredComponents: IDimensionalComponent[], setFilters: ISetValueFilter[]) => void;

    constructor(sets: ISet[], setDatas: ISetData[], components: IDimensionalComponent[], componentType: string, filterCallback: (filteredComponents: IDimensionalComponent[], setFilters: ISetValueFilter[]) => void, initialFilter?: IFilterDescription) {
        this.sets = sets;
        this.setDatas = setDatas;
        this.components = _.sortBy(components, c => c.name);
        this.sets.unshift({
            id: 'Component',
            name: componentType,
            abbreviation: null,
            description: null,
            numeric: null,
        });
        this.filters = [];
        this.filterCallback = filterCallback;
        if (initialFilter) {
            if (initialFilter.filterType.toLowerCase() === componentType.toLowerCase()) {
                const filteredComponent = _.find(this.components, c => c.id === initialFilter.filteredItemId);
                if (filteredComponent) {
                    this.filters.push(new DropdownFilter(this.setDatas, this.components, 'Component', initialFilter.filteredItemId));
                }
            }
            if (initialFilter.filterType.toLowerCase() === 'set' && _.some(this.sets, s => s.id === initialFilter.filteredItemId)) {
                this.filters.push(new DropdownFilter(this.setDatas, this.components, initialFilter.filteredItemId, initialFilter.filterValue));
            }
            if (this.filters.length) {
                this.apply();
            }
        }
    }

    addFilter = () => {
        this.filters.push(new DropdownFilter(this.setDatas, this.components));
    }

    removeFilter = (filter: DropdownFilter) => {
        _.remove(this.filters, filter);
        this.apply();
    }

    apply = () => {
        var filteredComponents = this.components;
        const componentFilters = _.filter(this.filters, f => f.selectedComponentId === 'Component');
        if (componentFilters.length) {
            filteredComponents = _.filter(this.components, c => _.some(componentFilters, cf => cf.selectedQuery === c.id));
        }
        const setFilters = _.filter(this.filters, f => f.selectedComponentId !== 'Component');
        const setFilterQueries: ISetValueFilter[] = _.map(setFilters, f => {
            return {
                id: f.selectedComponentId,
                query: new RegExp(`^${f.selectedQuery}$`, 'i'),
            }
        });
        this.filterCallback(filteredComponents, setFilterQueries);
    }

    clear = () => {
        this.filters = [];
        this.filterCallback(this.components, []);
    }
}