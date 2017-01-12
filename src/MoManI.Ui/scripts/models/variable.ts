import uuid = require('node-uuid');

export class VariableConstraint implements IVariableConstraint {
    operator: string;
    value: number;

    constructor(constraint?: IVariableConstraint) {
        if (constraint) {
            this.operator = constraint.operator;
            this.value = constraint.value;
        } else {
            this.operator = 'Gte';
            this.value = 0;
        }
    }
}

export class VariableSet {
    id: string;
    value: string;

    constructor(value: string) {
        this.id = uuid.v4();
        this.value = value;
    }
}

export class Variable implements IRenderable {
    id: string;
    name: string;
    description: string;
    sets: VariableSet[];
    constraint: IVariableConstraint;
    integer: boolean;
    unit: string;
    setOptions: ISet[];

    constructor(setOptions: ISet[], variable?: IVariable) {
        this.setOptions = setOptions;
        if (variable) {
            this.id = variable.id;
            this.name = variable.name;
            this.description = variable.description;
            this.sets = _.map(variable.sets, setId => {
                return new VariableSet(setId);
            });
            this.constraint = variable.constraint ? new VariableConstraint(variable.constraint) : null;
            this.integer = variable.integer;
            this.unit = variable.unit;
        } else {
            this.id = uuid.v4();
            this.name = '';
            this.description = '';
            this.sets = [];
            this.constraint = null;
            this.integer = false;
            this.unit = null;
        }
    }

    addSet = () => {
        var firstSet = _.first(this.setOptions);
        if (!firstSet)
            return;
        this.sets.push(new VariableSet(firstSet.id));
    }

    removeSet = (set: VariableSet) => {
        _.remove(this.sets, set);
    }

    render = () => {
        return '';
    }

    serialize(): IVariable {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            sets: _.map(this.sets, set => set.value),
            constraint: this.constraint,
            integer: this.integer,
            unit: this.unit,
        }
    }

    private getInternalSets: () => ISetWithAbbreviation[] = () => {
        return _.map(this.sets, (variableSet, index) => {
            var set = _.find(this.setOptions, 'id', variableSet.value);
            var sameSetCount = _(this.sets).take(index).filter(s => s.value == set.id).value().length;
            return {
                set: set,
                index: sameSetCount,
                actualAbbreviation: Array(sameSetCount+2).join(set.abbreviation),
            };
        });
    }

    asModelString: () => string = () => {
        var setDefinitions = _.map(this.getInternalSets(), internalSet => `${internalSet.actualAbbreviation} in ${internalSet.set.name}`);
        var internalSetDefinitionsString = this.sets.length > 0 ? `{${setDefinitions.join(', ') }}` : ``;
        var res = `var ${this.name}${internalSetDefinitionsString}`;
        if (this.constraint) {
            var operator = _.find(variableOperators, 'id', this.constraint.operator);
            res += ` ${operator.name} ${this.constraint.value}`;
        }
        if (this.integer) {
            res += `, integer`;
        }
        return `${res};`;
    }

    asOutputString: () => string = () => {
        var internalSets = this.getInternalSets();
        var setDefinitions = _.map(internalSets, internalSet => `${internalSet.actualAbbreviation} in ${internalSet.set.name}`);
        var internalSetDefinitionsString = this.sets.length > 0 ? `${setDefinitions.join(', ') }` : `mock in {1}`;
        var internalSetAbbreviationsString = _.map(internalSets, internalSet => internalSet.actualAbbreviation).join(', ');
        var columnListString = this.sets.length > 0 ? `${internalSetAbbreviationsString}, ` : ``;
        var setParameterListString = this.sets.length > 0 ? `[${internalSetAbbreviationsString}]` : ``;
        return `table tout {${internalSetDefinitionsString}} OUT "CSV" "res/csv/${this.name}.csv" : ${columnListString}${this.name}${setParameterListString};`;
    }

    asMetaData: () => string = () => {
        var sets = _.map(this.sets, s => s.value).join(',');
        var setStringPart = this.sets.length > 0 ? `,${sets}` : ``;
        return `${this.name},${this.id}${setStringPart}`;
    }
}

export var variableOperators: IVariableOperator[] = [
    { id: 'Gte', name: '>=' },
    { id: 'Lte', name: '<=' },
    { id: 'Gt', name: '>' },
    { id: 'Lt', name: '<' },
    { id: 'Eq', name: '=' },
    { id: 'Ne', name: '<>' },
]