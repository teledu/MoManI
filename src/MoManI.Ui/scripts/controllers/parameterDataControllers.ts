import $ = require('jquery');
import application = require('application');
import parameterDataModel = require('models/parameterData')
import setDataModel = require('models/setData')
import setService = require('services/setService');
import parameterService = require('services/parameterService');
import setDataService = require('services/setDataService');
import parameterDataService = require('services/parameterDataService');

var forceLoad = [setService, parameterService, setDataService, parameterDataService];

export interface IParameterDataScope extends ng.IScope {
    data: parameterDataModel.ParameterData;
    save: () => void;
}

export class ParameterDataController {
    constructor($scope: IParameterDataScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        ParameterService: ng.resource.IResourceClass<IParameterResource>, SetService: ng.resource.IResourceClass<ISetResource>,
        ParameterDataService: angular.resource.IResourceClass<IParameterDataResource>, SetDataService: angular.resource.IResourceClass<ISetDataResource>
    ) {
        var modelId = $routeParams['modelId'];
        var parameterId = $routeParams['parameterId'];

        var setReq = SetService.query().$promise;
        var parameterReq = ParameterService.get({ id: parameterId }).$promise;
        var parameterDataReq = ParameterDataService.get({ parameterId: parameterId, modelId: modelId }).$promise;

        $q.all([setReq, parameterReq, parameterDataReq]).then(res => {
            var sets = <ISet[]>res[0];
            var parameter = <IParameter>res[1];
            var parameterData = <IParameterData>res[2];
            var setDataReqs = _.map(parameter.sets, setId => {
                return SetDataService.get({ setId: setId, modelId: modelId }).$promise;
            });
            $q.all(setDataReqs).then(setDataRes => {
                var setDatas = _.map(parameter.sets, (setId, index) => {
                    var actualSet = _.find(sets, 'id', setId);
                    return new setDataModel.SetData(modelId, actualSet, <ISetData>setDataRes[index]);
                });
                $scope.data = new parameterDataModel.ParameterData(modelId, parameter, setDatas, parameterData);
            });
        });

        $scope.save = () => {
            ParameterDataService.save($scope.data.serialize(), () => {
                $window.location.href = `#/models/${modelId}/data`;
            }, () => {
                alert('An error occured');
            });
        }
    }
}