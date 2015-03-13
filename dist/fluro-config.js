//////////////////////////////////////////

//Create Fluro Config
angular.module('fluro.config', [])

// config module has provider with same name
.provider('Fluro', function() {
    // initial / default config
    var config = {
        apiURL: 'http://api.fluro.io'
    };
    return {
        set: function(settings) {
            config = settings;
        },
        $get: function() {
            return config;
        }
    };
});