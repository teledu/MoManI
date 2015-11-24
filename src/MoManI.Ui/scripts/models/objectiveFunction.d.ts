interface IObjectiveFunction {
    id: string;
    name: string;
    description: string;
    function: string;
    equation: IEquation;
}

interface IEquation {
    type: string;
    value: string;
    innerEquation1: IEquation;
    innerEquation2: IEquation;
    innerEquation3: IEquation;
    setChanges: ISetChanges[];
    enumeratingSets: IEnumeratingSet[];
}

interface IDisplayableEquation extends IEquation {
    display: string;
}

interface IEnumeratingSet {
    setId: string;
    abbreviation: string;
}

interface ISetChanges {
    setId: string;
    changes: ISetChangeItem[];
}

interface ISetChangeItem {
    changeType: string;
    changeValue: string;
}

interface IObjectiveFunctionResource extends IObjectiveFunction, ng.resource.IResource<IObjectiveFunctionResource> {
}