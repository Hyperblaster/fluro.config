//////////////////////////////////////////

//Create Fluro Config
angular.module('fluro.config', ['ngStorage'])

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



.service('FluroTokenService', function($rootScope, $injector, $localStorage, Fluro) {

    var controller = {};

    //////////////////////////

    controller.recall = function() {

        if ($localStorage.session) {
            $rootScope.user = $localStorage.session;
            Fluro.token = $localStorage.session.token;
            Fluro.tokenExpires = $localStorage.session.expires;
            Fluro.refreshToken = $localStorage.session.refreshToken;

            console.log('Recall', $localStorage.session);
        } else {
            console.log('Nothin!');
            controller.deleteSession();
        }
    }

    //////////////////////////

    //Submit and send back the user
    controller.login = function(details, successCallback, errorCallback) {

        var $http = $injector.get('$http');
        var request = $http.post(Fluro.apiURL + '/token/login', details);

        request.success(function(res) {
            console.log('Token Success', res);
            $localStorage.session = res;
            controller.recall();

            if (successCallback) {
                successCallback(res);
            }
        });

        request.error(function(res) {
            console.log('Token Error', res);
            if (errorCallback) {
                errorCallback(res);
            }
        });
    };

    //////////////////////////

    controller.hasExpired = function() {
        if ($localStorage.session) {
            var expiry = new Date($localStorage.session.expires);
            var now = new Date();
            return true;
            return (expiry.getTime() <= now.getTime());
        }
    }

    //////////////////////////

    controller.refresh = function(successCallback, errorCallback) {
        
        var $http = $injector.get('$http');
        var session = $localStorage.session;

        if (session) {
            if (session.refreshToken) {
                var request = $http.post(Fluro.apiURL + '/token/refresh', {
                    refreshToken: session.refreshToken
                });

                request.success(function(res) {
                    console.log('Refresh Token Success', res);
                    $localStorage.session = res;
                    controller.recall();

                    if (successCallback) {
                        successCallback(res);
                    }
                });

                request.error(function(res) {
                    console.log('Error refreshing token', res)
                    controller.deleteSession();

                    if (errorCallback) {
                        errorCallback(res);
                    }
                });
            }
        }
    }

    //////////////////////////

    controller.deleteSession = function() {
        delete $localStorage.session;
        delete $rootScope.user;

        //Remove the fluro token
        delete Fluro.token;
        delete Fluro.tokenExpires;
        delete Fluro.refreshToken;
    }


    //////////////////////////

    controller.logout = function() {
        controller.deleteSession();
    }

    //////////////////////////

    controller.recall();
    
    //////////////////////////
    
    return controller;


})



.service('FluroAuthentication', function($q, Fluro, FluroTokenService) {
    return {
        'request': function(config) {

            if (config.url.indexOf('/token') != -1){
                return config;
            }



            //Check if the token might expire
            if (Fluro.tokenExpires) {

                //Check if it's expired
                var expired = FluroTokenService.hasExpired();
                console.log('Has expired', expired);

                if (expired) {
                    console.log('token expired and requires refresh');
                    //Wait for a result
                    var deferred = $q.defer();


                    function refreshSuccess(res) {
                        console.log('Refreshed successfully', res)
                        deferred.resolve(config);
                    }

                    function refreshFailed(res) {
                        console.log('Refresh failed', res)
                        deferred.reject(config);
                    }

                    FluroTokenService.refresh(refreshSuccess, refreshFailed);

                    return deferred.promise;
                }

            }

            //Add Fluro token to headers
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

            //Add date to headers
            config.headers['fluro-request-date'] = date.toUTCString();

            ////////////////////////////////////////

            return config;




        },
    };
});