import $ = require('jquery');
import application = require('application');
import constraintModel = require('models/constraint');
import setService = require('services/setService');
import parameterService = require('services/parameterService');
import variableService = require('services/variableService');
import constraintService = require('services/constraintService');

var forceLoad = [setService, parameterService, variableService, constraintService];

export interface IConstraintListScope extends ng.IScope {
    orderProp: string;
    constraints: angular.resource.IResourceArray<IConstraint>;
}

export interface IConstraintDetailsScope extends ng.IScope {
    constraint: constraintModel.Constraint;
    enumerators: IEquationObjectSet[];
    detailsForm: angular.IFormController;
    save: () => void;
}

export class ConstraintListController {
    constructor($scope: IConstraintListScope, ConstraintService: ng.resource.IResourceClass<IConstraintResource>) {
        $scope.constraints = ConstraintService.query();
        $scope.orderProp = 'name';
    }
}

export class ConstraintDetailsController {
    constructor($scope: IConstraintDetailsScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $modal: angular.ui.bootstrap.IModalService, $q: angular.IQService,
        SetService: ng.resource.IResourceClass<ISetResource>, ParameterService: angular.resource.IResourceClass<IParameterResource>,
        VariableService: angular.resource.IResourceClass<IVariableResource>, ConstraintService: angular.resource.IResourceClass<IConstraintResource>
    ) {
        var setReq = SetService.query().$promise;
        var parameterReq = ParameterService.query().$promise;
        var variableReq = VariableService.query().$promise;
        var constraintReq;
        if ($routeParams['id'] === 'new') {
            var deferred = $q.defer();
            constraintReq = deferred.promise;
            deferred.resolve(null);
        } else {
            constraintReq = ConstraintService.get({ id: $routeParams['id'] }).$promise;
        }

        $q.all([setReq, parameterReq, variableReq, constraintReq]).then(res => {
            var data: IEquationObjectData = {
                sets: <ISet[]>res[0],
                parameters: <IParameter[]>res[1],
                variables: <IVariable[]>res[2],
            };
            $scope.constraint = new constraintModel.Constraint(data, $modal, <IConstraint>res[3]);
        });

        $scope.save = () => {
            if ($scope.detailsForm.$invalid)
                return;
            ConstraintService.save($scope.constraint.serialize(), () => {
                $window.location.href = '#/constraints';
            }, () => {
                alert('An error occured');
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