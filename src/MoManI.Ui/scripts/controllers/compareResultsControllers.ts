import _ = require('lodash');
import application = require('application');

//import modelModel = require('models/model')

import variableModel = require('models/variable')
import variableResultModel = require('models/variableResult')

import modelService = require('services/modelService');
import scenarioService = require('services/scenarioService');
import variableService = require('services/variableService');
import setService = require('services/setService');
import variableResultService = require('services/variableResultService');

var forceLoad = [modelService, scenarioService, variableService, setService, variableResultService];

export interface ICompareResultsScope extends ng.IScope {
    model: IModel;
    scenarios: IScenario[];
    scenario1: IScenario;
    scenario2: IScenario;
    variables: IVariable[];
    variable: IVariable;
    sets: ISet[];
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
        VariableResultService: ng.resource.IResourceClass<IVariableResultResource>
    ) {
        $scope.loading = true;
        var modelId = $routeParams['modelId'];
        
        var modelReq = ModelService.get({ id: modelId }).$promise;
        var scenarioReq = ScenarioService.query({ modelId: modelId }).$promise;
        var variableReq = VariableService.query().$promise;
        var setReq = SetService.query().$promise;

        $q.all([modelReq, scenarioReq, variableReq, setReq]).then(res => {
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
            $scope.loading = false;
        });

        $scope.updateComparison = () => {
            $scope.loading = true;
            if ($scope.variable.id == null)
                return;
            var variable = new variableModel.Variable($scope.sets, $scope.variable);
            var leftScenarioVariableResultPromise = VariableResultService.get({ id: $scope.variable.id, scenarioId: $scope.scenario1.id }).$promise;
            var rightScenarioVariableResultPromise = VariableResultService.get({ id: $scope.variable.id, scenarioId: $scope.scenario2.id }).$promise;
            var scenarioResultPromises = [leftScenarioVariableResultPromise, rightScenarioVariableResultPromise];
            $q.all(scenarioResultPromises).then((res: IVariableResultResource[]) => {
                var scenario1Result = res[0];
                var scenario2Result = res[1];
                $scope.scenario1VariableResult = new variableResultModel.VariableResult(variable, scenario1Result, $scope.sets);
                $scope.scenario1VariableResult.toggleLegend($scope.legendVisible);
                $scope.scenario2VariableResult = new variableResultModel.VariableResult(variable, scenario2Result, $scope.sets);
                $scope.scenario2VariableResult.toggleLegend($scope.legendVisible);
                $scope.loading = false;
            });
        }

        $scope.updateGroupOptions = () => {
            $scope.scenario2VariableResult.xSet = $scope.scenario1VariableResult.xSet;
            $scope.scenario1VariableResult.updateGroupOptions();
            $scope.scenario2VariableResult.updateGroupOptions();
        }

        $scope.updateChart = () => {
            $scope.scenario2VariableResult.groupSet = $scope.scenario1VariableResult.groupSet;
            $scope.scenario1VariableResult.updateChart();
            $scope.scenario2VariableResult.updateChart();
        }

        $scope.legendVisible = true;
        $scope.toggleLegend = $event => {
            var checkbox = <ICheckbox>$event.target;
            $scope.legendVisible = checkbox.checked;
            $scope.scenario1VariableResult.toggleLegend($scope.legendVisible);
            $scope.scenario2VariableResult.toggleLegend($scope.legendVisible);
        }
    }
}

interface ICheckbox {
    checked: boolean;
}