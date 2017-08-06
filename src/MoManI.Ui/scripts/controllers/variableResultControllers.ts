import _ = require('lodash');
import application = require('application');
import variableModel = require('models/variable')
import variableResultModel = require('models/variableResult')
import settingsModel = require('models/variableResultSettings');
import csvData = require('models/csvData');
import csvFiltering = require('models/csvFiltering');
import setService = require('services/setService');
import variableService = require('services/variableService');
import modelService = require('services/modelService');
import scenarioService = require('services/scenarioService');
import setDataService = require('services/setDataService');
import variableResultService = require('services/variableResultService');
import csvBuilder = require('models/csvBuilder');
import seriesLoader = require('models/seriesLoader');

var forceLoad = [setService, variableService, modelService, scenarioService, setDataService, variableResultService];

export interface IVariableResultListScope extends ng.IScope {
    scenario: IScenario;
    orderProp: string;
    variableResults: variableResultModel.VariableResult[];
    loading: boolean;
    download: (variableListItem: variableResultModel.VariableResult) => void;
}

export interface IVariableResultChartsScope extends ng.IScope {
    unsupportedDimensions: boolean;
    variableResult: variableResultModel.VariableResult;
    options: any;
    data: any[];
    loading: boolean;
    updateGroupOptions: () => void;
    updateChart: () => void;
    changeSetDataFilters: (setDataValues: string[]) => void;
    settings: settingsModel.VariableResultSettings;
}

export class VariableResultListController {
    constructor($scope: IVariableResultListScope, $q: angular.IQService, $http: angular.IHttpService, $routeParams: angular.route.IRouteParamsService,
        SetService: ng.resource.IResourceClass<ISetResource>, VariableService: angular.resource.IResourceClass<IVariableResource>,
        ScenarioService: angular.resource.IResourceClass<IScenarioResource>, SetDataService: ng.resource.IResourceClass<ISetDataResource>,
        VariableResultService: ng.resource.IResourceClass<IVariableResultResource>
    ) {
        $scope.loading = true;
        var modelId = $routeParams['modelId'];
        var scenarioId = $routeParams['scenarioId'];

        var scenarioReq = ScenarioService.get({ modelId: modelId, id: scenarioId }).$promise;
        var variableResultReq = VariableResultService.query({ scenarioId: scenarioId }).$promise;
        var variableReq = VariableService.query().$promise;
        var setsReq = SetService.query().$promise;

        $q.all([scenarioReq, variableResultReq, variableReq, setsReq]).then(res => {
            $scope.scenario = <IScenario>res[0];
            var variableResults = <IVariableResult[]>res[1];
            var variables = <IVariable[]>res[2];
            var sets = <ISet[]>res[3];
            $scope.variableResults = _.map(variableResults, variableResult => {
                var variable = new variableModel.Variable(sets, _.find(variables, v => v.id == variableResult.variableId));
                return new variableResultModel.VariableResult(variable, variableResult, sets, []);
            });
            $scope.loading = false;
        });
        $scope.orderProp = 'name';

        $scope.download = (variableListItem: variableResultModel.VariableResult) => {
            if (variableListItem == null)
                return;

            $scope.loading = true;
            var variable = variableListItem.variable;
            var variableResultReq = VariableResultService.get({ id: variable.id, scenarioId: scenarioId }).$promise;
            var setIds = _.map(variable.sets, set => set.value);
            var setDataReqs = _.map(setIds, setId => {
                return SetDataService.get({ setId: setId, modelId: modelId }).$promise;
            });
            $q.all([setsReq, variableResultReq].concat(<ng.IPromise<any>[]>setDataReqs)).then(res => {
                var sets = <ISet[]>res[0];
                var variableResultData = <IVariableResult>res[1];
                var setDatas = <ISetData[]>res.splice(2);

                var builder = new csvBuilder.CsvBuilder(variableResultData, sets, setDatas, variable);
                var dataBlob = builder.getCsvBlob();
                saveAs(dataBlob, `${variable.name}.csv`);
                $scope.loading = false;
            });
        };
    }
}

export class VariableResultChartsController {
    constructor($scope: IVariableResultChartsScope, $q: angular.IQService, $http: angular.IHttpService, $routeParams: angular.route.IRouteParamsService,
        SetService: ng.resource.IResourceClass<ISetResource>, VariableService: ng.resource.IResourceClass<IVariableResource>,
        SetDataService: angular.resource.IResourceClass<ISetDataResource>, VariableResultService: ng.resource.IResourceClass<IVariableResultResource>
    ) {
        $scope.loading = true;
        var modelId = $routeParams['modelId'];
        var scenarioId = $routeParams['scenarioId'];
        var variableId = $routeParams['variableId'];

        var variableReq = VariableService.get({ id: variableId }).$promise;
        var setsReq = SetService.query().$promise;
        var variableResultReq = VariableResultService.get({ id: variableId, scenarioId: scenarioId }).$promise;
        $q.all([variableReq, setsReq, variableResultReq]).then(res => {
            var variableRes = <IVariable>res[0];
            var sets = <ISet[]>res[1];
            var variableResult = <IVariableResult>res[2];

            var setDataReqs = _.map(variableRes.sets, setId => {
                return SetDataService.get({ setId: setId, modelId: modelId }).$promise;
            });

            $q.all(setDataReqs).then((setDatas: ISetData[]) => {
                var variable = new variableModel.Variable(sets, variableRes);
                $scope.settings = new settingsModel.VariableResultSettings();

                $scope.variableResult = new variableResultModel.VariableResult(variable, variableResult, sets, setDatas, true, $scope.settings);
                $scope.variableResult.addGroupDataHandler($scope.settings.updateSetData);
                $scope.settings.addSetDataFilterSubscriber($scope.changeSetDataFilters);
                setRangeAndDraw();
                $scope.loading = false;
            });
        });

        $scope.updateGroupOptions = () => {
            $scope.variableResult.updateGroupOptions();
            setRangeAndDraw();
        }

        $scope.updateChart = () => {
            $scope.variableResult.selectGrouping();
            setRangeAndDraw();
        }

        $scope.changeSetDataFilters = (setDataValues: string[]) => {
            $scope.variableResult.changeSetDataFilters(setDataValues);
            setRangeAndDraw();
        }

        var setRangeAndDraw = () => {
            var min = $scope.variableResult.getMinY();
            var max = $scope.variableResult.getMaxY();
            $scope.variableResult.setYRange(min, max);
            $scope.variableResult.draw();
        };
    }
}

export interface ICsvVariableResultScope extends ng.IScope {
    model: IModel;
    scenario: IScenario;
    data: csvData.VariableResultCsv;
    filtering: csvFiltering.CsvDropdownFiltering;
    changeColumnSet: () => void;
    downloadCsv: () => void;
    loading: boolean;
}

export class CsvVariableResultController {
    constructor($scope: ICsvVariableResultScope, $q: angular.IQService, $http: angular.IHttpService, $routeParams: angular.route.IRouteParamsService,
        SetService: ng.resource.IResourceClass<ISetResource>, VariableService: ng.resource.IResourceClass<IVariableResource>,
        SetDataService: angular.resource.IResourceClass<ISetDataResource>, VariableResultService: ng.resource.IResourceClass<IVariableResultResource>,
        ModelService: angular.resource.IResourceClass<IModelResource>, ScenarioService: angular.resource.IResourceClass<IScenarioResource>
    ) {
        $scope.loading = true;
        var modelId = $routeParams['modelId'];
        var scenarioId = $routeParams['scenarioId'];

        var setReq = SetService.query().$promise;
        var variableReq = VariableService.query().$promise;
        var modelReq = ModelService.get({ id: modelId }).$promise;
        var scenarioReq = ScenarioService.get({ modelId: modelId, id: scenarioId }).$promise;

        $q.all([setReq, variableReq, modelReq, scenarioReq]).then(res => {
            var allSets = <ISet[]>res[0];
            var allVariables = <IVariable[]>res[1];
            $scope.model = <IModel>res[2];
            $scope.scenario = <IScenario>res[3];
            var variables = _.filter(allVariables, p => _.includes($scope.model.variables, p.id));
            if (variables.length == 0) {
                $scope.loading = false;
                return;     //TODO: no data exists, indicate this somehow
            }
            var actualSetIds = _.uniq(_.flatten(_.map(variables, p => p.sets)));
            var sets = _.map(actualSetIds, sId => _.find(allSets, s => s.id == sId));
            var setDataReqs = _.map(actualSetIds, sId => {
                return SetDataService.get({ setId: sId, modelId: modelId }).$promise;
            });

            var variableResultLoaderReqs = _.map(variables, v => (() => VariableResultService.get({ id: v.id, scenarioId: scenarioId }).$promise));
            var variableResultLoader = new seriesLoader.SeriesLoader($q, variableResultLoaderReqs);
            var seriesLoadingVariableResultReqs = variableResultLoader.load();
            
            $q.all([$q.all(setDataReqs), seriesLoadingVariableResultReqs]).then((dataRes) => {
                var setDatas = <ISetData[]>dataRes[0];
                var variableResults = <IVariableResult[]>dataRes[1];

                $scope.data = new csvData.VariableResultCsv(modelId, scenarioId, variables, sets, variableResults, setDatas);
                $scope.filtering = new csvFiltering.CsvDropdownFiltering(sets, setDatas, variables, 'Variable', $scope.data.updateFilters);
                $scope.loading = false;
            });
        });

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
            saveAs(blob, `${$scope.scenario.name} - variable results.csv`);
        }
    }
}