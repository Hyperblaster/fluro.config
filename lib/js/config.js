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
            // if(hybridAuthenticationSource) {
            //     return hybridAuthenticationSource;
            // } else {
            //     return config;
            // }
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

    //Manually set the session token
    controller.set = function(session) {
        var storage = controller.storageLocation();
        storage.session = session;
        controller.recall();
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
            ////console.log('Session token recalled', Fluro.token);
        }
    }

    //////////////////////////

    //Register and send back the user
    controller.signup = function(details, options) {

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
        var url = Fluro.apiURL + '/token/signup';

        //If we are logging in to a managed account use a different endpoint
        if (options.application) {
            if (Fluro.appDevelopmentURL && Fluro.appDevelopmentURL.length) {
                //console.log('Sign up request rerouted to app development url', Fluro.appDevelopmentURL);
                url = Fluro.appDevelopmentURL + '/fluro/application/signup';
            } else {
                url = '/fluro/application/signup';

            }
        }

        //If we are logging in to a managed account use a different endpoint
        if (options.url) {
            url = options.url;
        }

        //////////////////////////////////////

        var $http = $injector.get('$http');
        var storage = controller.storageLocation();
        var request = $http.post(url, details);

        //////////////////////////

        request.then(function(res) {

            //Store the authentication 
            if (autoAuthenticate) {
                storage.session = res.data;
                controller.recall();
            }

            if (options.success) {
                options.success(res.data);
            }
        }, function(err) {
            if (options.error) {
                options.error(err.data);
            }
        });

        //////////////////////////

        return request;
    };

    //////////////////////////
    //////////////////////////
    //////////////////////////

    controller.sendResetPasswordRequest = function(details, options) {
        if (!options) {
            options = {};
        }

        //////////////////////////////////////

        //If a full fledged Fluro User
        //then send directly to the API
        var url = Fluro.apiURL + '/resend';

        //////////////////////////////////////

        //If we are testing locally then send the request to the remote application url
        if (Fluro.appDevelopmentURL && Fluro.appDevelopmentURL.length) {
            //console.log('Forgot password request rerouted to app development url', Fluro.appDevelopmentURL);
            url = Fluro.appDevelopmentURL + '/fluro/application/forgot';
        } else {
            //Otherwise just send to the url of the application
            url = '/fluro/application/forgot';
        }
        

        //Get the $http service
        var $http = $injector.get('$http');
        var request = $http.post(url, details);

        //Return the request promise
        return request;

    }

    //////////////////////////
    //////////////////////////
    //////////////////////////

    controller.applicationRequest = function(details, path, options) {
        if (!options) {
            options = {};
        }

        //////////////////////////////////////
        
        var url;

        //////////////////////////////////////

        //If we are testing locally then send the request to the remote application url
        if (Fluro.appDevelopmentURL && Fluro.appDevelopmentURL.length) {
            //console.log('Forgot password request rerouted to app development url', Fluro.appDevelopmentURL);
            url = Fluro.appDevelopmentURL + '/fluro/application' + path;
        } else {
            //Otherwise just send to the url of the application
            url = '/fluro/application' + path;
        }

        if(!url || !url.length) {
            return console.log('Cant send an invite request without an application url')
        }
        

        //Get the $http service
        var $http = $injector.get('$http');

        /////////////////////////////////////////

        var config;

        //Create a configuration object
        if(Fluro.token) {
            config = {
                bypassInterceptor:true,
                headers:{
                    Authorization:'Bearer ' + Fluro.token,
                },
            }
        }

        /////////////////////////////////////////

        var request = $http.post(url, details, config);

        //Return the request promise
        return request;

    }

    //////////////////////////
    //////////////////////////
    //////////////////////////

    controller.retrieveUserFromResetToken = function(token, options) {
        if (!options) {
            options = {};
        }

        //////////////////////////////////////

        //Url to login to
        var url = Fluro.apiURL + '/auth/token/' + token;

        //If we are logging in to a managed account use a different endpoint
        if (options.application) {
            if (Fluro.appDevelopmentURL && Fluro.appDevelopmentURL.length) {
                //console.log('Login request rerouted to app development url', Fluro.appDevelopmentURL);
                url = Fluro.appDevelopmentURL + '/fluro/application/reset/' + token;
            } else {
                url = '/fluro/application/reset/' + token;
            }
        }

        //Get the $http service
        var $http = $injector.get('$http');
        var request = $http.get(url);

        //Return the request promise
        return request;

    }


    //////////////////////////
    //////////////////////////
    //////////////////////////

    controller.updateUserWithToken = function(token, details, options) {
        if (!options) {
            options = {};
        }

        //////////////////////////////////////

        //Url to login to
        var url = Fluro.apiURL + '/auth/token/' + token;

        //If we are logging in to a managed account use a different endpoint
        if (options.application) {
            if (Fluro.appDevelopmentURL && Fluro.appDevelopmentURL.length) {
                //console.log('User Update request rerouted to app development url', Fluro.appDevelopmentURL);
                url = Fluro.appDevelopmentURL + '/fluro/application/reset/' + token;
            } else {
                url = '/fluro/application/reset/' + token;
            }
        }

        //Get the $http service
        var $http = $injector.get('$http');
        var request = $http.post(url, details);

        //Update the current user token with the new details on complete
        request.then(function(res) {
            // //console.log('updated user')
            //Manually set the session token
            controller.set(res.data);
        })

        //Return the request promise
        return request;

    }

    //////////////////////////
    //////////////////////////
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
        if (options.application) {
            if (Fluro.appDevelopmentURL && Fluro.appDevelopmentURL.length) {
                //console.log('Login request rerouted to app development url', Fluro.appDevelopmentURL);
                url = Fluro.appDevelopmentURL + '/fluro/application/login';
            } else {
                url = '/fluro/application/login';
            }
        }

        //If we are logging in to a managed account use a different endpoint
        if (options.managedAccount) {
            url = Fluro.apiURL + '/managed/' + options.managedAccount + '/login';
        }

        //If we are logging in to a managed account use a different endpoint
        if (options.url) {
            url = options.url;
        }

        //////////////////////////////////////

        var $http = $injector.get('$http');
        var storage = controller.storageLocation();
        var request = $http.post(url, details);

        //////////////////////////

        request.then(function(res) {

            //Store the authentication 
            if (autoAuthenticate) {
                storage.session = res.data;
                controller.recall();
            }

            if (options.success) {
                options.success(res.data);
            }
        }, function(res) {
            if (options.error) {
                options.error(res.data);
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

            //console.log('Collected User Session', res);
        });

        //////////////////////////

        request.error(function(res) {
            //console.log('Error collecting token', token)
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

        request.then(function(res) {
            if (autoAuthenticate) {
                storage.session = res.data;
                controller.recall();
            }

            if (options.success) {
                options.success(res.data);
            }
        }, function(res) {
            if (options.error) {
                options.error(res.data);
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

        request.then(function(res) {
            if (autoAuthenticate) {
                storage.session = res.data;
                controller.recall();
            }

            if (options.success) {
                options.success(res.data);
            }
        }, function(res) {
            if (options.error) {
                options.error(res.data);
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


            var hasExpired = (expiry.getTime() <= now.getTime());

            if(hasExpired) {
                //console.log('Token expired', expiry.format('g:i:a'), 'is less than', now.format('g:i:a'), storage.session.expires);
            }

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

        //console.log('controller.refresh() was called');

        ///////////////////////////////////////////

        if (inflightRequest) {
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
                inflightRequest.then(function(res) {
                    ////console.log('Updated token', res.token);
                    //Clear out the inflight
                    inflightRequest = null;

                    ////console.log('token has been refreshed new token is:', res.token);
                    storage.session.refreshToken = res.data.refreshToken;
                    storage.session.token = res.data.token;
                    storage.session.expires = res.data.expires;
                    controller.recall();


                    if (successCallback) {
                        return successCallback(res.data);
                    }
                }, function(err) {

                    //Clear out the inflight
                    inflightRequest = null;

                    if (err.data == 'invalid_refresh_token') {
                        // //console.log('your token has expired');
                        controller.deleteSession();
                    } else {
                        // //console.log('error refreshing token', res);
                    }

                    if (errorCallback) {
                        return errorCallback(err);
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

        //console.log('delete session');
        var storage = controller.storageLocation();

        //delete storage.session;
        storage.session = null;
        delete $rootScope.user;

        //Remove the fluro token
        delete Fluro.token;
        delete Fluro.tokenExpires;
        delete Fluro.refreshToken;

       
        if (Fluro.backupToken) {
            console.log('Set backup token')
            Fluro.token = Fluro.backupToken
        }
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

.service('FluroAuthentication', function($q, Fluro, $injector, FluroTokenService) {



    function retryRequest (httpConfig) {
        console.log('Retrying request')
        return $http(httpConfig);
    };


    return {
        'responseError': function (response) {
            switch (response.status) {
                case 502 :
                case 504 :
                    return retryRequest(response.config);
                    break;
            }

            return $q.reject(response);
        },


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
            // config.headers['fluro-tz-offset'] = offsetDifference;

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
                // //console.log('Has expired', expired, Fluro.tokenExpires);

                //TESTING expired = true;

                //We've expired
                if (expired) {


                    //Wait for a result
                    function refreshSuccess(res) {

                        //Get the new token
                        var newToken = res.data;

                        //Update with the new token
                        config.headers.Authorization = 'Bearer ' + newToken.token;
                        ////console.log('refreshed and using', newToken, newToken.token);

                        ////console.log('Resolve call', config.url, config.headers)
                        deferred.resolve(config);
                    }

                    /////////////////////////////////////////
                    /////////////////////////////////////////
                    /////////////////////////////////////////

                    function refreshFailed(res) {

                        if (FluroTokenService.backup) {
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
                    ////console.log('Not expired, carry on')
                    config.headers.Authorization = 'Bearer ' + Fluro.token;
                    deferred.resolve(config);
                }

            } else {
                ////console.log('Doesnt expire so keep on keeping on')
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


        //////////////////////////

        //Manually set the session token
        controller.set = function(session) {
            var storage = controller.storageLocation();
            storagestorage[key] = session;
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
        controller.login = function(credentials, options) {
            if (!options) {
                options = {}
            }
            //Get the storage location
            var storage = controller.storageLocation();

            //Disable this
            options.disableAutoAuthenticate = true;

            //Login but don't authenticate automatically
            var request = FluroTokenService.login(credentials, options);

            ////////////////////////

            function loginComplete(res) {

                //Save the storedUsers details
                storage[key] = res.data;

                ////////////////////////////////////////
                // //console.log('Token Login Success', controller.defaultStorage, storage[key]);
            }

            ////////////////////////

            function loginFailed(res) {
                // //console.log('Token Login Failed', res);
            }

            ////////////////////////

            request.then(loginComplete, loginFailed);

            ////////////////////////

            return request;
        }


        ////////////////////////////

        //Register with user credentials
        controller.signup = function(credentials, options) {
            if (!options) {
                options = {}
            }
            //Get the storage location
            var storage = controller.storageLocation();

            //Disable this
            options.disableAutoAuthenticate = true;

            //Login but don't authenticate automatically
            var request = FluroTokenService.signup(credentials, options);

            ////////////////////////

            function signupComplete(res) {

                //Save the storedUsers details
                storage[key] = res.data;

                ////////////////////////////////////////
                // //console.log('Token Signup Success', controller.defaultStorage, storage[key]);
            }

            ////////////////////////

            function signupFailed(res) {
                // //console.log('Token Signup Failed', res);
            }

            ////////////////////////

            request.then(signupComplete, signupFailed);

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

                var hasExpired = (expiry.getTime() <= now.getTime());

                // if(hasExpired) {
                //     //console.log('Token expired', expiry.format('g:i:a'), 'is less than', now.format('g:i:a'));
                // }
                return hasExpired;
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

                        ////console.log('Customer refresh success', res);
                        //Finish up and resolve
                        deferred.resolve(config);
                    }

                    //////////////////////////////////////////////

                    function refreshFailed(res) {
                        ////console.log('Customer refresh failed', res)
                        deferred.reject(config);
                    }

                    //////////////////////////////////////////////

                    //Refresh the storedUser token
                    var refreshRequest = controller.refresh();
                    refreshRequest.then(refreshSuccess, refreshFailed);

                    //////////////////////////////////////////////

                } else {
                    ////console.log('Customer still logged in', storage[key].token);
                    config.headers.Authorization = 'Bearer ' + storage[key].token;
                    deferred.resolve(config);
                }

            } else {

                ////console.log('Doesnt expire so keep on keeping on')
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
                        refreshToken: storedUser.refreshToken,
                        managed: storedUser.accountType == 'managed',
                    });

                    ///////////////////////////////////////////////////////

                    //Listen for when it's finished and update the session storage
                    inflightRequest.then(function(res) {
                        //Finish the inflight request
                        inflightRequest = null;

                        //Update the storedUser with new token details
                        storage[key].refreshToken = res.data.refreshToken;
                        storage[key].token = res.data.token;
                        storage[key].expires = res.data.expires;

                        //Add in a success callback if needed here
                    }, function(err) {

                        //Finish the inflight request
                        inflightRequest = null;

                        //If the refresh token was invalid delete the storedUser session
                        if (err.data == 'invalid_refresh_token') {
                            ////console.log('your token has expired');
                            controller.deleteSession();
                        } else {
                            ////console.log('error refreshing token', res);
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
})



////////////////////////////////////////////////////////////////////////////////////////

.service('DateTools', function(Fluro) {


    var controller = {};

    ///////////////////////////////////////

    controller.calculateAge = function(d) {
        var today; //= new Date();
        var birthDate;// = new Date(d);


        if(Fluro.timezoneOffset) {
            today = controller.localDate();
            birthDate = controller.localDate(d);
        } else {
            today = new Date();
            birthDate = new Date(d);
        }

        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        console.log('DateTools.calculateAge', d, age);
        return age;

    }

    ///////////////////////////////////////

    controller.localDate = function(d) {

        //Date
        var date;// = new Date(d);

        if(!d) {
            date = new Date();
        } else {
            date = new Date(d);
        }

        ///////////////////////////////////////////

        var timezoneOffset;
        var browserOffset = date.getTimezoneOffset();

        ///////////////////////////////////////////

        if(Fluro.timezone) {

            if(!window.moment) {
                console.log('Moment is not defined')
                return date;
            }
            // console.log('MOMENT TIMEZONE 2', moment.tz(date, Fluro.timezone).utcOffset());
            timezoneOffset = window.moment.tz(date, Fluro.timezone).utcOffset();
            browserOffset = window.moment(date).utcOffset();

            var difference = (timezoneOffset - browserOffset);
            var offsetDifference = difference * 60 * 1000;

            var prevDate = new Date(date);


            date.setTime(date.getTime() + offsetDifference);
            //console.log('TIMEZONE', timezoneOffset, browserOffset, timezoneOffset - browserOffset, 'hours');
        }

        return date;
    }

    ///////////////////////////////////////

    controller.expired = function(d) {
        var today;// = new Date();
        var checkDate;// = new Date(d);

        if(Fluro.timezoneOffset) {
            today = controller.localDate();
            checkDate = controller.localDate(d);
        } else {
            today = new Date();
            checkDate = new Date(d);
        }

        return today > checkDate;
    }

    ///////////////////////////////////////

    controller.isValidDate = function(d) {
        if (Object.prototype.toString.call(d) !== "[object Date]")
            return false;
        return !isNaN(d.getTime());
    }

    ///////////////////////////////////////

    controller.readableDateRange = function(startDate, endDate, options) {

        if(!options) {
            options = {};
        }

        //////////////////////////////////////////

        if (!_.isDate(startDate)) {
            if(Fluro.timezoneOffset) {
                startDate = controller.localDate(startDate);
            } else {
                startDate = new Date(startDate);
            }
        }

        if (!_.isDate(endDate)) {
            if(Fluro.timezoneOffset) {
                endDate = controller.localDate(endDate);
            } else {
                endDate = new Date(endDate);
            }
        }

        //////////////////////////////////////////

        var today;

        if(Fluro.timezoneOffset) {
            today = controller.localDate();
        } else {
            today = new Date();
        }

        //////////////////////////////////////////

        var string = '';

        //We have a range
        if (startDate.format('d/m/y') != endDate.format('d/m/y')) {
            if (startDate.format('M Y') == endDate.format('M Y')) {
                string = startDate.format('l j') + ' - ' + endDate.format('l j F');
            } else {
                string = startDate.format('l j F') + ' until ' + endDate.format('l j F');
            }

            //Append the year if the year is different from now
            if (today.format('Y') != endDate.format('Y')) {
                string = string + ' ' + endDate.format('Y');
            }
        } else {
            if (startDate) {
                string = startDate.format('l j F');

                //Append the year if the year is different from now
                if (today.format('Y') != startDate.format('Y')) {
                    string = string + ' ' + startDate.format('Y');
                }
            }
        }

        return string;
    }

    ///////////////////////////////////////

    return controller;

});

//Use this to close off the end
;