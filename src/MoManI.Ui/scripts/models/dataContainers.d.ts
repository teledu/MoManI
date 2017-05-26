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


interface IDimensionalData {
    sets: IDimensionalDataSet[];
    data: IDimensionalDataItem[];
}

interface IDimensionalDataSet {
    id: string;
    index: number;
}

interface IDimensionalDataItem {
    c: string[];
    v: number;
}


interface IParameterData extends IDimensionalData {
    parameterId: string;
    scenarioId: string;
    modelId: string;
    defaultValue: number;
}

interface IParameterDataResource extends IParameterData, ng.resource.IResource<IParameterDataResource> {
}


interface IVariableResult extends IDimensionalData {
    variableId: string,
    scenarioId: string,
    modelId: string,
}

interface IVariableResultResource extends IVariableResult, ng.resource.IResource<IVariableResultResource> {
}


interface IChartGroup {
    key: string | number;
    values: IChartValue[];
}

interface IChartValue {
    x: number | string;
    y: number;
}
