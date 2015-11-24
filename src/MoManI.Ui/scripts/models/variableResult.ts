import _ = require('lodash');
import variableModel = require('models/variable')

export class VariableResult {
    name: string;
    description: string;
    data: IVariableResultItem[];
    sets: ISet[];
    xSet: ISet;
    groupOptions: ISet[];
    groupSet: ISet;

    private chartOptions: any;
    private chartData: IChartGroup[];

    constructor(variable: variableModel.Variable, variableResult: IVariableResult, sets: ISet[], setDatas: ISetData[]) {
        this.name = variable.name;
        this.description = variable.description;
        this.data = variableResult.data;
        this.sets = _.map(variable.sets, s => _.find(sets, 'id', s.value));
        this.xSet = _(this.sets).filter(s => s.numeric).first() || _.first(this.sets);
        this.updateGroupOptions();
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
        this.updateChart();
    }

    updateChart = () => {
        this.chartOptions = {
            chart: _.assign({}, defaultChartOptions),
        }
        this.chartOptions.chart.type = this.xSet.numeric ? 'stackedAreaChart' : 'multiBarChart';
        this.chartData = _(this.data).groupBy(d => {
            return this.groupSet != null ? d.c[this.groupSetIndex()] : this.name;
        }).map((group: IVariableResultItem[], key: string) => {
            return {
                key: key,
                values: _(group).groupBy(v => {
                    return v.c[this.xSetIndex()];
                }).map((g: IVariableResultItem[], k: string) => {
                    return {
                        x: this.xSet.numeric ? +k : k,
                        y: _.reduce(g, (total: number, val: IVariableResultItem) => {
                            return total + val.v;
                        }, 0),
                    };
                }).value(),
            };
        }).value();
    }
}

var defaultChartOptions = {
    height: 450,
    margin: {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
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
        showMaxMin: true,
    },
    yAxis: {
        
    }
};