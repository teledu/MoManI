interface IEquationObjectSet {
    setId: string;
    name: string;
    initialAbbreviation: string;
    actualAbbreviation: string;
    increment: number;
    getChanges: () => ISetChanges;
    applyChanges: (changeCollection: ISetChanges) => void;
    render: () => string;
}