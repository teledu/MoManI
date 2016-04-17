import uuid = require('node-uuid');

interface ISetDataValue {
    id: string;
    value: string | number;
    name: string;
}

export class SetData {
    setId: string;
    modelId: string;
    private values: ISetDataValue[];
    setName: string;
    description: string;
    numeric: boolean;

    constructor(modelId: string, set: ISet, setData?: ISetData) {
        this.setId = set.id;
        this.modelId = modelId;
        this.setName = set.name;
        this.description = set.description;
        this.numeric = set.numeric;
        this.values = setData && setData.items ? _.map(setData.items, i => {
             return {
                 id: uuid.v4(),
                 value: this.numeric ? +i.value : i.value,
                 name: i.name,
             }
        }) : [];
    }

    serialize: () => ISetData = () => {
        return {
            setId: this.setId,
            modelId: this.modelId,
            //values: _.map(this.values, val => val.value.toString()),
            items: _.map(this.values, val => {
                return {
                    name: val.name,
                    value: val.value.toString(),
                }
            }), 
        };
    }

    valuesUnique: () => boolean = () => {
        return this.values.length == _.uniq(this.values, 'value').length;
    }

    addValue = () => {
        var value: ISetDataValue = {
            id: uuid.v4(),
            value: null,
            name: null,
        }
        if (this.numeric) {
            value.value = this.values.length > 0 ? (+_.last(this.values).value + 1) : 0;
        } else {
            value.value = '';
        }
        this.values.push(value);
    }

    removeValue = (value: ISetDataValue) => {
        _.remove(this.values, value);
    }

    getValues = () => {
        return _.map(this.values, val => val.value.toString());
    }
}