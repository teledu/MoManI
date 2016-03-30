import uuid = require('node-uuid');
import equationObject = require('models/equationObject');

export class Constraint {
    data: IEquationObjectData;
    modal: angular.ui.bootstrap.IModalService;
    constraintGroups: IConstraintGroup[];
    id: string;
    constraintGroupId: string;
    name: string;
    description: string;
    equation: IEquationObject;
    enumerators: IEquationObjectSet[];
    enumeratorListString: string;
    hasSetConstraint: boolean;
    setConstraint: IEquationObject;
    loading: boolean;

    constructor(data: IEquationObjectData, modal: angular.ui.bootstrap.IModalService, constraintGroups: IConstraintGroup[], constraint?: IConstraint) {
        this.data = data;
        this.modal = modal;
        var emptyGroup: IConstraintGroup[] = [{ id: null, name: '', description: null }];
        this.constraintGroups = emptyGroup.concat(constraintGroups);
        this.loading = true;
        if (constraint) {
            this.id = constraint.id;
            this.constraintGroupId = constraint.constraintGroupId;
            this.name = constraint.name;
            this.description = constraint.description;
            this.equation = equationObject.createEquationObject(data, equationObject.availableGroupOptions.all, this.replaceEquation, modal, constraint.equation, this.updateEnumeratorsHandler);
            this.setConstraint = equationObject.createEquationObject(data, equationObject.availableGroupOptions.all, this.replaceSetConstraint, modal, constraint.setConstraint);
        } else {
            this.id = uuid.v4();
            this.constraintGroupId = null;
            this.name = '';
            this.description = '';
            this.equation = equationObject.createEquationObject(data, equationObject.availableGroupOptions.all, this.replaceEquation, modal, null, this.updateEnumeratorsHandler);
            this.setConstraint = equationObject.createEquationObject(data, equationObject.availableGroupOptions.all, this.replaceSetConstraint, modal);
        }
        this.hasSetConstraint = !(this.setConstraint instanceof equationObject.EmptyEquationObject);
        this.loading = false;
        this.updateEnumeratorsHandler();
    }

    serialize: () => IConstraint = () => {
        return {
            id: this.id,
            constraintGroupId: this.constraintGroupId,
            name: this.name,
            description: this.description,
            equation: this.equation.serialize(),
            setConstraint: this.hasSetConstraint ? this.setConstraint.serialize() : null,
        }
    }

    replaceEquation = (equation: IEquation) => {
        this.equation = equationObject.createEquationObject(this.data, equationObject.availableGroupOptions.all, this.replaceEquation, this.modal, equation, this.updateEnumeratorsHandler);
        this.updateEnumeratorsHandler();
    }

    replaceSetConstraint = (equation: IEquation) => {
        this.setConstraint = equationObject.createEquationObject(this.data, equationObject.availableGroupOptions.all, this.replaceSetConstraint, this.modal, equation);
    }

    updateEnumeratorsHandler = () => {
        if (this.loading)
            return;
        this.enumerators = this.equation.getSets();
        this.enumeratorListString = _.map(this.enumerators, en => `${en.actualAbbreviation} in ${en.name}`).join(', ');
    }

    getDependencies: () => IDependencies = () => {
        return this.equation.getDependencies().join(this.setConstraint.getDependencies());
    }

    asModelString: () => string = () => {
        var enumeratorStrings = _.map(this.enumerators, e => {
            return `${e.actualAbbreviation} in ${e.name}`;
        });
        var setConstraintString = this.hasSetConstraint ? `: ${this.setConstraint.asString() }` : ``;
        var enumerationString = this.enumerators.length > 0 ? `{${enumeratorStrings.join(', ') }${setConstraintString}}` : ``;
        return `s.t. ${this.name}${enumerationString}: ${this.equation.asString() };`;
    }
}