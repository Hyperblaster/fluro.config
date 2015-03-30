angular.module('fluro.config', [])


.factory('FluroAuthentication', function($q, Fluro) {
    return {
        'request': function(config) {
            if (Fluro.token) {
                console.log('Add API KEY', Fluro.token)
                config.headers.Authorization = 'Bearer ' + Fluro.token;
            }
            return config;
        },
    };
});



//////////////////////////////////////////

//Create Fluro Config
angular.module('fluro.config', [])

// config module has provider with same name
.provider('Fluro', function() {

    /////////////////////////////////////

    var config = {
        apiURL: 'http://api.fluro.io',
        token:null,
    };

    /////////////////////////////////////

    return {
        set: function(settings) {
            config = settings;
        },
        $get: function() {
            return config;
        }
    };
})



