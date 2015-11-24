import angular = require('angular');
import angularRoute = require('angular-route');
import angularResource = require('angular-resource');
import angularUiBootstrap = require('angular-ui-bootstrap');
import angularStrapNavbar = require('angular-strap-navbar');
import angularNvd3 = require('angular-nvd3');
import checklistModel = require('checklist-model');

var application = angular.module('application', ['ngRoute', 'ngResource', 'ui.bootstrap', 'mgcrea.ngStrap.navbar', 'checklist-model', 'ngHandsontable', 'nvd3']);
export = application