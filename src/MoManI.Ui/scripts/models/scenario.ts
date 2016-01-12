import uuid = require('node-uuid');

export class Scenario {
    id: string;
    modelId: string;
    name: string;
    description: string;
    revision: number;

    constructor(scenario: IScenario) {
        this.id = scenario.id;
        this.modelId = scenario.modelId;
        this.name = scenario.name;
        this.description = scenario.description;
        this.revision = scenario.revision;
    }

    serialize: () => IScenario = () => {
        return {
            id: this.id,
            modelId: this.modelId,
            name: this.name,
            description: this.description,
            revision: this.revision,
            hasResults: null,
        }
    }
}