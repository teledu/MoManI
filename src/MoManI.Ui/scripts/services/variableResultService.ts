import application = require('application');
import angularResource = require('angular-resource');
import urls = require('urls');

application.factory('VariableResultService', ($resource: ng.resource.IResourceService): ng.resource.IResourceClass<IVariableResultResource> => (
    <ng.resource.IResourceClass<IVariableResultResource>>$resource(urls.variableResults + '?variableId=:variableId&modelId=:modelId', { variableId: '@variableId', modelId: '@modelId' })
));