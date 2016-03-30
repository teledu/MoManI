import uuid = require('node-uuid');

export class ConstraintGroup {
    id: string;
    name: string;
    description: string;

    constructor(constraintGroup?: IConstraintGroup) {
        if (constraintGroup) {
            this.id = constraintGroup.id;
            this.name = constraintGroup.name;
            this.description = constraintGroup.description;
        } else {
            this.id = uuid.v4();
            this.name = '';
            this.description = '';
        }
    }

    serialize: () => IConstraintGroup = () => {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
        }
    }
}