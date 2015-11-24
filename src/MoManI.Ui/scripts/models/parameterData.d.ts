interface IParameterData {
    parameterId: string;
    modelId: string;
    defaultValue: number;
    sets: IParameterDataSet[];
    data: IParameterDataItem[];
}

interface IParameterDataSet {
    id: string;
    index: number;
}

interface IParameterDataItem {
    c: string[];
    v: number;
}

interface IParameterDataResource extends IParameterData, ng.resource.IResource<IParameterDataResource> {
}