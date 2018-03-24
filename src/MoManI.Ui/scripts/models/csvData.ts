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
        return this.setId === other.setId && this.index === other.index;
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
    protected getRemainingDataForComponent: (data: TData, remainingItems: IDimensionalDataItem[]) => TData;
    protected getDefaultValueForData: (data: TData) => string | number;
    protected constructFullDataForComponent: (data: TData, dataArray: IDimensionalDataItem[]) => TData;
    protected valueSameAsDefault: (value: number, data: TData) => boolean;

    protected currentComponentFilters: IDimensionalComponent[];
    protected currentSetFilters: ISetValueFilter[];
    protected hiddenFilteredRows: (number | string)[][];

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
        this.columnSetId = axisDimension ? _.find(this.sets, s => s.id === axisDimension.setId).id : null;
        this.unshownData = [];

        this.currentComponentFilters = components;
        this.currentSetFilters = [];
        this.hiddenFilteredRows = [];
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
        this.filterData();
    }

    protected showSpreadsheet = () => {
        var componentDimensions = _.map(_.orderBy(this.components, c => c.name), component => {
            var dimensions = this.dimensionStore.getDimensionsForComponent(component);
            var columnDimensions = _.filter(dimensions, d => d !== this.dimensionStore.getAxisDimension());
            return {
                component: component,
                columnDimensions: columnDimensions,
                rows: _.reduce(columnDimensions, (res, d) => res * d.values.length, 1 as number),
                data: this.getDataForComponent(component.id),
                usesValueColumn: dimensions.length === columnDimensions.length,
            } as IDimensionalCsvData<TComponent, TData>;
        });

        var rowCount = _.sumBy(componentDimensions, pd => pd.rows);
        this.setupSpreadsheet(rowCount);

        _.forEach(componentDimensions, (componentDimension, componentDimensionIndex) => {
            var startingRow = _.sum(_.map(componentDimensions.slice(0, componentDimensionIndex), ppd => ppd.rows));

            for (let rowIndex = startingRow; rowIndex < startingRow + componentDimension.rows; rowIndex++) {
                this.spreadsheetItems[rowIndex][0] = componentDimension.component.name;
                this.spreadsheetItems[rowIndex][this.spreadsheetSettings.columns.length] = componentDimension.component.id;
                this.spreadsheetItems[rowIndex][this.spreadsheetSettings.columns.length + 1] = componentDimension.usesValueColumn ? 1 : 0;
            };

            var currentRowGroups = 1;
            _.forEach(this.dimensionStore.getColumnDimensions(), (setData, columnIndex) => {
                if (_.some(componentDimension.columnDimensions, d => d === setData)) {

                    var repetitionSize = componentDimension.rows / currentRowGroups;
                    var lumpSize = repetitionSize / setData.values.length;
                    const repetitions = componentDimension.rows / repetitionSize;

                    for (var rep = 0; rep < repetitions; rep++) {
                        _.forEach(setData.values, (val, valueIndex) => {
                            for (let i = 0; i < lumpSize; i++) {
                                const rowIndex = startingRow + rep * repetitionSize + valueIndex * lumpSize + i;
                                this.spreadsheetItems[rowIndex][columnIndex + 1] = val.value;
                            };
                        });
                    };
                    currentRowGroups = currentRowGroups * setData.values.length;


                } else {
                    for (let rowIndex = startingRow; rowIndex < startingRow + componentDimension.rows; rowIndex++) {
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

        var columnProperties = [{
            readOnly: true,
        }] as IColumnProperties[];
        _.forEach(this.dimensionStore.getColumnDimensions(), () => {
            columnProperties.push({
                readOnly: true
            } as IColumnProperties);
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
                var headerHtml = `<span title="${v.displayName}">${v.value}</span>`;
                columnHeaders.push(headerHtml);
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
            manualColumnMove: true,
        };

        if (!this.allColumnsReadOnly) {
            settings.cells = (row, col) => {
                var usesValueColumn = this.spreadsheetItems[row] && this.spreadsheetItems[row][columnHeaders.length - 1];

                if (usesValueColumn && col < visibleColumnCount - 1) {
                    return {
                        readOnly: true,
                    }
                }

                if (!usesValueColumn && needsValueColumn && col === visibleColumnCount - 1) {
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
                var dimension = _.find(componentDimension.columnDimensions, dim => dim.setId === set.id && dim.index === set.index);
                if (dimension == null) {
                    if (axisDimension && axisDimension.setId === set.id && axisDimension.index === set.index)
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
                var defaultComponentData = this.getDefaultDataForComponent(componentDimension.component);
                for (let row = startingRow; row < startingRow + componentDimension.rows; row++) {
                    if (componentDimension.usesValueColumn) {
                        for (let i = 0; i < axisDimension.values.length; i++) {
                            this.spreadsheetItems[row][valueColumnStartIndex + i] = '-';
                        }
                        this.spreadsheetItems[row][valueColumnStartIndex + axisDimension.values.length] = defaultComponentData.defaultValue;
                    } else {
                        for (let i = 0; i < axisDimension.values.length; i++) {
                            this.spreadsheetItems[row][valueColumnStartIndex + i] = defaultComponentData.defaultValue;
                        }
                        if (this.dimensionStore.needsValueColumn()) {
                            this.spreadsheetItems[row][valueColumnStartIndex + axisDimension.values.length] = '-';
                        }
                    }
                }
                
                this.unshownData.push(defaultComponentData);
                return;
            }
            let stringgedDataMap: { [key: string]: IDimensionalDataItem; } = {};
            _.forEach(componentDimension.data.data, data => {
                stringgedDataMap[data.c.join('|')] = data;
            });
            
            if (componentDimension.usesValueColumn) {
                for (let row = startingRow; row < startingRow + componentDimension.rows; row++) {
                    for (let i = 0; i < axisDimension.values.length; i++) {
                        this.spreadsheetItems[row][valueColumnStartIndex + i] = '-';
                    }
                    const mappedCoordinates = dataMappingFunction(componentDimension, this.spreadsheetItems[row]);
                    const found = stringgedDataMap[mappedCoordinates];
                    if (found) {
                        delete stringgedDataMap[mappedCoordinates];
                    }
                    const value = found ? found.v : this.getDefaultValueForData(componentDimension.data);
                    this.spreadsheetItems[row][valueColumnStartIndex + axisDimension.values.length] = value;
                }
            } else {
                for (var row = startingRow; row < startingRow + componentDimension.rows; row++) {
                    for (let i = 0; i < axisDimension.values.length; i++) {
                        const mappedCoordinates = dataMappingFunction(componentDimension, this.spreadsheetItems[row], axisDimension.values[i].value);
                        const found = stringgedDataMap[mappedCoordinates];
                        if (found) {
                            delete stringgedDataMap[mappedCoordinates];
                        }
                        const value = found ? found.v : this.getDefaultValueForData(componentDimension.data);
                        this.spreadsheetItems[row][valueColumnStartIndex + i] = value;
                    }
                    if (this.dimensionStore.needsValueColumn()) {
                        this.spreadsheetItems[row][valueColumnStartIndex + axisDimension.values.length] = '-';
                    }
                }
            }
            let remainingData: IDimensionalDataItem[] = [];
            _.forOwn(stringgedDataMap, val => remainingData.push(val));
            this.unshownData.push(this.getRemainingDataForComponent(componentDimension.data, remainingData));
        });
    }

    private filterData = () => {
        var sourceData = this.spreadsheetItems.concat(this.hiddenFilteredRows);
        this.spreadsheetItems = [];
        this.hiddenFilteredRows = [];

        var parameterIdColumnIndex = this.spreadsheetSettings.columns.length;
        var columnDimensionIds = _.map(this.dimensionStore.getColumnDimensions(), d => d.setId);
        var activeSetFilters = _.filter(this.currentSetFilters, sf => _.some(columnDimensionIds, cdi => cdi === sf.id));
        var indexFilters = _.map(activeSetFilters, sf => {
            return {
                index: _.indexOf(columnDimensionIds, sf.id) + 1,
                regex: sf.query,
            };
        });

        _.forEach(sourceData, row => {
            if (_.some(this.currentComponentFilters, c => c.id === row[parameterIdColumnIndex])) {
                if (activeSetFilters.length) {
                    const passesAllSetFilters = _.every(indexFilters, f => (row[f.index] as string).search(f.regex) !== -1);
                    if (passesAllSetFilters) {
                        this.spreadsheetItems.push(row);
                    } else {
                        this.hiddenFilteredRows.push(row);
                    }
                } else {
                    this.spreadsheetItems.push(row);
                }
            } else {
                this.hiddenFilteredRows.push(row);
            }
        });
    }

    updateFilters = (filteredComponents: IDimensionalComponent[], setFilters: ISetValueFilter[]) => {
        this.currentComponentFilters = filteredComponents;
        this.currentSetFilters = setFilters;
        this.filterData();
    }

    serialize: () => TData[] = () => {
        var allData = this.spreadsheetItems.concat(this.hiddenFilteredRows);
        return _.map(_.groupBy(allData, r => r[this.spreadsheetSettings.columns.length]), (rows, componentId) => {
            var unshownData = this.getUnshownDataForComponent(componentId);
            var data = unshownData.data.slice();

            var axisDimension = this.dimensionStore.getAxisDimension();
            var columns = this.dimensionStore.getColumnDimensions();

            var columnIndexMap = _.map(unshownData.sets, dimension => {
                var index = _.findIndex(columns, col => col.setId === dimension.id && col.index === dimension.index);
                if (index < 0)
                    return null;
                return index + 1;
            });
            var coordinateFunction = (row: (string | number)[], valueIndex?: number) => {
                return _.map(unshownData.sets, (dimension, index) => {
                    var mappedColumnIndex = columnIndexMap[index];
                    if (mappedColumnIndex)
                        return row[mappedColumnIndex].toString();
                    if (axisDimension.setId === dimension.id && axisDimension.index === dimension.index) {
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
                    const val = +row[valueColumnIndex];
                    if (this.valueSameAsDefault(val, unshownData))
                        return;
                    const coordinates = coordinateFunction(row);
                    data.push({
                        c: coordinates,
                        v: val,
                    });
                } else {
                    for (let i = 0; i < axisDimension.values.length; i++) {
                        const val = +row[axisColumnsStartIndex + i];
                        if (this.valueSameAsDefault(val, unshownData))
                            continue;
                        const coordinates = coordinateFunction(row, i);
                        data.push({
                            c: coordinates,
                            v: val,
                        });
                    }
                }
            });

            return this.constructFullDataForComponent(unshownData, data);
        });
    }

    asTextFile: () => string[] = () => {
        var res = [];
        res.push(`${this.spreadsheetSettings.colHeaders.slice(0, this.spreadsheetSettings.columns.length).join(',')}\r\n`);
        _.forEach(this.spreadsheetItems, row => {
            var values = _.map(row.slice(0, this.spreadsheetSettings.columns.length), val => {
                return val === '-' ? '' : val;
            });
            res.push(`${values.join(',')}\r\n`);
        });
        return res;
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
        return _.find(this.datas, pd => pd.parameterId === componentId);
    }

    getUnshownDataForComponent = (componentId: string) => {
        return _.find(this.unshownData, pd => pd.parameterId === componentId);
    }

    getDefaultDataForComponent = (component: IParameter) => {
        return {                    //TODO: fix no data cases
            modelId: this.modelId,
            scenarioId: this.scenarioId,
            parameterId: component.id,
            defaultValue: component.defaultValue,
            sets: _.map(component.sets, (setId, index) => {
                var instanceIndex = _(component.sets).slice(0, index).filter(sId => sId === setId).value().length;
                return {
                    id: setId,
                    index: instanceIndex,
                }
            }),
            data: [],
        };
    }

    getRemainingDataForComponent = (data: IParameterData, remainingItems: IDimensionalDataItem[]) => {
        return {
            modelId: data.modelId,
            scenarioId: data.scenarioId,
            parameterId: data.parameterId,
            defaultValue: data.defaultValue,
            sets: data.sets,
            data: remainingItems,
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
        return value === data.defaultValue;
    }
}

export class VariableResultCsv extends CsvData<IVariable, IVariableResult> {
    protected datas: IVariableResult[];

    constructor(modelId: string, scenarioId: string, variables: IVariable[], sets: ISet[], variableResults: IVariableResult[], setDatas: ISetData[]) {
        super(modelId, scenarioId, variables, sets, variableResults, setDatas);
        this.typeColumnName = 'Variable';
        this.allColumnsReadOnly = true;

        this.showSpreadsheet();
    }

    getDataForComponent = (componentId: string) => {
        return _.find(this.datas, pd => pd.variableId === componentId);
    }

    getUnshownDataForComponent = (componentId: string) => {
        return _.find(this.unshownData, pd => pd.variableId === componentId);
    }

    getDefaultDataForComponent = (component: IVariable) => {
        return {                    //TODO: fix no data cases
            modelId: this.modelId,
            scenarioId: this.scenarioId,
            variableId: component.id,
            defaultValue: null,
            sets: _.map(component.sets, (setId, index) => {
                var instanceIndex = _(component.sets).slice(0, index).filter(sId => sId === setId).value().length;
                return {
                    id: setId,
                    index: instanceIndex,
                }
            }),
            data: [],
        };
    }

    getRemainingDataForComponent = (data: IVariableResult, remainingItems: IDimensionalDataItem[]) => {
        return {
            modelId: data.modelId,
            scenarioId: data.scenarioId,
            variableId: data.variableId,
            defaultValue: data.defaultValue,
            sets: data.sets,
            data: remainingItems,
        }
    }

    getDefaultValueForData = (data: IVariableResult) => {
        return data.defaultValue;
    }

    constructFullDataForComponent = (data: IVariableResult, dataArray: IDimensionalDataItem[]) => {
        return {
            modelId: this.modelId,
            scenarioId: this.scenarioId,
            variableId: data.variableId,
            defaultValue: data.defaultValue,
            sets: data.sets,
            data: dataArray,
        };
    }

    valueSameAsDefault = (value: number, data: IVariableResult) => {
        return value === data.defaultValue;
    }
}

class CsvDimensionStore {
    private readonly dimensions: IDimension[];
    private readonly components: IDimensionalComponent[];
    private readonly setDatas: setDataModel.SetData[];
    private axisDimension: IDimension;

    constructor(modelId: string, sets: ISet[], setDatas: ISetData[], components: IDimensionalComponent[]) {
        this.dimensions = [];
        this.components = components;
        this.setDatas = _.map(sets, set => {
            var setData = _.find(setDatas, sd => sd.setId === set.id);
            return new setDataModel.SetData(modelId, set, setData);
        });
        _.forEach(components, component => {
            _.forEach(component.sets, (setId, i) => {
                var previousSetIds = component.sets.slice(0, i);
                var index = _.filter(previousSetIds, psId => psId === setId).length;
                var dimension = _.find(this.dimensions, d => d.setId === setId && d.index === index);
                if (dimension) {
                    return;
                }
                var setData = _.find(this.setDatas, sd => sd.setId === setId);
                dimension = {
                    setId: setId,
                    index: index,
                    name: setData.setName,
                    numeric: setData.numeric,
                    values: _.map(setData.getValueNamePairs(), valueName => {
                        var onlyDisplayValue = valueName.value === valueName.name || !valueName.name;
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
        if (this.dimensions.length === 0)
            return;
        var numericSets = _.filter(this.setDatas, s => s.numeric);
        var initialSet = numericSets.length ? _.maxBy(numericSets, s => s.getValueCount()) : _.maxBy(this.setDatas, s => s.getValueCount());
        this.setAxisSet(initialSet.setId);
    }

    setAxisSet = (setId: string) => {
        this.axisDimension = _.find(this.dimensions, d => d.setId === setId && d.index === 0);
    }

    getDimensionsForComponent = (component: IDimensionalComponent) => {
        return _.map(component.sets, (setId, i) => {
            var previousSetIds = component.sets.slice(0, i);
            var index = _.filter(previousSetIds, psId => psId === setId).length;
            return _.find(this.dimensions, d => d.setId === setId && d.index === index);
        });
    }

    getAxisDimension = () => {
        return this.axisDimension;
    }

    getColumnDimensions = () => {
        return _.filter(this.dimensions, d => d !== this.getAxisDimension());
    }

    getAllDimensions = () => {
        return this.dimensions;
    }

    needsValueColumn = () => {
        if (this.axisDimension == null)
            return true;
        return !_.every(this.components, c => _.some(c.sets, sId => sId === this.axisDimension.setId));
    }
}