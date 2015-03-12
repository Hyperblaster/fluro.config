//////////////////////////////////////////

//Create Fluro Config
angular.module('fluro.config', [])

// config module has provider with same name
.provider('FluroConfig', function() {
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