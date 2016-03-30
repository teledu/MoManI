interface IConstraint {
    id: string;
    constraintGroupId: string;
    name: string;
    description: string;
    equation: IEquation;
    setConstraint: IEquation;
}

interface IConstraintResource extends IConstraint, ng.resource.IResource<IConstraintResource> {
}