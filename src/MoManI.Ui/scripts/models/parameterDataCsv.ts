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

interface IParameterCsvData {
    parameter: IParameter;
    columnDimensions: IDimension[];
    rows: number;
    data: IParameterData;
}

class Dimension implements IDimension {
    setId: string;
    index: number;
    name: string;
    numeric: boolean;
    values: IDimensionItem[];

    constructor(setId: string, index: number, name: string, numeric: boolean, values: IDimensionItem[]) {
        this.setId = setId;
        this.index = index;
        this.name = name;
        this.numeric = numeric;
        this.values = values;
    }

    sameDimensionAs(other: Dimension) {
        return this.setId == other.setId && this.index == other.index;
    }
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
                return _.every(setIndexMap, mapEntry => {
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

class CsvDimensionStore {
    private dimensions: IDimension[];
    private setDatas: setDataModel.SetData[];
    private fixedSetId: string;
    private axisSetId: string;

    constructor(modelId: string, sets: ISet[], setDatas: ISetData[], fixedSetId: string, axisSetId: string) {
        this.dimensions = [];
        this.setDatas = _.map(setDatas, setData => {
            var set = _.find(sets, s => s.id == setData.setId);
            return new setDataModel.SetData(modelId, set, setData);
        });
        this.fixedSetId = fixedSetId;
        this.axisSetId = axisSetId;
    }

    updateAndRetrieveDimensions: (parameter: IParameter) => IDimension[] = (parameter: IParameter) => {
        return _.map(parameter.sets, (setId, i) => {
            var previousSetIds = parameter.sets.slice(0, i);
            var index = _.filter(previousSetIds, psId => psId == setId).length;
            var dimension = _.find(this.dimensions, d => d.setId == setId && d.index == index);
            if (dimension) {
                return dimension;
            }
            var setData = _.find(this.setDatas, sd => sd.setId == setId);
            dimension = {
                setId: setId,
                index: index,
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
            this.dimensions.push(dimension);
            return dimension;
        });
    }

    getFixedDimension = () => {
        return _.find(this.dimensions, d => d.setId == this.fixedSetId && d.index == 0);
    }

    getUnfixedDimensions = () => {
        return _.filter(this.dimensions, d => d != this.getFixedDimension());
    }

    getAxisDimension = () => {
        return _.minBy(_.filter(this.getUnfixedDimensions(), ud => ud.setId == this.axisSetId), d => d.index);
    }

    getColumnDimensions = () => {
        return _.filter(this.getUnfixedDimensions(), d => d != this.getAxisDimension());
    }

    getAllDimensions = () => {
        return this.dimensions;
    }
}

export class MultipleParameterDataCsv {
    scenarioId: string;
    modelId: string;
    actualSetValue: string;
    
    private dimensionStore: CsvDimensionStore;

    spreadsheetVisible: boolean;
    spreadsheetSettings: any;
    spreadsheetItems: (number | string)[][];

    constructor(modelId: string, scenarioId: string, parameters: IParameter[], sets: ISet[], parameterDatas: IParameterData[], setDatas: ISetData[], actualSetId: string, actualSetValue: string, axisSetId: string) {
        this.scenarioId = scenarioId;
        this.modelId = modelId;
        this.actualSetValue = actualSetValue;
        this.dimensionStore = new CsvDimensionStore(modelId, sets, setDatas, actualSetId, axisSetId);

        var parameterDimensions = _.map(_.orderBy(parameters, p => p.name), parameter => {
            var dimensions = this.dimensionStore.updateAndRetrieveDimensions(parameter);
            var columnDimensions = _.filter(dimensions, d => d != this.dimensionStore.getFixedDimension() && d != this.dimensionStore.getAxisDimension());
            return <IParameterCsvData>{
                parameter: parameter,
                columnDimensions: columnDimensions,
                rows: _.reduce(columnDimensions, (res, d) => res * d.values.length, 1),
                data: _.find(parameterDatas, pd => pd.parameterId == parameter.id),
            };
        });
        
        var rowCount = _.sumBy(parameterDimensions, pd => pd.rows);
        this.setupSpreadsheet(rowCount);
        
        _.forEach(parameterDimensions, (parameterDimension, parameterDimensionIndex) => {
            var startingRow = _.sum(_.map(parameterDimensions.slice(0, parameterDimensionIndex), ppd => ppd.rows));

            for (var rowIndex = startingRow; rowIndex < startingRow + parameterDimension.rows; rowIndex++) {
                this.spreadsheetItems[rowIndex][0] = parameterDimension.parameter.name;
                this.spreadsheetItems[rowIndex][this.spreadsheetSettings.columns.length] = parameterDimension.parameter.id;
            };

            var currentRowGroups = 1;
            _.forEach(this.dimensionStore.getColumnDimensions(), (setData, columnIndex) => {
                if (_.some(parameterDimension.columnDimensions, d => d == setData)) {

                    var repetitionSize = parameterDimension.rows / currentRowGroups;
                    var lumpSize = repetitionSize / setData.values.length;
                    var repetitions = parameterDimension.rows / repetitionSize;

                    for (var rep = 0; rep < repetitions; rep++) {
                        _.forEach(setData.values, (val, valueIndex) => {
                            for (var i = 0; i < lumpSize; i++) {
                                var rowIndex = startingRow + rep * repetitionSize + valueIndex * lumpSize + i;
                                this.spreadsheetItems[rowIndex][columnIndex + 1] = val.displayName;
                            };
                        });
                    };
                    currentRowGroups = currentRowGroups * setData.values.length;


                } else {
                    for (var rowIndex = startingRow; rowIndex < startingRow + parameterDimension.rows; rowIndex++) {
                        this.spreadsheetItems[rowIndex][columnIndex + 1] = '-';
                    };
                }
            });
        });
        
        this.loadData(parameterDimensions);

        this.spreadsheetVisible = true;
    }

    private setupSpreadsheet = (rowCount: number) => {
        var parameterNameColumns = [{
            readOnly: true,
        }];
        var indexColumns = _.times(this.dimensionStore.getColumnDimensions().length, () => {
            return {
                readOnly: true,
            }
        });
        var axisDimension = this.dimensionStore.getAxisDimension();
        var valueColumns = axisDimension
            ? _.times(axisDimension.values.length, () => {
                return {
                    readOnly: false,
                    type: 'numeric',
                    format: '0.[000000000]',
                }
            })
            : [{
                readOnly: false,
                type: 'numeric',
                format: '0.[000000000]',
            }];
        var columns = ['Parameter'].concat(_.map(this.dimensionStore.getColumnDimensions(), s => s.name)).concat(axisDimension ? _.map(axisDimension.values, v => v.value) : ['Value']);

        this.spreadsheetSettings = {
            columnSorting: true,
            colHeaders: columns,
            columns: parameterNameColumns.concat(indexColumns).concat(valueColumns),
        };
        columns.push('parameterId');

        this.spreadsheetItems = _.times(rowCount, () => {
            return _.map(columns, () => null);
        });
    }

    private loadData = (parameterDimensions: IParameterCsvData[]) => {

        var valueColumnStartIndex = this.dimensionStore.getColumnDimensions().length + 1;
        var axisDimension = this.dimensionStore.getAxisDimension();
        
        var dataMappingFunction = (parameterDimension: IParameterCsvData, rowContents: (string | number)[], colValue?: string) => {
            var actualOrderedValues = _.map(parameterDimension.data.sets, set => {
                var dimension = _.find(parameterDimension.columnDimensions, dim => dim.setId == set.id && dim.index == set.index);
                if (dimension == null) {
                    if (axisDimension && axisDimension.setId == set.id && axisDimension.index == set.index)
                        return colValue;
                    return this.actualSetValue;
                }
                var column = _.findIndex(this.dimensionStore.getColumnDimensions(), dimension) + 1;
                return rowContents[column];
            });
            return actualOrderedValues.join('|');
        };

        _.forEach(parameterDimensions, (parameterDimension, parameterDimensionIndex) => {
            if (!parameterDimension.data)
                return;

            var stringgedData = _.map(parameterDimension.data.data, data => {
                return {
                    coordinateString: data.c.join('|'),
                    value: data.v,
                };
            });

            var startingRow = _.sum(_.map(parameterDimensions.slice(0, parameterDimensionIndex), ppd => ppd.rows));

            if (axisDimension) {
                for (var row = startingRow; row < startingRow + parameterDimension.rows; row++) {
                    for (var i = 0; i < axisDimension.values.length; i++) {
                        var mappedCoordinates = dataMappingFunction(parameterDimension, this.spreadsheetItems[row], axisDimension.values[i].value);
                        var found = _.find(stringgedData, data => data.coordinateString == mappedCoordinates);
                        var value = found ? found.value : parameterDimension.data.defaultValue;
                        this.spreadsheetItems[row][valueColumnStartIndex + i] = value;
                    }
                }
            } else {
                for (var row = startingRow; row < startingRow + parameterDimension.rows; row++) {
                    var mappedCoordinates = dataMappingFunction(parameterDimension, this.spreadsheetItems[row]);
                    var found = _.find(stringgedData, data => data.coordinateString == mappedCoordinates);
                    var value = found ? found.value : parameterDimension.data.defaultValue;
                    this.spreadsheetItems[row][valueColumnStartIndex] = value;
                }
            }
        });
    }

    serialize: () => IParameterData = () => {
        return null;
    }
}