import $ = require('jquery');
import application = require('application');
import modelModel = require('models/model')
import setService = require('services/setService');
import parameterService = require('services/parameterService');
import variableService = require('services/variableService');
import objectiveFunctionService = require('services/objectiveFunctionService');
import constraintService = require('services/constraintService');
import modelService = require('services/modelService');

var forceLoad = [setService, parameterService, variableService, objectiveFunctionService, constraintService, modelService];

export interface IModelDataScope extends ng.IScope {
    setOrderProp: string;
    parameterOrderProp: string;
    model: modelModel.Model;
}

export class ModelDataController {
    constructor($scope: IModelDataScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        SetService: ng.resource.IResourceClass<ISetResource>, ParameterService: angular.resource.IResourceClass<IParameterResource>,
        VariableService: angular.resource.IResourceClass<IVariableResource>, ObjectiveFunctionService: angular.resource.IResourceClass<IObjectiveFunctionResource>,
        ConstraintService: angular.resource.IResourceClass<IConstraintResource>, ModelService: angular.resource.IResourceClass<IModelResource>
    ) {
        var setReq = SetService.query().$promise;
        var parameterReq = ParameterService.query().$promise;
        var variableReq = VariableService.query().$promise;
        var objectiveFunctionReq = ObjectiveFunctionService.query().$promise;
        var constraintReq = ConstraintService.query().$promise;
        var modelReq = ModelService.get({ id: $routeParams['id'] }).$promise;

        $q.all([setReq, parameterReq, variableReq, objectiveFunctionReq, constraintReq, modelReq]).then(res => {
            $scope.model = new modelModel.Model(<ISet[]>res[0], <IParameter[]>res[1], <IVariable[]>res[2], <IObjectiveFunction[]>res[3], <IConstraint[]>res[4], <IModel>res[5]);
        });

        $scope.setOrderProp = 'data.name';
        $scope.parameterOrderProp = 'data.name';
    }
}