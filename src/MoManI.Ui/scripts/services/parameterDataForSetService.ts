import application = require('application');
import angularResource = require('angular-resource');
import urls = require('urls');

application.factory('ParameterDataForSetService', ($resource: ng.resource.IResourceService): ng.resource.IResourceClass<IParameterDataResource> => (
    <ng.resource.IResourceClass<IParameterDataResource>> $resource(urls.parameterDataForSet)
));