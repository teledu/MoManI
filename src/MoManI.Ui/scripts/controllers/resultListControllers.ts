import $ = require('jquery');
import application = require('application');
import modelResultModel = require('models/modelResult')
import modelResultService = require('services/modelResultService');
import variableService = require('services/variableService');

var forceLoad = [modelResultService, variableService];

export interface IResultListScope extends ng.IScope {
    orderProp: string;
    models: angular.resource.IResourceArray<IModelResult>;
}

export interface IVariableResultListScope extends ng.IScope {
    orderProp: string;
    model: modelResultModel.ModelResult;
}

export class ResultsListController {
    constructor($scope: IResultListScope, $q: angular.IQService, $http: angular.IHttpService,
        ModelResultService: ng.resource.IResourceClass<IModelResultResource>
    ) {
        $scope.models = ModelResultService.query();
        $scope.orderProp = 'name';
    }
}

export class ResultDetailsController {
    constructor($scope: IVariableResultListScope, $q: angular.IQService, $http: angular.IHttpService, $routeParams: angular.route.IRouteParamsService,
        ModelResultService: ng.resource.IResourceClass<IModelResultResource>, VariableService: angular.resource.IResourceClass<IVariableResource>
    ) {
        var modelResultReq = ModelResultService.get({ id: $routeParams['modelId'] }).$promise;
        var variableReq = VariableService.query().$promise;

        $q.all([modelResultReq, variableReq]).then(res => {
            var modelResult = <IModelResult>res[0];
            var variables = <IVariable[]>res[1];
            $scope.model = new modelResultModel.ModelResult(modelResult, variables);
        });
        $scope.orderProp = 'name';
    }
}