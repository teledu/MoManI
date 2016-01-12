import _ = require('lodash');
import application = require('application');
import variableModel = require('models/variable')
import variableResultModel = require('models/variableResult')
import setService = require('services/setService');
import variableService = require('services/variableService');
import scenarioService = require('services/scenarioService');
import variableResultService = require('services/variableResultService');

var forceLoad = [setService, variableService, scenarioService, variableResultService];

export interface IVariableResultListScope extends ng.IScope {
    scenario: IScenario;
    orderProp: string;
    variableResults: variableResultModel.VariableResult[];
}

export interface IVariableResultChartsScope extends ng.IScope {
    unsupportedDimensions: boolean;
    variableResult: variableResultModel.VariableResult;
    options: any;
    data: any[];
}

export class VariableResultListController {
    constructor($scope: IVariableResultListScope, $q: angular.IQService, $http: angular.IHttpService, $routeParams: angular.route.IRouteParamsService,
        SetService: ng.resource.IResourceClass<ISetResource>, VariableService: angular.resource.IResourceClass<IVariableResource>,
        ScenarioService: angular.resource.IResourceClass<IScenarioResource>, VariableResultService: ng.resource.IResourceClass<IVariableResultResource>
    ) {
        var modelId = $routeParams['modelId'];
        var scenarioId = $routeParams['scenarioId'];

        var scenarioReq = ScenarioService.get({ modelId: modelId, id: scenarioId }).$promise;
        var variableResultReq = VariableResultService.query({ scenarioId: scenarioId }).$promise;
        var variableReq = VariableService.query().$promise;
        var setsReq = SetService.query().$promise;

        $q.all([scenarioReq, variableResultReq, variableReq, setsReq]).then(res => {
            $scope.scenario = <IScenario>res[0];
            var variableResults = <IVariableResult[]>res[1];
            var variables = <IVariable[]>res[2];
            var sets = <ISet[]>res[3];
            $scope.variableResults = _.map(variableResults, variableResult => {
                var variable = new variableModel.Variable(sets, _.find(variables, 'id', variableResult.variableId));
                return new variableResultModel.VariableResult(variable, variableResult, sets);
            });
        });
        $scope.orderProp = 'name';
    }
}

export class VariableResultChartsController {
    constructor($scope: IVariableResultChartsScope, $q: angular.IQService, $http: angular.IHttpService, $routeParams: angular.route.IRouteParamsService,
        SetService: ng.resource.IResourceClass<ISetResource>, VariableService: ng.resource.IResourceClass<IVariableResource>,
        SetDataService: angular.resource.IResourceClass<ISetDataResource>, VariableResultService: ng.resource.IResourceClass<IVariableResultResource>
    ) {
        var modelId = $routeParams['modelId'];
        var scenarioId = $routeParams['scenarioId'];
        var variableId = $routeParams['variableId'];

        var variableReq = VariableService.get({ id: variableId }).$promise;

        $q.when(variableReq).then((variableRes: IVariable) => {

            var setsReq = SetService.query().$promise;
            var variableResultReq = VariableResultService.get({ id: variableId, scenarioId: scenarioId }).$promise;

            $q.all([setsReq, variableResultReq]).then(res => {
                var sets = <ISet[]>res[0];
                var variableResult = <IVariableResult>res[1];
                var variable = new variableModel.Variable(sets, variableRes);

                $scope.variableResult = new variableResultModel.VariableResult(variable, variableResult, sets);
            });

        });


    }
}