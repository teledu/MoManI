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
import seriesLoader = require('models/seriesLoader');

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
        const modelId = $routeParams['modelId'];
        const scenarioId = $routeParams['scenarioId'];
        const parameterId = $routeParams['parameterId'];
        const returnSetId = $routeParams['setId'];
        $scope.returnUrlSuffix = returnSetId ? `/sets/${returnSetId}` : ``;

        const modelReq = ModelService.get({ id: modelId }).$promise;
        const setReq = SetService.query().$promise;
        const parametersReq = ParameterService.query().$promise;
        const parameterDataReq = ParameterDataService.get({ parameterId: parameterId, scenarioId: scenarioId }).$promise;

        $q.all([setReq, parameterDataReq, parametersReq, modelReq]).then(res => {
            const sets = res[0] as ISet[];
            const parameterData = res[1] as IParameterData;
            const allParameters = _.sortBy(res[2] as IParameter[], p => p.name);
            const model = res[3] as IModel;
            $scope.parameters = _.filter(allParameters, param => _.some(model.parameters, pId => param.id === pId));
            const parameter = _.find($scope.parameters, p => p.id === parameterId);
            $scope.selectedParameterId = parameter.id;
            const setDataReqs = _.map(parameter.sets, setId => {
                return SetDataService.get({ setId: setId, modelId: modelId }).$promise;
            });
            $q.all(setDataReqs).then(setDataRes => {
                const setDatas = _.map(parameter.sets, (setId, index) => {
                    const actualSet = _.find(sets, s => s.id === setId);
                    return new setDataModel.SetData(modelId, actualSet, setDataRes[index] as ISetData);
                });
                $scope.data = new parameterDataModel.ParameterData(scenarioId, modelId, parameter, setDatas, parameterData);
                $scope.loading = false;
            });
        });

        $scope.switchParameter = () => {
            const redirectHandler = () => {
                $window.location.href = `#/models/${modelId}/${scenarioId}/data/parameter/${$scope.selectedParameterId}`;
            }
            const saveBeforeRedirect = confirm('Do you want to save your current data before navigating to the selected parameter?');
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
    filtering: csvFiltering.CsvDropdownFiltering;
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

        const setReq = SetService.query().$promise;
        const parameterReq = ParameterService.query().$promise;
        const modelReq = ModelService.get({ id: modelId }).$promise;
        const scenarioReq = ScenarioService.get({ modelId: modelId, id: scenarioId }).$promise;

        $q.all([setReq, parameterReq, modelReq, scenarioReq]).then(res => {
            const allSets = res[0] as ISet[];
            const allParameters = res[1] as IParameter[];
            $scope.model = res[2] as IModel;
            $scope.scenario = res[3] as IScenario;
            var parameters = _.filter(allParameters, p => _.includes($scope.model.parameters, p.id));
            if (parameters.length === 0) {
                $scope.loading = false;
                return;     //TODO: no data needs to be entered, indicate this somehow
            }
            const actualSetIds = _.uniq(_.flatten(_.map(parameters, p => p.sets)));
            const sets = _.map(actualSetIds, sId => _.find(allSets, s => s.id === sId));
            const setDataReqs = _.map(actualSetIds, sId => {
                return SetDataService.get({ setId: sId, modelId: modelId }).$promise;
            });

            var parameterDataLoaderReqs = _.map(parameters, p => (() => ParameterDataService.get({ parameterId: p.id, scenarioId: scenarioId }).$promise));
            var parameterDataLoader = new seriesLoader.SeriesLoader($q, parameterDataLoaderReqs);
            var seriesLoadingParameterDataReqs = parameterDataLoader.load();

            $q.all([$q.all(setDataReqs), seriesLoadingParameterDataReqs]).then((dataRes) => {
                const setDatas = dataRes[0] as ISetData[];
                const parameterDatas = dataRes[1] as IParameterData[];

                $scope.data = new csvData.ParameterDataCsv(modelId, scenarioId, parameters, sets, parameterDatas, setDatas);
                $scope.filtering = new csvFiltering.CsvDropdownFiltering(sets, setDatas, parameters, 'Parameter', $scope.data.updateFilters, initialFilter);
                $scope.loading = false;
            });
        });

        $scope.save = () => {
            $scope.loading = true;
            const parameterDatas = $scope.data.serialize();
            const saveReqs = _.map(parameterDatas, parameterData => ParameterDataService.save(parameterData).$promise);
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
            const data = $scope.data.asTextFile();
            const blob = new Blob(data, { type: 'text/csv;charset=utf-8' });
            saveAs(blob, `${$scope.scenario.name} - parameter data.csv`);
        }
    }
}