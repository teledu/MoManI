import application = require('application');
import setService = require('services/setService');
import variableModel = require('models/variable');
import variableService = require('services/variableService');

var forceLoad = [setService, variableService];

export interface IVariableListScope extends ng.IScope {
    orderProp: string;
    variables: angular.resource.IResourceArray<IVariable>;
}

export interface IVariableDetailsScope extends ng.IScope {
    variable: variableModel.Variable;
    operators: IVariableOperator[];
    toggleConstraint: (any) => void;
    detailsForm: angular.IFormController;
    save: () => void;
}

export class VariableListController {
    constructor($scope: IVariableListScope, VariableService: ng.resource.IResourceClass<IVariableResource>) {
        $scope.variables = VariableService.query();
        $scope.orderProp = 'name';
    }
}

export class VariableDetailsController {
    constructor($scope: IVariableDetailsScope, $routeParams: angular.route.IRouteParamsService, $window: angular.IWindowService, $q: angular.IQService,
        SetService: ng.resource.IResourceClass<ISetResource>, VariableService: angular.resource.IResourceClass<IVariableResource>
    ) {
        var setReq = SetService.query().$promise;
        var variableReq;
        if ($routeParams['id'] === 'new') {
            var deferred = $q.defer();
            variableReq = deferred.promise;
            deferred.resolve(null);
        } else {
            variableReq = VariableService.get({ id: $routeParams['id'] }).$promise;
        }

        $q.all([setReq, variableReq]).then(res => {
            $scope.variable = new variableModel.Variable(<ISet[]>res[0], <IVariable>res[1]);
        });

        $scope.operators = variableModel.variableOperators;

        $scope.toggleConstraint = $event => {
            var checkbox = <ICheckbox>$event.target;
            $scope.variable.constraint = checkbox.checked ? new variableModel.VariableConstraint() : null;
        }

        $scope.save = () => {
            if ($scope.detailsForm.$invalid)
                return;
            VariableService.save($scope.variable.serialize(), () => {
                $window.location.href = '#/variables';
            }, () => {
                alert('An error occured');
            });
        }
    }
}

interface ICheckbox {
    checked: boolean;
}