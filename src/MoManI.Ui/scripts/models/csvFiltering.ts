import _ = require('lodash');

export class Filter {
    setId: string;
    query: string;
    
    constructor(id?: string, query?: string) {
        this.setId = id;
        this.query = query;
    }
}

export class CsvFiltering {
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