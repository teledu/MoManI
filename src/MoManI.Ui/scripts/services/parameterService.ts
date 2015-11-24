import application = require('application');
import angularResource = require('angular-resource');
import urls = require('urls');

application.factory('ParameterService', ($resource: ng.resource.IResourceService): ng.resource.IResourceClass<IParameterResource> => (
    <ng.resource.IResourceClass<IParameterResource>> $resource(urls.parameters + ':id', { id: '@id' })
));