﻿import $ = require('jquery');
import application = require('application');
import setDataModel = require('models/setData')
import setService = require('services/setService');
import setDataService = require('services/setDataService');

var forceLoad = [setService, setDataService];

export interface ISetDataScope extends ng.IScope {
    data: setDataModel.SetData;
    save: () => void;
    invalidValuesNotUnique: boolean;
    valuesForm: angular.IFormController;
    loading: boolean;
    colorPickerOptions: IColorPickerOptions;
}

export class SetDataController {
    constructor($scope: ISetDataScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        SetService: ng.resource.IResourceClass<ISetResource>, SetDataService: angular.resource.IResourceClass<ISetDataResource>
    ) {
        $scope.loading = true;
        $scope.invalidValuesNotUnique = false;
        $scope.colorPickerOptions = defaultColorPickerOptions;
        var modelId = $routeParams['modelId'];
        var setId = $routeParams['setId'];
        var setReq = SetService.get({ id: setId }).$promise;
        var setDataReq = SetDataService.get({ setId: setId, modelId: modelId }).$promise;

        $q.all([setReq, setDataReq]).then(res => {
            $scope.data = new setDataModel.SetData(modelId, <ISet>res[0], <ISetData>res[1]);
            $scope.loading = false;
        });

        $scope.save = () => {
            if ($scope.valuesForm.$invalid) {
                return;
            }
            $scope.invalidValuesNotUnique = false;
            if (!$scope.data.valuesUnique()) {
                $scope.invalidValuesNotUnique = true;
                return;
            }
            $scope.loading = true;
            SetDataService.save($scope.data.serialize(), () => {
                $window.location.href = `#/models/${modelId}/setData`;
            }, () => {
                alert('An error occured');
                $scope.loading = false;
            });
        }
    }
}

var defaultColorPickerOptions: IColorPickerOptions = {
    disabled: false,
    round: false,
    format: 'hex',
    hue: true,
    alpha: false,
    swatch: true,
    swatchPos: 'left',
    swatchBootstrap: true,
    swatchOnly: true,
    pos: 'bottom left',
    case: 'lower',
    inline: false,
    placeholder: '',
}

export interface IColorPickerOptions {
    disabled: boolean;
    round: boolean;
    format: string;
    hue: boolean;
    alpha: boolean;
    swatch: boolean;
    swatchPos: string;
    swatchBootstrap: boolean;
    swatchOnly: boolean;
    pos: string;
    case: string;
    inline: boolean;
    placeholder: string;
}