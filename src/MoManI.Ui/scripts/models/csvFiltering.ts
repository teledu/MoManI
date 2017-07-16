import _ = require('lodash');

export class Filter {
    setId: string;
    query: string;

    constructor() {
        this.setId = null;
        this.query = '';
    }
}

export class CsvFiltering {
    public sets: ISet[];
    public filters: Filter[];

    private components: IDimensionalComponent[];
    private filterCallback: (filteredComponents: IDimensionalComponent[], setFilters: ISetValueFilter[]) => void;

    constructor(sets: ISet[], components: IDimensionalComponent[], componentType: string, filterCallback: (filteredComponents: IDimensionalComponent[], setFilters: ISetValueFilter[]) => void) {
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
    }

    public addFilter = () => {
        this.filters.push(new Filter());
    }

    public apply = () => {
        var filteredComponents = this.components;
        var componentFilters = _.filter(this.filters, f => f.setId == 'Component');
        if (componentFilters.length) {
            var componentRegexQueries = _.map(componentFilters, cf => new RegExp(cf.query, 'i'));
            filteredComponents = _.filter(this.components, c => _.some(componentRegexQueries, crq => c.name.search(crq) != -1));
        }
        var setFilters = _.filter(this.filters, f => f.setId != 'Component');
        var setFilterQueries: ISetValueFilter[] = _.map(setFilters, f => {
            return {
                id: f.setId,
                query: new RegExp(f.query, 'i'),
            }
        });
        this.filterCallback(filteredComponents, setFilterQueries);
    }

    public clear = () => {
        this.filters = [];
        this.filterCallback(this.components, []);
    }
}