import $ = require('jquery');
import application = require('application');
import urls = require('urls');
import modelModel = require('models/model');
import scenarioModel = require('models/scenario');
import executableRenderingControllers = require('controllers/executableRenderingControllers');
import setService = require('services/setService');
import parameterService = require('services/parameterService');
import variableService = require('services/variableService');
import objectiveFunctionService = require('services/objectiveFunctionService');
import constraintGroupService = require('services/constraintGroupService');
import constraintService = require('services/constraintService');
import modelService = require('services/modelService');
import scenarioService = require('services/scenarioService');

var forceLoad = [setService, parameterService, variableService, objectiveFunctionService, constraintGroupService, constraintService, modelService, scenarioService];

export interface IScenarioListScope extends ng.IScope {
    orderProp: string;
    scenarios: angular.resource.IResourceArray<IScenario>;
    downloadExec: (scenario: IScenario) => void;
    clone: (scenario: IScenario) => void;
    delete: (scenario: IScenario) => void;
}

export interface IScenarioDetailsScope extends ng.IScope {
    parameterOrderProp: string;
    model: modelModel.Model;
    scenario: scenarioModel.Scenario;
    save: () => void;
}

export class ScenarioListController {
    constructor(
        $scope: IScenarioListScope, $q: angular.IQService, $http: angular.IHttpService, $routeParams: angular.route.IRouteParamsService, $modal: angular.ui.bootstrap.IModalService,
        ScenarioService: angular.resource.IResourceClass<IScenarioResource>
    ) {
        $scope.scenarios = ScenarioService.query({ modelId: $routeParams['modelId'] });
        $scope.orderProp = 'revision';

        $scope.downloadExec = (scenario: IScenario) => {
            $modal.open({
                templateUrl: 'partials/render-executable.html',
                controller: executableRenderingControllers.ExecutableRenderingController,
                resolve: {
                    scenario() { return scenario; },
                }
            });
        }

        $scope.clone = (scenario: IScenario) => {
            var cloneReq = $http({
                url: urls.scenarioCloning,
                method: 'POST',
                params: {id: scenario.id},
            });
            $q.when(cloneReq).then(() => {
                $scope.scenarios = ScenarioService.query({ modelId: $routeParams['modelId'] });
            });
        }

        $scope.delete = (scenario: IScenario) => {
            ScenarioService.delete({ id: scenario.id }).$promise.then(() => {
                $scope.scenarios = ScenarioService.query({ modelId: $routeParams['modelId'] });
            });
        }
    }
}

export class ScenarioDetailsController {
    constructor($scope: IScenarioDetailsScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        SetService: ng.resource.IResourceClass<ISetResource>, ParameterService: angular.resource.IResourceClass<IParameterResource>,
        VariableService: angular.resource.IResourceClass<IVariableResource>, ObjectiveFunctionService: angular.resource.IResourceClass<IObjectiveFunctionResource>,
        ConstraintGroupService: angular.resource.IResourceClass<IConstraintGroupResource>, ConstraintService: angular.resource.IResourceClass<IConstraintResource>,
        ModelService: angular.resource.IResourceClass<IModelResource>, ScenarioService: angular.resource.IResourceClass<IScenarioResource>
    ) {
        var setReq = SetService.query().$promise;
        var parameterReq = ParameterService.query().$promise;
        var variableReq = VariableService.query().$promise;
        var objectiveFunctionReq = ObjectiveFunctionService.query().$promise;
        var constraintGroupReq = ConstraintGroupService.query().$promise;
        var constraintReq = ConstraintService.query().$promise;
        var modelReq = ModelService.get({ id: $routeParams['modelId'] }).$promise;
        var scenarioReq = ScenarioService.get({ modelId: $routeParams['modelId'], id: $routeParams['scenarioId'] }).$promise;

        $q.all([scenarioReq]).then(res => {
            $scope.scenario = new scenarioModel.Scenario(<IScenario>res[0]);
        });
        $q.all([setReq, parameterReq, variableReq, objectiveFunctionReq, constraintGroupReq, constraintReq, modelReq]).then(res => {
            $scope.model = new modelModel.Model(<ISet[]>res[0], <IParameter[]>res[1], <IVariable[]>res[2], <IObjectiveFunction[]>res[3], <IConstraintGroup[]>res[4], <IConstraint[]>res[5], <IModel>res[6]);
        });
        
        $scope.parameterOrderProp = 'data.name';

        $scope.save = () => {
            ScenarioService.save($scope.scenario.serialize());
        }
    }
}