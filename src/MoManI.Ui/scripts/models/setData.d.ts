interface ISetData {
    setId: string;
    scenarioId: string;
    modelId: string;
    values: string[];
}

interface ISetDataResource extends ISetData, ng.resource.IResource<ISetDataResource> {
}