import application = require('application');
import _ = require('lodash');
import urls = require('urls');
import scenarioService = require('services/scenarioService');

var forceLoad = [scenarioService];

export interface IExecutableRenderingModalScope extends ng.IScope {
    scenarios: IScenario[];
    orderProp: string;
    selectedScenario: IScenario;
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
        ScenarioService: ng.resource.IResourceClass<IScenarioResource>,
        model: IModel
    ) {
        $scope.loading = true;
        $scope.scenarios = ScenarioService.query({ modelId: model.id });
        $scope.orderProp = 'revision';
        $scope.newName = '';
        $scope.scenarios.$promise.finally(() => {
            $scope.loading = false;
        });

        //$scope.cloningParameters = { modelId: model.id, scenarioIds: [$scope.selectedScenario.id], name: $scope.newName }

        $scope.clone = () => {
            if ($scope.cloneScenarioForm.$invalid)
                return;
            $scope.loading = true;
            
            var cloneReq = $http({
                url: urls.modelCloning,
                method: 'POST',
                params: { modelId: model.id, scenarioIds: [$scope.selectedScenario.id], name: $scope.newName } as ICloningParameters,
                
            });
            $q.when(cloneReq).finally(() => {
                $scope.loading = false;
            }).then(() => {
                $modalInstance.close();
            });
        }

        $scope.cancel = () => {
            $modalInstance.dismiss();
        }
    }
}