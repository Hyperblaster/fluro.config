//////////////////////////////////////////

//Create Fluro Config
angular.module('fluro.config', [])

// config module has provider with same name
.provider('Fluro', function() {

    /////////////////////////////////////

    var config = {
        apiURL: 'https://apiv2.fluro.io',
        token: null,
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



.service('FluroTokenService', function($rootScope, $http, Fluro) {

    var controller = {};

    //////////////////////////

    //Submit and send back the user
    controller.login = function(details, successCallback, errorCallback) {
        $http.post(Fluro.apiURL + '/token/login', details)
            .success(function(res) {
                console.log('Token Success', res);

                if (successCallback) {
                    successCallback(res);
                }
            })
            .error(function(res) {
                console.log('Token Error', res);
                if (errorCallback) {
                    errorCallback(res);
                }
            });

    };

    //////////////////////////

    return controller;

})



.service('FluroAuthentication', function($q, Fluro) {
    return {
        'request': function(config) {
            if (Fluro.token) {
                config.headers.Authorization = 'Bearer ' + Fluro.token;
            }

            ////////////////////////////////////////

            var date = new Date();

            if (Fluro.timezoneOffset && String(Fluro.timezoneOffset).length) {

                //Localized time
                var websiteOffset = Fluro.timezoneOffset; // * 60;
                var viewerOffset = (date.getTimezoneOffset() * -1);

                ///////////////////////////////////////////////////////////////

                //Get the difference
                var hoursDifference = websiteOffset - viewerOffset;
                var offsetDifference = hoursDifference * 60 * 1000;

                //Adjust the date
                date.setTime(date.getTime() + offsetDifference);
            }

            config.headers['fluro-request-date'] = date.toUTCString();

            ////////////////////////////////////////

            return config;
        },
    };
});