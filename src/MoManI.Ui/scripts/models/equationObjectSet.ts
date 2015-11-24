export class EquationObjectSet implements IEquationObjectSet {
    setId: string;
    name: string;
    initialAbbreviation: string;
    actualAbbreviation: string;
    increment: number;

    constructor(set: ISet, occurence: number) {
        this.setId = set.id;
        this.name = set.name;
        this.initialAbbreviation = _.repeat(set.abbreviation, occurence);
        this.actualAbbreviation = this.initialAbbreviation;
        this.increment = null;
    }

    applyChanges = (changeCollection: ISetChanges) => {
        if (changeCollection == null || changeCollection.setId !== this.setId || changeCollection.changes == null)
            return;
        var renames = _.filter(changeCollection.changes, change => change.changeType === 'Rename');
        var rename = _.last(renames);
        var increments = _.filter(changeCollection.changes, change => change.changeType === 'Increment');
        var increment = _.last(increments);
        this.actualAbbreviation = rename ? rename.changeValue : this.initialAbbreviation;
        this.increment = increment ? +increment.changeValue : null;
    }

    getChanges = () => {
        var changes: ISetChangeItem[] = [];
        if (this.initialAbbreviation !== this.actualAbbreviation) {
            changes.push({ changeType: 'Rename', changeValue: this.actualAbbreviation });
        }
        if (this.increment != null) {
            changes.push({ changeType: 'Increment', changeValue: this.increment.toString() });
        }
        return {
            setId: this.setId,
            changes: changes,
        }
    }

    render = () => {
        var render = this.actualAbbreviation;
        if (this.increment) {
            if (this.increment > 0) {
                render += `+${this.increment.toString() }`;
            } else if (this.increment < 0) {
                render += this.increment.toString();
            }
        }
        return render;
    }
}