interface IConstraintGroup {
    id: string;
    name: string;
    description: string;
}

interface IConstraintGroupResource extends IConstraintGroup, ng.resource.IResource<IConstraintGroupResource> {
}