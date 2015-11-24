import _ = require('lodash');
import setDataModel = require('models/setData')

interface IParameterDataSetCoordinate {
    id: string;
    index: number;
    value: string;
}

export class ParameterData {
    name: string;
    setCount: number;
    defaultValue: number;
    setDatas: setDataModel.SetData[];
    data: any;

    constructor(parameter: IParameter, setDatas: setDataModel.SetData[], parameterData: IParameterData) {
        this.name = parameter.name;
        this.setCount = setDatas.length;
        this.defaultValue = parameterData.defaultValue || 0;
        this.setDatas = setDatas;
        this.data = this.generateMatrix(0, [], parameterData.data);

    }

    private generateMatrix: (index: number, fixedCoordinates: string[], data: IParameterDataItem[]) => any = (index: number, fixedCoordinates: string[], data: IParameterDataItem[]) => {
        var actualSetData = this.setDatas[index];
        return _.map(actualSetData.getValues(), s => {
            //var sameSetCoordinateCount = _.filter(fixedCoordinates, f => f.id == actualSetData.setId).length;
            var coordinates = fixedCoordinates.concat([s]);
            if (index + 1 == this.setCount) {
                var val = findDataItem(coordinates, data);
                if (val != null) {
                    var valueIndex = _.indexOf(data, val);
                    data.splice(valueIndex, 1);
                    return val.v;
                }
                return this.defaultValue;
            } else {
                return this.generateMatrix(index + 1, coordinates, data);
            }
        });
    }

    asDataString: () => string[] = () => {
        var res = [];
        if (this.setCount == 1) {
            _.forEach(this.setDatas[0].getValues(), (val, index) => {
                if (this.data[index] != this.defaultValue) {
                    res.push(`${val} ${this.data[index]}`);
                }
            });
        } else {
            res = res.concat(this.getMultidimensionlStrings([], this.data));
        }
        res.unshift(`param ${this.name} default ${this.defaultValue} :${(this.setCount != 2 || res.length == 0 ? '=' : '') }`);
        res.push(`;`);
        return res;
    }

    getMultidimensionlStrings = (fixedValues: string[], data: any[]) => {
        if (this.setCount - fixedValues.length > 2) {
            var res = [];
            _.forEach(data, (dataValue, index) => {
                var value = this.setDatas[fixedValues.length].getValues()[index];
                var fixed = fixedValues.concat([value]);
                res = res.concat(this.getMultidimensionlStrings(fixed, dataValue));
            });
            return res;
        } else {
            return this.get2DStrings(fixedValues, data);
        }
    }

    get2DStrings = (fixedValues: string[], data: any[]) => {
        var res = [];
        _.forEach(this.setDatas[this.setCount - 2].getValues(), (val, valIndex) => {
            if (_.some(data[valIndex], d => d != this.defaultValue)) {
                res.push(`${val} ${data[valIndex].join(' ') }`);
            }
        });
        if (res.length > 0) {
            res.unshift(`${this.setDatas[this.setCount - 1].getValues().join(' ') }:=`);
            if (fixedValues.length > 0) {
                res.unshift(`[${fixedValues.join(',') },*,*]:`);
            }
        }
        return res;
    }
}

function findDataItem(coords: string[], data: IParameterDataItem[]) {
    return _.find(data, d => hasSameCoordinates(coords, d.c));
}

function hasSameCoordinates(coords1: string[], coords2: string[]) {
    return _.every(coords1, (c, index) => c == coords2[index]);
}