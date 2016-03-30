import $ = require('jquery');
import application = require('application');
import constraintListModel = require('models/constraintList');
import constraintModel = require('models/constraint');
import setService = require('services/setService');
import parameterService = require('services/parameterService');
import variableService = require('services/variableService');
import constraintGroupService = require('services/constraintGroupService');
import constraintService = require('services/constraintService');

var forceLoad = [setService, parameterService, variableService, constraintGroupService, constraintService];

export interface IConstraintListScope extends ng.IScope {
    constraintList: constraintListModel.ConstraintList;
    query: string;
    constraintFilter: (constraint: constraintListModel.ITableRow) => boolean;
}

export interface IConstraintDetailsScope extends ng.IScope {
    constraint: constraintModel.Constraint;
    enumerators: IEquationObjectSet[];
    detailsForm: angular.IFormController;
    save: () => void;
}

export class ConstraintListController {
    constructor(
        $scope: IConstraintListScope, $q: angular.IQService,
        ConstraintGroupService: angular.resource.IResourceClass<IConstraintGroupResource>, ConstraintService: ng.resource.IResourceClass<IConstraintResource>
    ) {
        var constraintGroupReq = ConstraintGroupService.query().$promise;
        var constraintReq = ConstraintService.query().$promise;
        $q.all([constraintGroupReq, constraintReq]).then(res => {
            var constraintGroups = <IConstraintGroup[]>res[0];
            var constraints = <IConstraint[]>res[1];
            $scope.constraintList = new constraintListModel.ConstraintList(constraintGroups, constraints);
        });
        $scope.query = '';
        $scope.constraintFilter = (constraint) => {
            if (constraint.constraintName == null) {
                return true;
            }
            if (constraint.name.indexOf($scope.query) > -1) {
                return true;
            }
            return false;
        }
    }
}

export class ConstraintDetailsController {
    constructor($scope: IConstraintDetailsScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $modal: angular.ui.bootstrap.IModalService, $q: angular.IQService,
        SetService: ng.resource.IResourceClass<ISetResource>, ParameterService: angular.resource.IResourceClass<IParameterResource>,
        VariableService: angular.resource.IResourceClass<IVariableResource>, ConstraintGroupService: angular.resource.IResourceClass<IConstraintGroupResource>,
        ConstraintService: angular.resource.IResourceClass<IConstraintResource>
    ) {
        var setReq = SetService.query().$promise;
        var parameterReq = ParameterService.query().$promise;
        var variableReq = VariableService.query().$promise;
        var constraintGroupReq = ConstraintGroupService.query().$promise;
        var constraintReq;
        if ($routeParams['id'] === 'new') {
            var deferred = $q.defer();
            constraintReq = deferred.promise;
            deferred.resolve(null);
        } else {
            constraintReq = ConstraintService.get({ id: $routeParams['id'] }).$promise;
        }

        $q.all([setReq, parameterReq, variableReq, constraintGroupReq, constraintReq]).then(res => {
            var data: IEquationObjectData = {
                sets: <ISet[]>res[0],
                parameters: <IParameter[]>res[1],
                variables: <IVariable[]>res[2],
            };
            $scope.constraint = new constraintModel.Constraint(data, $modal, <IConstraintGroup[]>res[3], <IConstraint>res[4]);
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