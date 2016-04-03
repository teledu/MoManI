import $ = require('jquery');
import application = require('application');
import setDataModel = require('models/setData')
import setService = require('services/setService');
import setDataService = require('services/setDataService');

var forceLoad = [setService, setDataService];

export interface ISetDataScope extends ng.IScope {
    data: setDataModel.SetData;
    save: () => void;
    invalidValuesNotUnique: boolean;
}

export class SetDataController {
    constructor($scope: ISetDataScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        SetService: ng.resource.IResourceClass<ISetResource>, SetDataService: angular.resource.IResourceClass<ISetDataResource>
    ) {
        $scope.invalidValuesNotUnique = false;
        var modelId = $routeParams['modelId'];
        var setId = $routeParams['setId'];
        var setReq = SetService.get({ id: setId }).$promise;
        var setDataReq = SetDataService.get({ setId: setId, modelId: modelId }).$promise;

        $q.all([setReq, setDataReq]).then(res => {
            $scope.data = new setDataModel.SetData(modelId, <ISet>res[0], <ISetData>res[1]);
        });

        $scope.save = () => {
            $scope.invalidValuesNotUnique = false;
            if (!$scope.data.valuesUnique()) {
                $scope.invalidValuesNotUnique = true;
                return;
            }
            SetDataService.save($scope.data.serialize(), () => {
                $window.location.href = `#/models/${modelId}/setData`;
            }, () => {
                alert('An error occured');
            });
        }
    }
}