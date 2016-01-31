import $ = require('jquery');
import application = require('application');
import executableRenderingControllers = require('controllers/executableRenderingControllers');
import modelService = require('services/modelService');

var forceLoad = [modelService];

export interface IModelListScope extends ng.IScope {
    orderProp: string;
    models: angular.resource.IResourceArray<IModel>;
    downloadExec: (model: IModel) => void;
    delete: (model: IModel) => void;
}

export class ModelListController {
    constructor($scope: IModelListScope, $modal: angular.ui.bootstrap.IModalService, ModelService: angular.resource.IResourceClass<IModelResource>) {
        $scope.models = ModelService.query();
        $scope.orderProp = 'name';

        $scope.downloadExec = (model: IModel) => {
            $modal.open({
                templateUrl: 'partials/render-executable.html',
                controller: executableRenderingControllers.ExecutableRenderingController,
                resolve: {
                    model() { return model; },
                }
            });
        }

        $scope.delete = (model: IModel) => {
            ModelService.delete({ id: model.id }).$promise.then(() => {
                $scope.models = ModelService.query();
            });
        }
    }
}