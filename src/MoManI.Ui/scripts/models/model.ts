﻿import _ = require('lodash');
import uuid = require('node-uuid');
import urls = require('urls');
import setModel = require('models/set');
import parameterModel = require('models/parameter');
import variableModel = require('models/variable');
import objectiveFunctionModel = require('models/objectiveFunction');
import constraintModel = require('models/constraint');
import modelDependency = require('models/modelDependency');

export class ModelConstraintGroup {
    id: string;
    name: string;
    constraints: ISelectableEntry<constraintModel.Constraint>[];
    selected: boolean;
    toggleGroupConstraints: (event) => void;
    selectedConstraints: () => constraintModel.Constraint[];

    constructor(id : string, name: string, constraints: IConstraint[], selectedConstraints: string[], data: IEquationObjectData, changeHandler: () => void) {
        this.id = id;
        this.name = name;
        var sortedConstraints = _.sortBy(constraints, c => c.name);
        this.constraints = _.map(sortedConstraints, (c: IConstraint) => {
            return {
                data: new constraintModel.Constraint(data, null, [], c),
                selected: _.some(selectedConstraints, constraintId => constraintId == c.id),
            }
        });
        this.selected = _.every(this.constraints, c => c.selected);
        this.toggleGroupConstraints = (checked) => {
            var checkbox = <ICheckbox>checked.target;
            _.forEach(this.constraints, c => { c.selected = checkbox.checked });
            changeHandler();
        }
        this.selectedConstraints = () => {
            return _(this.constraints).filter(c => c.selected).map(c => c.data).value();
        }
    }
}

export class Model {
    id: string;
    name: string;
    description: string;
    sets: ISelectableEntry<setModel.Set>[];
    parameters: ISelectableEntry<parameterModel.Parameter>[];
    variables: ISelectableEntry<variableModel.Variable>[];
    objectiveFunctions: ISelectableEntry<objectiveFunctionModel.ObjectiveFunction>[];
    constraintGroups: ModelConstraintGroup[];
    allConstraintsSelected: boolean;

    constructor(sets: ISet[], parameters: IParameter[], variables: IVariable[], objectiveFunctions: IObjectiveFunction[], constraintGroups: IConstraintGroup[], constraints: IConstraint[], model?: IModel) {
        if (model) {
            this.id = model.id;
            this.name = model.name;
            this.description = model.description;
        } else {
            this.id = uuid.v4();
            this.name = '';
            this.description = '';
        }
        var data: IEquationObjectData = {
            sets: sets,
            parameters: parameters,
            variables: variables,
        };
        this.sets = _.map(_.sortBy(sets, s => s.name), s => {
            return {
                data: new setModel.Set(s),
                selected: model ? _.some(model.sets, setId => setId == s.id) : false,
            }
        });
        this.parameters = _.map(_.sortBy(parameters, p => p.name), p => {
            return {
                data: new parameterModel.Parameter(sets, p),
                selected: model ? _.some(model.parameters, parameterId => parameterId == p.id) : false,
            }
        });
        this.variables = _.map(_.sortBy(variables, v => v.name), v => {
            return {
                data: new variableModel.Variable(sets, v),
                selected: model ? _.some(model.variables, variableId => variableId == v.id) : false,
            }
        });
        this.objectiveFunctions = _.map(_.sortBy(objectiveFunctions, o => o.name), o => {
            return {
                data: new objectiveFunctionModel.ObjectiveFunction(data, null, o),
                selected: model ? model.objectiveFunction == o.id : false,
            }
        });

        var modelConstraints = model ? model.constraints : [];
        var sortedConstraintGroups = _.sortBy(constraintGroups, cg => cg.name);
        var constraintGroupList = _.map(sortedConstraintGroups, cg => {
            var groupConstraints = _.filter(constraints, c => c.constraintGroupId == cg.id);
            return new ModelConstraintGroup(cg.id, cg.name, groupConstraints, modelConstraints, data, this.recalculateDependencies);
        });
        var ungroupedConstraints = _.filter(constraints, c => c.constraintGroupId == null);
        constraintGroupList.push(new ModelConstraintGroup(null, 'Ungrouped', ungroupedConstraints, modelConstraints, data, this.recalculateDependencies));
        this.constraintGroups = constraintGroupList;
        this.allConstraintsSelected = this.selectedConstraints().length == constraints.length;
    }

    toggleObjectiveFunction: (event, objFun: ISelectableEntry<objectiveFunctionModel.ObjectiveFunction>) => void = (event, objFun) => {
        var checkbox = <ICheckbox>event.target;
        _.forEach(this.objectiveFunctions, other => { other.selected = false });
        objFun.selected = checkbox.checked;
        this.recalculateDependencies();
    }

    toggleConstraint: (event, constraint: ISelectableEntry<constraintModel.Constraint>) => void = (event, constraint) => {
        var checkbox = <ICheckbox>event.target;
        constraint.selected = checkbox.checked;
        this.recalculateDependencies();
    }

    toggleAllConstraints: (event) => void = (event) => {
        var checkbox = <ICheckbox>event.target;
        _.forEach(this.constraintGroups, cg => {
            _.forEach(cg.constraints, c => {
                c.selected = checkbox.checked;
            });
            cg.selected = checkbox.checked;
        });
        this.recalculateDependencies();
    }

    recalculateDependencies: () => void = () => {
        var dependencies = new modelDependency.ModelDependency([], [], []);
        var selectedObjectiveFunctions = _.filter(this.objectiveFunctions, objFun => objFun.selected);
        _.forEach(selectedObjectiveFunctions, objFun => {
            dependencies = dependencies.join(objFun.data.getDependencies());
        });
        _.forEach(this.selectedConstraints(), constraint => {
            dependencies = dependencies.join(constraint.getDependencies());
        });
        this.markDependencies(dependencies);
    }

    markDependencies = (dependencies: IDependencies) => {
        _.forEach(this.sets, s => {
            s.selected = _.some(dependencies.sets, depSet => {
                return s.data.id == depSet;
            });
        });
        _.forEach(this.parameters, p => {
            p.selected = _.some(dependencies.parameters, depPar => {
                return p.data.id == depPar;
            });
        });
        _.forEach(this.variables, v => {
            v.selected = _.some(dependencies.variables, depVar => {
                return v.data.id == depVar;
            });
        });
    }

    selectedSets = () => {
        return _(this.sets).filter(s => s.selected).map(s => s.data).value();
    }

    selectedParameters = () => {
        return _(this.parameters).filter(p => p.selected).map(p => p.data).value();
    }

    selectedVariables = () => {
        return _(this.variables).filter(v => v.selected).map(v => v.data).value();
    }

    selectedObjectiveFunction = () => {
        return _(this.objectiveFunctions).filter(o => o.selected).map(o => o.data).first();
    }

    selectedConstraints = () => {
        return _.flatten(_.map(this.constraintGroups, cg => cg.selectedConstraints()));
    }

    selectedConstraintGroups = () => {
        return _.filter(this.constraintGroups, cg => _.some(cg.constraints, c => c.selected));
    }

    serialize: () => IModel = () => {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            sets: _.map(this.selectedSets(), s => s.id),
            parameters: _.map(this.selectedParameters(), p => p.id),
            variables: _.map(this.selectedVariables(), v => v.id),
            objectiveFunction: this.selectedObjectiveFunction().id,
            constraints: _.map(this.selectedConstraints(), c => c.id),
        }
    }

    asTextFile: () => string[] = () => {
        var res = [];
        res.push('###############');
        res.push('#    Sets     #');
        res.push('###############');
        res.push('#');
        _.forEach(this.selectedSets(), s => {
            res.push(s.asModelString());
        });
        res.push('#');
        res.push('#####################');
        res.push('#    Parameters     #');
        res.push('#####################');
        res.push('#');
        _.forEach(this.selectedParameters(), p => {
            res.push(p.asModelString());
        });
        res.push('#');
        res.push('##########################');
        res.push('#    Model Variables     #');
        res.push('##########################');
        res.push('#');
        _.forEach(this.selectedVariables(), v => {
            res.push(v.asModelString());
        });
        res.push('#');
        res.push('######################');
        res.push('# Objective Function #');
        res.push('######################');
        res.push('#');
        res.push(this.selectedObjectiveFunction().asModelString());
        res.push('#');
        res.push('#####################');
        res.push('#    Constraints    #');
        res.push('#####################');
        res.push('#');
        _.forEach(this.selectedConstraintGroups(), cg => {
            res.push(`#  ${cg.name}`);
            _.forEach(cg.selectedConstraints(), c => {
                res.push(c.asModelString());
            });
            res.push('#');
        });
        res.push('#####################');
        res.push('#');
        res.push('solve;');
        res.push('#');
        res.push('#####################');
        res.push('#');
        res.push('################');
        res.push('#    Output    #');
        res.push('################');
        res.push('#');
        _.forEach(this.selectedVariables(), v => {
            res.push(v.asOutputString());
        });
        res.push('#');
        res.push('end;');
        res.push('');
        return res;
    }

    asScenarioMetaDataTextFile: (scenarioId: string) => string[] = (scenarioId: string) => {
        var res = [];
        res.push(urls.baseUrl);
        res.push(scenarioId);
        res.push(this.id);
        _.forEach(this.selectedVariables(), v => {
            res.push(v.asMetaData());
        });
        return res;
    }
}

interface ICheckbox {
    checked: boolean;
}