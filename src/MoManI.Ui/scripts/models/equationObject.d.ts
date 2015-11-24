interface IEquationObjectData {
    sets: ISet[],
    parameters: IParameter[],
    variables: IVariable[],
}

interface IEquationObject {
    operator1: string;
    operator2: string;
    operator3: string;
    innerEquation1: IEquationObject;
    innerEquation2: IEquationObject;
    innerEquation3: IEquationObject;
    canRender: boolean;
    actions: IEquationObjectAction[];

    render: () => string;
    getSets: () => IEquationObjectSet[];
    serialize: () => IEquation;
    asString: () => string;
    getDependencies: () => IDependencies;
}

interface IEquationObjectAction {
    text: string;
    handler: () => void;
}

interface IEnumeratingSetObject {
    set: ISet;
    abbreviation: string;
}

interface IEnumeratorModalResult {
    constraint: IEquation;
    enumerators: IEnumeratingSet[];
}