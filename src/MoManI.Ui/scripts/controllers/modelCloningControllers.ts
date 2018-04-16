
import $ = require('jquery');
import application = require('application');
import _ = require('lodash');
import urls = require('urls');
import scenarioService = require('services/scenarioService');
import modelCloningService = require('services/modelCloningService');

var forceLoad = [scenarioService, modelCloningService];

export interface IExecutableRenderingModalScope extends ng.IScope {
    scenarios: IScenario[];
    orderProp: string;
    selectedScenario: IScenario;
    selectedScenarios: string[];
    scenarioIds: string[];
    newName: string;
    clone: () => void;
    cancel: () => void;
    loading: boolean;
    cloneScenarioForm: angular.IFormController;
    cloningParameters: ICloningParameters;
}

export class ModelCloningModalController {
    constructor(
        $scope: IExecutableRenderingModalScope, $q: angular.IQService, $modalInstance: angular.ui.bootstrap.IModalServiceInstance, $http: angular.IHttpService,
        ScenarioService: ng.resource.IResourceClass<IScenarioResource>, ModelCloningService: angular.resource.IResourceClass<ISetDataResource>, $window: angular.IWindowService,
        model: IModel
    ) {
        $scope.loading = true;
        $scope.scenarios = ScenarioService.query({ modelId: model.id });
        $scope.orderProp = 'revision';
        $scope.newName = '';
        $scope.scenarios.$promise.finally(() => {
            $scope.loading = false;
        });

        $scope.clone = () => {
            if ($scope.cloneScenarioForm.$invalid)
                return;
            $scope.loading = true;

            var selectedScenarioIds = Object.keys($scope.selectedScenarios).filter(s => {
                return $scope.selectedScenarios[s] !== false;
            }); 

            var cloningParameters = { modelId: model.id, scenarioIds: selectedScenarioIds, name: $scope.newName } as ICloningParameters;

            ModelCloningService.save(JSON.stringify(cloningParameters)).$promise.then(() => {
                $window.location.href = '#/models';
            }).catch(() => {
                alert('An error occured');
            }).finally(() => {
                $scope.loading = false;
                $modalInstance.close();
            });

        }

            $scope.cancel = () => {
                $modalInstance.dismiss();
            }
        }
}