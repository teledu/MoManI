import application = require('application');
import _ = require('lodash');

export interface IEquationObjectModalScope extends ng.IScope {
    ok: () => void;
    cancel: () => void;
    sets: IEquationObjectSet[];
}

export class EquationObjectModalController {
    constructor($scope: IEquationObjectModalScope, $modalInstance: angular.ui.bootstrap.IModalServiceInstance, sets: IEquationObjectSet[]) {
        $scope.sets = sets;

        $scope.ok = () => {
            $modalInstance.close(_.map($scope.sets, set => set.getChanges()));
        };

        $scope.cancel = () => {
            $modalInstance.dismiss('cancel');
        };
    }
}