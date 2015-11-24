interface IVariableConstraint {
    operator: string;
    value: number;
}

interface IVariable {
    id: string;
    name: string;
    description: string;
    sets: string[];
    constraint: IVariableConstraint;
    integer: boolean;
}

interface IVariableResource extends IVariable, ng.resource.IResource<IVariableResource> {
}

interface IVariableOperator {
    id: string;
    name: string;
}