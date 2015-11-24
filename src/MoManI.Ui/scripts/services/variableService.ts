import application = require('application');
import angularResource = require('angular-resource');
import urls = require('urls');

application.factory('VariableService', ($resource: ng.resource.IResourceService): ng.resource.IResourceClass<IVariableResource> => (
    <ng.resource.IResourceClass<IVariableResource>> $resource(urls.variables + ':id', { id: '@id' })
));