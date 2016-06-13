import _ = require('lodash');

export class VariableResultSettings {
    private visible: boolean;
    private legendVisible: boolean;
    private legendSubscribers: ((legendVisible: boolean) => void)[];
    private useSetDataDescriptions: boolean;
    private useSetDataDescriptionsSubscribers: ((useSetDataDescriptions: boolean) => void)[];
    private setDataOptions: ISelectableOption[];
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
        this.setDataOptions = _.map(setData.items, i => {
            return {
                value: i.value,
                name: i.name,
                selected: true,
                display: i.value == i.name ? i.value : `${i.value} (${i.name})`,
            };
        });
        this.notifySetDataFilterSubscribers();
    }

    addSetDataFilterSubscriber = (subscriber: (selectedDataValues: string[]) => void) => {
        this.setDataFilterSubscribers.push(subscriber);
    }

    toggleSetData = ($event, setDataOption: ISelectableOption) => {
        var checkbox = <ICheckbox>$event.target;
        setDataOption.selected = checkbox.checked;
        this.notifySetDataFilterSubscribers();
    }

    private notifySetDataFilterSubscribers = () => {
        var selectedSetDataOptions = _.filter(this.setDataOptions, sdo => sdo.selected);
        var selectedSetDataValues = _.map(selectedSetDataOptions, sdo => sdo.value);
        _.forEach(this.setDataFilterSubscribers, subscriber => {
            subscriber(selectedSetDataValues);
        });
    }
}

interface ICheckbox {
    checked: boolean;
}

interface ISelectableOption {
    value: string;
    name: string;
    selected: boolean;
    display: string;
}