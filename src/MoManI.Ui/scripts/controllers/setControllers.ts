import application = require('application');
import setModel = require('models/set');
import setService = require('services/setService');
import checkmarkFilter = require('filters/checkmarkFilter');

var forceLoad = [checkmarkFilter, setService];

export interface ISetListScope extends ng.IScope {
    orderProp: string;
    sets: angular.resource.IResourceArray<ISet>;
    loading: boolean;
}

export interface ISetDetailsScope extends ng.IScope {
    set: setModel.Set;
    detailsForm: angular.IFormController;
    save: () => void;
    loading: boolean;
}

export class SetListController {
    constructor($scope: ISetListScope, SetService: ng.resource.IResourceClass<ISetResource>) {
        $scope.loading = true;
        $scope.sets = SetService.query();
        $scope.sets.$promise.finally(() => {
            $scope.loading = false;
        });
        $scope.orderProp = 'name';
    }
}

export class SetDetailsController {
    constructor(
        $scope: ISetDetailsScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        SetService: ng.resource.IResourceClass<ISetResource>
    ) {
        $scope.loading = true;
        var setReq;
        if ($routeParams['id'] === 'new') {
            var deferred = $q.defer();
            setReq = deferred.promise;
            deferred.resolve(null);
        } else {
            setReq = SetService.get({ id: $routeParams['id'] }).$promise;
        }

        $q.all([setReq]).then(res => {
            $scope.set = new setModel.Set(<ISet>res[0]);
            $scope.loading = false;
        });

        $scope.save = () => {
            if ($scope.detailsForm.$invalid)
                return;
            $scope.loading = true;
            SetService.save($scope.set.serialize(), () => {
                $window.location.href = '#/sets';
            }, () => {
                alert('An error occured');
                $scope.loading = false;
            });
        }
    }
}