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