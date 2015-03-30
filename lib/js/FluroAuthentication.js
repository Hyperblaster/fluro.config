angular.module('fluro.config')


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


