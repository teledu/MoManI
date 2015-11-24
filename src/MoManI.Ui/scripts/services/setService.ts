import application = require('application');
import angularResource = require('angular-resource');
import urls = require('urls');

application.factory('SetService', ($resource: ng.resource.IResourceService): ng.resource.IResourceClass<ISetResource> => (
    <ng.resource.IResourceClass<ISetResource>> $resource(urls.sets + ':id', { id: '@id' })
));