import _ = require('lodash');
import variableModel = require('models/variable')

export class CsvBuilder {
    rows: string[];

    constructor(dataset: IDimensionalData, sets: ISet[], setDatas: ISetData[], variable: variableModel.Variable) {
        var actualSets = _.map(dataset.sets, s => {
            return _.find(sets, 'id', s.id);
        });
        var otherSetCount = actualSets.length - 1;
        var otherSets = _.take(actualSets, otherSetCount);
        var actualSetDatas = _.map(actualSets, s => _.find(setDatas, 'setId', s.id));
        var detailedSetData = _.last(actualSetDatas);
        var otherSetDatas = _.take(actualSetDatas, otherSetCount);
        var detailedSetDataValueCount = detailedSetData.items.length;
        this.rows = [];
        if (variable.unit) {
            this.rows.push(variable.unit);
        }
        var headerSetNames = _.map(otherSets, s => s.name);
        var headerSetValues = _.map(detailedSetData.items, i => i.value);
        var headerItems = headerSetNames.concat(headerSetValues);
        this.rows.push(headerItems.join(','));

        var coordinates: string[][] = [];
        _.forEach(otherSetDatas, data => {
            var values = _.map(data.items, item => item.value);
            coordinates = buildCoordinates(coordinates, values);
        });

        var dataRows = _.map(coordinates, c => {
            return {
                coordinates: c.join(','),
                values: _.map(_.range(detailedSetDataValueCount), () => <string>undefined)
            }
        });
        
        _.forEach(dataset.data, (data: IDimensionalDataItem) => {
            var coordinates = _.take(data.c, otherSetCount).join(',');
            var index = _.indexOf(headerSetValues, _.last(data.c));
            if (index < 0) return;
            var row = _.find(dataRows, r => r.coordinates === coordinates);
            if (row == null) return;
            row.values[index] = data.v.toString();
        });

        _.forEach(dataRows, data => {
            var row = [data.coordinates].concat(data.values).join(',');
            this.rows.push(row);
        });
    }

    getCsvBlob: () => Blob = () => {
        var content = this.rows.join('\r\n');
        return this.textToBlob(content, 'text/csv');
    }

    private textToBlob = (text: string, contentType: string, sliceSize?: number) => {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;
        
        var byteArrays = [];

        for (var offset = 0; offset < text.length; offset += sliceSize) {
            var slice = text.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, { type: contentType });
        return blob;
    }
}

function buildCoordinates(existingRows: string[][], additionalValues: string[]) {
    if (existingRows.length == 0) {
        return _.map(additionalValues, value => [value]);
    }
    var res: string[][] = [];
    _.forEach(existingRows, row => {
        _.forEach(additionalValues, value => {
            res.push(row.concat(value));
        });
    });
    return res;
}