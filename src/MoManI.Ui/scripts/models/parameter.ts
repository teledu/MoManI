import _ = require('lodash');
import uuid = require('node-uuid');

export class ParameterSet {
    id: string;
    value: string;

    constructor(value: string) {
        this.id = uuid.v4();
        this.value = value;
    }
}

export class Parameter implements IRenderable {
    id: string;
    name: string;
    description: string;
    sets: ParameterSet[];
    setOptions: ISet[];
    
    constructor(setOptions: ISet[], parameter?: IParameter) {
        this.setOptions = setOptions;
        if (parameter) {
            this.id = parameter.id;
            this.name = parameter.name;
            this.description = parameter.description;
            this.sets = _.map(parameter.sets, setId => {
                return new ParameterSet(setId);
            });
        } else {
            this.id = uuid.v4();
            this.name = '';
            this.description = '';
            this.sets = [];
        }
    }

    addSet = () => {
        var firstSet = _.first(this.setOptions);
        if (!firstSet)
            return;
        this.sets.push(new ParameterSet(firstSet.id));
    }

    removeSet = (set: ParameterSet) => {
        _.remove(this.sets, set);
    }

    render = () => {
        return '';
    }

    serialize(): IParameter {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            sets: _.map(this.sets, set => set.value),
        }
    }

    private getInternalSets: () => ISetWithAbbreviation[] = () => {
        return _.map(this.sets, (variableSet, index) => {
            var set = _.find(this.setOptions, 'id', variableSet.value);
            var sameSetCount = _(this.sets).take(index).filter(s => s.value == set.id).value().length;
            return {
                set: set,
                index: sameSetCount,
                actualAbbreviation: Array(sameSetCount + 2).join(set.abbreviation),
            };
        });
    }

    asModelString: () => string = () => {
        var setDefinitions = _.map(this.getInternalSets(), internalSet => `${internalSet.actualAbbreviation} in ${internalSet.set.name}`);
        var internalSetDefinitionsString = this.sets.length > 0 ? `{${setDefinitions.join(', ') }}` : ``;
        return `param ${this.name}${internalSetDefinitionsString};`;
    }
}