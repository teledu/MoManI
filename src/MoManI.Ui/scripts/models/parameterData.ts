import _ = require('lodash');
import uuid = require('node-uuid');
import setDataModel = require('models/setData')

interface IDimensionItem {
    value: string;
    displayName: string;
}

interface IDimension {
    id: string;
    setId: string;
    index: number;
    name: string;
    values: IDimensionItem[];
}

interface IDataItem {
    dimensions: any[];
    value: string;
}

interface IIdValuePair {
    id: string;
    value: string;
}

class DimensionSelector {
    dimensions: IDimension[];
    selected: string;
    selectedDimension: IDimension;
    dimensionValue: string;
    update: () => void;
    selectorIndex: number;

    constructor(index: number, dimensions: IDimension[]) {
        this.selected = '';
        this.dimensions = dimensions;
        this.selectorIndex = index;
    }
}

export class ParameterData {
    scenarioId: string;
    modelId: string;
    parameter: IParameter;
    defaultValue: number;
    setDatas: setDataModel.SetData[];
    private dimensions: IDimension[];
    private dimensionSelectors: DimensionSelector[] = [];
    private dimensionValues: IIdValuePair[] = [];
    spreadsheetVisible: boolean;
    private colSet: IDimension;
    private rowSet: IDimension;
    columns: string[];
    rows: string[];
    spreadsheetSettings: any;
    private data: IDataItem[];
    spreadsheetItems: number[]|string[][] = [];
    private otherItems: IDataItem[];


    constructor(scenarioId: string, modelId: string, parameter: IParameter, setDatas: setDataModel.SetData[], parameterData?: IParameterData) {
        this.scenarioId = scenarioId;
        this.modelId = modelId;
        this.parameter = parameter;
        this.setDatas = setDatas;
        this.dimensions = _.map(setDatas, (setData, index) => {
            var instanceIndex = _(setDatas).slice(0, index).filter(d => d.setId == setData.setId).value().length;
            return {
                id: uuid.v4(),
                setId: setData.setId,
                name: setData.setName,
                index: instanceIndex,
                values: _.map(setData.getValueNamePairs(), valueName => {
                    var onlyDisplayValue = valueName.value == valueName.name || !valueName.name;
                    return {
                        value: valueName.value,
                        displayName: onlyDisplayValue ? valueName.value : `${valueName.value} (${valueName.name})`,
                    }
                }),
            }
        });
        if (parameterData.defaultValue != null) {
            this.defaultValue = parameterData.defaultValue;
            this.data = _.map(parameterData.data, item => {
                var res = {
                    dimensions: [],
                    value: item.v.toString(),
                };
                _.forEach(item.c, (coordinate, index) => {
                    var dimensionId = this.dimensions[index].id;
                    res.dimensions[dimensionId] = coordinate;
                });
                return res;
            });
        } else {
            this.defaultValue = 0;
            this.data = [];
        }
        if (this.dimensions.length > 2) {
            this.dimensionSelectors.push(new DimensionSelector(this.dimensionSelectors.length, this.dimensions));
        } else {
            this.updateSpreadsheet(this.dimensions[0], this.dimensions[1]);
        }
    }

    updateDimensions = (index: number) => {
        this.saveSpreadsheetItems();
        this.dimensionSelectors = _.take(this.dimensionSelectors, index + 1);
        var changed = _.last(this.dimensionSelectors);
        if (changed.selected) {
            changed.selectedDimension = _.find(changed.dimensions, 'id', changed.selected);
            changed.dimensionValue = _.first(changed.selectedDimension.values).value;
            var availableDimensions = _.filter(this.dimensions, dimension => !_.some(this.dimensionSelectors, ds => ds.selected == dimension.id));
            if (availableDimensions.length > 2) {
                this.hideSpreadsheet();
                this.dimensionSelectors.push(new DimensionSelector(this.dimensionSelectors.length, availableDimensions));
            } else {
                this.dimensionValues = _(this.dimensionSelectors).filter(s => s.selected).map(s => { return { id: s.selected, value: s.dimensionValue } }).value();
                this.updateSpreadsheet(availableDimensions[0], availableDimensions[1]);
            }
        }
    }

    changeDimensionValue = () => {
        if (this.dimensions.length - _.filter(this.dimensionSelectors, sel => sel.selected).length <= 2) {
            this.saveSpreadsheetItems();
            this.dimensionValues = _.map(this.dimensionSelectors, s => { return { id: s.selected, value: s.dimensionValue } });
            this.updateSpreadsheet(this.rowSet, this.colSet);
        }
    }

    switchAxes = () => {
        this.spreadsheetVisible = false;
        this.saveSpreadsheetItems();
        this.updateSpreadsheet(this.colSet, this.rowSet);
    }

    serialize: () => IParameterData = () => {
        this.saveSpreadsheetItems();
        return {
            parameterId: this.parameter.id,
            scenarioId: this.scenarioId,
            modelId: this.modelId,
            defaultValue: this.defaultValue,
            sets: _.map(this.dimensions, dimension => {
                return {
                    id: dimension.setId,
                    index: dimension.index,
                }
            }),
            data: _(this.data).map(dataItem => {
                var numValue = +dataItem.value.trim().replace(',', '.');
                var value = isNaN(numValue) ? null : numValue;
                return {
                    c: _.map(this.dimensions, dimension => dataItem.dimensions[dimension.id]),
                    v: value,
                }
            }).filter(dataItem =>
                dataItem.v != this.defaultValue && dataItem.v != null
            ).value(),
        };
    }

    private hideSpreadsheet = () => {
        this.spreadsheetVisible = false;
        this.spreadsheetItems = [];
    }

    private updateSpreadsheet = (dimension1: IDimension, dimension2?: IDimension) => {
        if (this.spreadsheetItems.length > 0) {
            this.hideSpreadsheet();
            setTimeout(() => {
                this.setupSpreadsheet(dimension1, dimension2);
            }, 0);
        } else {
            this.setupSpreadsheet(dimension1, dimension2);
        }
    }

    private setupSpreadsheet(dimension1: IDimension, dimension2?: IDimension) {
        this.rowSet = dimension1;
        this.colSet = dimension2;
        var rowSetData = _.find(this.setDatas, 'setId', dimension1.setId);
        var colSetData = dimension2 ? _.find(this.setDatas, 'setId', dimension2.setId) : null;
        this.rows = rowSetData.getValues();
        this.columns = colSetData ? colSetData.getValues() : [null];
        this.spreadsheetSettings = {
            colHeaders: dimension2 ? this.columns : false,
            rowHeaders: this.rows,
            maxRows: this.rows.length,
        };
        this.spreadsheetItems = _.map(this.rows, () => {
            return _.map(this.columns, () => null);
        });
        this.otherItems = [];
        _.forEach(this.data, dataItem => {
            var isActual = _.every(this.dimensionValues, dimensionValue => {
                return dataItem.dimensions[dimensionValue.id] == dimensionValue.value;
            });
            if (isActual) {
                var rowIndex = _.indexOf(this.rows, dataItem.dimensions[this.rowSet.id]);
                var colIndex = this.colSet ? _.indexOf(this.columns, dataItem.dimensions[this.colSet.id]) : 0;
                if (rowIndex < 0 || colIndex < 0) return;
                this.spreadsheetItems[rowIndex][colIndex] = dataItem.value;
            } else {
                this.otherItems.push(dataItem);
            }
        });
        this.spreadsheetVisible = true;
    }

    saveSpreadsheetItems = () => {
        if (this.spreadsheetItems.length > 0) {
            this.data = this.otherItems;
            _.forEach(this.rows, (row, rowIndex) => {
                _.forEach(this.columns, (column, colIndex) => {
                    var val = this.spreadsheetItems[rowIndex][colIndex];
                    if (val != null && val != '') {
                        var dataItem = {
                            dimensions: [],
                            value: val,
                        }
                        _.forEach(this.dimensionValues, dimensionValue => {
                            dataItem.dimensions[dimensionValue.id] = dimensionValue.value;
                        });
                        dataItem.dimensions[this.rowSet.id] = this.rows[rowIndex];
                        if (this.colSet) {
                            dataItem.dimensions[this.colSet.id] = this.columns[colIndex];
                        }
                        this.data.push(dataItem);
                    }
                });
            });
        };
    }
}