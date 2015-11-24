import application = require('application');
import angularResource = require('angular-resource');
import urls = require('urls');

application.factory('ConstraintService', ($resource: ng.resource.IResourceService): ng.resource.IResourceClass<IConstraintResource> => (
    <ng.resource.IResourceClass<IConstraintResource>> $resource(urls.constraints + ':id', { id: '@id' })
));