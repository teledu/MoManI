import uuid = require('node-uuid');
import equationObject = require('models/equationObject');

export class ObjectiveFunction {
    data: IEquationObjectData;
    modal: angular.ui.bootstrap.IModalService;
    id: string;
    name: string;
    description: string;
    function: string;
    equation: IEquationObject;

    constructor(data: IEquationObjectData, modal: angular.ui.bootstrap.IModalService, objectiveFunction?: IObjectiveFunction) {
        this.data = data;
        this.modal = modal;
        if (objectiveFunction) {
            this.id = objectiveFunction.id;
            this.name = objectiveFunction.name;
            this.description = objectiveFunction.description;
            this.function = objectiveFunction.function;
            this.equation = equationObject.createEquationObject(data, equationObject.availableGroupOptions.all, this.replaceEquation, modal, objectiveFunction.equation);
        } else {
            this.id = uuid.v4();
            this.name = '';
            this.description = '';
            this.function = 'Minimize';
            this.equation = equationObject.createEquationObject(data, equationObject.availableGroupOptions.all, this.replaceEquation, modal);
        }
    }

    serialize: () => IObjectiveFunction = () => {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            function: this.function,
            equation: this.equation.serialize(),
        }
    }

    replaceEquation = (equation: IEquation) => {
        this.equation = equationObject.createEquationObject(this.data, equationObject.availableGroupOptions.all, this.replaceEquation, this.modal, equation);
    }

    getDependencies: () => IDependencies = () => {
        return this.equation.getDependencies();
    }

    asModelString: () => string = () => {
        return `${this.function.toLowerCase()} ${this.name}: ${this.equation.asString()};`;
    }
}