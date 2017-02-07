import _ = require('lodash');
import setDataModel = require('models/setData')

interface IDimensionItem {
    value: string;
    displayName: string;
}

interface IDimension {
    setId: string;
    index: number;
    name: string;
    numeric: boolean;
    values: IDimensionItem[];
}

export class ParameterDataCsv {
    scenarioId: string;
    modelId: string;
    parameter: IParameter;
    defaultValue: number;
    
    private axisSet: IDimension;
    private cellSets: IDimension[];
    private axisSetValues: string[];

    spreadsheetVisible: boolean;
    spreadsheetSettings: any;
    spreadsheetItems: (number|string)[][];


    constructor(scenarioId: string, modelId: string, parameter: IParameter, setDatas: setDataModel.SetData[], parameterData?: IParameterData) {
        this.scenarioId = scenarioId;
        this.modelId = modelId;
        this.parameter = parameter;
        this.defaultValue = 0;

        var dimensions = _.map(setDatas, (setData, index) => {
            var instanceIndex = _(setDatas).slice(0, index).filter(d => d.setId == setData.setId).value().length;
            return {
                setId: setData.setId,
                index: instanceIndex,
                name: setData.setName,
                numeric: setData.numeric,
                values: _.map(setData.getValueNamePairs(), valueName => {
                    var onlyDisplayValue = valueName.value == valueName.name || !valueName.name;
                    return {
                        value: valueName.value,
                        displayName: onlyDisplayValue ? valueName.value : `${valueName.value} (${valueName.name})`,
                    }
                }),
            };
        });
        
        this.axisSet = _(dimensions).filter(s => s.numeric).last() || _.first(_.sortBy(dimensions, s => s.values.length));
        this.cellSets = _.filter(dimensions, s => s != this.axisSet);

        this.axisSetValues = _.map(this.axisSet.values, v => v.value);
        var rowCount = _.reduce(this.cellSets, (res, s) => s.values.length * res, 1);

        this.setupSpreadsheet(rowCount);

        _.forEach(this.cellSets, (setData, columnIndex) => {
            var remainingSets = this.cellSets.slice(columnIndex + 1);
            var lumpSize = _.reduce(remainingSets, (res, s) => s.values.length * res, 1);
            var repetitionSize = lumpSize * setData.values.length;
            var repetitions = rowCount / repetitionSize;

            for (var rep = 0; rep < repetitions; rep++) {
                _.forEach(setData.values, (val, valueIndex) => {
                    for (var i = 0; i < lumpSize; i++) {
                        var rowIndex = rep * repetitionSize + valueIndex * lumpSize + i;
                        this.spreadsheetItems[rowIndex][columnIndex] = val.displayName;
                    };
                });
            };
        });

        if (parameterData) {
            this.loadData(parameterData);
        }

        this.spreadsheetVisible = true;
    }

    private setupSpreadsheet = (rowCount: number) => {
        var indexColumns = _.times(this.cellSets.length, () => {
            return {
                readOnly: true,
            }
        });
        var valueColumns = _.times(this.axisSet.values.length, () => {
            return {
                readOnly: false,
                type: 'numeric',
                format: '0.[000000000]',
            }
        });
        var columns = _.map(this.cellSets, s => s.name).concat(_.map(this.axisSet.values, v => v.displayName));

        this.spreadsheetSettings = {
            columnSorting: true,
            colHeaders: columns,
            columns: indexColumns.concat(valueColumns),
        };

        this.spreadsheetItems = _.times(rowCount, () => {
            return _.map(columns, () => null);
        });
    }

    private loadData = (parameterData: IParameterData) => {
        this.defaultValue = parameterData.defaultValue;

        var indexOfAxisSet = _.findIndex(parameterData.sets, s => s.id == this.axisSet.setId && s.index == this.axisSet.index);
        var setIndexMap = _(parameterData.sets).map((dataSet, index) => {
            var cellSetIndex = _.findIndex(this.cellSets, s => s.setId == dataSet.id && s.index == dataSet.index);
            if (cellSetIndex < 0)
                return null;
            return {
                fromIndex: index,
                toIndex: cellSetIndex,
            };
        }).filter(i => i != null).value();
        
        _.forEach(parameterData.data, value => {
            var actualRowIndex = _.findIndex(this.spreadsheetItems, row => {
                return _.all(setIndexMap, mapEntry => {
                    return row[mapEntry.toIndex] == value.c[mapEntry.fromIndex];
                });
            });
            var actualColumnIndex = this.cellSets.length + _.findIndex(this.axisSetValues, val => val == value.c[indexOfAxisSet]);
            this.spreadsheetItems[actualRowIndex][actualColumnIndex] = value.v;
        });
    }

    serialize: () => IParameterData = () => {
        var sets = _.map(this.cellSets, s => {
            return {
                id: s.setId,
                index: s.index,
            };
        });
        sets.push({
            id: this.axisSet.setId,
            index: this.axisSet.index,
        });

        var data = [];
        _.forEach(this.spreadsheetItems, row => {
            _.forEach(this.axisSetValues, (axisValue, axisIndex) => {
                var coordinates = _.map(this.cellSets, (s, index) => {
                    return row[index];
                });
                coordinates.push(axisValue);
                data.push({
                    c: coordinates,
                    v: row[axisIndex + this.cellSets.length]
                });
            });
        });

        return {
            parameterId: this.parameter.id,
            scenarioId: this.scenarioId,
            modelId: this.modelId,
            defaultValue: this.defaultValue,
            sets: sets,
            data: data,
        };
    }
}