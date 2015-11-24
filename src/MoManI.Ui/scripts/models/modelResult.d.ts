interface IModelResult {
    modelId: string,
    name: string,
    description: string,
    variableResults: IVariableResult[],
}

interface IModelResultResource extends IModelResult, ng.resource.IResource<IModelResultResource> {
}