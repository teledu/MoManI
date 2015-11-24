interface IParameter {
    id: string;
    name: string;
    description: string;
    sets: string[];
}

interface IParameterResource extends IParameter, ng.resource.IResource<IParameterResource> {
}