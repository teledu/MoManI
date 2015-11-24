import application = require('application');
import angularResource = require('angular-resource');
import urls = require('urls');

application.factory('ModelService', ($resource: ng.resource.IResourceService): ng.resource.IResourceClass<IModelResource> => (
    <ng.resource.IResourceClass<IModelResource>> $resource(urls.models + ':id', { id: '@id' })
));