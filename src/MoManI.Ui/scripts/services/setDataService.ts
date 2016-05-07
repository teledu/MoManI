import application = require('application');
import angularResource = require('angular-resource');
import urls = require('urls');

application.factory('SetDataService', ($resource: ng.resource.IResourceService): ng.resource.IResourceClass<ISetDataResource> => (
    <ng.resource.IResourceClass<ISetDataResource>> $resource(urls.setData)
));