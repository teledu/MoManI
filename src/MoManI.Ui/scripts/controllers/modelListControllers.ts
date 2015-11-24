import $ = require('jquery');
import application = require('application');
import modelModel = require('models/model')
import setService = require('services/setService');
import parameterService = require('services/parameterService');
import variableService = require('services/variableService');
import objectiveFunctionService = require('services/objectiveFunctionService');
import constraintService = require('services/constraintService');
import modelService = require('services/modelService');
import setDataService = require('services/setDataService');
import parameterDataService = require('services/parameterDataService');
import dataStringBuilder = require('models/dataStringBuilder');
import JSZip = require('jszip');
import urls = require('urls');

var forceLoad = [setService, parameterService, variableService, objectiveFunctionService, constraintService, modelService, setDataService, parameterDataService];

export interface IModelListScope extends ng.IScope {
    orderProp: string;
    models: angular.resource.IResourceArray<IModel>;
    downloadExec: (model: IModel) => void;
}

export class ModelListController {
    constructor($scope: IModelListScope, $q: angular.IQService, $http: angular.IHttpService,
        SetService: ng.resource.IResourceClass<ISetResource>, ParameterService: angular.resource.IResourceClass<IParameterResource>,
        VariableService: angular.resource.IResourceClass<IVariableResource>, ObjectiveFunctionService: angular.resource.IResourceClass<IObjectiveFunctionResource>,
        ConstraintService: angular.resource.IResourceClass<IConstraintResource>, ModelService: angular.resource.IResourceClass<IModelResource>,
        SetDataService: angular.resource.IResourceClass<ISetDataResource>, ParameterDataService: angular.resource.IResourceClass<IParameterDataResource>
    ) {
        $scope.models = ModelService.query();
        $scope.orderProp = 'name';

        $scope.downloadExec = (model: IModel) => {
            var zip = new JSZip();
            var setReq = SetService.query().$promise;
            var parameterReq = ParameterService.query().$promise;
            var variableReq = VariableService.query().$promise;
            var objectiveFunctionReq = ObjectiveFunctionService.query().$promise;
            var constraintReq = ConstraintService.query().$promise;
            var modelReq = ModelService.get({ id: model.id }).$promise;
            var executableReq = $http({
                url: urls.executable,
                method: 'GET',
                responseType: 'arraybuffer'
            });

            $q.all([setReq, parameterReq, variableReq, objectiveFunctionReq, constraintReq, modelReq, executableReq]).then(res => {
                var sets = <ISet[]>res[0];
                var parameters = <IParameter[]>res[1];
                var modelData = new modelModel.Model(sets, parameters, <IVariable[]>res[2], <IObjectiveFunction[]>res[3], <IConstraint[]>res[4], <IModel>res[5]);
                var setModels = modelData.selectedSets();
                var executable: ArrayBuffer = (<any>res[6]).data;
                zip.file('RunSimulation.exe', executable, { binary: true });
                zip.file('model.txt', modelData.asTextFile().join(`\r\n`));
                zip.file('metadata.txt', modelData.asMeteDataTextFile().join(`\r\n`));

                var dataBuilder = new dataStringBuilder.Builder($q, SetDataService, ParameterDataService, sets, parameters, model.id, setModels);
                _.forEach(modelData.selectedParameters(), p => {
                    dataBuilder.addParameter(p.id);
                });
                dataBuilder.build().then(data => {
                    zip.file('data.txt', data);

                    try {
                        var blob = zip.generate({ type: 'blob' });
                        saveAs(blob, `${model.name}.zip`);
                    } catch (e) {
                        console.log(e);
                    }
                });
            });
        }
    }
}