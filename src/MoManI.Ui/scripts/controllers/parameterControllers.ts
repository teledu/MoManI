import application = require('application');
import _ = require('lodash');
import setService = require('services/setService');
import parameterModel = require('models/parameter');
import parameterService = require('services/parameterService');

var forceLoad = [setService, parameterService];

export interface IParameterListScope extends ng.IScope {
    orderProp: string;
    parameters: angular.resource.IResourceArray<IParameter>;
}

export interface IParameterDetailsScope extends ng.IScope {
    parameter: parameterModel.Parameter;
    detailsForm: angular.IFormController;
    save: () => void;
}

export class ParameterListController {
    constructor($scope: IParameterListScope, ParameterService: ng.resource.IResourceClass<IParameterResource>) {
        $scope.parameters = ParameterService.query();
        $scope.orderProp = 'name';
    }
}

export class ParameterDetailsController {
    constructor($scope: IParameterDetailsScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        SetService: ng.resource.IResourceClass<ISetResource>, ParameterService: angular.resource.IResourceClass<IParameterResource>
    ) {
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
        });

        $scope.save = () => {
            if ($scope.detailsForm.$invalid)
                return;
            ParameterService.save($scope.parameter.serialize(), () => {
                $window.location.href = '#/parameters';
            }, () => {
                alert('An error occured');
            });
        }
    }
}