import uuid = require('node-uuid');

interface IValue {
    id: string;
    value: string|number;
}

export class SetData {
    setId: string;
    modelId: string;
    private values: IValue[];
    setName: string;
    description: string;
    numeric: boolean;

    constructor(modelId: string, set: ISet, setData?: ISetData) {
        this.setId = set.id;
        this.modelId = modelId;
        this.setName = set.name;
        this.description = set.description;
        this.numeric = set.numeric;
        this.values = setData && setData.values ? _.map(setData.values, val => {
             return {
                 id: uuid.v4(),
                 value: this.numeric ? +val : val,
             }
        }) : [];
    }

    serialize: () => ISetData = () => {
        return {
            setId: this.setId,
            modelId: this.modelId,
            values: _.map(this.values, val => val.value.toString()),
        };
    }

    valuesUnique: () => boolean = () => {
        return this.values.length == _.uniq(this.values, 'value').length;
    }

    addValue = () => {
        var value: IValue = {
            id: uuid.v4(),
            value: null,
        }
        if (this.numeric) {
            value.value = this.values.length > 0 ? (+_.last(this.values).value + 1) : 0;
        } else {
            value.value = '';
        }
        this.values.push(value);
    }

    removeValue = (value: IValue) => {
        _.remove(this.values, value);
    }

    getValues = () => {
        return _.map(this.values, val => val.value.toString());
    }
}