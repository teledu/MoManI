import _ = require('lodash');

export class SetDataGroup {
    id: string;
    name: string;
    items: ISelectableEntry<ISetDataItem>[];
    selected: boolean;
    toggleGroupItems: (event) => void;
    selectedItems: () => ISetDataItem[];

    constructor(id: string, name: string, items: ISetDataItem[], changeHandler: () => void) {
        this.id = id;
        this.name = name;
        this.items = _.map(items, (i: ISetDataItem) => {
            return {
                data: i,
                selected: true,
            };
        });
        this.selected = true;
        this.toggleGroupItems = (checked) => {
            var checkbox = <ICheckbox>checked.target;
            _.forEach(this.items, i => { i.selected = checkbox.checked });
            changeHandler();
        }
        this.selectedItems = () => {
            return _(this.items).filter(i => i.selected).map(i => i.data).value();
        }
    }
}

export class VariableResultSettings {
    private visible: boolean;
    private legendVisible: boolean;
    private legendSubscribers: ((legendVisible: boolean) => void)[];
    private useSetDataDescriptions: boolean;
    private useSetDataDescriptionsSubscribers: ((useSetDataDescriptions: boolean) => void)[];
    private setDataGroups: SetDataGroup[];
    private setDataFilterSubscribers: ((selectedDataValues: string[]) => void)[];

    constructor() {
        this.visible = false;
        this.legendVisible = true;
        this.legendSubscribers = [];
        this.useSetDataDescriptions = true;
        this.useSetDataDescriptionsSubscribers = [];
        this.setDataFilterSubscribers = [];
    }

    addLegendSubscriber = (subscriber: (legendVisible: boolean) => void) => {
        this.legendSubscribers.push(subscriber);
    }

    toggleLegend = $event => {
        var checkbox = <ICheckbox>$event.target;
        this.legendVisible = checkbox.checked;
        _.forEach(this.legendSubscribers, subscriber => {
            subscriber(this.legendVisible);
        });
    }

    addUseSetDataDescriptionSubscriber = (subscriber: (useSetDataDescriptions: boolean) => void) => {
        this.useSetDataDescriptionsSubscribers.push(subscriber);
    }

    toggleUseSetDataDescriptions = $event => {
        var checkbox = <ICheckbox>$event.target;
        this.useSetDataDescriptions = checkbox.checked;
        _.forEach(this.useSetDataDescriptionsSubscribers, subscriber => {
            subscriber(this.useSetDataDescriptions);
        });
    }

    updateSetData = (setData: ISetData) => {
        var groups = setData && setData.groups ? setData.groups : [];
        var items = setData && setData.items ? setData.items : [];
        var sortedGroups = _.sortBy(groups, g => g.name);
        var groupList = _.map(sortedGroups, g => {
            var groupSetData = _.filter(items, i => i.groupId == g.id);
            return new SetDataGroup(g.id, g.name, groupSetData, this.notifySetDataFilterSubscribers);
        });
        var ungroupedItems = _.filter(items, c => c.groupId == null);
        groupList.push(new SetDataGroup(null, 'Ungrouped', ungroupedItems, this.notifySetDataFilterSubscribers));
        this.setDataGroups = groupList;
        this.notifySetDataFilterSubscribers();
    }

    addSetDataFilterSubscriber = (subscriber: (selectedDataValues: string[]) => void) => {
        this.setDataFilterSubscribers.push(subscriber);
    }

    toggleSetData = ($event, setDataOption: ISelectableEntry<ISetDataItem>) => {
        var checkbox = <ICheckbox>$event.target;
        setDataOption.selected = checkbox.checked;
        this.notifySetDataFilterSubscribers();
    }

    private notifySetDataFilterSubscribers = () => {
        var selectedSetDataOptions = _.flatten(_.map(this.setDataGroups, g => g.selectedItems()));
        var selectedSetDataValues = _.map(selectedSetDataOptions, sdo => sdo.value);
        _.forEach(this.setDataFilterSubscribers, subscriber => {
            subscriber(selectedSetDataValues);
        });
    }

    public displayForNameValue = (name: string, value: string) => {
        return value == name ? value : `${value} (${name})`;
    }
}

interface ICheckbox {
    checked: boolean;
}