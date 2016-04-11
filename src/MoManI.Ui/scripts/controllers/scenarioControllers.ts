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
import tree = require('models/tree');

var forceLoad = [setService, parameterService, variableService, objectiveFunctionService, constraintGroupService, constraintService, modelService, scenarioService];

export interface IScenarioListScope extends ng.IScope {
    scenarios: angular.resource.IResourceArray<IScenario>;
    scenarioTrees: any[];
    expandableProperty: any;
    treeCols: any[];
    downloadExec: (scenarioId: string) => void;
    clone: (scenarioId: string) => void;
    delete: (scenarioId: string) => void;
}

export interface IScenarioDetailsScope extends ng.IScope {
    parameterOrderProp: string;
    model: modelModel.Model;
    scenario: scenarioModel.Scenario;
    save: () => void;
}

export class ScenarioListController {
    modelId: string;
    $scope: IScenarioListScope;
    $q: angular.IQService;
    ScenarioService: angular.resource.IResourceClass<IScenarioResource>

    constructor(
        $scope: IScenarioListScope, $q: angular.IQService, $http: angular.IHttpService, $routeParams: angular.route.IRouteParamsService, $modal: angular.ui.bootstrap.IModalService,
        ScenarioService: angular.resource.IResourceClass<IScenarioResource>
    ) {
        this.modelId = $routeParams['modelId'];
        this.$scope = $scope;
        this.$q = $q;
        this.ScenarioService = ScenarioService;

        this.loadScenarios();

        $scope.expandableProperty = {
            field: 'name',
            displayName: 'Name',
        };
        $scope.treeCols = [
            {
                field: 'description',
                displayName: 'Description',
            },
            {
                field: 'revision',
                displayName: 'Revision',
            },
            {
                field: 'id',
                displayName: '',
                cellTemplate: `<a href="#/models/${this.modelId}/{{row.branch[col.field]}}/data">Enter data</a>`,
            },
            {
                field: 'id',
                displayName: '',
                cellTemplate: `<a ng-click="cellTemplateScope.downloadExecutable(row.branch[col.field])">Download executable</a>`,
                cellTemplateScope: {
                    downloadExecutable: (scenarioId: string) => this.$scope.downloadExec(scenarioId)
                },
            },
            {
                field: 'id',
                displayName: '',
                cellTemplate: `<a ng-click="cellTemplateScope.clone(row.branch[col.field])">Clone revision</a>`,
                cellTemplateScope: {
                    clone: (scenarioId: string) => this.$scope.clone(scenarioId)
                },
            },
            {
                field: 'id',
                displayName: '',
                cellTemplate: `<a ng-if="row.branch.revision != 1" ng-click="cellTemplateScope.delete(row.branch[col.field])" confirm="Are you sure you want to delete the scenario {{row.branch.name}}? This will remove all of its associated data and results">Delete</a>`,
                cellTemplateScope: {
                    delete: (scenarioId: string) => this.$scope.delete(scenarioId)
                },
            },
        ];

        $scope.downloadExec = (scenarioId: string) => {
            var scenario = _.find($scope.scenarios, 'id', scenarioId);
            $modal.open({
                templateUrl: 'partials/render-executable.html',
                controller: executableRenderingControllers.ExecutableRenderingController,
                resolve: {
                    scenario() { return scenario; },
                }
            });
        }

        $scope.clone = (scenarioId: string) => {
            var cloneReq = $http({
                url: urls.scenarioCloning,
                method: 'POST',
                params: { id: scenarioId },
            });
            $q.when(cloneReq).then(() => {
                this.loadScenarios();
            });
        }

        $scope.delete = (scenarioId: string) => {
            ScenarioService.delete({ id: scenarioId }).$promise.then(() => {
                this.loadScenarios();
            });
        }
    }

    loadScenarios = () => {
        this.$scope.scenarioTrees = null;
        var scenarioPromise = this.ScenarioService.query({ modelId: this.modelId }).$promise;
        this.$q.when(scenarioPromise).then(scenarios => {
            this.$scope.scenarios = scenarios;
            this.$scope.scenarioTrees = tree.getTree(scenarios, 'id', 'parentScenarioId');
        });
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