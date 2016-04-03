interface ISetData {
    setId: string;
    modelId: string;
    values: string[];
}

interface ISetDataResource extends ISetData, ng.resource.IResource<ISetDataResource> {
}