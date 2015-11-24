import _ = require('lodash');
import setModel = require('models/set');
import setDataModel = require('models/setData');
import parameterDataSerializer = require('models/parameterDataStringSerializer');

export interface ISetComponent {
    id: string;
    model: setModel.Set;
    data: setDataModel.SetData;
}

export class Builder {
    $q: angular.IQService;
    parameterDataService: angular.resource.IResourceClass<IParameterDataResource>;
    parameters: IParameter[];
    modelId: string;
    parameterDataReqs: ng.IPromise<void>[];
    setsLoading: ng.IPromise<boolean>;
    setData: setDataModel.SetData[];
    parameterData: parameterDataSerializer.ParameterData[];

    constructor(
        $q: angular.IQService, setDataService: angular.resource.IResourceClass<ISetDataResource>, parameterDataService: angular.resource.IResourceClass<IParameterDataResource>,
        sets: ISet[], parameters: IParameter[], modelId: string, setModels: setModel.Set[]
    ) {
        this.$q = $q;
        this.parameterDataService = parameterDataService;
        this.parameters = parameters;
        this.modelId = modelId;

        this.setData = [];
        this.parameterData = [];
        this.parameterDataReqs = [];
        var deferred = this.$q.defer();
        this.setsLoading = deferred.promise;
        var setDataReqs = _.map(setModels, sm => {
            return setDataService.get({ setId: sm.id, modelId: this.modelId }).$promise.then(data => {
                var set = _.find(sets, 'id', sm.id);
                this.setData.push(new setDataModel.SetData(this.modelId, set, data));
            });
        });
        $q.all(setDataReqs).then(() => { deferred.resolve(true); }, () => deferred.reject(false));
    }

    addParameter = (parameterId: string) => {
        var req = this.parameterDataService.get({ parameterId: parameterId, modelId: this.modelId }).$promise;
        var load = this.$q.all([req, this.setsLoading]).then(res => {
            var parameter = _.find(this.parameters, 'id', parameterId);
            var parameterData = <IParameterData>res[0];
            var dependentSetData = _.map(parameter.sets, s => {
                return _.find(this.setData, 'setId', s);
            });
            this.parameterData.push(new parameterDataSerializer.ParameterData(parameter, dependentSetData, parameterData));
        });
        this.parameterDataReqs.push(load);
    }

    build: () => ng.IPromise<string> = () => {
        return this.$q.all(this.parameterDataReqs).then(() => {
            var res = [];
            res.push('###############');
            res.push('#    Sets     #');
            res.push('###############');
            res.push('#');
            _.forEach(this.setData, s => {
                res.push(`set ${s.setName} := ${s.getValues().join(' ') } ;`);
            });
            res.push('');
            res.push('');
            res.push('#####################');
            res.push('#    Parameters     #');
            res.push('#####################');
            res.push('#');
            _.forEach(this.parameterData, p => {
                res = res.concat(p.asDataString());
                res.push('');
            });
            res.push('#');
            res.push('end;');
            res.push('');
            return res.join('\r\n');;
        });
    }
}