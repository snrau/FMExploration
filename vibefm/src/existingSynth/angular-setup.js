import angular from 'angular';
import './synth.css'; // Import AngularJS CSS if needed

// Define AngularJS app
const app = angular.module('synth', []);

// Controllers and configuration can go here
app.controller('MidiCtrl', function ($scope) {
    // Controller logic here
});

app.controller('PresetCtrl', function ($scope) {
    // Controller logic here
});

// Export function to initialize the app
export function bootstrapAngularApp(element) {
    angular.bootstrap(element, ['synth']);
}