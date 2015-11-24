import $ = require('jquery');
import _ = require('lodash');

var appSettingPrefix = 'momani-settings-';

var nodes = $('meta[itemprop]');

var keyValuePairs = _(nodes)
    .map((node: any) => {
        return { key: node.attributes['itemprop'].value, value: node.attributes['content'].value }
    })
    .filter(entry => entry.key.indexOf(appSettingPrefix) === 0)
    .value();

var settings: { [key: string]: string } = {};

_.each(keyValuePairs, entry => settings[entry.key.substr(appSettingPrefix.length)] = entry.value);

export function get(key: string) {
    return settings[key];
}