import application = require('application');
import setModel = require('models/set');
import setService = require('services/setService');
import checkmarkFilter = require('filters/checkmarkFilter');

var forceLoad = [checkmarkFilter, setService];

export interface ISetListScope extends ng.IScope {
    orderProp: string;
    sets: angular.resource.IResourceArray<ISet>;
}

export interface ISetDetailsScope extends ng.IScope {
    set: setModel.Set;
    detailsForm: angular.IFormController;
    save: () => void;
}

export class SetListController {
    constructor($scope: ISetListScope, SetService: ng.resource.IResourceClass<ISetResource>) {
        $scope.sets = SetService.query();
        $scope.orderProp = 'name';
    }
}

export class SetDetailsController {
    constructor(
        $scope: ISetDetailsScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        SetService: ng.resource.IResourceClass<ISetResource>
    ) {
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
        });

        $scope.save = () => {
            if ($scope.detailsForm.$invalid) return;
            SetService.save($scope.set.serialize(), () => {
                $window.location.href = '#/sets';
            }, () => {
                alert('An error occured');
            });
        }
    }
}