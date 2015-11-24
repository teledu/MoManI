interface IModel {
    id: string;
    name: string;
    description: string;
    sets: string[];
    parameters: string[];
    variables: string[];
    objectiveFunction: string;
    constraints: string[];
}

interface IModelResource extends IModel, ng.resource.IResource<IModelResource> {
}

interface ISelectableEntry<T>  {
    selected: boolean;
    data: T;
}