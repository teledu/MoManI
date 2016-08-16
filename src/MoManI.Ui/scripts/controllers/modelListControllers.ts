import $ = require('jquery');
import application = require('application');
import modelCloningControllers = require('controllers/modelCloningControllers');
import modelService = require('services/modelService');

var forceLoad = [modelService];

export interface IModelListScope extends ng.IScope {
    orderProp: string;
    models: angular.resource.IResourceArray<IModel>;
    clone: (model: IModel) => void;
    delete: (model: IModel) => void;
    loading: boolean;
}

export class ModelListController {
    constructor($scope: IModelListScope, $modal: angular.ui.bootstrap.IModalService, ModelService: angular.resource.IResourceClass<IModelResource>) {
        $scope.loading = true;
        $scope.models = ModelService.query();
        $scope.orderProp = 'name';

        $scope.clone = (model: IModel) => {
            var modalInstance = $modal.open({
                templateUrl: 'partials/clone-model-scenario-dialog.html',
                controller: modelCloningControllers.ModelCloningModalController,
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    model() { return model; },
                }
            });
            modalInstance.result.then(() => {
                $scope.loading = true;
                $scope.models = ModelService.query();
                $scope.models.$promise.finally(() => {
                    $scope.loading = false;
                });
            });
        }

        $scope.delete = (model: IModel) => {
            $scope.loading = true;
            ModelService.delete({ id: model.id }).$promise.then(() => {
                $scope.models = ModelService.query();
                $scope.models.$promise.finally(() => {
                    $scope.loading = false;
                });
            });
        }

        $scope.models.$promise.finally(() => {
            $scope.loading = false;
        });
    }
}