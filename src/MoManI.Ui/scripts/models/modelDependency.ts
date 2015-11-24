import _ = require('lodash');

export class ModelDependency implements IDependencies {
    sets: string[];
    parameters: string[];
    variables: string[];

    constructor(sets: string[], parameters: string[], variables: string[]) {
        this.sets = sets;
        this.parameters = parameters;
        this.variables = variables;
    }

    join: (other: IDependencies) => IDependencies = (other: IDependencies) => {
        var sets = _.uniq(this.sets.concat(other.sets));
        var parameters = _.uniq(this.parameters.concat(other.parameters));
        var variables = _.uniq(this.variables.concat(other.variables));
        return new ModelDependency(sets, parameters, variables);
    }
}