import $ = require('jquery');
import application = require('application');
import modelService = require('services/modelService');
import scenarioService = require('services/scenarioService');

var forceLoad =  [modelService, scenarioService];

export interface IResultModelListScope extends ng.IScope {
    orderProp: string;
    models: angular.resource.IResourceArray<IModel>;
}

export interface IResultScenarioListScope extends ng.IScope {
    orderProp: string;
    scenarios: angular.resource.IResourceArray<IScenario>;
}

export class ResultsModelListController {
    constructor($scope: IResultModelListScope, $q: angular.IQService, $http: angular.IHttpService,
        ModelService: ng.resource.IResourceClass<IModelResource>
    ) {
        $scope.models = ModelService.query();
        $scope.orderProp = 'name';
    }
}

export class ResultsScenarioListController {
    constructor($scope: IResultScenarioListScope, $routeParams: angular.route.IRouteParamsService, ScenarioService: angular.resource.IResourceClass<IScenarioResource>) {
        $scope.scenarios = ScenarioService.query({ modelId: $routeParams['modelId'] });
        $scope.orderProp = 'revision';
    }
}