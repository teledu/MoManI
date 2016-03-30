import application = require('application');
import angularResource = require('angular-resource');
import urls = require('urls');

application.factory('ConstraintGroupService', ($resource: ng.resource.IResourceService): ng.resource.IResourceClass<IConstraintGroupResource> => (
    <ng.resource.IResourceClass<IConstraintGroupResource>> $resource(urls.constraintGroups + ':id', { id: '@id' })
));