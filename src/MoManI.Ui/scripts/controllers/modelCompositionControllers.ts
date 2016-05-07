import $ = require('jquery');
import application = require('application');
import modelModel = require('models/model')
import setService = require('services/setService');
import parameterService = require('services/parameterService');
import variableService = require('services/variableService');
import objectiveFunctionService = require('services/objectiveFunctionService');
import constraintService = require('services/constraintService');
import constraintGroupService = require('services/constraintGroupService');
import modelService = require('services/modelService');

var forceLoad = [setService, parameterService, variableService, objectiveFunctionService, constraintGroupService, constraintService, modelService];

export interface IModelDetailsScope extends ng.IScope {
    model: modelModel.Model;
    detailsForm: angular.IFormController;
    save: () => void;
    loading: boolean;
}

export class ModelCompositionController {
    constructor($scope: IModelDetailsScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        SetService: ng.resource.IResourceClass<ISetResource>, ParameterService: angular.resource.IResourceClass<IParameterResource>,
        VariableService: angular.resource.IResourceClass<IVariableResource>, ObjectiveFunctionService: angular.resource.IResourceClass<IObjectiveFunctionResource>,
        ConstraintGroupService: angular.resource.IResourceClass<IConstraintGroupResource>, ConstraintService: angular.resource.IResourceClass<IConstraintResource>,
        ModelService: angular.resource.IResourceClass<IModelResource>
    ) {
        $scope.loading = true;
        var setReq = SetService.query().$promise;
        var parameterReq = ParameterService.query().$promise;
        var variableReq = VariableService.query().$promise;
        var objectiveFunctionReq = ObjectiveFunctionService.query().$promise;
        var constraintGroupReq = ConstraintGroupService.query().$promise;
        var constraintReq = ConstraintService.query().$promise;
        var modelReq;
        if ($routeParams['id'] === 'new') {
            var deferred = $q.defer();
            modelReq = deferred.promise;
            deferred.resolve(null);
        } else {
            modelReq = ModelService.get({ id: $routeParams['id'] }).$promise;
        }

        $q.all([setReq, parameterReq, variableReq, objectiveFunctionReq, constraintGroupReq, constraintReq, modelReq]).then(res => {
            $scope.model = new modelModel.Model(<ISet[]>res[0], <IParameter[]>res[1], <IVariable[]>res[2], <IObjectiveFunction[]>res[3], <IConstraintGroup[]>res[4], <IConstraint[]>res[5], <IModel>res[6]);
        }).finally(() => {
            $scope.loading = false;
        });

        $scope.save = () => {
            if ($scope.detailsForm.$invalid)
                return;
            $scope.loading = true;
            ModelService.save($scope.model.serialize()).$promise.then(() => {
                $window.location.href = '#/models';
            }).catch(() => {
                alert('An error occured');
            }).finally(() => {
                $scope.loading = false;
            });
        }
    }
}