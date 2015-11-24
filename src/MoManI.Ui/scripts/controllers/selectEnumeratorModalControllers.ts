import _ = require('lodash');
import application = require('application');
import equationObject = require('models/equationObject');

export class SelectableEnumerator {
    set: ISet;
    abbreviation: string;
    selected: boolean;

    constructor(equationObjectSet: IEquationObjectSet, setObject: ISet, current: IEnumeratingSetObject) {
        this.abbreviation = equationObjectSet.actualAbbreviation;
        this.set = setObject;
        this.selected = !!current;
    }

    render = () => {
        return `${this.abbreviation} in ${this.set.name}`;
    }

    serialize: () => IEnumeratingSet = () => {
        return {
            setId: this.set.id,
            abbreviation: this.abbreviation,
        }
    }
}

export interface ISelectEnumeratorModalScope extends ng.IScope {
    enumerators: SelectableEnumerator[];
    hasConstraint: boolean;
    constraint: IEquationObject;
    ok: () => void;
    cancel: () => void;
}

export class SelectEnumeratorModalController {
    replaceConstraint: (equation: IEquation) => void;

    constructor($scope: ISelectEnumeratorModalScope, $modalInstance: angular.ui.bootstrap.IModalServiceInstance, $modal: angular.ui.bootstrap.IModalService, data: IEquationObjectData, enumerators: IEquationObjectSet[], selected: IEnumeratingSetObject[], constraint: IEquation) {
        $scope.enumerators = _.map(enumerators, enumeratorData => {
            var set = _.find(data.sets, 'id', enumeratorData.setId);
            var currentData = _.find(selected, sel => sel.set.id == enumeratorData.setId && sel.abbreviation == enumeratorData.actualAbbreviation);
            return new SelectableEnumerator(enumeratorData, set, currentData);
        });

        this.replaceConstraint = (equation: IEquation) => {
            $scope.constraint = equationObject.createEquationObject(data, equationObject.availableGroupOptions.all, this.replaceConstraint, $modal, equation);
        }

        $scope.constraint = equationObject.createEquationObject(data, equationObject.availableGroupOptions.all, this.replaceConstraint, $modal, constraint);
        $scope.hasConstraint = !($scope.constraint instanceof equationObject.EmptyEquationObject);


        $scope.ok = () => {
            var results: IEnumeratorModalResult = {
                enumerators: _($scope.enumerators).filter(e => e.selected).map(e => e.serialize()).value(),
                constraint: (!$scope.hasConstraint || $scope.constraint instanceof equationObject.EmptyEquationObject) ? null : $scope.constraint.serialize(),
            };
            $modalInstance.close(results);
        };

        $scope.cancel = () => {
            $modalInstance.dismiss('cancel');
        };
    }
}