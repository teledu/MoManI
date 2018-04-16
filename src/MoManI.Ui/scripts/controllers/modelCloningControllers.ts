
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
            var cloningParameters = { modelId: model.id, scenarioIds: Object.keys($scope.selectedScenarios), name: $scope.newName } as ICloningParameters;

           // var cloneReq = $http({
           //     url: urls.modelCloning,
           //     method: 'POST',
           //     params: { parameters: cloningParameters },
           //     
           // });
           // $q.when(cloneReq).finally(() => {
           //     $scope.loading = false;
           // }).then(() => {
           //     $modalInstance.close();
           //     });

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