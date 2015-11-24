import application = require('application');
import angularResource = require('angular-resource');
import urls = require('urls');

application.factory('ObjectiveFunctionService', ($resource: ng.resource.IResourceService): ng.resource.IResourceClass<IObjectiveFunctionResource> => (
    <ng.resource.IResourceClass<IObjectiveFunctionResource>> $resource(urls.objectiveFunctions + ':id', { id: '@id' })
));