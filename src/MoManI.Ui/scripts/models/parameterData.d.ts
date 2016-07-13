interface IParameterData extends IDimensionalData {
    parameterId: string;
    scenarioId: string;
    modelId: string;
    defaultValue: number;
}

interface IParameterDataResource extends IParameterData, ng.resource.IResource<IParameterDataResource> {
}