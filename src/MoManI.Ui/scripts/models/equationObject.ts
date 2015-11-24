import _ = require('lodash');
import equationObjectSet = require('models/equationObjectSet');
import modelDependency = require('models/modelDependency');
import equationObjectEditSetsController = require('controllers/equationObjectEditSetsController');
import equationObjectModalControllers = require('controllers/equationObjectModalControllers');
import selectEnumeratorModalControllers = require('controllers/selectEnumeratorModalControllers');

export enum ReplaceGroupOption {
    Sets,
    Parameters,
    Variables,
    Operators,
    Number,
}

export var availableGroupOptions = {
    all: [ReplaceGroupOption.Sets, ReplaceGroupOption.Parameters, ReplaceGroupOption.Variables, ReplaceGroupOption.Operators, ReplaceGroupOption.Number],
    sets: [ReplaceGroupOption.Sets],
    none: [],
}

export var equationOperators = [
    { id: '=', name: '=' },
    { id: '>', name: '>' },
    { id: '<', name: '<' },
    { id: '>=', name: '>=' },
    { id: '<=', name: '<=' },
    { id: '<>', name: '<>' },
    { id: '+', name: '+' },
    { id: '-', name: '-' },
    { id: '*', name: '*' },
    { id: '/', name: '/' },
    { id: '()', name: '( )' },
    { id: 'sum', name: 'Sum' },
    { id: 'min', name: 'Min' },
    { id: 'max', name: 'Max' },
    { id: 'ifthen', name: 'If - then' },
    { id: 'if', name: 'If - then - else' },
];

export var modalReplaceHandler = (availableGroups: ReplaceGroupOption[], callback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService, data: IEquationObjectData, updateHandler?: () => void) => {
    var modalInstance = modal.open({
        templateUrl: 'partials/replace-equation-object.html',
        controller: equationObjectModalControllers.EquationObjectModalController,
        resolve: {
            data() { return data; },
            availableGroups() { return availableGroups; },
        }
    });
    modalInstance.result.then((selectedItem: IEquation) => {
        callback(selectedItem);
        if (updateHandler)
            updateHandler();
    });
};

export class EquationObjectAction implements IEquationObjectAction {
    text: string;
    handler: () => void;

    constructor(text: string, handler: () => void) {
        this.text = text;
        this.handler = handler;
    }
}


export class EquationObjectBase implements IEquationObject {
    data: IEquationObjectData;
    operator1: string = null;
    operator2: string = null;
    operator3: string = null;
    innerEquation1: IEquationObject = null;
    innerEquation2: IEquationObject = null;
    innerEquation3: IEquationObject = null;
    innerEquation1AvailableGroups = availableGroupOptions.all;
    innerEquation2AvailableGroups = availableGroupOptions.all;
    innerEquation3AvailableGroups = availableGroupOptions.all;
    actions: IEquationObjectAction[] = [];
    canRender: boolean = false;
    render: () => string = () => '';
    updateHandler: () => void;
    modal: angular.ui.bootstrap.IModalService;

    serialize: () => IEquation;
    asString: () => string;

    constructor(
        data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
        replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService, updateHandler?: () => void
    ) {
        this.data = data;
        this.updateHandler = updateHandler;
        this.actions.push(new EquationObjectAction('Replace', () => { modalReplaceHandler(availableReplacementGroups, replaceCallback, modal, data, updateHandler) }));
        this.modal = modal;
    }

    replaceInnerEquation1 = (equation: IEquation) => {
        this.innerEquation1 = createEquationObject(this.data, this.innerEquation1AvailableGroups, this.replaceInnerEquation1, this.modal, equation, this.updateHandler);
    }
    replaceInnerEquation2 = (equation: IEquation) => {
        this.innerEquation2 = createEquationObject(this.data, this.innerEquation2AvailableGroups, this.replaceInnerEquation2, this.modal, equation, this.updateHandler);
    }
    replaceInnerEquation3 = (equation: IEquation) => {
        this.innerEquation3 = createEquationObject(this.data, this.innerEquation3AvailableGroups, this.replaceInnerEquation3, this.modal, equation, this.updateHandler);
    }

    getSets = () => {
        var setCollection: IEquationObjectSet[] = [];
        if (this.innerEquation1) {
            setCollection = setCollection.concat(this.innerEquation1.getSets());
        }
        if (this.innerEquation2) {
            setCollection = setCollection.concat(this.innerEquation2.getSets());
        }
        if (this.innerEquation3) {
            setCollection = setCollection.concat(this.innerEquation3.getSets());
        }
        return _.uniq(setCollection, setItem => {
            return [setItem.setId, setItem.actualAbbreviation].join(':');
        });
    }

    getDependencies = () => {
        var dependencies = new modelDependency.ModelDependency([], [], []);
        if (this.innerEquation1) {
            dependencies = dependencies.join(this.innerEquation1.getDependencies());
        }
        if (this.innerEquation2) {
            dependencies = dependencies.join(this.innerEquation2.getDependencies());
        }
        if (this.innerEquation3) {
            dependencies = dependencies.join(this.innerEquation3.getDependencies());
        }
        return dependencies;
    }
}

export function createEquationObject(
    data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
    replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService,
    equation?: IEquation, updateHandler?: () => void
): IEquationObject {
    if (equation == null)
        return new EmptyEquationObject(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
    switch (equation.type) {
        case 'Empty':
            return new EmptyEquationObject(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
        case 'Number':
            return new NumberEquationObject(data, availableReplacementGroups, replaceCallback, modal, equation, updateHandler);
        case 'Parameter':
            return new ParameterEquationObject(data, availableReplacementGroups, replaceCallback, modal, equation, updateHandler);
        case 'Variable':
            return new VariableEquationObject(data, availableReplacementGroups, replaceCallback, modal, equation, updateHandler);
        case 'Operator':
            return createOperatorEquationObject(data, availableReplacementGroups, replaceCallback, modal, equation, updateHandler);
        case 'Set':
            return new SetEquationObject(data, availableReplacementGroups, replaceCallback, modal, equation, updateHandler);
        default:
            return new EmptyEquationObject(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
        //throw new Error(`Unsupported equation object type: ${equation.type}`);
    }
}

export class EmptyEquationObject extends EquationObjectBase {
    constructor(
        data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
        replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService, updateHandler?: () => void
    ) {
        super(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
        this.render = () => '...';
        this.canRender = true;
    }

    serialize = () => {
        return {
            type: 'Empty',
            value: null,
            innerEquation1: null,
            innerEquation2: null,
            innerEquation3: null,
            setChanges: null,
            enumeratingSets: null,
        }
    }

    asString = () => 'null';
}

class NumberEquationObject extends EquationObjectBase {
    value: number;

    constructor(
        data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
        replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService,
        equation: IEquation, updateHandler?: () => void
    ) {
        super(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
        this.value = +equation.value;
        this.render = () => this.value.toString();
        this.canRender = true;
    }

    serialize = () => {
        return {
            type: 'Number',
            value: this.value.toString(),
            innerEquation1: null,
            innerEquation2: null,
            innerEquation3: null,
            setChanges: null,
            enumeratingSets: null,
        }
    }

    asString = () => this.value.toString();
}

class EditableSetEquationObjectBase extends EquationObjectBase {
    internalSets: IEquationObjectSet[];

    constructor(
        data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
        replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService, updateHandler?: () => void
    ) {
        super(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
        var editHandler = () => {
            var internalSets = this.internalSets;
            var modalInstance = modal.open({
                templateUrl: 'partials/equation-object-edit-sets.html',
                controller: equationObjectEditSetsController.EquationObjectModalController,
                resolve: {
                    sets() { return internalSets; },
                }
            });
            modalInstance.result.then((setChanges: ISetChanges[]) => {
                _.forEach(this.internalSets, (internalSet, index) => {
                    internalSet.applyChanges(setChanges[index]);
                });
                if (this.updateHandler)
                    this.updateHandler();
            });
        };
        this.actions.push(new EquationObjectAction('Edit sets', editHandler));
    }

    getSets = () => {
        return _.uniq(this.internalSets, setItem => {
            return [setItem.setId, setItem.actualAbbreviation].join(':');
        });
    }

    asString = () => this.render();
}

class ParameterEquationObject extends EditableSetEquationObjectBase {
    parameter: IParameter;

    constructor(
        data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
        replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService,
        equation: IEquation, updateHandler?: () => void
    ) {
        super(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
        this.parameter = _.find(data.parameters, 'id', equation.value);
        var parameterSets = _.map(this.parameter.sets, setId => _.find(data.sets, 'id', setId));
        this.internalSets = _.map(parameterSets, (set: ISet, index) => {
            var previousSets = _.take(parameterSets, index);
            var repetitions = _.filter(previousSets, (previousSet: ISet) => previousSet.id === set.id).length;
            var item = new equationObjectSet.EquationObjectSet(set, repetitions + 1);
            if (equation.setChanges) {
                item.applyChanges(equation.setChanges[index]);
            }
            return item;
        });
        this.render = () => {
            var internalSetsString = this.internalSets.length > 0 ? ` [${_.map(this.internalSets, is => is.render()).join(', ') }]` : ``;
            return `${this.parameter.name}${internalSetsString}`;
        }
        this.canRender = true;
    }

    serialize = () => {
        return {
            type: 'Parameter',
            value: this.parameter.id,
            innerEquation1: null,
            innerEquation2: null,
            innerEquation3: null,
            setChanges: _.map(this.internalSets, internalSet => internalSet.getChanges()),
            enumeratingSets: null,
        }
    }

    getDependencies = () => {
        return new modelDependency.ModelDependency(this.parameter.sets, [this.parameter.id], []);
    }
}

class VariableEquationObject extends EditableSetEquationObjectBase {
    variable: IVariable;

    constructor(
        data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
        replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService,
        equation: IEquation, updateHandler?: () => void
    ) {
        super(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
        this.variable = _.find(data.variables, 'id', equation.value);
        var variableSets = _.map(this.variable.sets, setId => _.find(data.sets, 'id', setId));
        this.internalSets = _.map(variableSets, (set: ISet, index) => {
            var previousSets = _.take(variableSets, index);
            var repetitions = _.filter(previousSets, (previousSet: ISet) => previousSet.id === set.id).length;
            var item = new equationObjectSet.EquationObjectSet(set, repetitions + 1);
            if (equation.setChanges) {
                item.applyChanges(equation.setChanges[index]);
            }
            return item;
        });
        this.render = () => {
            var internalSetsString = this.internalSets.length > 0 ? ` [${_.map(this.internalSets, is => is.render()).join(', ') }]` : ``;
            return `${this.variable.name}${internalSetsString}`;
        }
        this.canRender = true;
    }

    serialize = () => {
        return {
            type: 'Variable',
            value: this.variable.id,
            innerEquation1: null,
            innerEquation2: null,
            innerEquation3: null,
            setChanges: _.map(this.internalSets, internalSet => internalSet.getChanges()),
            enumeratingSets: null,
        }
    }

    getDependencies = () => {
        return new modelDependency.ModelDependency(this.variable.sets, [], [this.variable.id]);
    }
}

class SetEquationObject extends EquationObjectBase {
    set: ISet;
    internalSet: IEquationObjectSet;

    constructor(
        data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
        replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService,
        equation: IEquation, updateHandler?: () => void
    ) {
        super(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
        this.set = _.find(data.sets, 'id', equation.value);
        this.render = () => this.internalSet.render();
        this.canRender = true;
        this.internalSet = new equationObjectSet.EquationObjectSet(this.set, 1);
        if (equation.setChanges) {
            this.internalSet.applyChanges(equation.setChanges[0]);
        }

        var editHandler = () => {
            var internalSets = [this.internalSet];
            var modalInstance = modal.open({
                templateUrl: 'partials/equation-object-edit-sets.html',
                controller: equationObjectEditSetsController.EquationObjectModalController,
                resolve: {
                    sets() { return internalSets; },
                }
            });
            modalInstance.result.then((setChanges: ISetChanges[]) => {
                this.internalSet.applyChanges(setChanges[0]);
                if (this.updateHandler)
                    this.updateHandler();
            });
        };
        this.actions.push(new EquationObjectAction('Edit set', editHandler));
    }

    getSets = () => {
        return [this.internalSet];
    }

    serialize = () => {
        return {
            type: 'Set',
            value: this.set.id,
            innerEquation1: null,
            innerEquation2: null,
            innerEquation3: null,
            setChanges: [this.internalSet.getChanges()],
            enumeratingSets: null,
        }
    }

    asString = () => this.render();

    getDependencies = () => {
        return new modelDependency.ModelDependency([this.set.id], [], []);
    }
}

class SimpleOperator extends EquationObjectBase {
    constructor(
        data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
        replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService,
        equation: IEquation, updateHandler?: () => void
    ) {
        super(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
        this.operator2 = equation.value;
        this.innerEquation1 = createEquationObject(data, this.innerEquation1AvailableGroups, this.replaceInnerEquation1, modal, equation.innerEquation1, updateHandler);
        this.innerEquation2 = createEquationObject(data, this.innerEquation2AvailableGroups, this.replaceInnerEquation2, modal, equation.innerEquation2, updateHandler);
    }

    serialize = () => {
        return {
            type: 'Operator',
            value: this.operator2,
            innerEquation1: this.innerEquation1.serialize(),
            innerEquation2: this.innerEquation2.serialize(),
            innerEquation3: null,
            setChanges: null,
            enumeratingSets: null,
        }
    }

    asString = () => `${this.innerEquation1.asString() } ${this.operator2} ${this.innerEquation2.asString() }`;
}

class ParenthesisOperator extends EquationObjectBase {
    constructor(
        data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
        replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService,
        equation: IEquation, updateHandler?: () => void
    ) {
        super(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
        this.operator1 = '(';
        this.operator2 = ')';
        this.innerEquation1 = createEquationObject(data, this.innerEquation1AvailableGroups, this.replaceInnerEquation1, modal, equation.innerEquation1, updateHandler);
    }

    serialize = () => {
        return {
            type: 'Operator',
            value: '()',
            innerEquation1: this.innerEquation1.serialize(),
            innerEquation2: null,
            innerEquation3: null,
            setChanges: null,
            enumeratingSets: null,
        }
    }

    asString = () => `(${this.innerEquation1.asString() })`;
}

class IfThenOperator extends EquationObjectBase {
    constructor(
        data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
        replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService,
        equation: IEquation, updateHandler?: () => void
    ) {
        super(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
        this.operator1 = 'if';
        this.operator2 = 'then';
        this.innerEquation1 = createEquationObject(data, this.innerEquation1AvailableGroups, this.replaceInnerEquation1, modal, equation.innerEquation1, updateHandler);
        this.innerEquation2 = createEquationObject(data, this.innerEquation2AvailableGroups, this.replaceInnerEquation2, modal, equation.innerEquation2, updateHandler);
    }

    serialize = () => {
        return {
            type: 'Operator',
            value: 'ifthen',
            innerEquation1: this.innerEquation1.serialize(),
            innerEquation2: this.innerEquation2.serialize(),
            innerEquation3: null,
            setChanges: null,
            enumeratingSets: null,
        }
    }

    asString = () => `if ${this.innerEquation1.asString() } then ${this.innerEquation2.asString() }`;
}

class IfOperator extends EquationObjectBase {
    constructor(
        data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
        replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService,
        equation: IEquation, updateHandler?: () => void
    ) {
        super(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
        this.operator1 = 'if';
        this.operator2 = 'then';
        this.operator3 = 'else';
        this.innerEquation1 = createEquationObject(data, this.innerEquation1AvailableGroups, this.replaceInnerEquation1, modal, equation.innerEquation1, updateHandler);
        this.innerEquation2 = createEquationObject(data, this.innerEquation2AvailableGroups, this.replaceInnerEquation2, modal, equation.innerEquation2, updateHandler);
        this.innerEquation3 = createEquationObject(data, this.innerEquation3AvailableGroups, this.replaceInnerEquation3, modal, equation.innerEquation3, updateHandler);
    }

    serialize = () => {
        return {
            type: 'Operator',
            value: 'if',
            innerEquation1: this.innerEquation1.serialize(),
            innerEquation2: this.innerEquation2.serialize(),
            innerEquation3: this.innerEquation3.serialize(),
            setChanges: null,
            enumeratingSets: null,
        }
    }

    asString = () => `if ${this.innerEquation1.asString() } then ${this.innerEquation2.asString() } else ${this.innerEquation3.asString() }`;
}

class SetEnumeratedOperator extends EquationObjectBase {
    operatorValue: string;
    innerEquation1: SetEnumeratorObject;

    constructor(
        data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
        replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService,
        equation: IEquation, updateHandler?: () => void
    ) {
        super(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
        this.innerEquation2 = createEquationObject(data, this.innerEquation2AvailableGroups, this.replaceInnerEquation2, modal, equation.innerEquation2, updateHandler);
        this.innerEquation1 = new SetEnumeratorObject(data, modal, this.retrieveInternalSets, equation.innerEquation1, updateHandler);
    }

    serialize = () => {
        return {
            type: 'Operator',
            value: this.operatorValue,
            innerEquation1: this.innerEquation1.serialize(),
            innerEquation2: this.innerEquation2.serialize(),
            innerEquation3: null,
            setChanges: null,
            enumeratingSets: null,
        }
    }

    getSets = () => {
        return _.filter(this.retrieveInternalSets(), internalSet => {
            return !_.some(this.innerEquation1.enumerators, enumerator => {
                return enumerator.set.id == internalSet.setId && enumerator.abbreviation == internalSet.actualAbbreviation;
            });
        });
    }

    private retrieveInternalSets = () => {
        var setCollection: IEquationObjectSet[] = [];
        setCollection = setCollection.concat(this.innerEquation1.constraint.getSets());
        setCollection = setCollection.concat(this.innerEquation2.getSets());
        return _.uniq(setCollection, setItem => {
            return [setItem.setId, setItem.actualAbbreviation].join(':');
        });
    }
}

class MinMaxOperator extends SetEnumeratedOperator {
    constructor(
        data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
        replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService,
        equation: IEquation, updateHandler?: () => void
    ) {
        super(data, availableReplacementGroups, replaceCallback, modal, equation, updateHandler);
        this.operatorValue = equation.value;
        this.operator1 = `${equation.value}{`;
        this.operator2 = `} ${equation.value}(`;
        this.operator3 = ')';
        this.innerEquation2AvailableGroups = availableGroupOptions.sets;
    }

    asString = () => `${this.operatorValue}{${this.innerEquation1.asString() }} ${this.operatorValue}(${this.innerEquation2.asString() })`;
}

class SumOperator extends SetEnumeratedOperator {
    constructor(
        data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
        replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService,
        equation: IEquation, updateHandler?: () => void
    ) {
        super(data, availableReplacementGroups, replaceCallback, modal, equation, updateHandler);
        this.operatorValue = 'sum';
        this.operator1 = 'sum {';
        this.operator2 = '}';
    }

    asString = () => `sum{${this.innerEquation1.asString() }} ${this.innerEquation2.asString() }`;
}

class SetEnumeratorObject implements IEquationObject {
    data: IEquationObjectData;
    modal: angular.ui.bootstrap.IModalService;
    operator1: string;
    operator2: string;
    operator3: string;
    innerEquation1: IEquationObject;
    innerEquation2: IEquationObject;
    innerEquation3: IEquationObject;
    canRender: boolean;
    actions: IEquationObjectAction[] = [];

    updateHandler: () => void
    sets: () => IEquationObjectSet[];
    enumerators: EnumeratingSetObject[] = [];
    constraint: IEquationObject;

    constructor(
        data: IEquationObjectData,
        modal: angular.ui.bootstrap.IModalService,
        sets: () => IEquationObjectSet[],
        equation: IEquation,
        updateHandler?: () => void
    ) {
        this.data = data;
        this.modal = modal;
        this.updateHandler = updateHandler;
        this.sets = sets;
        if (equation) {
            this.loadEnumerators(equation.enumeratingSets, equation.innerEquation1);
        } else {
            this.loadEnumerators([], null);
        }
        this.canRender = true;
        this.actions.push(new EquationObjectAction('Select sets', () => { modalSelectEnumeratorsHandler(modal, this.loadEnumerators, data, this.sets, this.enumerators, this.constraint.serialize()) }));
    }

    render = () => {
        var render: string;
        if (this.enumerators.length == 0) {
            render = '...';
        } else {
            render = _.map(this.enumerators, enumerator => enumerator.render()).join(', ');
        }
        if (!(this.constraint instanceof EmptyEquationObject)) {
            render += `: ${this.constraint.asString() }`;
        }
        return render;
    }

    getSets(): IEquationObjectSet[] { return []; }

    serialize = () => {
        return {
            type: 'SetEnumerator',
            value: null,
            innerEquation1: this.constraint ? this.constraint.serialize() : null,
            innerEquation2: null,
            innerEquation3: null,
            setChanges: null,
            enumeratingSets: _.map(this.enumerators, enumerator => enumerator.serialize()),
        }
    }

    asString = () => {
        var render: string;
        if (this.enumerators.length == 0) {
            render = 'null';
        } else {
            render = _.map(this.enumerators, enumerator => enumerator.render()).join(', ');
        }
        if (!(this.constraint instanceof EmptyEquationObject)) {
            render += `: ${this.constraint.asString() }`;
        }
        return render;
    }

    getDependencies = () => {
        return this.constraint.getDependencies();
    }

    private loadEnumerators = (enumerators: IEnumeratingSet[], constraint: IEquation) => {
        this.enumerators = _.map(enumerators, enumerator => new EnumeratingSetObject(this.data, this.modal, enumerator));
        this.constraint = createEquationObject(this.data, availableGroupOptions.all, null, null, constraint);
        if (this.updateHandler)
            this.updateHandler();
    }
}

class EnumeratingSetObject implements IEnumeratingSetObject {
    setId: string;
    set: ISet;
    abbreviation: string;
    data: IEquationObjectData;
    modal: angular.ui.bootstrap.IModalService;

    constructor(data: IEquationObjectData, modal: angular.ui.bootstrap.IModalService, enumerator: IEnumeratingSet) {
        this.data = data;
        this.modal = modal;
        this.abbreviation = enumerator.abbreviation;
        this.set = _.find(data.sets, 'id', enumerator.setId);
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

function createOperatorEquationObject(
    data: IEquationObjectData, availableReplacementGroups: ReplaceGroupOption[],
    replaceCallback: (equation: IEquation) => void, modal: angular.ui.bootstrap.IModalService,
    equation: IEquation, updateHandler?: () => void
): EquationObjectBase {
    switch (equation.value) {
        case '=':
        case '>':
        case '<':
        case '>=':
        case '<=':
        case '<>':
        case '+':
        case '-':
        case '*':
        case '/':
        case '^':
        case '&&':
        case '||':
            return new SimpleOperator(data, availableReplacementGroups, replaceCallback, modal, equation, updateHandler);
        case 'sum':
            return new SumOperator(data, availableReplacementGroups, replaceCallback, modal, equation, updateHandler);
        case '()':
            return new ParenthesisOperator(data, availableReplacementGroups, replaceCallback, modal, equation, updateHandler);
        case 'min':
        case 'max':
            return new MinMaxOperator(data, availableReplacementGroups, replaceCallback, modal, equation, updateHandler);
        case 'ifthen':
            return new IfThenOperator(data, availableReplacementGroups, replaceCallback, modal, equation, updateHandler);
        case 'if':
            return new IfOperator(data, availableReplacementGroups, replaceCallback, modal, equation, updateHandler);
        default:
            return new EmptyEquationObject(data, availableReplacementGroups, replaceCallback, modal, updateHandler);
    }
}

var modalSelectEnumeratorsHandler = (
    modal: angular.ui.bootstrap.IModalService, callback: (enumerators: IEnumeratingSet[], constraint: IEquation) => void,
    data: IEquationObjectData, sets: () => IEquationObjectSet[], selected: IEnumeratingSetObject[], constraint: IEquation
) => {
    var modalInstance = modal.open({
        templateUrl: 'partials/select-enumerators.html',
        controller: selectEnumeratorModalControllers.SelectEnumeratorModalController,
        resolve: {
            data() { return data; },
            enumerators() { return sets(); },
            selected() { return selected; },
            constraint() { return constraint; },
        },
        size: 'lg',
    });
    modalInstance.result.then((result: IEnumeratorModalResult) => {
        callback(result.enumerators, result.constraint);
    });
};