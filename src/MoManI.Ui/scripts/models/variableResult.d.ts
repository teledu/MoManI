interface IVariableResult extends IDimensionalData {
    variableId: string,
    scenarioId: string,
    modelId: string,
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
