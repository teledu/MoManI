import _ = require('lodash');

interface IGroup {
    id: string;
    name: string;
    description: string;
    constraints: IConstraint[];
}

export interface ITableRow {
    name: string;
    constraintName?: string;
    description?: string;
    editLink?: string;
    css: string;
}

export class ConstraintList {
    private groups: IGroup[];
    private ungrouped: IConstraint[];
    private flattened: ITableRow[];
    
    constructor(constraintGroups: IConstraintGroup[], constraints: IConstraint[]) {
        this.groups = _.map(constraintGroups, g => {
            return {
                id: g.id,
                name: g.name,
                description: g.description,
                constraints: [],
            };
        });
        this.ungrouped = [];
        _.forEach(constraints, c => {
            var group = _.find(this.groups, 'id', c.constraintGroupId);
            if (group == null) {
                this.ungrouped.push(c);
            } else {
                group.constraints.push(c);
            }
        });

        this.groups = _.sortBy(this.groups, 'name');
        _.forEach(this.groups, g => {
            g.constraints = _.sortBy(g.constraints, 'name');
        });
        this.ungrouped = _.sortBy(this.ungrouped, 'name');

        this.flattened = [];
        _.forEach(this.groups, g => {
            this.flattened.push({
                name: g.name,
                editLink: `#/constraintGroups/${g.id}`,
                css: 'constraint-group-row',
            });
            _.forEach(g.constraints, c => {
                this.flattened.push({
                    name: c.name,
                    constraintName: c.name,
                    description: c.description,
                    editLink: `#/constraints/${c.id}`,
                    css: 'constraint-row',
                });
            });
        });
        this.flattened.push({
            name: 'Ungrouped',
            css: 'constraint-group-row',
        });
        _.forEach(this.ungrouped, c => {
            this.flattened.push({
                name: c.name,
                constraintName: c.name,
                description: c.description,
                editLink: `#/constraints/${c.id}`,
                css: 'constraint-row',
            });
        });
    }
}