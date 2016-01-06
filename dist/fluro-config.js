//////////////////////////////////////////

//Create Fluro Config
angular.module('fluro.config', [])

// config module has provider with same name
.provider('Fluro', function() {

    /////////////////////////////////////

    var config = {
        apiURL: 'https://apiv2.fluro.io',
        token:null,
        timezone:null,
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

.service('FluroAuthentication', function($q, Fluro) {
    return {
        'request': function(config) {
            if (Fluro.token) {
                config.headers.Authorization = 'Bearer ' + Fluro.token;
            }

            if (Fluro.timezone) {
                config.headers['fluro-timezone'] = Fluro.timezone;
            }

            //Add the browsers date for queries 
            config.headers['fluro-request-date'] = new Date();
            
            return config;
        },
    };
});


