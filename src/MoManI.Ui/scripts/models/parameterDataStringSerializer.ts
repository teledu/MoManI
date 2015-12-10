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
    setDatas: string[][];
    data: any[];

    constructor(parameter: IParameter, setDatas: setDataModel.SetData[], parameterData: IParameterData) {
        this.name = parameter.name;
        this.setCount = setDatas.length;
        this.defaultValue = parameterData.defaultValue || 0;

        if (this.setCount == 0) {
            this.defaultValue = parameterData.data.length > 0 ? _.first(parameterData.data).v : this.defaultValue;
            return;
        }

        var orderedSetDatas = _.map(parameterData.sets, s => {
            return _.find(setDatas, 'setId', s.id);
        });
        if (_.some(orderedSetDatas, s => s == null)) {    // needed as a fallback due to a fixed mistake that caused incorrect set ids in parameter data
            orderedSetDatas = setDatas;
        }
        this.setDatas = _.map(orderedSetDatas, s => s.getValues());

        this.data = this.createArray(this.setDatas);
        this.loadData(parameterData.data);
    }

    private createArray(setDatas: string[][]): any[] {
        var otherElements = setDatas.slice(1, setDatas.length);
        return _.map(_.first(setDatas), () => {
            return otherElements.length > 0 ? this.createArray(otherElements) : this.defaultValue;
        });
    }

    private loadData(parameterData: IParameterDataItem[]) {
        if (this.setDatas.length == 0) {
            this.defaultValue = parameterData && parameterData.length > 0 ? _.first(parameterData).v : this.defaultValue;
            return;
        }
        _.forEach(parameterData, item => {
            var coordinateIdexes = this.mapToCoordinateIndexes(item.c);
            if (_.some(coordinateIdexes, i => i < 0)) {
                return;
            }
            this.placeItem(this.data, coordinateIdexes, item.v);
        });
    }

    private placeItem(grid: any[], coordinates: number[], value: number) {
        var currentCoord = _.first(coordinates);
        if (coordinates.length == 1) {
            grid[currentCoord] = value;
            return;
        }
        this.placeItem(grid[currentCoord], coordinates.slice(1, coordinates.length), value);
    }

    mapToCoordinateIndexes(coordinates: string[]): number[] {
        return _.map(coordinates, (coord, index) => {
            return _.indexOf(this.setDatas[index], coord);
        });
    }

    asDataString: () => string[] = () => {
        var res = [];
        if (this.setCount == 0) {
            res.unshift(`param ${this.name} default ${this.defaultValue}`);
            res.push(`;`);
            return res;
        }
        if (this.setCount == 1) {
            _.forEach(this.setDatas[0], (val, index) => {
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
                var value = this.setDatas[fixedValues.length][index];
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
        _.forEach(this.setDatas[this.setCount - 2], (val, valIndex) => {
            if (_.some(data[valIndex], d => d != this.defaultValue)) {
                res.push(`${val} ${data[valIndex].join(' ') }`);
            }
        });
        if (res.length > 0) {
            res.unshift(`${this.setDatas[this.setCount - 1].join(' ') }:=`);
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