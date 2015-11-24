import _ = require('lodash');

export class ModelResult {
    id: string;
    name: string;
    description: string;
    variables: IVariable[];

    constructor(modelResult: IModelResult, variables: IVariable[]) {
        this.id = modelResult.modelId;
        this.name = modelResult.name;
        this.description = modelResult.description;
        this.variables = _.map(modelResult.variableResults, v => {
            return _.find(variables, 'id', v.variableId);
        });
    }
}