import application = require('application');
import _ = require('lodash');
import setService = require('services/setService');
import parameterModel = require('models/parameter');
import parameterService = require('services/parameterService');

var forceLoad = [setService, parameterService];

export interface IParameterListScope extends ng.IScope {
    orderProp: string;
    parameters: angular.resource.IResourceArray<IParameter>;
    loading: boolean;
}

export interface IParameterDetailsScope extends ng.IScope {
    parameter: parameterModel.Parameter;
    detailsForm: angular.IFormController;
    save: () => void;
    loading: boolean;
}

export class ParameterListController {
    constructor($scope: IParameterListScope, ParameterService: ng.resource.IResourceClass<IParameterResource>) {
        $scope.loading = true;
        $scope.parameters = ParameterService.query();
        $scope.parameters.$promise.finally(() => {
            $scope.loading = false;
        });
        $scope.orderProp = 'name';
    }
}

export class ParameterDetailsController {
    constructor($scope: IParameterDetailsScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        SetService: ng.resource.IResourceClass<ISetResource>, ParameterService: angular.resource.IResourceClass<IParameterResource>
    ) {
        $scope.loading = true;
        var setReq = SetService.query().$promise;
        var parameterReq;
        if ($routeParams['id'] === 'new') {
            var deferred = $q.defer();
            parameterReq = deferred.promise;
            deferred.resolve(null);
        } else {
            parameterReq = ParameterService.get({ id: $routeParams['id'] }).$promise;
        }

        $q.all([setReq, parameterReq]).then(res => {
            $scope.parameter = new parameterModel.Parameter(<ISet[]>res[0], <IParameter>res[1]);
            $scope.loading = false;
        });

        $scope.save = () => {
            if ($scope.detailsForm.$invalid)
                return;
            $scope.loading = true;
            ParameterService.save($scope.parameter.serialize(), () => {
                $window.location.href = '#/parameters';
            }, () => {
                alert('An error occured');
                $scope.loading = false;
            });
        }
    }
}