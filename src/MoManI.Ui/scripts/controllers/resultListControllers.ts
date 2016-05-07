import $ = require('jquery');
import application = require('application');
import modelService = require('services/modelService');
import scenarioService = require('services/scenarioService');

var forceLoad =  [modelService, scenarioService];

export interface IResultModelListScope extends ng.IScope {
    orderProp: string;
    models: angular.resource.IResourceArray<IModel>;
    loading: boolean;
}

export interface IResultScenarioListScope extends ng.IScope {
    orderProp: string;
    scenarios: angular.resource.IResourceArray<IScenario>;
    loading: boolean;
}

export class ResultsModelListController {
    constructor($scope: IResultModelListScope, $q: angular.IQService, $http: angular.IHttpService,
        ModelService: ng.resource.IResourceClass<IModelResource>
    ) {
        $scope.loading = true;
        $scope.models = ModelService.query();
        $scope.models.$promise.finally(() => {
            $scope.loading = false;
        });
        $scope.orderProp = 'name';
    }
}

export class ResultsScenarioListController {
    constructor($scope: IResultScenarioListScope, $routeParams: angular.route.IRouteParamsService, ScenarioService: angular.resource.IResourceClass<IScenarioResource>) {
        $scope.loading = true;
        $scope.scenarios = ScenarioService.query({ modelId: $routeParams['modelId'] });
        $scope.scenarios.$promise.finally(() => {
            $scope.loading = false;
        });
        $scope.orderProp = 'revision';
    }
}