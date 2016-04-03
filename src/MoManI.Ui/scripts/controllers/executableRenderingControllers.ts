import application = require('application');
import _ = require('lodash');
import JSZip = require('jszip');
import urls = require('urls');
import modelModel = require('models/model');
import setModel = require('models/set');
import parameterModel = require('models/parameter');
import setDataModel = require('models/setData');
import dataStringBuilder = require('models/dataStringBuilder');
import setService = require('services/setService');
import parameterService = require('services/parameterService');
import variableService = require('services/variableService');
import objectiveFunctionService = require('services/objectiveFunctionService');
import constraintService = require('services/constraintService');
import constraintGroupService = require('services/constraintGroupService');
import modelService = require('services/modelService');
import setDataService = require('services/setDataService');
import parameterDataService = require('services/parameterDataService');

var forceLoad = [setService, parameterService, variableService, objectiveFunctionService, constraintGroupService, constraintService, modelService, setDataService, parameterDataService];

export interface IExecutableRenderingModalScope extends ng.IScope {
    executableLoading: boolean;
    executableLoaded: boolean;
    modelLoading: boolean;
    modelLoaded: boolean;
    dataLoading: boolean;
    dataLoaded: boolean;
    dataProgress: string;
}

export class ExecutableRenderingController {
    private $scope: IExecutableRenderingModalScope;
    private $q: angular.IQService;
    private $http: angular.IHttpService;
    private zip: JSZip;
    private scenarioId: string;
    private modelId: string;
    private setService: ng.resource.IResourceClass<ISetResource>;
    private parameterService: angular.resource.IResourceClass<IParameterResource>;
    private variableService: angular.resource.IResourceClass<IVariableResource>;
    private objectiveFunctionService: angular.resource.IResourceClass<IObjectiveFunctionResource>;
    private constraintService: angular.resource.IResourceClass<IConstraintResource>;
    private constraintGroupService: angular.resource.IResourceClass<IConstraintGroupResource>;
    private modelService: angular.resource.IResourceClass<IModelResource>;
    private setDataService: angular.resource.IResourceClass<ISetDataResource>;
    private parameterDataService: angular.resource.IResourceClass<IParameterDataResource>;
    private sets: setModel.Set[];
    private parameters: parameterModel.Parameter[];
    private model: modelModel.Model;
    private setData: setDataModel.SetData[];

    constructor($scope: IExecutableRenderingModalScope, $q: angular.IQService, $http: angular.IHttpService, $modalInstance: angular.ui.bootstrap.IModalServiceInstance,
        SetService: ng.resource.IResourceClass<ISetResource>, ParameterService: angular.resource.IResourceClass<IParameterResource>,
        VariableService: angular.resource.IResourceClass<IVariableResource>, ObjectiveFunctionService: angular.resource.IResourceClass<IObjectiveFunctionResource>,
        ConstraintGroupService: angular.resource.IResourceClass<IConstraintGroupResource>, ConstraintService: angular.resource.IResourceClass<IConstraintResource>,
        ModelService: angular.resource.IResourceClass<IModelResource>, SetDataService: angular.resource.IResourceClass<ISetDataResource>,
        ParameterDataService: angular.resource.IResourceClass<IParameterDataResource>,
        scenario: IScenario
    ) {
        this.$scope = $scope;
        this.$q = $q;
        this.$http = $http;
        this.setService = SetService;
        this.parameterService = ParameterService;
        this.variableService = VariableService;
        this.objectiveFunctionService = ObjectiveFunctionService;
        this.constraintGroupService = ConstraintGroupService;
        this.constraintService = ConstraintService;
        this.modelService = ModelService;
        this.setDataService = SetDataService;
        this.parameterDataService = ParameterDataService;
        this.zip = new JSZip();
        this.scenarioId = scenario.id;
        this.modelId = scenario.modelId;

        $q.when(this.loadExecutable().promise).then(() => {
            $q.when(this.loadModel().promise).then(() => {
                $q.when(this.loadData().promise).then(() => {
                    try {
                        var blob = this.zip.generate({ type: 'blob' });
                        saveAs(blob, `${scenario.name}.zip`);
                        setTimeout($modalInstance.close, 1000);
                    } catch (e) {
                        console.log(e);
                    }
                });
            });
        });
    }

    private loadExecutable = () => {
        this.$scope.executableLoading = true;
        var done = this.$q.defer();
        var executableReq = this.$http({
            url: urls.executable,
            method: 'GET',
            responseType: 'arraybuffer'
        });
        this.$q.when(executableReq).then((exec: any) => {
            var executable: ArrayBuffer = exec.data;
            this.zip.file('RunSimulation.exe', executable, { binary: true });
            this.$scope.executableLoading = false;
            this.$scope.executableLoaded = true;
            done.resolve();
        });
        return done;
    }

    private loadModel = () => {
        this.$scope.modelLoading = true;
        var done = this.$q.defer();
        var setReq = this.setService.query().$promise;
        var parameterReq = this.parameterService.query().$promise;
        var variableReq = this.variableService.query().$promise;
        var objectiveFunctionReq = this.objectiveFunctionService.query().$promise;
        var constraintGroupReq = this.constraintGroupService.query().$promise;
        var constraintReq = this.constraintService.query().$promise;
        var modelReq = this.modelService.get({ id: this.modelId }).$promise;
        this.$q.all([setReq, parameterReq, variableReq, objectiveFunctionReq, constraintGroupReq, constraintReq, modelReq]).then(res => {
            var sets = <ISet[]>res[0];
            var parameters = <IParameter[]>res[1];
            this.model = new modelModel.Model(sets, parameters, <IVariable[]>res[2], <IObjectiveFunction[]>res[3], <IConstraintGroup[]>res[4], <IConstraint[]>res[5], <IModel>res[6]);
            this.sets = this.model.selectedSets();
            this.parameters = this.model.selectedParameters();
            this.zip.file('model.txt', this.model.asTextFile().join(`\r\n`));
            this.zip.file('metadata.txt', this.model.asScenarioMetaDataTextFile(this.scenarioId).join(`\r\n`));
            this.$scope.modelLoading = false;
            this.$scope.modelLoaded = true;
            done.resolve();
        });
        return done;
    }

    private loadData = () => {
        this.$scope.dataLoading = true;
        var done = this.$q.defer();
        var dataBuilder = new dataStringBuilder.Builder(this.$q, this.setDataService, this.parameterDataService, this.parameters, this.scenarioId, this.modelId, this.sets);
        this.$scope.dataProgress = `0/${this.parameters.length}`;
        this.$q.when(this.loadParameters(dataBuilder, this.parameters.map(p => p.id)).promise).then(() => {
            dataBuilder.build().then(data => {
                this.zip.file('data.txt', data);
                this.$scope.dataLoading = false;
                this.$scope.dataLoaded = true;
                done.resolve();
            });
        });
        return done;
    }

    loadParameters = (dataBuilder: dataStringBuilder.Builder, parameterIds: string[]) => {
        var loaded = this.$q.defer();
        this.$q.when(dataBuilder.addParameter(_.first(parameterIds)).promise).then(() => {
            parameterIds.shift();
            this.$scope.dataProgress = `${this.parameters.length - parameterIds.length}/${this.parameters.length}`;
            if (parameterIds.length == 0) {
                loaded.resolve();
            } else {
                this.$q.when(this.loadParameters(dataBuilder, parameterIds).promise).then(() => {
                    loaded.resolve();
                });
            }
        });
        return loaded;
    }
}