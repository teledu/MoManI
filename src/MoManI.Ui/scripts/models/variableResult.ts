import _ = require('lodash');
import variableModel = require('models/variable')
import settingsModel = require('models/variableResultSettings');

interface ICoordinateData {
    x: string | number;
    y: number;
}

interface IChartGroupData {
    key: string | number;
    values: ICoordinateData[];
    color: string;
}

export class VariableResult {
    variableId: string;
    scenarioId: string;
    modelId: string;
    name: string;
    description: string;
    defaultValue: number;
    data: IDimensionalDataItem[];
    sets: ISet[];
    xSet: ISet;
    groupOptions: ISet[];
    groupSet: ISet;
    setData: ISetData[];
    variable: variableModel.Variable;

    private chartHeight: number;
    private pending: any;
    private chartOptions: any;
    private chartData: IChartGroup[];
    private legendVisible: boolean;
    private useSetValues: boolean;
    private groupDataHandler: (setData: ISetData) => void;
    private setDataFilters: string[];

    constructor(variable: variableModel.Variable, variableResult: IVariableResult, sets: ISet[], setData: ISetData[], withChart?: boolean, settings?: settingsModel.VariableResultSettings) {
        this.variableId = variableResult.variableId;
        this.scenarioId = variableResult.scenarioId;
        this.modelId = variableResult.modelId;
        this.variable = variable;
        this.name = variable.name;
        this.description = variable.description;
        this.defaultValue = variableResult.defaultValue;
        this.data = variableResult.data;
        this.sets = _.map(variable.sets, s => _.find(sets, ss => ss.id == s.value));
        this.setData = setData;
        if (withChart) {
            this.pending = {};
            this.xSet = _(this.sets).filter(s => s.numeric).first() || _.first(this.sets);
            this.updateGroupOptions();
            this.useSetValues = false;
            this.chartHeight = 450;
        }
        if (settings) {
            settings.addLegendSubscriber(this.toggleLegend);
            settings.addUseSetDataDescriptionSubscriber(this.toggleUseSetDataDescriptions);
            settings.addSetDataFilterSubscriber(this.changeSetDataFilters);
            settings.addChartHeightSubscriber(this.changeChartHeight);
            this.chartHeight = settings.chartHeight;
        }
    }

    xSetIndex = () => {
        return _.findIndex(this.sets, s => s.id == this.xSet.id);
    };

    groupSetIndex = () => {
        return this.groupSet != null ? _.findIndex(this.sets, s => s.id == this.groupSet.id) : null;
    };

    updateGroupOptions = () => {
        this.groupOptions = _.filter(this.sets, s => s.id != this.xSet.id);
        if (this.groupSet == null || !_.some(this.groupOptions, { id: this.groupSet.id })) {
            this.groupSet = _.first(this.groupOptions);
        }
        this.selectGrouping();
    }

    addGroupDataHandler = (handler: (setData: ISetData) => void) => {
        this.groupDataHandler = handler;
        if (this.groupSet) {
            var groupSetData = _.find(this.setData, sd => sd.setId == this.groupSet.id);
            this.groupDataHandler(groupSetData);
        }
    }

    changeSetDataFilters = (setDataValues: string[]) => {
        this.setDataFilters = setDataValues;
        this.updateChart();
    }

    changeChartHeight = (height: number) => {
        this.chartHeight = height;
        this.chartOptions.chart.height = height;
    }

    selectGrouping = () => {
        if (this.groupDataHandler) {
            var groupSetData = _.find(this.setData, sd => sd.setId == this.groupSet.id);
            this.groupDataHandler(groupSetData);
        }
        this.updateChart();
    }

    getUnfilteredChartData: () => IChartGroupData[] = () => {
        var axisSetData = _.find(this.setData, sd => sd.setId == this.xSet.id);
        var axisValues = _.map(axisSetData.items, i => i.value);
        var xSetIndex = this.xSetIndex();
        
        var groupSetId = this.groupSet ? this.groupSet.id : null;
        var groupSetData = _.find(this.setData, sd => sd.setId == groupSetId);
        if (!groupSetData) {
            var values = _.map(axisValues, k => {
                var axisPointValues = _.filter(this.data, d => d.c[xSetIndex] == k);
                return {
                    x: this.resolveSetDataText(this.xSet, k),
                    y: _.reduce(axisPointValues, (total, val) => total + val.v, 0),
                }
            });
            return [{
                key: this.name,
                values: values,
                color: '#1F77B4',
            }];
        }

        var groups = _.map(groupSetData.items, i => i.value);
        return _.map(groups, group => {
            var groupData = _.filter(this.data, d => d.c[this.groupSetIndex()] == group);
            var values = _.map(axisValues, k => {
                var axisPointValues = _.filter(groupData, d => d.c[xSetIndex] == k);
                return {
                    x: this.resolveSetDataText(this.xSet, k),
                    y: _.reduce(axisPointValues, (total, val) => total + val.v, 0),
                }
            });
            return {
                key: this.resolveSetDataText(this.groupSet, group),
                values: values,
                color: this.resolveSetDataColor(this.groupSet, group),
            }
        });
    }

    updateChart = () => {
        this.pending.chartOptions = {
            chart: _.assign({}, defaultChartOptions),
        }
        this.pending.chartOptions.chart.type = this.xSet.numeric ? 'stackedAreaChart' : 'multiBarChart';
        this.pending.chartOptions.chart.yAxis.axisLabel = this.variable.unit;
        this.pending.chartOptions.chart.height = this.chartHeight;

        var unfilteredChartData = this.getUnfilteredChartData();
        this.pending.chartData = _.filter(unfilteredChartData, d => {
            if (!this.setDataFilters)
                return true;
            var namedSetDataFilters = _.map(this.setDataFilters, s => this.resolveSetDataText(this.groupSet, s));
            return _.includes(namedSetDataFilters, d.key);
        });
    }

    getMinY = () => {
        var allValues = _.map(this.pending.chartData, (cd: IChartGroup) => {
            return cd.values;
        });
        var flatValues = _.flatten(allValues);
        if (this.xSet.numeric) {    // stackedAreaChart
            var groupedValues = _.groupBy(flatValues, fv => {
                return fv.x;
            });
            var groupSums = _.map(groupedValues, gv => {
                return _.sumBy(gv, (val: IChartValue) => {
                    return val.y;
                });
            });
            var minSum = _.min(groupSums);
            return minSum < 0 ? roundUp(minSum) : 0;
        } else {                    // multiBarChart
            var min = _.minBy(flatValues, fv => fv.y);
            return min.y < 0 ? roundUp(min.y) : 0;
        }
    }

    getMaxY = () => {
        var allValues = _.map(this.pending.chartData, (cd: IChartGroup) => {
            return cd.values;
        });
        var flatValues = _.flatten(allValues);
        if (this.xSet.numeric) {    // stackedAreaChart
            var groupedValues = _.groupBy(flatValues, fv => {
                return fv.x;
            });
            var groupSums = _.map(groupedValues, gv => {
                return _.sumBy(gv, (val: IChartValue) => {
                    return val.y;
                });
            });
            var maxSum = _.max(groupSums);
            return maxSum > 0 ? roundUp(maxSum) : 0;
        } else {                    // multiBarChart
            var max = _.maxBy(flatValues, fv => fv.y);
            return max.y > 0 ? roundUp(max.y) : 0;
        }
    }

    setYRange = (from: number, to: number) => {
        this.pending.chartOptions.chart.yDomain = [from, to];
    }

    clear = () => {
        this.chartOptions = null;
        this.chartData = null;
    }

    draw = () => {
        this.chartOptions = this.pending.chartOptions;
        this.chartData = this.pending.chartData;
    }

    resolveSetDataText = (set: ISet, value: string) => {
        if (set == null)
            return this.name;
        if (this.useSetValues) {
            return value;
        }
        var actualSetDataEntry = this.resolveSetDataEntry(set, value);
        if (actualSetDataEntry == null)
            return value;
        return set.numeric ? +actualSetDataEntry.value : actualSetDataEntry.name;
    }

    resolveSetDataColor = (set: ISet, value: string) => {
        var defaultColor = '#1F77B4';
        if (set == null)
            return defaultColor;
        var actualSetDataEntry = this.resolveSetDataEntry(set, value);
        if (actualSetDataEntry == null)
            return defaultColor;
        return actualSetDataEntry.color;
    }

    resolveSetDataEntry = (set: ISet, value: string) => {
        if (set == null)
            return null;
        var actualSetData = _.find(this.setData, sd => sd.setId == set.id);
        return _.find(actualSetData.items, i => i.value == value);
    }

    toggleLegend = (visible: boolean) => {
        defaultChartOptions.showControls = visible;
        defaultChartOptions.showLegend = visible;
        this.pending.chartOptions.chart.showControls = visible;
        this.pending.chartOptions.chart.showLegend = visible;
        if (this.chartOptions != null) {
            this.chartOptions.chart.showControls = visible;
            this.chartOptions.chart.showLegend = visible;
        }
    }

    toggleUseSetDataDescriptions = (useDescriptions: boolean) => {
        this.useSetValues = !useDescriptions;
        this.updateChart();
        var minY = this.getMinY();
        var maxY = this.getMaxY();
        this.setYRange(minY, maxY);
        this.draw();
    }
}

var roundUp = (input: number) => {
    if (input == 0)
        return 0;
    var negative = input < 0;
    if (negative)
        input = -input;
    var digits = Math.ceil(Math.log(input) / Math.log(10));
    var roundingMultiplier = Math.pow(10, digits - 2);
    var normalizedInput = input / roundingMultiplier;
    var roundedNormalizedInput = Math.ceil(normalizedInput);
    var roundedValue;
    if (roundingMultiplier > 1) {
        roundedValue = roundedNormalizedInput * roundingMultiplier;
    } else {
        var roundingDivisor = 1 / roundingMultiplier;
        roundedValue = roundedNormalizedInput / roundingDivisor;
    }
    return negative ? -roundedValue : roundedValue;
}

var defaultChartOptions = {
    margin: {
        top: 20,
        right: 20,
        bottom: 30,
        left: 60
    },
    x: (d) => {
        return d.x;
    },
    y: (d) => {
        return d.y;
    },
    useVoronoi: false,
    clipEdge: true,
    transitionDuration: 500,
    useInteractiveGuideline: true,
    xAxis: {
        showMaxMin: false,
    },
    yAxis: {
        showMaxMin: true,
    },
    showControls: true,
    showLegend: true,
    yDomain: null,
};