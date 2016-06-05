import _ = require('lodash');
import application = require('application');

//import modelModel = require('models/model')

import variableModel = require('models/variable')
import variableResultModel = require('models/variableResult')

import modelService = require('services/modelService');
import scenarioService = require('services/scenarioService');
import variableService = require('services/variableService');
import setService = require('services/setService');
import setDataService = require('services/setDataService');
import variableResultService = require('services/variableResultService');

var forceLoad = [modelService, scenarioService, variableService, setService, setDataService, variableResultService];

export interface ICompareResultsScope extends ng.IScope {
    model: IModel;
    scenarios: IScenario[];
    scenario1: IScenario;
    scenario2: IScenario;
    variables: IVariable[];
    variable: IVariable;
    sets: ISet[];
    setData: ISetData[];
    scenario1VariableResult: variableResultModel.VariableResult;
    scenario2VariableResult: variableResultModel.VariableResult;
    updateComparison: () => void;
    updateGroupOptions: () => void;
    updateChart: () => void;
    legendVisible: boolean;
    toggleLegend: (any) => void;
    loading: boolean;
}

export class CompareResultsController {
    constructor($scope: ICompareResultsScope, $q: angular.IQService, $http: angular.IHttpService, $routeParams: angular.route.IRouteParamsService,
        ModelService: ng.resource.IResourceClass<IModelResource>, ScenarioService: ng.resource.IResourceClass<IScenarioResource>,
        VariableService: ng.resource.IResourceClass<IVariableResource>, SetService: ng.resource.IResourceClass<ISetResource>,
        SetDataService: ng.resource.IResourceClass<ISetDataResource>, VariableResultService: ng.resource.IResourceClass<IVariableResultResource>
    ) {
        $scope.loading = true;
        var modelId = $routeParams['modelId'];
        
        var modelReq = ModelService.get({ id: modelId }).$promise;
        var scenarioReq = ScenarioService.query({ modelId: modelId }).$promise;
        var variableReq = VariableService.query().$promise;
        var setReq = SetService.query().$promise;
        var setDataReq = SetDataService.query({ modelId: modelId }).$promise;

        $q.all([modelReq, scenarioReq, variableReq, setReq, setDataReq]).then(res => {
            $scope.model = <IModel>res[0];
            $scope.scenarios = <IScenario[]>res[1];
            $scope.scenario1 = _.first($scope.scenarios);
            $scope.scenario2 = _.last($scope.scenarios);
            var allVariables = <IVariable[]>res[2];
            var variables = _.filter(allVariables, variable => _.some($scope.model.variables, v => v == variable.id));
            $scope.variables = _.sortBy(variables, v => v.name);
            $scope.variables.unshift(<IVariable>{
                id: null,
                name: '',
            });
            $scope.variable = _.first($scope.variables);
            $scope.sets = <ISet[]>res[3];
            $scope.setData = <ISetData[]>res[4];
            $scope.loading = false;
        });

        $scope.updateComparison = () => {
            if ($scope.variable.id == null) {
                return;
            }
            $scope.loading = true;
            var variable = new variableModel.Variable($scope.sets, $scope.variable);
            var leftScenarioVariableResultPromise = VariableResultService.get({ id: $scope.variable.id, scenarioId: $scope.scenario1.id }).$promise;
            var rightScenarioVariableResultPromise = VariableResultService.get({ id: $scope.variable.id, scenarioId: $scope.scenario2.id }).$promise;
            var scenarioResultPromises = [leftScenarioVariableResultPromise, rightScenarioVariableResultPromise];
            $q.all(scenarioResultPromises).then((res: IVariableResultResource[]) => {
                var scenario1Result = res[0];
                var scenario2Result = res[1];
                $scope.scenario1VariableResult = new variableResultModel.VariableResult(variable, scenario1Result, $scope.sets, $scope.setData, true);
                $scope.scenario2VariableResult = new variableResultModel.VariableResult(variable, scenario2Result, $scope.sets, $scope.setData, true);
                $scope.scenario1VariableResult.toggleLegend($scope.legendVisible);
                $scope.scenario2VariableResult.toggleLegend($scope.legendVisible);
                setRangeAndDraw();
                $scope.loading = false;
            });
        }

        $scope.updateGroupOptions = () => {
            $scope.scenario2VariableResult.xSet = $scope.scenario1VariableResult.xSet;
            $scope.scenario1VariableResult.updateGroupOptions();
            $scope.scenario2VariableResult.updateGroupOptions();
            setRangeAndDraw();
        }

        $scope.updateChart = () => {
            $scope.scenario2VariableResult.groupSet = $scope.scenario1VariableResult.groupSet;
            $scope.scenario1VariableResult.updateChart();
            $scope.scenario2VariableResult.updateChart();
            setRangeAndDraw();
        }

        $scope.legendVisible = true;
        $scope.toggleLegend = $event => {
            var checkbox = <ICheckbox>$event.target;
            $scope.legendVisible = checkbox.checked;
            $scope.scenario1VariableResult.toggleLegend($scope.legendVisible);
            $scope.scenario2VariableResult.toggleLegend($scope.legendVisible);
        }

        var setRangeAndDraw = () => {
            var min1 = $scope.scenario1VariableResult.getMinY();
            var min2 = $scope.scenario2VariableResult.getMinY();
            var max1 = $scope.scenario1VariableResult.getMaxY();
            var max2 = $scope.scenario2VariableResult.getMaxY();
            var minY = _.min([min1, min2]);
            var maxY = _.max([max1, max2]);
            $scope.scenario1VariableResult.setYRange(minY, maxY);
            $scope.scenario2VariableResult.setYRange(minY, maxY);
            $scope.scenario1VariableResult.draw();
            $scope.scenario2VariableResult.draw();
        };
    }
}

interface ICheckbox {
    checked: boolean;
}