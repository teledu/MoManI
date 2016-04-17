interface ISetData {
    setId: string;
    modelId: string;
    items: ISetDataItem[];
}

interface ISetDataItem {
    value: string;
    name: string;
}

interface ISetDataResource extends ISetData, ng.resource.IResource<ISetDataResource> {
}