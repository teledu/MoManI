import uuid = require('node-uuid');

interface ISetDataValue {
    id: string;
    value: string | number;
    name: string;
    color: string;
    groupId: string;
    editable: boolean;
}

export class SetData {
    setId: string;
    modelId: string;
    private values: ISetDataValue[];
    setName: string;
    description: string;
    numeric: boolean;
    groups: ISetDataGroup[];

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
                 color: i.color,
                 groupId: i.groupId,
                 editable: false,
             }
        }) : [];
        this.groups = setData && setData.groups ? setData.groups : [];
    }

    serialize: () => ISetData = () => {
        return {
            setId: this.setId,
            modelId: this.modelId,
            items: _.map(this.values, val => {
                return {
                    name: val.name,
                    value: val.value.toString(),
                    color: val.color,
                    groupId: val.groupId,
                }
            }),
            groups: this.groups,
        };
    }

    valuesUnique: () => boolean = () => {
        return this.values.length == _.uniqBy(this.values, 'value').length;
    }

    addValue = () => {
        var value: ISetDataValue = {
            id: uuid.v4(),
            value: null,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            groupId: null,
            name: null,
            editable: true,
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

    getValueCount = () => {
        return this.values.length;
    }

    getValueNamePairs = () => {
        return _.map(this.values, val => {
            return {
                value: val.value.toString(),
                name: val.name,
            }
        });
    }

    addGroup = () => {
        this.groups.push({
            id: uuid.v4(),
            name: '',
        });
    }

    removeGroup = (group: ISetDataGroup) => {
        _.forEach(this.values, val => {
            if (val.groupId == group.id) {
                val.groupId = null;
            };
        });
        _.remove(this.groups, group);
    }

    getGlpkReadyValues = () => {
        return _.map(this.values, val => {
            var stringValue = val.value.toString();
            return SetData.glpkReady(stringValue);
        });
    }

    public static  glpkReady: (value: string) => string = (value) => {
        var regExp = new RegExp("^[a-zA-Z0-9_.]*$");
        if (value.match(regExp)) {
            return value;
        }
        return (`"${value}"`);
    }
}