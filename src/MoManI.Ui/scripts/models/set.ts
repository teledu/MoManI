import uuid = require('node-uuid');

export class Set{
    id: string;
    name: string;
    abbreviation: string;
    description: string;
    numeric: boolean;

    constructor(set?: ISet) {
        if (set) {
            this.id = set.id;
            this.name = set.name;
            this.abbreviation = set.abbreviation;
            this.description = set.description;
            this.numeric = set.numeric;
        } else {
            this.id = uuid.v4();
            this.name = '';
            this.abbreviation = '';
            this.description = '';
            this.numeric = false;
        }
    }

    serialize: () => ISet = () => {
        return {
            id: this.id,
            name: this.name,
            abbreviation: this.abbreviation,
            description: this.description,
            numeric: this.numeric,
        }
    }

    asModelString: () => string = () => {
        return `set ${this.name};`;
    }
}