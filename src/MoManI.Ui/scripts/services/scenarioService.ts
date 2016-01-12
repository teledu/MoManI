import application = require('application');
import angularResource = require('angular-resource');
import urls = require('urls');

application.factory('ScenarioService', ($resource: ng.resource.IResourceService): ng.resource.IResourceClass<IScenarioResource> => (
    <ng.resource.IResourceClass<IScenarioResource>>$resource(urls.scenarios + ':id', { id: '@id' })
));