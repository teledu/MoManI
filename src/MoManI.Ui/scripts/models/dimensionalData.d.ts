interface IDimensionalData {
    sets: IDimensionalDataSet[];
    data: IDimensionalDataItem[];
}

interface IDimensionalDataSet {
    id: string;
    index: number;
}

interface IDimensionalDataItem {
    c: string[];
    v: number;
}
