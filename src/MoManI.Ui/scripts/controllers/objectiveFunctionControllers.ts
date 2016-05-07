import $ = require('jquery');
import application = require('application');
import objectiveFunctionModel = require('models/objectiveFunction');
import setService = require('services/setService');
import parameterService = require('services/parameterService');
import variableService = require('services/variableService');
import objectiveFunctionService = require('services/objectiveFunctionService');

var forceLoad = [setService, parameterService, variableService, objectiveFunctionService];

export interface IObjectiveFunctionListScope extends ng.IScope {
    orderProp: string;
    objectiveFunctions: angular.resource.IResourceArray<IObjectiveFunction>;
    loading: boolean;
}

export interface IObjectiveFunctionDetailsScope extends ng.IScope {
    objectiveFunction: objectiveFunctionModel.ObjectiveFunction;
    detailsForm: angular.IFormController;
    save: () => void;
    loading: boolean;
}

export class ObjectiveFunctionListController {
    constructor($scope: IObjectiveFunctionListScope, ObjectiveFunctionService: ng.resource.IResourceClass<IObjectiveFunctionResource>) {
        $scope.loading = true;
        $scope.objectiveFunctions = ObjectiveFunctionService.query();
        $scope.objectiveFunctions.$promise.finally(() => {
            $scope.loading = false;
        });
        $scope.orderProp = 'name';
    }
}

export class ObjectiveFunctionDetailsController {
    constructor($scope: IObjectiveFunctionDetailsScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $modal: angular.ui.bootstrap.IModalService, $q: angular.IQService,
        SetService: ng.resource.IResourceClass<ISetResource>, ParameterService: angular.resource.IResourceClass<IParameterResource>,
        VariableService: angular.resource.IResourceClass<IVariableResource>, ObjectiveFunctionService: angular.resource.IResourceClass<IObjectiveFunctionResource>
    ) {
        $scope.loading = true;
        var setReq = SetService.query().$promise;
        var parameterReq = ParameterService.query().$promise;
        var variableReq = VariableService.query().$promise;
        var functionReq;
        if ($routeParams['id'] === 'new') {
            var deferred = $q.defer();
            functionReq = deferred.promise;
            deferred.resolve(null);
        } else {
            functionReq = ObjectiveFunctionService.get({ id: $routeParams['id'] }).$promise;
        }

        $q.all([setReq, parameterReq, variableReq, functionReq]).then(res => {
            var data: IEquationObjectData = {
                sets: <ISet[]>res[0],
                parameters: <IParameter[]>res[1],
                variables: <IVariable[]>res[2],
            };
            $scope.objectiveFunction = new objectiveFunctionModel.ObjectiveFunction(data, $modal, <IObjectiveFunction>res[3]);
            $scope.loading = false;
        });

        $scope.save = () => {
            if ($scope.detailsForm.$invalid)
                return;
            $scope.loading = true;
            ObjectiveFunctionService.save($scope.objectiveFunction.serialize(), () => {
                $window.location.href = '#/functions';
            }, () => {
                alert('An error occured');
                $scope.loading = false;
            });
        };

        $('.view-frame')
            .on('mouseover', '.equation-operator', function () {
                $(this).closest('.equation-composite').addClass('equation-composite-hovered');
                $(this).parent().parent().children('div').children('.equation-operator').addClass('equation-operator-hovered');
            })
            .on('mouseout', '.equation-operator', function () {
                $(this).closest('.equation-composite').removeClass('equation-composite-hovered');
                $(this).parent().parent().children('div').children('.equation-operator').removeClass('equation-operator-hovered');
            });
    }
}