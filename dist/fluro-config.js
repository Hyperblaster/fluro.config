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



.service('FluroTokenService', function($rootScope, $injector, Fluro) {

    console.log('TESTING');

    

    var controller = {};

    //////////////////////////

    controller.recall = function() {
        if (localStorage.session) {
            $rootScope.user = localStorage.session;
        }
    }

    //////////////////////////

    //Submit and send back the user
    controller.login = function(details, successCallback, errorCallback) {

        var $http = $injector.get('$http');

        var request = $http.post(Fluro.apiURL + '/token/login', details);

        request.success(function(res) {
            console.log('Token Success', res);
            $rootScope.user = res;

            if (details.remember) {
                localStorage.session = res;
            }

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
        if (localStorage.session) {
            var expiry = new Date(localStorage.session.expires);
            var now = new Date();
            return (expiry.getTime() <= now.getTime());
        }
    }

    //////////////////////////

    controller.refresh = function(successCallback, errorCallback) {

        var $http = $injector.get('$http');
        var session = localStorage.session;

        if (session) {
            if (session.refreshToken) {
                var request = $http.post(Fluro.apiURL + '/token/refresh', {
                    refreshToken: session.refreshToken
                });

                request.success(function(res) {
                    console.log('Refresh Token Success', res);
                    localStorage.session = res;
                    $rootScope.user = res;

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
        delete localStorage.session;
        delete $rootScope.user;
    }


    //////////////////////////

    controller.logout = function() {
        controller.deleteSession();
    }

    //////////////////////////

    return controller;

})



.service('FluroAuthentication', function($q, Fluro, FluroTokenService) {
    return {
        'request': function(config) {

            //Check if the token might expire
            if (FluroTokenService.hasExpired()) {
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

            } else {

                //Do the normal thing

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

                return config;

            }


        },
    };
});