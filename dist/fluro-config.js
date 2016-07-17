//////////////////////////////////////////

//Create Fluro Config
angular.module('fluro.config', ['ngStorage'])

// config module has provider with same name
.provider('Fluro', function() {

    /////////////////////////////////////

    var config = {
        apiURL: 'https://apiv2.fluro.io', //Use the basic Fluro API URL by default
        token: null, //Set a token to use for Authentication
        sessionStorage: false, //Set to true if you want to use sessionStorage instead of localStorage
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
        if (Fluro.sessionStorage) {
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
            //console.log('Session token recalled', Fluro.token);
        }
    }

    //////////////////////////

    //Submit and send back the user
    controller.login = function(details, options) {

        if (!options) {
            options = {};
        }

        //////////////////////////////////////

        //Let this service automatically refresh and use tokens
        var autoAuthenticate = true;

        if (options.disableAutoAuthenticate) {
            autoAuthenticate = false;
        }

        //////////////////////////////////////

        //Url to login to
        var url = Fluro.apiURL + '/token/login';

        //If we are logging in to a managed account use a different endpoint
        if (options.managedAccount) {
            url = Fluro.apiURL + '/managed/' + options.managedAccount + '/login';
        }

        //////////////////////////////////////

        var $http = $injector.get('$http');
        var storage = controller.storageLocation();
        var request = $http.post(url, details);

        //////////////////////////

        request.success(function(res) {

            //Store the authentication 
            if (autoAuthenticate) {
                storage.session = res;
                controller.recall();
            }

            if (options.success) {
                options.success(res);
            }
        });

        //////////////////////////

        request.error(function(res) {
            if (options.error) {
                options.error(res);
            }
        });

        //////////////////////////

        return request;
    };

    //////////////////////////
    /**
    controller.collectToken = function(transferToken) {

        var $http = $injector.get('$http');
        var storage = controller.storageLocation();
        var request = $http.get(Fluro.apiURL + '/token/collect/' + transferToken);

        //////////////////////////

        request.success(function(res) {
            
            //Store the authentication 
            storage.session = res;
            controller.recall();

            console.log('Collected User Session', res);
        });

        //////////////////////////

        request.error(function(res) {
            console.log('Error collecting token', token)
        });

        return request;

    }
    /**/
    ////////////////////////////////////////////////////
    ////////////////////////////////////////////////////

    //Sign in as a specified persona
    controller.signInAsPersona = function(personaID, options) {

        if (!options) {
            options = {};
        }

        //////////////////////////

        //Let this service automatically refresh and use tokens
        var autoAuthenticate = true;

        if (options.disableAutoAuthenticate) {
            autoAuthenticate = false;
        }

        //////////////////////////

        var $http = $injector.get('$http');
        var storage = controller.storageLocation();
        var request = $http.post(Fluro.apiURL + '/token/persona/' + personaID);

        request.success(function(res) {
            if (autoAuthenticate) {
                storage.session = res;
                controller.recall();
            }

            if (options.success) {
                options.success(res);
            }
        });

        request.error(function(res) {
            if (options.error) {
                options.error(res);
            }
        });

        return request;
    };

    //////////////////////////

    //Submit and send back the user
    controller.getTokenForAccount = function(accountId, options) {

        if (!options) {
            options = {};
        }

        //////////////////////////

        //Let this service automatically refresh and use tokens
        var autoAuthenticate = true;

        if (options.disableAutoAuthenticate) {
            autoAuthenticate = false;
        }

        //////////////////////////

        var $http = $injector.get('$http');
        var storage = controller.storageLocation();
        var request = $http.post(Fluro.apiURL + '/token/account/' + accountId);

        request.success(function(res) {
            if (autoAuthenticate) {
                storage.session = res;
                controller.recall();
            }

            if (options.success) {
                options.success(res);
            }
        });

        request.error(function(res) {
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
    //////////////////////////
    //////////////////////////
    //////////////////////////
    //////////////////////////

    var inflightRequest;

    //Refresh the token
    controller.refresh = function(successCallback, errorCallback) {

        ///////////////////////////////////////////

        if (inflightRequest) {
            console.log('refresh is inflight')
            return inflightRequest;
        }

        ///////////////////////////////////////////

        //Find out what kind of storage we are upating
        var storage = controller.storageLocation();

        var $http = $injector.get('$http');
        var session = storage.session;

        if (session) {
            if (session.refreshToken) {

                //Make the request to refresh the token
                inflightRequest = $http.post(Fluro.apiURL + '/token/refresh', {
                    refreshToken: session.refreshToken,
                    managed: session.accountType == 'managed',
                });

                ///////////////////////////////////////////////////////

                //Listen for when it's finished and update the session storage
                inflightRequest.success(function(res) {
                    //console.log('Updated token', res.token);
                    //Clear out the inflight
                    inflightRequest = null;

                    //console.log('token has been refreshed new token is:', res.token);
                    storage.session.refreshToken = res.refreshToken;
                    storage.session.token = res.token;
                    storage.session.expires = res.expires;
                    controller.recall();


                    if (successCallback) {
                        return successCallback(res);
                    }
                });

                ///////////////////////////////////////////////////////

                //Request error
                inflightRequest.error(function(res) {

                    //Clear out the inflight
                    inflightRequest = null;

                    if (res == 'invalid_refresh_token') {
                        console.log('your token has expired');
                        controller.deleteSession();
                    } else {
                        console.log('error refreshing token', res);
                    }

                    if (errorCallback) {
                        return errorCallback(res);
                    }
                });

                ///////////////////////////////////////////////////////

                return inflightRequest;
            }
        }
    }

    //////////////////////////

    //Useful for logging out and destroying the session
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

    //Calls above but could be updated to attempt to destroy the token on the server also
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
            if (!startsWith(Fluro.apiURL)) {
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
            //then go no further than here
            if (config.bypassInterceptor) {
                return config;
            }

            ////////////////////////////////////////
            ////////////////////////////////////////

            //If it's a refresh request ignore authentication
            if (config.url.indexOf('/token/refresh') != -1) {
                return config;
            }

            //Add Fluro token to headers
            if (!Fluro.token) {
                return config;
            }

            ////////////////////////////////////////
            ////////////////////////////////////////

            //Now delay the in flight request
            var deferred = $q.defer();

            //Check if the token might expire
            if (Fluro.tokenExpires) {

                //Check if it's expired
                var expired = FluroTokenService.hasExpired();
                //console.log('Has expired', expired, Fluro.tokenExpires);

                //TESTING expired = true;

                //We've expired
                if (expired) {

                    //Wait for a result
                    function refreshSuccess(res) {

                        //Get the new token
                        var newToken = res.data;

                        //Update with the new token
                        config.headers.Authorization = 'Bearer ' + newToken.token;
                        //console.log('refreshed and using', newToken, newToken.token);

                        //console.log('Resolve call', config.url, config.headers)
                        deferred.resolve(config);
                    }

                    /////////////////////////////////////////
                    /////////////////////////////////////////
                    /////////////////////////////////////////

                    function refreshFailed(res) {

                        if(FluroTokenService.backup) {
                            if (FluroTokenService.backup.token) {
                                Fluro.token = FluroTokenService.backup.token;
                                config.headers.Authorization = 'Bearer ' + Fluro.token;
                            }

                            if (FluroTokenService.backup.user) {
                                $rootScope.user = FluroTokenService.backup.user;
                            }

                            deferred.resolve(config);
                        } else {
                            deferred.reject(config);
                        }
                    }

                    //////////////////////////////////////////////

                    var refreshRequest = FluroTokenService.refresh();
                    refreshRequest.then(refreshSuccess, refreshFailed);

                    //////////////////////////////////////////////

                } else {
                    //console.log('Not expired, carry on')
                    config.headers.Authorization = 'Bearer ' + Fluro.token;
                    deferred.resolve(config);
                }

            } else {
                //console.log('Doesnt expire so keep on keeping on')
                config.headers.Authorization = 'Bearer ' + Fluro.token;
                deferred.resolve(config);
            }


            return deferred.promise;
        },
    };
})

//Create a storage service for keeping tokens
.service('FluroTokenStore', function($sessionStorage, $localStorage, $q, $injector, Fluro, FluroTokenService) {

    //Store instance
    //Provide a unique key to store against
    var storeInstance = function(key) {

        var controller = {};

        //Default to local storage
        controller.defaultStorage = 'local';

        ////////////////////////////

        //Function for getting the current storedUser if logged in
        controller.get = function() {
            var storage = controller.storageLocation();
            return storage[key];
        }

        ////////////////////////////

        //Return the session storage by default
        controller.storageLocation = function() {
            if (controller.storage) {
                return controller.storage;
            }

            //////////////////////////////////////

            switch (controller.defaultStorage) {
                case 'session':
                    return $sessionStorage;
                    break;
                default:
                    return $localStorage;
                    break;
            }
        }

        ////////////////////////////
        ////////////////////////////

        //Login with user credentials
        controller.login = function(credentials) {

            //Get the storage location
            var storage = controller.storageLocation();

            //Login but don't authenticate automatically
            var request = FluroTokenService.login(credentials, {
                disableAutoAuthenticate: true
            });

            ////////////////////////

            function loginComplete(res) {

                //Save the storedUsers details
                storage[key] = res.data;

                ////////////////////////////////////////
                console.log('Token Login Success', controller.defaultStorage, storage[key]);
            }

            ////////////////////////

            function loginFailed(res) {
                console.log('Token Login Failed', res);
            }

            ////////////////////////

            request.then(loginComplete, loginFailed);

            ////////////////////////

            return request;
        }

        ////////////////////////////
        ////////////////////////////
        ////////////////////////////

        controller.hasExpired = function() {
            var storage = controller.storageLocation();

            if (storage[key]) {
                var expiry = new Date(storage[key].expires);
                var now = new Date();

                return (expiry.getTime() <= now.getTime());
            }
        }


        ////////////////////////////
        ////////////////////////////
        ////////////////////////////

        //This function returns the HTTP config required to authenticate the storedUsers request
        controller.config = function() {


            //Now delay the in flight request
            var deferred = $q.defer();

            ////////////////////////////////////////

            //Get the storage location
            var storage = controller.storageLocation();

            //If there is no storedUser then reject
            if (!storage[key] || !storage[key].token) {
                deferred.reject();
                return deferred.promise;
            }

            //Create the configuration object
            var config = {}

            //Bypass the default Fluro interceptor
            config.bypassInterceptor = true;

            ////////////////////////////////////////

            // //Include the bearer token in the request
            config.headers = {
                Authorization: 'Bearer ' + storage[key].token
            }

            ////////////////////////////////////////


            //Check if the token might expire
            if (storage[key].expires) {

                //Check if it's expired
                var expired = controller.hasExpired();

                //We've expired
                if (expired) {

                    //Wait for a result
                    function refreshSuccess(res) {

                        //Get the new token
                        var newToken = res.data;

                        //Update with the new token
                        config.headers.Authorization = 'Bearer ' + storage[key].token;

                        //console.log('Customer refresh success', res);
                        //Finish up and resolve
                        deferred.resolve(config);
                    }

                    //////////////////////////////////////////////

                    function refreshFailed(res) {
                        //console.log('Customer refresh failed', res)
                        deferred.reject(config);
                    }

                    //////////////////////////////////////////////

                    //Refresh the storedUser token
                    var refreshRequest = controller.refresh();
                    refreshRequest.then(refreshSuccess, refreshFailed);

                    //////////////////////////////////////////////

                } else {
                    //console.log('Customer still logged in', storage[key].token);
                    config.headers.Authorization = 'Bearer ' + storage[key].token;
                    deferred.resolve(config);
                }

            } else {

                //console.log('Doesnt expire so keep on keeping on')
                config.headers.Authorization = 'Bearer ' + storage[key].token;
                deferred.resolve(config);
            }

            //Return the promise
            return deferred.promise;
        }


        //////////////////////////

        //Useful for logging out and destroying the session
        controller.deleteSession = function() {
            var storage = controller.storageLocation();
            delete storage[key];
        }

        //////////////////////////
        //////////////////////////
        //////////////////////////

        //Store the inflight request
        var inflightRequest;

        //Refresh the token
        controller.refresh = function() {

            ///////////////////////////////////////////

            //If a token refresh request is already being made
            if (inflightRequest) {
                return inflightRequest;
            }

            ///////////////////////////////////////////

            //Find out what kind of storage we are updating
            var storage = controller.storageLocation();

            //Get the $http service
            var $http = $injector.get('$http');
            var storedUser = storage[key];

            if (storedUser) {

                //If the storedUser has a refresh token
                if (storedUser.refreshToken) {

                    //Make the request
                    inflightRequest = $http.post(Fluro.apiURL + '/token/refresh', {
                        refreshToken: storedUser.refreshToken
                    });

                    ///////////////////////////////////////////////////////

                    //Listen for when it's finished and update the session storage
                    inflightRequest.success(function(res) {
                        //Finish the inflight request
                        inflightRequest = null;

                        //Update the storedUser with new token details
                        storage[key].refreshToken = res.refreshToken;
                        storage[key].token = res.token;
                        storage[key].expires = res.expires;

                        //Add in a success callback if needed here
                    });

                    ///////////////////////////////////////////////////////

                    inflightRequest.error(function(res) {

                        //Finish the inflight request
                        inflightRequest = null;

                        //If the refresh token was invalid delete the storedUser session
                        if (res == 'invalid_refresh_token') {
                            //console.log('your token has expired');
                            controller.deleteSession();
                        } else {
                            //console.log('error refreshing token', res);
                        }

                        //Add in an error callback if needed here
                    });

                    ///////////////////////////////////////////////////////

                    return inflightRequest;
                }
            }
        }

        ////////////////////////////

        return controller;

    }

    return storeInstance;
});

//Use this to close off the end
;