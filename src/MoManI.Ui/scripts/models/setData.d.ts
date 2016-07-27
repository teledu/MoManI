interface ISetData {
    setId: string;
    modelId: string;
    items: ISetDataItem[];
    groups: ISetDataGroup[];
}

interface ISetDataItem {
    value: string;
    name: string;
    color: string;
    groupId: string;
}

interface ISetDataGroup {
    id: string;
    name: string;
}

interface ISetDataResource extends ISetData, ng.resource.IResource<ISetDataResource> {
}