//////////////////////////////////////////

//Create Fluro Config
angular.module('fluro.config', ['ngStorage'])

// config module has provider with same name
.provider('Fluro', function() {

    /////////////////////////////////////

    var config = {
        apiURL: 'https://apiv2.fluro.io', //Use the basic Fluro API URL by default
        token: null, //Set a token to use for Authentication
        sessionStorage:false, //Set to true if you want to use sessionStorage instead of localStorage
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



.service('FluroTokenService', function($rootScope, $injector, $sessionStorage, $localStorage, Fluro) {

    var controller = {};

    //////////////////////////

   
    controller.storageLocation = function() {
        if(Fluro.sessionStorage) {
            return $sessionStorage;
        } else {
            return $localStorage;
        }
    }

    //////////////////////////

    controller.recall = function() {

        //Get the storage location
        var storage = controller.storageLocation();

        if (storage.session) {
            $rootScope.user = storage.session;
            Fluro.token = storage.session.token;
            Fluro.tokenExpires = storage.session.expires;
            Fluro.refreshToken = storage.session.refreshToken;
           console.log('Recalled session', storage.session.name, storage.session.account);
        } else {
            console.log('No existing session');
        }
    }

    //////////////////////////

    //Submit and send back the user
    controller.login = function(details, options) {

        if(!options) {
            options = {};
        }

        //////////////////////////////////////

        //Let this service automatically refresh and use tokens
        var autoAuthenticate = true;

        if(options.disableAutoAuthenticate) {
            autoAuthenticate = false;
        }

        //////////////////////////////////////

        var $http = $injector.get('$http');
        var storage = controller.storageLocation();
        var request = $http.post(Fluro.apiURL + '/token/login', details);

        //////////////////////////

        request.success(function(res) {
            
            //Store the authentication 
            if(autoAuthenticate) {
                storage.session = res;
                controller.recall();
            }

            if (options.success) {
                options.success(res);
            }
        });

        //////////////////////////

        request.error(function(res) {
            console.log('Token Error', res);
            if (options.error) {
                options.error(res);
            }
        });

        //////////////////////////

        return request;
    };

    //////////////////////////

    //Submit and send back the user
    controller.getTokenForAccount = function(accountId, options) {

        if(!options) {
            options = {};
        }

        //////////////////////////

        //Let this service automatically refresh and use tokens
        var autoAuthenticate = true;

        if(options.disableAutoAuthenticate) {
            autoAuthenticate = false;
        }

        //////////////////////////
        
        var $http = $injector.get('$http');
        var storage = controller.storageLocation();
        var request = $http.post(Fluro.apiURL + '/token/account/' + accountId);

        request.success(function(res) {
            console.log('Account Token Success', res);

            if(autoAuthenticate) {
                storage.session = res;
                controller.recall();
            }


            if (options.success) {
                options.success(res);
            }
        });

        request.error(function(res) {
            console.log('Account Token Error', res);
            if (options.error) {
                options.error(res);
            }
        });

        return request;
    };

    //////////////////////////

    controller.hasExpired = function() {

        var storage = controller.storageLocation();

        if (storage.session) {
            var expiry = new Date(storage.session.expires);
            var now = new Date();
            
            return (expiry.getTime() <= now.getTime());
        }
    }

    //////////////////////////

    controller.refresh = function(successCallback, errorCallback) {

        //Find out what kind of storage we are upating
        var storage = controller.storageLocation();

        var $http = $injector.get('$http');
        var session = storage.session;

        if (session) {
            if (session.refreshToken) {
                var request = $http.post(Fluro.apiURL + '/token/refresh', {
                    refreshToken: session.refreshToken
                });

                request.success(function(res) {
                    console.log('Refresh Token Success', res);
                    storage.session.refreshToken = res.refreshToken;
                    storage.session.token = res.token;
                    storage.session.expires = res.expires;
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

        var storage = controller.storageLocation();
        

        //delete storage.session;
        storage.session = null;
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


            ////////////////////////////////////////
            ////////////////////////////////////////

            function startsWith(string) {
                //Check if the domain name matches the string
                return config.url.slice(0, string.length) === string;
            }

            //If we are hitting a url that doesnt match the api domain then just return here
            if(!startsWith(Fluro.apiURL)) {
                return config;
            }

            ////////////////////////////////////////
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

            //Add current date of the website to headers
            config.headers['fluro-request-date'] = date.toUTCString();

            ////////////////////////////////////////
            ////////////////////////////////////////

            //If we're bypassing the interceptor
            if(config.bypassInterceptor) {
                return config;
            }

            ////////////////////////////////////////
            ////////////////////////////////////////


            if (config.url.indexOf('/token/refresh') != -1 ) {
                console.log(config.url, 'dont send token when refreshing')
                return config;
            }

            var deferred = $q.defer();

            //Add Fluro token to headers
            if (Fluro.token) {
                console.log('Use token', Fluro.token);
                config.headers.Authorization = 'Bearer ' + Fluro.token;
            }

            ////////////////////////////////////////
            ////////////////////////////////////////


            //Check if the token might expire
            if (Fluro.tokenExpires) {

                //Check if it's expired
                var expired = FluroTokenService.hasExpired();
                console.log('Has expired', expired, Fluro.tokenExpires);

                if (expired) {

                    //Wait for a result
                    function refreshSuccess(res) {
                        //Update with the new token
                        config.headers.Authorization = 'Bearer ' + res.token;
                        deferred.resolve(config);
                    }

                    function refreshFailed(res) {
                        deferred.reject(config);
                    }

                    //Update
                    FluroTokenService.refresh(refreshSuccess, refreshFailed);
                } else {
                    deferred.resolve(config);
                }
            } else {
                deferred.resolve(config);
            }


            return deferred.promise;

        },
    };
});