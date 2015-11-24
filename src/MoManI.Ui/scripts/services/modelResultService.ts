import application = require('application');
import angularResource = require('angular-resource');
import urls = require('urls');

application.factory('ModelResultService', ($resource: ng.resource.IResourceService): ng.resource.IResourceClass<IModelResultResource> => (
    <ng.resource.IResourceClass<IModelResultResource>> $resource(urls.modelResults + ':id', { id: '@id' })
));