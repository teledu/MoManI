import application = require('application');
import _ = require('lodash');
import parameterDataModel = require('models/parameterData');
import csvData = require('models/csvData');
import csvFiltering = require('models/csvFiltering');
import setDataModel = require('models/setData');
import setService = require('services/setService');
import parameterService = require('services/parameterService');
import setDataService = require('services/setDataService');
import parameterDataService = require('services/parameterDataService');
import modelService = require('services/modelService');
import scenarioService = require('services/scenarioService');

var forceLoad = [setService, parameterService, setDataService, parameterDataService, modelService, scenarioService];

export interface IParameterDataScope extends ng.IScope {
    data: parameterDataModel.ParameterData;
    save: () => void;
    loading: boolean;
    returnUrlSuffix: string;
    selectedParameterId: string;
    parameters: IParameter[];
    switchParameter: () => void;
}

export class ParameterDataController {
    constructor($scope: IParameterDataScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        ParameterService: ng.resource.IResourceClass<IParameterResource>, SetService: ng.resource.IResourceClass<ISetResource>,
        ParameterDataService: angular.resource.IResourceClass<IParameterDataResource>, SetDataService: angular.resource.IResourceClass<ISetDataResource>,
        ModelService: angular.resource.IResourceClass<IModelResource>
    ) {
        $scope.loading = true;
        var modelId = $routeParams['modelId'];
        var scenarioId = $routeParams['scenarioId'];
        var parameterId = $routeParams['parameterId'];
        var returnSetId = $routeParams['setId'];
        $scope.returnUrlSuffix = returnSetId ? `/sets/${returnSetId}` : ``;

        var modelReq = ModelService.get({ id: modelId }).$promise;
        var setReq = SetService.query().$promise;
        var parametersReq = ParameterService.query().$promise;
        var parameterDataReq = ParameterDataService.get({ parameterId: parameterId, scenarioId: scenarioId }).$promise;

        $q.all([setReq, parameterDataReq, parametersReq, modelReq]).then(res => {
            var sets = <ISet[]>res[0];
            var parameterData = <IParameterData>res[1];
            var allParameters = _.sortBy(<IParameter[]>res[2], p => p.name);
            var model = <IModel>res[3];
            $scope.parameters = _.filter(allParameters, param => _.some(model.parameters, pId => param.id == pId));
            var parameter = _.find($scope.parameters, p => p.id == parameterId);
            $scope.selectedParameterId = parameter.id;
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

        $scope.switchParameter = () => {
            var redirectHandler = () => {
                $window.location.href = `#/models/${modelId}/${scenarioId}/data/parameter/${$scope.selectedParameterId}`;
            }
            var saveBeforeRedirect = confirm('Do you want to save your current data before navigating to the selected parameter?');
            if (saveBeforeRedirect) {
                $scope.loading = true;
                ParameterDataService.save($scope.data.serialize(),
                    redirectHandler,
                    () => {
                        alert('An error occured');
                        $scope.loading = false;
                        return;
                    });
            } else {
                redirectHandler();
            }
        }

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

export interface ICsvParameterDataScope extends ng.IScope {
    model: IModel;
    scenario: IScenario;
    data: csvData.ParameterDataCsv;
    filtering: csvFiltering.CsvFiltering;
    changeColumnSet: () => void;
    save: () => void;
    downloadCsv: () => void;
    loading: boolean;
}

export class CsvParameterDataController {
    constructor($scope: ICsvParameterDataScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        ParameterService: ng.resource.IResourceClass<IParameterResource>, SetService: ng.resource.IResourceClass<ISetResource>,
        ParameterDataService: angular.resource.IResourceClass<IParameterDataResource>, SetDataService: angular.resource.IResourceClass<ISetDataResource>,
        ModelService: angular.resource.IResourceClass<IModelResource>, ScenarioService: angular.resource.IResourceClass<IScenarioResource>
    ) {
        $scope.loading = true;
        const modelId = $routeParams['modelId'];
        const scenarioId = $routeParams['scenarioId'];

        const initialFilter = $routeParams['filterType'] ? {
            filterType: $routeParams['filterType'],
            filteredItemId: $routeParams['filteredItemId'],
            filterValue: $routeParams['filterValue'],
        } as IFilterDescription : null;

        var setReq = SetService.query().$promise;
        var parameterReq = ParameterService.query().$promise;
        var modelReq = ModelService.get({ id: modelId }).$promise;
        var scenarioReq = ScenarioService.get({ modelId: modelId, id: scenarioId }).$promise;

        $q.all([setReq, parameterReq, modelReq, scenarioReq]).then(res => {
            var allSets = <ISet[]>res[0];
            var allParameters = <IParameter[]>res[1];
            $scope.model = <IModel>res[2];
            $scope.scenario = <IScenario>res[3];
            var parameters = _.filter(allParameters, p => _.includes($scope.model.parameters, p.id));
            if (parameters.length == 0) {
                $scope.loading = false;
                return;     //TODO: no data needs to be entered, indicate this somehow
            }
            var actualSetIds = _.uniq(_.flatten(_.map(parameters, p => p.sets)));
            var sets = _.map(actualSetIds, sId => _.find(allSets, s => s.id == sId));
            var setDataReqs = _.map(actualSetIds, sId => {
                return SetDataService.get({ setId: sId, modelId: modelId }).$promise;
            });

            var parameterDataReqs = _.map(parameters, p => ParameterDataService.get({ parameterId: p.id, scenarioId: scenarioId }).$promise);

            $q.all([$q.all(setDataReqs), $q.all(parameterDataReqs)]).then((dataRes) => {
                var setDatas = <ISetData[]>dataRes[0];
                var parameterDatas = <IParameterData[]>dataRes[1];

                $scope.data = new csvData.ParameterDataCsv(modelId, scenarioId, parameters, sets, parameterDatas, setDatas);
                $scope.filtering = new csvFiltering.CsvFiltering(sets, parameters, 'Parameter', $scope.data.updateFilters, initialFilter);
                $scope.loading = false;
            });
        });

        $scope.save = () => {
            $scope.loading = true;
            var parameterDatas = $scope.data.serialize();
            var saveReqs = _.map(parameterDatas, parameterData => ParameterDataService.save(parameterData).$promise);
            $q.all(saveReqs).then(() => {
                $window.location.href = `#/models/${$scope.model.id}/${$scope.scenario.id}/data`;
            }, () => {
                alert('An error has occured during saving');
                $scope.loading = false;
            });
        }

        $scope.changeColumnSet = () => {
            $scope.loading = true;
            $scope.data.clearSpreadsheet();
            setTimeout(() => {
                $scope.data.changeColumnSet();
                $scope.loading = false;
            }, 1);
        }

        $scope.downloadCsv = () => {
            var data = $scope.data.asTextFile();
            var blob = new Blob(data, { type: 'text/csv;charset=utf-8' });
            saveAs(blob, `${$scope.scenario.name} - parameter data.csv`);
        }
    }
}

export interface ICsvParameterDataForParameterScope extends ng.IScope {
    data: csvData.LegacyParameterDataCsv;
    save: () => void;
    loading: boolean;
    returnUrlSuffix: string;
}

export class CsvParameterDataForParameterController {
    constructor($scope: ICsvParameterDataForParameterScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
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
            var allSets = <ISet[]>res[0];
            var parameter = <IParameter>res[1];
            var sets = _.filter(allSets, s => _.some(parameter.sets, sId => sId == s.id));
            var parameterData = <IParameterData>res[2];
            var setDataReqs = _.map(parameter.sets, setId => {
                return SetDataService.get({ setId: setId, modelId: modelId }).$promise;
            });
            $q.all(setDataReqs).then(setDataRes => {
                var setDatas = <ISetData[]>setDataRes;
                var numericSets = _.filter(sets, s => s.numeric);
                var axisSetData = numericSets.length ? _(setDatas).filter(sd => _.some(numericSets, ns => ns.id == sd.setId)).maxBy(sd => sd.items.length) : _.maxBy(setDatas, sd => sd.items.length);
                $scope.data = new csvData.LegacyParameterDataCsv(modelId, scenarioId, [parameter], sets, [parameterData], setDatas, axisSetData.setId);
                $scope.loading = false;
            });
        });

        $scope.save = () => {
            $scope.loading = true;
            ParameterDataService.save(_.first($scope.data.serialize()), () => {
                $window.location.href = `#/models/${modelId}/${scenarioId}/data${$scope.returnUrlSuffix}`;
            }, () => {
                alert('An error occured');
                $scope.loading = false;
            });
        }
    }
}