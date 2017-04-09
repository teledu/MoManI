import application = require('application');
import _ = require('lodash');
import parameterDataModel = require('models/parameterData');
import parameterDataModelCsv = require('models/parameterDataCsv');
import setDataModel = require('models/setData');
import setService = require('services/setService');
import parameterService = require('services/parameterService');
import setDataService = require('services/setDataService');
import parameterDataService = require('services/parameterDataService');
import parameterDataForSetService = require('services/parameterDataForSetService');
import modelService = require('services/modelService');

var forceLoad = [setService, parameterService, setDataService, parameterDataService, parameterDataForSetService, modelService];

export interface IParameterDataScope extends ng.IScope {
    data: parameterDataModel.ParameterData;
    save: () => void;
    loading: boolean;
    returnUrlSuffix: string;
}

export interface ICsvParameterDataScope extends ng.IScope {
    data: parameterDataModelCsv.ParameterDataCsv;
    save: () => void;
    loading: boolean;
    returnUrlSuffix: string;
}

export class ParameterDataController {
    constructor($scope: IParameterDataScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        ParameterService: ng.resource.IResourceClass<IParameterResource>, SetService: ng.resource.IResourceClass<ISetResource>,
        ParameterDataService: angular.resource.IResourceClass<IParameterDataResource>, SetDataService: angular.resource.IResourceClass<ISetDataResource>
    ) {
        $scope.loading = true;
        var modelId = $routeParams['modelId'];
        var scenarioId = $routeParams['scenarioId'];
        var parameterId = $routeParams['parameterId'];
        var returnSetId = $routeParams['setId'];
        $scope.returnUrlSuffix = returnSetId ? `/sets/${returnSetId}` : ``;

        var setReq = SetService.query().$promise;
        var parameterReq = ParameterService.get({ id: parameterId }).$promise;
        var parameterDataReq = ParameterDataService.get({ parameterId: parameterId, scenarioId: scenarioId }).$promise;

        $q.all([setReq, parameterReq, parameterDataReq]).then(res => {
            var sets = <ISet[]>res[0];
            var parameter = <IParameter>res[1];
            var parameterData = <IParameterData>res[2];
            var setDataReqs = _.map(parameter.sets, setId => {
                return SetDataService.get({ setId: setId, modelId: modelId }).$promise;
            });
            $q.all(setDataReqs).then(setDataRes => {
                var setDatas = _.map(parameter.sets, (setId, index) => {
                    var actualSet = _.find(sets, s => s.id == setId);
                    return new setDataModel.SetData(modelId, actualSet, <ISetData>setDataRes[index]);
                });
                $scope.data = new parameterDataModel.ParameterData(scenarioId, modelId, parameter, setDatas, parameterData);
                $scope.loading = false;
            });
        });

        $scope.save = () => {
            $scope.loading = true;
            ParameterDataService.save($scope.data.serialize(), () => {
                $window.location.href = `#/models/${modelId}/${scenarioId}/data${$scope.returnUrlSuffix}`;
            }, () => {
                alert('An error occured');
                $scope.loading = false;
            });
        }
    }
}

export class CsvParameterDataController {
    constructor($scope: ICsvParameterDataScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        ParameterService: ng.resource.IResourceClass<IParameterResource>, SetService: ng.resource.IResourceClass<ISetResource>,
        ParameterDataService: angular.resource.IResourceClass<IParameterDataResource>, SetDataService: angular.resource.IResourceClass<ISetDataResource>
    ) {
        $scope.loading = true;
        var modelId = $routeParams['modelId'];
        var scenarioId = $routeParams['scenarioId'];
        var parameterId = $routeParams['parameterId'];
        var returnSetId = $routeParams['setId'];
        $scope.returnUrlSuffix = returnSetId ? `/sets/${returnSetId}` : ``;

        var setReq = SetService.query().$promise;
        var parameterReq = ParameterService.get({ id: parameterId }).$promise;
        var parameterDataReq = ParameterDataService.get({ parameterId: parameterId, scenarioId: scenarioId }).$promise;

        $q.all([setReq, parameterReq, parameterDataReq]).then(res => {
            var sets = <ISet[]>res[0];
            var parameter = <IParameter>res[1];
            var parameterData = <IParameterData>res[2];
            var setDataReqs = _.map(parameter.sets, setId => {
                return SetDataService.get({ setId: setId, modelId: modelId }).$promise;
            });
            $q.all(setDataReqs).then(setDataRes => {
                var setDatas = _.map(parameter.sets, (setId, index) => {
                    var actualSet = _.find(sets, s => s.id == setId);
                    return new setDataModel.SetData(modelId, actualSet, <ISetData>setDataRes[index]);
                });
                $scope.data = new parameterDataModelCsv.ParameterDataCsv(scenarioId, modelId, parameter, setDatas, parameterData);
                $scope.loading = false;
            });
        });

        $scope.save = () => {
            $scope.loading = true;
            ParameterDataService.save($scope.data.serialize(), () => {
                $window.location.href = `#/models/${modelId}/${scenarioId}/data${$scope.returnUrlSuffix}`;
            }, () => {
                alert('An error occured');
                $scope.loading = false;
            });
        }
    }
}

export interface ICsvParameterDataForSetScope extends ng.IScope {
    data: parameterDataModelCsv.MultipleParameterDataCsv;
    set: ISet;
    modelId: string;
    scenarioId: string;
    setValue: string;
    save: () => void;
    loading: boolean;
}

export class CsvParameterDataForSetController {
    constructor($scope: ICsvParameterDataForSetScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        ParameterService: ng.resource.IResourceClass<IParameterResource>, SetService: ng.resource.IResourceClass<ISetResource>,
        ParameterDataService: angular.resource.IResourceClass<IParameterDataResource>, SetDataService: angular.resource.IResourceClass<ISetDataResource>,
        ParameterDataForSetService: angular.resource.IResourceClass<IParameterDataResource>, ModelService: angular.resource.IResourceClass<IModelResource>
    ) {
        $scope.loading = true;
        $scope.modelId = $routeParams['modelId'];
        $scope.scenarioId = $routeParams['scenarioId'];
        var setId = $routeParams['setId'];
        $scope.setValue = $routeParams['setValue'];
        
        var setReq = SetService.query().$promise;
        var parameterReq = ParameterService.query().$promise;
        var modelReq = ModelService.get({ id: $scope.modelId }).$promise;
        var parameterDataReq = ParameterDataForSetService.query({ scenarioId: $scope.scenarioId, setId: setId, setValue: $scope.setValue }).$promise;

        $q.all([setReq, parameterReq, modelReq, parameterDataReq]).then(res => {
            var allSets = <ISet[]>res[0];
            var allParameters = <IParameter[]>res[1];
            var model = <IModel>res[2];
            var parameterDatas = <IParameterData[]>res[3];
            $scope.set = _.find(allSets, s => s.id == setId);
            var parameters = _.filter(allParameters, p => _.includes(model.parameters, p.id) && _.includes(p.sets, setId));
            if (parameters.length == 0) {
                $scope.loading = false;
                return;
            }
            var actualSetIds = _.uniq(_.flatten(_.map(parameters, p => p.sets)));
            var setDataReqs = _.map(actualSetIds, s => {
                return SetDataService.get({ setId: s, modelId: $scope.modelId }).$promise;
            });

            $q.all(setDataReqs).then((setDatas: ISetData[]) => {
                var commonSets = _.filter(allSets, s => s != null && s.id != setId && _.every(parameters, p => _.includes(p.sets, s.id)));
                var axisSet = this.determineCommonSet(commonSets, setDatas);
                var axisSetId = axisSet ? axisSet.id : null;
                
                $scope.data = new parameterDataModelCsv.MultipleParameterDataCsv($scope.modelId, $scope.scenarioId, parameters, allSets, parameterDatas, setDatas, setId, $scope.setValue, axisSetId);
                $scope.loading = false;
            });
        });

        $scope.save = () => {
            $scope.loading = true;
            alert('Not yet implemented');
        }
    }

    private determineCommonSet = (sets: ISet[], setDatas: ISetData[]) => {
        if (sets.length == 0)
            return null;
        var numericSets = _.filter(sets, s => s.numeric);
        return numericSets.length
            ? this.determineSetWithMostData(numericSets, setDatas)
            : this.determineSetWithMostData(sets, setDatas);
    }

    private determineSetWithMostData = (sets: ISet[], setDatas: ISetData[]) => {
        return _.maxBy(sets, s => {
            var setData = _.find(setDatas, sd => sd.setId == s.id);
            return setData ? setData.items.length : 0;
        });
    }
}