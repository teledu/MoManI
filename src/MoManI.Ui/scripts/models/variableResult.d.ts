interface IVariableResult {
    variableId: string,
    scenarioId: string,
    modelId: string,
    sets: IVariableResultSet[],
    data: IVariableResultItem[],
}

interface IVariableResultSet {
    id: string;
    index: number;
}

interface IVariableResultItem {
    c: string[];
    v: number;
}

interface IVariableResultResource extends IVariableResult, ng.resource.IResource<IVariableResultResource> {
}


interface IChartGroup {
    key: string|number;
    values: IChartValue[];
}

interface IChartValue {
    x: number | string;
    y: number;
}