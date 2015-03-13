app.constant('$api_url', getProperty('fluro_url'));
//////////////////////////////////////////

//Create Fluro Config
angular.module('fluro.config', [])

// config module has provider with same name
.provider('Fluro', function() {
    // initial / default config
    var config = {
        fluro_url: 'http://api.fluro.io'
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