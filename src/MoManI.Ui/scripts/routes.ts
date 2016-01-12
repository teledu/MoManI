import application = require('application');
import setControllers = require('controllers/setControllers');
import parameterControllers = require('controllers/parameterControllers');
import variableControllers = require('controllers/variableControllers');
import objectiveFunctionControllers = require('controllers/objectiveFunctionControllers');
import constraintControllers = require('controllers/constraintControllers');
import modelListControllers = require('controllers/modelListControllers');
import modelCompositionControllers = require('controllers/modelCompositionControllers');
import scenarioControllers = require('controllers/scenarioControllers');
import setDataControllers = require('controllers/setDataControllers');
import parameterDataControllers = require('controllers/parameterDataControllers');
import resultListControllers = require('controllers/resultListControllers');
import variableResultControllers = require('controllers/variableResultControllers');

application.config(($routeProvider: angular.route.IRouteProvider, $rootScopeProvider) => {
    $rootScopeProvider.digestTtl(100);
    $routeProvider
        .when(
            '/sets', {
                controller: setControllers.SetListController,
                templateUrl: 'partials/set-list.html',
            })
        .when(
            '/sets/:id', {
                controller: setControllers.SetDetailsController,
                templateUrl: 'partials/set-detail.html'
            })
        .when(
            '/parameters', {
                controller: parameterControllers.ParameterListController,
                templateUrl: 'partials/parameter-list.html'
            })
        .when(
            '/parameters/:id', {
                controller: parameterControllers.ParameterDetailsController,
                templateUrl: 'partials/parameter-detail.html'
            })
        .when(
            '/variables', {
                controller: variableControllers.VariableListController,
                templateUrl: 'partials/variable-list.html'
            })
        .when(
            '/variables/:id', {
                controller: variableControllers.VariableDetailsController,
                templateUrl: 'partials/variable-detail.html'
            })
        .when(
            '/functions', {
                controller: objectiveFunctionControllers.ObjectiveFunctionListController,
                templateUrl: 'partials/function-list.html'
            })
        .when(
            '/functions/:id', {
                controller: objectiveFunctionControllers.ObjectiveFunctionDetailsController,
                templateUrl: 'partials/function-detail.html'
            })
        .when(
            '/constraints', {
                controller: constraintControllers.ConstraintListController,
                templateUrl: 'partials/constraint-list.html'
            })
        .when(
            '/constraints/:id', {
                controller: constraintControllers.ConstraintDetailsController,
                templateUrl: 'partials/constraint-detail.html'
            })
        .when(
            '/models', {
                controller: modelListControllers.ModelListController,
                templateUrl: 'partials/model-list.html'
            })
        .when(
            '/models/:id/compose', {
                controller: modelCompositionControllers.ModelCompositionController,
                templateUrl: 'partials/composition-details.html'
            })
        .when(
            '/models/:modelId/scenarios', {
            controller: scenarioControllers.ScenarioListController,
                templateUrl: 'partials/scenario-list.html'
            })
        .when(
            '/models/:modelId/:scenarioId/data', {
            controller: scenarioControllers.ScenarioDetailsController,
                templateUrl: 'partials/scenario-details.html'
            })
        .when(
            '/models/:modelId/:scenarioId/data/set/:setId', {
                controller: setDataControllers.SetDataController,
                templateUrl: 'partials/set-data.html'
            })
        .when(
            '/models/:modelId/:scenarioId/data/parameter/:parameterId', {
                controller: parameterDataControllers.ParameterDataController,
                templateUrl: 'partials/parameter-data.html'
            })
        .when(
            '/results', {
                controller: resultListControllers.ResultsModelListController,
                templateUrl: 'partials/result-model-list.html'
            })
        .when(
            '/results/:modelId', {
                controller: resultListControllers.ResultsScenarioListController,
                templateUrl: 'partials/result-scenario-list.html'
            })
        .when(
            '/results/:modelId/:scenarioId', {
                controller: variableResultControllers.VariableResultListController,
                templateUrl: 'partials/variable-result-list.html'
            })
        .when(
            '/results/:modelId/:scenarioId/:variableId/charts', {
                controller: variableResultControllers.VariableResultChartsController,
                templateUrl: 'partials/variable-result-charts.html'
            })
        .otherwise({
            redirectTo: '/models'
        });
});