interface ISet {
    id: string;
    name: string;
    abbreviation: string;
    description: string;
    numeric: boolean;
}

interface ISetWithAbbreviation {
    set: ISet;
    index: number;
    actualAbbreviation: string;
}

interface ISetResource extends ISet, ng.resource.IResource<ISetResource> {
}


interface IDimensionalComponent {
    id: string;
    name: string;
    description: string;
    sets: string[];
}


interface IParameter extends IDimensionalComponent {
    defaultValue: number;
    unit: string;
}

interface IParameterResource extends IParameter, ng.resource.IResource<IParameterResource> {
}


interface IVariableConstraint {
    operator: string;
    value: number;
}

interface IVariable extends IDimensionalComponent {
    constraint: IVariableConstraint;
    integer: boolean;
    unit: string;
}

interface IVariableResource extends IVariable, ng.resource.IResource<IVariableResource> {
}

interface IVariableOperator {
    id: string;
    name: string;
}