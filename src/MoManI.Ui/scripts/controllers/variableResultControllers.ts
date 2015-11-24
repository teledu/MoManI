import _ = require('lodash');
import application = require('application');
import variableModel = require('models/variable')
import variableResultModel = require('models/variableResult')
import setService = require('services/setService');
import variableService = require('services/variableService');
import setDataService = require('services/setDataService');
import variableResultService = require('services/variableResultService');

var forceLoad = [setService, variableService, setDataService, variableResultService];

export interface IVariableResultChartsScope extends ng.IScope {
    unsupportedDimensions: boolean;
    variableResult: variableResultModel.VariableResult;
    options: any;
    data: any[];
}

export class VariableResultChartsController {
    constructor($scope: IVariableResultChartsScope, $q: angular.IQService, $http: angular.IHttpService, $routeParams: angular.route.IRouteParamsService,
        SetService: ng.resource.IResourceClass<ISetResource>, VariableService: ng.resource.IResourceClass<IVariableResource>,
        SetDataService: angular.resource.IResourceClass<ISetDataResource>, VariableResultService: ng.resource.IResourceClass<IVariableResultResource>
    ) {
        var modelId = $routeParams['modelId'];
        var variableId = $routeParams['variableId'];

        var variableReq = VariableService.get({ id: variableId }).$promise;

        $q.when(variableReq).then((variableRes: IVariable) => {

            var setsReq = SetService.query().$promise;
            var variableResultReq = VariableResultService.get({ variableId: variableId, modelId: modelId }).$promise;
            var reqs: ng.IPromise<any>[] = _(variableRes.sets).uniq().map(s => SetDataService.get({ setId: s, modelId: modelId }).$promise).value();

            reqs.unshift(setsReq, variableResultReq);

            $q.all(reqs).then(res => {
                var sets = <ISet[]>res[0];
                var variableResult = <IVariableResult>res[1];
                var setDatas = <ISetData[]>res.slice(2);
                var variable = new variableModel.Variable(sets, variableRes);

                $scope.variableResult = new variableResultModel.VariableResult(variable, variableResult, sets, setDatas);
            });

        });


    }
}