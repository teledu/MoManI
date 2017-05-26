import _ = require('lodash');
import setDataModel = require('models/setData')

interface IDimensionItem {
    value: string;
    displayName: string;
}

interface IColumnProperties {
    readOnly?: boolean,
    type?: string,
    format?: string,
}

interface IDimension {
    setId: string;
    index: number;
    name: string;
    numeric: boolean;
    values: IDimensionItem[];
}

interface IStringgedData extends IDimensionalDataItem {
    coordinateString: string
}

interface IDimensionalCsvData<TComponent extends IDimensionalComponent, TData extends IDimensionalData> {
    component: TComponent;
    columnDimensions: IDimension[];
    rows: number;
    data: TData;
    usesValueColumn: boolean;
}

interface ITestDimensionalData<T1, T2> {
    component: T1;
    data: T2;

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

abstract class CsvData<TComponent extends IDimensionalComponent, TData extends IDimensionalData> {
    private readonly components: TComponent[];
    private readonly dimensionStore: CsvDimensionStore;

    protected scenarioId: string;
    protected modelId: string;
    protected allColumnsReadOnly: boolean = false;
    protected typeColumnName: string;
    protected datas: TData[];
    protected unshownData: TData[];
    protected getDataForComponent: (componentId: string) => TData;
    protected getUnshownDataForComponent: (componentId: string) => TData;
    protected getDefaultDataForComponent: (component: TComponent) => TData;
    protected getRemainingDataForComponent: (data: TData, striggedData: IStringgedData[]) => TData;
    protected getDefaultValueForData: (data: TData) => string | number;
    protected constructFullDataForComponent: (data: TData, dataArray: IDimensionalDataItem[]) => TData;
    protected valueSameAsDefault: (value: number, data: TData) => boolean;

    columnSetId: string;
    sets: ISet[];

    spreadsheetVisible: boolean;
    spreadsheetSettings: any;
    spreadsheetItems: (number | string)[][];

    protected constructor(modelId: string, scenarioId: string, components: TComponent[], sets: ISet[], datas: TData[], setDatas: ISetData[]) {
        this.scenarioId = scenarioId;
        this.modelId = modelId;
        this.sets = sets;
        this.components = components;
        this.datas = datas;
        this.dimensionStore = new CsvDimensionStore(modelId, sets, setDatas, components);
        var axisDimension = this.dimensionStore.getAxisDimension();
        this.columnSetId = axisDimension ? _.find(this.sets, s => s.id == axisDimension.setId).id : null;
        this.unshownData = [];
    }

    public clearSpreadsheet = () => {
        this.datas = this.serialize();
        this.spreadsheetVisible = false;
        this.unshownData = [];
        this.spreadsheetSettings = null;
        this.spreadsheetItems = [];
    }

    public changeColumnSet = () => {
        this.dimensionStore.setAxisSet(this.columnSetId);
        this.showSpreadsheet();
    }

    protected showSpreadsheet = () => {
        var componentDimensions = _.map(_.orderBy(this.components, c => c.name), component => {
            var dimensions = this.dimensionStore.getDimensionsForComponent(component);
            var columnDimensions = _.filter(dimensions, d => d != this.dimensionStore.getAxisDimension());
            return <IDimensionalCsvData<TComponent, TData>>{
                component: component,
                columnDimensions: columnDimensions,
                rows: _.reduce(columnDimensions, (res, d) => res * d.values.length, 1 as number),
                data: this.getDataForComponent(component.id),
                usesValueColumn: dimensions.length == columnDimensions.length,
            };
        });

        var rowCount = _.sumBy(componentDimensions, pd => pd.rows);
        this.setupSpreadsheet(rowCount);

        _.forEach(componentDimensions, (componentDimension, componentDimensionIndex) => {
            var startingRow = _.sum(_.map(componentDimensions.slice(0, componentDimensionIndex), ppd => ppd.rows));

            for (var rowIndex = startingRow; rowIndex < startingRow + componentDimension.rows; rowIndex++) {
                this.spreadsheetItems[rowIndex][0] = componentDimension.component.name;
                this.spreadsheetItems[rowIndex][this.spreadsheetSettings.columns.length] = componentDimension.component.id;
                this.spreadsheetItems[rowIndex][this.spreadsheetSettings.columns.length + 1] = componentDimension.usesValueColumn ? 1 : 0;
            };

            var currentRowGroups = 1;
            _.forEach(this.dimensionStore.getColumnDimensions(), (setData, columnIndex) => {
                if (_.some(componentDimension.columnDimensions, d => d == setData)) {

                    var repetitionSize = componentDimension.rows / currentRowGroups;
                    var lumpSize = repetitionSize / setData.values.length;
                    var repetitions = componentDimension.rows / repetitionSize;

                    for (var rep = 0; rep < repetitions; rep++) {
                        _.forEach(setData.values, (val, valueIndex) => {
                            for (var i = 0; i < lumpSize; i++) {
                                var rowIndex = startingRow + rep * repetitionSize + valueIndex * lumpSize + i;
                                this.spreadsheetItems[rowIndex][columnIndex + 1] = val.value;
                            };
                        });
                    };
                    currentRowGroups = currentRowGroups * setData.values.length;


                } else {
                    for (var rowIndex = startingRow; rowIndex < startingRow + componentDimension.rows; rowIndex++) {
                        this.spreadsheetItems[rowIndex][columnIndex + 1] = '-';
                    };
                }
            });
        });

        this.loadData(componentDimensions);

        this.spreadsheetVisible = true;
    }

    private setupSpreadsheet = (rowCount: number) => {
        var axisDimension = this.dimensionStore.getAxisDimension();

        var columnProperties = <IColumnProperties[]>[{
            readOnly: true,
        }];
        _.forEach(this.dimensionStore.getColumnDimensions(), () => {
            columnProperties.push(<IColumnProperties>{
                readOnly: true
            });
        });
        if (axisDimension) {
            _.forEach(axisDimension.values, () => {
                columnProperties.push({
                    readOnly: this.allColumnsReadOnly,
                    type: 'numeric',
                    format: '0.[000000000]',
                });
            });
        };
        if (this.dimensionStore.needsValueColumn()) {
            columnProperties.push({
                readOnly: this.allColumnsReadOnly,
                type: 'numeric',
                format: '0.[000000000]',
            });
        };

        var columnHeaders = [this.typeColumnName].concat(_.map(this.dimensionStore.getColumnDimensions(), s => s.name));
        if (axisDimension) {
            _.forEach(axisDimension.values, v => {
                columnHeaders.push(v.value);
            });
        };
        if (this.dimensionStore.needsValueColumn()) {
            columnHeaders.push('Value');
        }
        columnHeaders.push('id');
        columnHeaders.push('usesValueColumn');

        var visibleColumnCount = columnHeaders.length - 2;
        var needsValueColumn = this.dimensionStore.needsValueColumn();
        var settings = <any>{
            columnSorting: true,
            colHeaders: columnHeaders,
            columns: columnProperties,
        };

        if (!this.allColumnsReadOnly) {
            settings.cells = (row, col, prop) => {
                var usesValueColumn = this.spreadsheetItems[row] && this.spreadsheetItems[row][columnHeaders.length - 1];

                if (usesValueColumn && col < visibleColumnCount - 1) {
                    return {
                        readOnly: true,
                    }
                }

                if (!usesValueColumn && needsValueColumn && col == visibleColumnCount - 1) {
                    return {
                        readOnly: true,
                    }
                }

                return {};
            }
        }
        this.spreadsheetSettings = settings;

        this.spreadsheetItems = _.times(rowCount, () => {
            return _.map(columnHeaders, () => null);
        });
    }

    private loadData = (componentDimensions: IDimensionalCsvData<TComponent, TData>[]) => {

        var valueColumnStartIndex = this.dimensionStore.getColumnDimensions().length + 1;
        var axisDimension = this.dimensionStore.getAxisDimension();

        var dataMappingFunction = (componentDimension: IDimensionalCsvData<TComponent, TData>, rowContents: (string | number)[], colValue?: string) => {
            var actualOrderedValues = _.map(componentDimension.data.sets, set => {
                var dimension = _.find(componentDimension.columnDimensions, dim => dim.setId == set.id && dim.index == set.index);
                if (dimension == null) {
                    if (axisDimension && axisDimension.setId == set.id && axisDimension.index == set.index)
                        return colValue;
                    throw ('this.actualSetValue');
                }
                var column = _.findIndex(this.dimensionStore.getColumnDimensions(), dimension) + 1;
                return rowContents[column];
            });
            return actualOrderedValues.join('|');
        };

        _.forEach(componentDimensions, (componentDimension, componentDimensionIndex) => {
            var startingRow = _.sum(_.map(componentDimensions.slice(0, componentDimensionIndex), ppd => ppd.rows));

            if (!componentDimension.data) {
                for (var row = startingRow; row < startingRow + componentDimension.rows; row++) {
                    if (componentDimension.usesValueColumn) {
                        for (i = 0; i < axisDimension.values.length; i++) {
                            this.spreadsheetItems[row][valueColumnStartIndex + i] = '-';
                        }
                    } else {
                        if (this.dimensionStore.needsValueColumn()) {
                            this.spreadsheetItems[row][valueColumnStartIndex + axisDimension.values.length] = '-';
                        }
                    }
                }
                
                this.unshownData.push(this.getDefaultDataForComponent(componentDimension.component));
                return;
            }
            var stringgedData = _.map(componentDimension.data.data, data => {
                return <IStringgedData>{
                    c: data.c,
                    coordinateString: data.c.join('|'),
                    v: data.v,
                };
            });

            if (componentDimension.usesValueColumn) {
                for (var row = startingRow; row < startingRow + componentDimension.rows; row++) {
                    var i;
                    for (i = 0; i < axisDimension.values.length; i++) {
                        this.spreadsheetItems[row][valueColumnStartIndex + i] = '-';
                    }
                    var mappedCoordinates = dataMappingFunction(componentDimension, this.spreadsheetItems[row]);
                    var found = _.find(stringgedData, data => data.coordinateString == mappedCoordinates);
                    if (found) {
                        stringgedData.splice(stringgedData.indexOf(found), 1);
                    }
                    var value = found ? found.v : this.getDefaultValueForData(componentDimension.data);
                    this.spreadsheetItems[row][valueColumnStartIndex + i] = value;
                }
            } else {
                for (var row = startingRow; row < startingRow + componentDimension.rows; row++) {
                    var i;
                    for (i = 0; i < axisDimension.values.length; i++) {
                        var mappedCoordinates = dataMappingFunction(componentDimension, this.spreadsheetItems[row], axisDimension.values[i].value);
                        var found = _.find(stringgedData, data => data.coordinateString == mappedCoordinates);
                        if (found) {
                            stringgedData.splice(stringgedData.indexOf(found), 1);
                        }
                        var value = found ? found.v : this.getDefaultValueForData(componentDimension.data);
                        this.spreadsheetItems[row][valueColumnStartIndex + i] = value;
                    }
                    if (this.dimensionStore.needsValueColumn()) {
                        this.spreadsheetItems[row][valueColumnStartIndex + i] = '-';
                    }
                }
            }
            
            this.unshownData.push(this.getRemainingDataForComponent(componentDimension.data, stringgedData));
        });
    }

    serialize: () => TData[] = () => {
        var asdf = _.map(_.groupBy(this.spreadsheetItems, r => r[this.spreadsheetSettings.columns.length]), (rows, componentId) => {
            var unshownData = this.getUnshownDataForComponent(componentId);
            var data = unshownData.data.slice();

            var axisDimension = this.dimensionStore.getAxisDimension();
            var columns = this.dimensionStore.getColumnDimensions();

            var columnIndexMap = _.map(unshownData.sets, dimension => {
                var index = _.findIndex(columns, col => col.setId == dimension.id && col.index == dimension.index);
                if (index < 0)
                    return null;
                return index + 1;
            });
            var coordinateFunction = (row: (string | number)[], valueIndex?: number) => {
                return _.map(unshownData.sets, (dimension, index) => {
                    var mappedColumnIndex = columnIndexMap[index];
                    if (mappedColumnIndex)
                        return row[mappedColumnIndex].toString();
                    if (axisDimension.setId == dimension.id && axisDimension.index == dimension.index) {
                        return axisDimension.values[valueIndex].value;
                    }
                    throw 'err';
                });
            };
            var axisColumnsStartIndex = this.dimensionStore.getColumnDimensions().length + 1;
            var valueColumnIndex = axisColumnsStartIndex + axisDimension.values.length;
            _.forEach(rows, row => {
                var rowUsesValueColumn = !!row[this.spreadsheetSettings.columns.length + 1];
                if (rowUsesValueColumn) {
                    var val = +row[valueColumnIndex];
                    if (this.valueSameAsDefault(val, unshownData))
                        return;
                    var coordinates = coordinateFunction(row);
                    data.push({
                        c: coordinates,
                        v: val,
                    });
                } else {
                    for (var i = 0; i < axisDimension.values.length; i++) {
                        var val = +row[axisColumnsStartIndex + i];
                        if (this.valueSameAsDefault(val, unshownData))
                            continue;
                        var coordinates = coordinateFunction(row, i);
                        data.push({
                            c: coordinates,
                            v: val,
                        });
                    }
                }
            });

            return this.constructFullDataForComponent(unshownData, data);
        });
        return [];
    }
}

export class ParameterDataCsv extends CsvData<IParameter, IParameterData> {
    protected datas: IParameterData[];

    constructor(modelId: string, scenarioId: string, parameters: IParameter[], sets: ISet[], parameterDatas: IParameterData[], setDatas: ISetData[]) {
        super(modelId, scenarioId, parameters, sets, parameterDatas, setDatas);
        this.typeColumnName = 'Parameter';

        this.showSpreadsheet();
    }

    getDataForComponent = (componentId: string) => {
        return _.find(this.datas, pd => pd.parameterId == componentId);
    }

    getUnshownDataForComponent = (componentId: string) => {
        return _.find(this.unshownData, pd => pd.parameterId == componentId);
    }

    getDefaultDataForComponent = (component: IParameter) => {
        return {                    //TODO: fix no data cases
            modelId: this.modelId,
            scenarioId: this.scenarioId,
            parameterId: component.id,
            defaultValue: 0,
            sets: _.map(component.sets, (setId, index) => {
                var instanceIndex = _(component.sets).slice(0, index).filter(sId => sId == setId).value().length;
                return {
                    id: setId,
                    index: instanceIndex,
                }
            }),
            data: [],
        };
    }

    getRemainingDataForComponent = (data: IParameterData, stringedData: IStringgedData[]) => {
        return {
            modelId: data.modelId,
            scenarioId: data.scenarioId,
            parameterId: data.parameterId,
            defaultValue: data.defaultValue,
            sets: data.sets,
            data: _.map(stringedData, d => {
                return {
                    c: d.c,
                    v: d.v,
                }
            })
        }
    }

    getDefaultValueForData = (data: IParameterData) => {
        return data.defaultValue;
    }

    constructFullDataForComponent = (data: IParameterData, dataArray: IDimensionalDataItem[]) => {
        return {
            modelId: this.modelId,
            scenarioId: this.scenarioId,
            parameterId: data.parameterId,
            defaultValue: data.defaultValue,
            sets: data.sets,
            data: dataArray,
        };
    }

    valueSameAsDefault = (value: number, data: IParameterData) => {
        return value == data.defaultValue;
    }
}

class CsvDimensionStore {
    private dimensions: IDimension[];
    private components: IDimensionalComponent[];
    private setDatas: setDataModel.SetData[];
    private axisDimension: IDimension;

    constructor(modelId: string, sets: ISet[], setDatas: ISetData[], components: IDimensionalComponent[]) {
        this.dimensions = [];
        this.components = components;
        this.setDatas = _.map(setDatas, setData => {
            var set = _.find(sets, s => s.id == setData.setId);
            return new setDataModel.SetData(modelId, set, setData);
        });
        _.forEach(components, component => {
            _.forEach(component.sets, (setId, i) => {
                var previousSetIds = component.sets.slice(0, i);
                var index = _.filter(previousSetIds, psId => psId == setId).length;
                var dimension = _.find(this.dimensions, d => d.setId == setId && d.index == index);
                if (dimension) {
                    return;
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
            });
        });

        this.assignInitialAxisSet();
    }

    private assignInitialAxisSet = () => {
        if (this.dimensions.length == 0)
            return;
        var numericSets = _.filter(this.setDatas, s => s.numeric);
        var initialSet = numericSets.length ? _.maxBy(numericSets, s => s.getValueCount()) : _.maxBy(this.setDatas, s => s.getValueCount());
        this.setAxisSet(initialSet.setId);
    }

    setAxisSet = (setId: string) => {
        this.axisDimension = _.find(this.dimensions, d => d.setId == setId && d.index == 0);
    }

    getDimensionsForComponent = (component: IDimensionalComponent) => {
        return _.map(component.sets, (setId, i) => {
            var previousSetIds = component.sets.slice(0, i);
            var index = _.filter(previousSetIds, psId => psId == setId).length;
            return _.find(this.dimensions, d => d.setId == setId && d.index == index);
        });
    }

    getAxisDimension = () => {
        return this.axisDimension;
    }

    getColumnDimensions = () => {
        return _.filter(this.dimensions, d => d != this.getAxisDimension());
    }

    getAllDimensions = () => {
        return this.dimensions;
    }

    needsValueColumn = () => {
        if (this.axisDimension == null)
            return true;
        return !_.every(this.components, c => _.some(c.sets, sId => sId == this.axisDimension.setId));
    }
}






class LegacyCsvDimensionStore {
    private dimensions: IDimension[];
    private setDatas: setDataModel.SetData[];
    private fixedSetId: string;
    private axisSetId: string;

    constructor(modelId: string, sets: ISet[], setDatas: ISetData[], axisSetId: string, fixedSetId?: string) {
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
        if (this.fixedSetId == null)
            return null
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

interface ILegacyParameterCsvData {
    parameter: IParameter;
    columnDimensions: IDimension[];
    rows: number;
    data: IParameterData;
    usesValueColumn: boolean;
}

export class LegacyParameterDataCsv {
    scenarioId: string;
    modelId: string;
    actualSetValue: string;
    
    private dimensionStore: LegacyCsvDimensionStore;
    private unshownParameterData: IParameterData[];

    spreadsheetVisible: boolean;
    spreadsheetSettings: any;
    spreadsheetItems: (number | string)[][];

    constructor(modelId: string, scenarioId: string, parameters: IParameter[], sets: ISet[], parameterDatas: IParameterData[], setDatas: ISetData[], axisSetId?: string, actualSetId?: string, actualSetValue?: string) {
        this.scenarioId = scenarioId;
        this.modelId = modelId;
        this.actualSetValue = actualSetValue;
        this.dimensionStore = new LegacyCsvDimensionStore(modelId, sets, setDatas, axisSetId, actualSetId);
        this.unshownParameterData = [];

        var parameterDimensions = _.map(_.orderBy(parameters, p => p.name), parameter => {
            var dimensions = this.dimensionStore.updateAndRetrieveDimensions(parameter);
            var columnDimensions = _.filter(dimensions, d => d != this.dimensionStore.getFixedDimension() && d != this.dimensionStore.getAxisDimension());
            return <ILegacyParameterCsvData>{
                parameter: parameter,
                columnDimensions: columnDimensions,
                rows: _.reduce(columnDimensions, (res, d) => res * d.values.length, 1 as number),
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
        var parameterNameColumns = [<IColumnProperties>{
            readOnly: true,
        }];
        var indexColumns = _.times(this.dimensionStore.getColumnDimensions().length, (n) => {
            return <IColumnProperties>{
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

    private loadData = (parameterDimensions: ILegacyParameterCsvData[]) => {

        var valueColumnStartIndex = this.dimensionStore.getColumnDimensions().length + 1;
        var axisDimension = this.dimensionStore.getAxisDimension();
        
        var dataMappingFunction = (parameterDimension: ILegacyParameterCsvData, rowContents: (string | number)[], colValue?: string) => {
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
            if (!parameterDimension.data) {
                this.unshownParameterData.push({
                    modelId: this.modelId,
                    scenarioId: this.scenarioId,
                    parameterId: parameterDimension.parameter.id,
                    defaultValue: 0,
                    sets: _.map(parameterDimension.parameter.sets, (setId, index) => {
                        var instanceIndex = _(parameterDimension.parameter.sets).slice(0, index).filter(sId => sId == setId).value().length;
                        return {
                            id: setId,
                            index: instanceIndex,
                        }
                    }),
                    data: [],
                });
                return;
            }

            var stringgedData = _.map(parameterDimension.data.data, data => {
                return {
                    coordinates: data.c,
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
                        if (found) {
                            stringgedData.splice(stringgedData.indexOf(found), 1);
                        }
                        var value = found ? found.value : parameterDimension.data.defaultValue;
                        this.spreadsheetItems[row][valueColumnStartIndex + i] = value;
                    }
                }
            } else {
                for (var row = startingRow; row < startingRow + parameterDimension.rows; row++) {
                    var mappedCoordinates = dataMappingFunction(parameterDimension, this.spreadsheetItems[row]);
                    var found = _.find(stringgedData, data => data.coordinateString == mappedCoordinates);
                    if (found) {
                        stringgedData.splice(stringgedData.indexOf(found), 1);
                    }
                    var value = found ? found.value : parameterDimension.data.defaultValue;
                    this.spreadsheetItems[row][valueColumnStartIndex] = value;
                }
            }
            
            this.unshownParameterData.push({
                modelId: parameterDimension.data.modelId,
                scenarioId: parameterDimension.data.scenarioId,
                parameterId: parameterDimension.data.parameterId,
                defaultValue: parameterDimension.data.defaultValue,
                sets: parameterDimension.data.sets,
                data: _.map(stringgedData, d => {return {
                    c: d.coordinates,
                    v: d.value,
                }})
            });
        });
    }

    serialize: () => IParameterData[] = () => {
        return _.map(_.groupBy(this.spreadsheetItems, r => r[this.spreadsheetSettings.columns.length]), (rows, parameterId) => {
            var unshownParameterData = _.find(this.unshownParameterData, d => d.parameterId == parameterId);
            var data = unshownParameterData.data.slice();

            var valueColumnStartIndex = this.dimensionStore.getColumnDimensions().length + 1;
            var axisDimension = this.dimensionStore.getAxisDimension();
            var fixedDimension = this.dimensionStore.getFixedDimension();
            var columns = this.dimensionStore.getColumnDimensions();

            var columnIndexMap = _.map(unshownParameterData.sets, dimension => {
                var index = _.findIndex(columns, col => col.setId == dimension.id && col.index == dimension.index);
                if (index < 0)
                    return null;
                return index + 1;
            });
            var coordinateFunction = (row: (string|number)[], valueIndex?: number) => {
                return _.map(unshownParameterData.sets, (dimension, index) => {
                    var mappedColumnIndex = columnIndexMap[index];
                    if (mappedColumnIndex)
                        return row[mappedColumnIndex].toString();
                    if (axisDimension.setId == dimension.id && axisDimension.index == dimension.index) {
                        return axisDimension.values[valueIndex].value;
                    }
                    if (fixedDimension && fixedDimension.setId == dimension.id && fixedDimension.index == dimension.index) {
                        return this.actualSetValue;
                    }
                    throw 'err';
                });
            };

            _.forEach(rows, row => {
                if (axisDimension) {
                    for (var i = 0; i < axisDimension.values.length; i++) {
                        var val = +row[valueColumnStartIndex + i];
                        if (val == unshownParameterData.defaultValue)
                            continue;
                        var coordinates = coordinateFunction(row, i);
                        data.push({
                            c: coordinates,
                            v: val,
                        });
                    }
                } else {
                    var val = +row[valueColumnStartIndex];
                    if (val == unshownParameterData.defaultValue)
                        return;
                    var coordinates = coordinateFunction(row);
                    data.push({
                        c: coordinates,
                        v: val,
                    });
                }
            });

            return {
                modelId: this.modelId,
                scenarioId: this.scenarioId,
                parameterId: parameterId,
                defaultValue: unshownParameterData.defaultValue,
                sets: unshownParameterData.sets,
                data: data,
            };
        });
    }
}