import application = require('application');
import _ = require('lodash');

export interface IEnumeratingSetSelectionModalScope extends ng.IScope {
    ok: () => void;
    cancel: () => void;
}

export class EnumeratingSetSelectionModalController {
    constructor($scope: IEnumeratingSetSelectionModalScope, $modalInstance: angular.ui.bootstrap.IModalServiceInstance) {
        $scope.ok = () => {
            $modalInstance.close();
        };

        $scope.cancel = () => {
            $modalInstance.dismiss('cancel');
        };
    }
}