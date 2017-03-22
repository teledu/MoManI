import $ = require('jquery');
import _ = require('lodash');
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
    loading: boolean;
}

export interface IScenarioDetailsScope extends ng.IScope {
    parameterOrderProp: string;
    model: modelModel.Model;
    scenario: scenarioModel.Scenario;
    save: () => void;
    loading: boolean;
}

export interface ISetListDataScope extends ng.IScope {
    modelId: string;
    scenarioId: string;
    sets: ISetWithParameters[];
    setOrderProp: string;
    parameterOrderProp: string;
    loading: boolean;
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
        $scope.loading = true;
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
                cellTemplate: `<a ng-if="row.branch.revision != 1" ng-click="cellTemplateScope.delete(row.branch[col.field])" confirm="Are you sure you want to delete the scenario {{row.branch.name}}? This will remove all the associated data and results of this and any daughter scenarios">Delete</a>`,
                cellTemplateScope: {
                    delete: (scenarioId: string) => this.$scope.delete(scenarioId)
                },
            },
        ];

        $scope.downloadExec = (scenarioId: string) => {
            var scenario = _.find($scope.scenarios, s => s.id == scenarioId);
            $modal.open({
                templateUrl: 'partials/render-executable.html',
                controller: executableRenderingControllers.ExecutableRenderingController,
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    scenario() { return scenario; },
                }
            });
        }

        $scope.clone = (scenarioId: string) => {
            $scope.loading = true;
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
            $scope.loading = true;
            ScenarioService.delete({ id: scenarioId }).$promise.then(() => {
                this.loadScenarios();
            });
        }
    }

    loadScenarios = () => {
        this.$scope.loading = true;
        this.$scope.scenarioTrees = null;
        var scenarioPromise = this.ScenarioService.query({ modelId: this.modelId }).$promise;
        this.$q.when(scenarioPromise).then(scenarios => {
            this.$scope.scenarios = scenarios;
            this.$scope.scenarioTrees = tree.getTree(scenarios, 'id', 'parentScenarioId');
            this.$scope.loading = false;
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
        $scope.loading = true;
        var modelId = $routeParams['modelId'];
        var scenarioId = $routeParams['scenarioId'];
        var setReq = SetService.query().$promise;
        var parameterReq = ParameterService.query().$promise;
        var variableReq = VariableService.query().$promise;
        var objectiveFunctionReq = ObjectiveFunctionService.query().$promise;
        var constraintGroupReq = ConstraintGroupService.query().$promise;
        var constraintReq = ConstraintService.query().$promise;
        var modelReq = ModelService.get({ id: modelId}).$promise;
        var scenarioReq = ScenarioService.get({ modelId: modelId, id: scenarioId}).$promise;

        $q.all([scenarioReq]).then(res => {
            $scope.scenario = new scenarioModel.Scenario(<IScenario>res[0]);
        });
        $q.all([setReq, parameterReq, variableReq, objectiveFunctionReq, constraintGroupReq, constraintReq, modelReq]).then(res => {
            $scope.model = new modelModel.Model(<ISet[]>res[0], <IParameter[]>res[1], <IVariable[]>res[2], <IObjectiveFunction[]>res[3], <IConstraintGroup[]>res[4], <IConstraint[]>res[5], <IModel>res[6]);
            $scope.loading = false;
        });
        
        $scope.parameterOrderProp = 'data.name';

        $scope.save = () => {
            $scope.loading = true;
            ScenarioService.save($scope.scenario.serialize()).$promise.finally(() => {
                $scope.loading = false;
            });
        }
    }
}

export class SetListController {
    constructor($scope: ISetListDataScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        SetService: ng.resource.IResourceClass<ISetResource>, ParameterService: angular.resource.IResourceClass<IParameterResource>,
        VariableService: angular.resource.IResourceClass<IVariableResource>, ObjectiveFunctionService: angular.resource.IResourceClass<IObjectiveFunctionResource>,
        ConstraintGroupService: angular.resource.IResourceClass<IConstraintGroupResource>, ConstraintService: angular.resource.IResourceClass<IConstraintResource>,
        ModelService: angular.resource.IResourceClass<IModelResource>
    ) {
        $scope.loading = true;
        $scope.modelId = $routeParams['modelId'];
        $scope.scenarioId = $routeParams['scenarioId'];
        var setId = $routeParams['setId'];
        var setReq = SetService.query().$promise;
        var parameterReq = ParameterService.query().$promise;
        var variableReq = VariableService.query().$promise;
        var objectiveFunctionReq = ObjectiveFunctionService.query().$promise;
        var constraintGroupReq = ConstraintGroupService.query().$promise;
        var constraintReq = ConstraintService.query().$promise;
        var modelReq = ModelService.get({ id: $scope.modelId }).$promise;

        $scope.setOrderProp = 'name';
        $scope.parameterOrderProp = 'name';

        $q.all([setReq, parameterReq, variableReq, objectiveFunctionReq, constraintGroupReq, constraintReq, modelReq]).then(res => {
            var model = new modelModel.Model(<ISet[]>res[0], <IParameter[]>res[1], <IVariable[]>res[2], <IObjectiveFunction[]>res[3], <IConstraintGroup[]>res[4], <IConstraint[]>res[5], <IModel>res[6]);

            var parameters = _.map(model.selectedParameters(), p => {
                return {
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    setIds: _.map(p.sets, s => s.value),
                };
            });
            $scope.sets = _.map(model.selectedSets(), s => {
                return {
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    parameters: _.filter(parameters, p => _.includes(p.setIds, s.id)),
                    expanded: s.id == setId,
                };
            });
            $scope.loading = false;
        });
    }
}

export interface ISetWithParameters {
    id: string;
    name: string;
    description: string;
    parameters: IDependentParameter[];
    expanded: boolean;
}

export interface IDependentParameter {
    id: string;
    name: string;
    description: string;
    setIds: string[];
}