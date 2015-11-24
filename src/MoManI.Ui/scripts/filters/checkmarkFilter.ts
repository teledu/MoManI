import application = require('application');

application.filter('checkmark', () => input => (input ? "\u2713" : "\u2718"));