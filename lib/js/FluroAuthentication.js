angular.module('fluro.config', [])


.service('FluroAuthentication', function($q, Fluro) {
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


console.log('Test')
