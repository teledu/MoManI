import application = require('application');
import _ = require('lodash');
import equationObject = require('models/equationObject');

export interface IEquationObjectModalOption {
    id: string;
    display: string;
}

export interface IEquationObjectModalScope extends ng.IScope {
    parametersVisible: boolean;
    variablesVisible: boolean;
    operatorsVisible: boolean;
    numberVisible: boolean;
    setsVisible: boolean;
    parameters: IEquationObjectModalOption[];
    variables: IEquationObjectModalOption[];
    operators: IEquationObjectModalOption[];
    sets: IEquationObjectModalOption[];
    empty: IEquationObjectModalOption;
    numberValue: number;
    selected: IDisplayableEquation;
    select: (object: IEquationObjectModalOption, objectType: string) => void;
    selectNumber: (value: number) => void;
    ok: () => void;
    cancel: () => void;
}

export class EquationObjectModalController {
    constructor($scope: IEquationObjectModalScope, $modalInstance: angular.ui.bootstrap.IModalServiceInstance, data: IEquationObjectData, availableGroups: equationObject.ReplaceGroupOption[]) {
        var sortedSets = _.sortBy(data.sets, 'name');
        $scope.sets = _.map(sortedSets, set => {
            return {
                id: set.id,
                display: `${set.abbreviation} in ${set.name}`,
            };
        });
        var sortedParameters = _.sortBy(data.parameters, 'name');
        $scope.parameters = _.map(sortedParameters, parameter => {
            var parameterSets = _.map(parameter.sets, setId => _.find(data.sets, s => s.id == setId));
            var setRenders = _.map(parameterSets, (set, index) => {
                var previousSets = _.take(parameterSets, index);
                var repetitions = _.filter(previousSets, previousSet => previousSet.id === set.id).length;
                return _.repeat(set.abbreviation, repetitions + 1) + ' in ' + set.name;
            });
            return {
                id: parameter.id,
                display: parameter.name + ' {' + setRenders.join(', ') + '}',
            };
        });
        var sortedVariables = _.sortBy(data.variables, 'name');
        $scope.variables = _.map(sortedVariables, variable => {
            var variableSets = _.map(variable.sets, setId => _.find(data.sets, s => s.id == setId));
            var setRenders = _.map(variableSets, (set, index) => {
                var previousSets = _.take(variableSets, index);
                var repetitions = _.filter(previousSets, previousSet => previousSet.id === set.id).length;
                return _.repeat(set.abbreviation, repetitions + 1) + ' in ' + set.name;
            });
            return {
                id: variable.id,
                display: variable.name + ' {' + setRenders.join(', ') + '}',
            };
        });
        $scope.operators = [
            { id: '=', display: '=' },
            { id: '>', display: '>' },
            { id: '<', display: '<' },
            { id: '>=', display: '>=' },
            { id: '<=', display: '<=' },
            { id: '<>', display: '<>' },
            { id: '+', display: '+' },
            { id: '-', display: '-' },
            { id: '*', display: '*' },
            { id: '/', display: '/' },
            { id: '^', display: '^' },
            { id: '&&', display: '&&' },
            { id: '||', display: '||' },
            { id: '()', display: '( )' },
            { id: 'sum', display: 'Sum' },
            { id: 'min', display: 'Min' },
            { id: 'max', display: 'Max' },
            { id: 'ifthen', display: 'If - then' },
            { id: 'if', display: 'If - then - else' },
        ];
        $scope.empty = {
            id: null,
            display: 'Empty',
        };
        $scope.numberValue = null;

        $scope.parametersVisible = _.includes(availableGroups, equationObject.ReplaceGroupOption.Parameters);
        $scope.variablesVisible = _.includes(availableGroups, equationObject.ReplaceGroupOption.Variables);
        $scope.operatorsVisible = _.includes(availableGroups, equationObject.ReplaceGroupOption.Operators);
        $scope.numberVisible = _.includes(availableGroups, equationObject.ReplaceGroupOption.Number);
        $scope.setsVisible = _.includes(availableGroups, equationObject.ReplaceGroupOption.Sets);

        $scope.select = (object, objectType) => {
            $scope.selected = {
                type: objectType,
                value: object.id,
                display: object.display,
                innerEquation1: null,
                innerEquation2: null,
                innerEquation3: null,
                setChanges: null,
                enumeratingSets: null,
            }
        };

        $scope.selectNumber = (value: number) => {
            if (value == null) {
                $scope.selected = null;
                return;
            }
            $scope.selected = {
                type: 'Number',
                value: value.toString(),
                display: value.toString(),
                innerEquation1: null,
                innerEquation2: null,
                innerEquation3: null,
                setChanges: null,
                enumeratingSets: null,
            }
        }

        $scope.ok = () => {
            $modalInstance.close($scope.selected);
        };

        $scope.cancel = () => {
            $modalInstance.dismiss('cancel');
        };
    }
}