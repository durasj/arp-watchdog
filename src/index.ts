/**
 * Initializion of the app
 */
require('material-components-web/dist/material-components-web');

// Load configuration
require('./Config').default.loadCustom();

// Main UI bootstraping
require('./ui');
