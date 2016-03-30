import settings = require('appSettings');

var apiRoot = settings.get('api');

export var baseUrl = apiRoot;

export var sets = apiRoot + 'Sets/';
export var parameters = apiRoot + 'Parameters/';
export var variables = apiRoot + 'Variables/';
export var objectiveFunctions = apiRoot + 'ObjectiveFunctions/';
export var constraintGroups = apiRoot + 'ConstraintGroups/';
export var constraints = apiRoot + 'Constraints/';
export var models = apiRoot + 'ComposedModels/';
export var scenarios = apiRoot + 'Scenarios/';
export var scenarioCloning = apiRoot + 'ScenarioCloning/';
export var setData = apiRoot + 'SetData/';
export var parameterData = apiRoot + 'ParameterData/';
export var parameterDataSlice = apiRoot + 'ParameterDataSlice/';
export var executable = apiRoot + 'Executable/';
export var variableResults = apiRoot + 'VariableResults/';