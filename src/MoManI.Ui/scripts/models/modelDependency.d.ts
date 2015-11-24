interface IDependencies {
    sets: string[];
    parameters: string[];
    variables: string[];

    join: (other: IDependencies) => IDependencies;
}