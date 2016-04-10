interface IScenario {
    id: string;
    modelId: string;
    parentScenarioId: string;
    name: string;
    description: string;
    revision: number;
    hasResults: boolean;
}

interface IScenarioResource extends IScenario, ng.resource.IResource<IScenarioResource> {
}