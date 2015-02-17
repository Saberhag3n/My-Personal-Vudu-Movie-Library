'use strict';

angular.module('app.services', []).
  // config(['$httpProvider', function($httpProvider) {
  //  $httpProvider.interceptors.push(['$q', function($q) {
  //    
  //    return {
  //      response: function (response) {
  //        console.log('INTERCEPTOR:response');
  //        console.log('response: ', response);
  //        return response;
  //      },
  //      responseError: function (response) {
  //        console.log('INTERCEPTOR:responseError');
  //        return $q.reject(response);
  //      }
  //    };
  //    
  //    
  //    
  //    // return function(promise) {
  //    //  return promise.then(function(response) {
  //    // 
  //    //    console.log('');
  //    //    console.log('Interceptor');
  //    //    console.log('response: ', response);
  //    //    console.log('response.data: ', response.data);
  //    // 
  //    //    if(response.data._type && response.data._type == "sessionKeyResponse") {
  //    //      if(response.data.status && response.data.status[0] == "loginFailed"){
  //    //        response.data = { 
  //    //          error: true, 
  //    //          description: 'Login failed'
  //    //        };
  //    //        return $q.reject(response);
  //    //      }
  //    //    }
  //    // 
  //    // 
  //    //    return response; 
  //    //  }, function(response) {
  //    //    if (response.data._type === "error") {
  //    //      console.log('ERROR ON HTTPs');
  //    //      // HTTP 401 Error: 
  //    //      // The request requires user authentication
  //    //      // response.data = { 
  //    //      //  status: false, 
  //    //      //  description: 'Authentication required!'
  //    //      // };
  //    //      return response;
  //    //    }
  //    //    return $q.reject(response);
  //    //  });
  //    // }
  //  }]);
  // }]).

  factory('alertService', function() {
    var alerts = [];
    
    var clear = function() {
      alerts.splice(0, alerts.length);
    };
    
    var close = function(index) {
      alerts.splice(index, 1);
    };
    var push = function(msg, type){
      type = type || 'success';
      alerts.push({type: type, msg: msg});
    };
    
    return {
      alerts: alerts
      , clear: clear
      , close: close
      , push: push
    }
  }).

  factory('progressService', function() {
    var value = 0;
    var type = 'success';
    
    var reset = function() {
      this.value = 0;
      this.type = 'success';
    };
    
    return {
      value: value
      , type: type
      , reset: reset
    }
  }).
  
  factory('vuduFactory', function($http, $q, $cookieStore, $timeout) {
    // console.log('');
    // console.group('vuduFactory');
    
    var url = 'https://api.vudu.com/api2/';
    var count = 100;
    var user = null;
    
    var isAuthenticated = function() {
      // console.log('');
      // console.group('isAuthenticated');
      
      // console.log('user: ', user);
      
      // if(!user && $cookieStore.get('ffmbVuduCollection_id') && $cookieStore.get('ffmbVuduCollection_expirationTime') && $cookieStore.get('ffmbVuduCollection_sessionKey')){
      //   user = {
      //     id: $cookieStore.get('ffmbVuduCollection_id'),
      //     expirationTime: $cookieStore.get('ffmbVuduCollection_expirationTime'),
      //     sessionKey: $cookieStore.get('ffmbVuduCollection_sessionKey')
      //   }
      // }
      
      // console.groupEnd();
      
      return (user && user.sessionKey && user.id) ? true : false;
    };
    
    var sessionKeyRequest = function(userName, password) {
      // console.log('');
      // console.group('vuduFactory.sessionKeyRequest()');
      
      return $http.jsonp(url, { 
        params: {
          claimedAppId: 'fmbb-vudu-collection',
          format: 'application/json',
          callback: 'JSON_CALLBACK',
          _type: 'sessionKeyRequest',
          followup: 'user',
          password: password,
          userName: userName
        }
      }).then(function(response) {
        // console.log('vuduFactory.sessionKeyRequest():success');
        // console.log('response: ', response);
        
        if(response.data && response.data.status){
          if(response.data.status[0] == 'success'){
            // console.log('loginSuccess: set it');
            
            user = {
              id: response.data.sessionKey[0].userId[0],
              expirationTime: response.data.sessionKey[0].expirationTime[0],
              sessionKey: response.data.sessionKey[0].sessionKey[0]
            }
            // console.log('user: ', user);
            
            // $cookieStore.put('ffmbVuduCollection_id', user.id);
            // $cookieStore.put('ffmbVuduCollection_expirationTime', user.expirationTime);
            // $cookieStore.put('ffmbVuduCollection_sessionKey', user.sessionKey);
            
          } else if(response.data.status[0] == 'loginFailed'){
            console.log('loginFailed: reject it');
            
            response.data = { 
              error: true, 
              message: 'Login failed',
              status: response.data.status[0]
            };
            
            return $q.reject(response);
          }
        }
        
        return response || $q.when(response);
      }, function(response) {
        console.log('vuduFactory.sessionKeyRequest():failure:response');
        console.log('response: ', response);
        return response;
      }, function(response) {
        console.log('vuduFactory.sessionKeyRequest():notify');
        console.log('response: ', response);
        return response;
      });
      
      // console.groupEnd();
    }
    
    var signOut = function() {
      // console.log('');
      // console.group('vuduFactory.signOut()');
      
      var deferred = $q.defer();
      
      // $timeout(function() {
      //  deferred.notify('About to sign out');
      // }, 0);
      
      user = null;
      $cookieStore.remove('ffmbVuduCollection_id');
      $cookieStore.remove('ffmbVuduCollection_expirationTime');
      $cookieStore.remove('ffmbVuduCollection_sessionKey');
      
      $timeout(function() {
        deferred.resolve({status: 'success', message: 'Signed out'});
      }, 100);
      
      // console.groupEnd();
      
      return deferred.promise;
    };
    
    var getTitlesOwned = function(page) {
      return $http.jsonp(url, { 
        params: {
          claimedAppId: 'fmbb-vudu-collection',
          format: 'application/json',
          _type: 'contentSearch',
          count: count,
          dimensionality: 'any',
          followup: ['ratingsSummaries', 'totalCount'],
          listType: 'rentedOrOwned',
          offset: page * count,
          sessionKey: user.sessionKey,
          sortBy: '-purchaseTime',
          superType: 'movies',
          type: ['program', 'bundle'],
          userId: user.id,
          callback: 'JSON_CALLBACK'
        }
      }).then(function(response) {
        // console.log('');
        // console.group('vuduFactory.getTitlesOwned():success');
        // console.log('response: ', response);
        // console.groupEnd();
        
        return parseVuduResponse(response);
        
      }, function(response) {
        console.log('vuduFactory.getTitlesOwned():failure:');
        console.log('response: ', response);
      }, function(response) {
        console.log('vuduFactory.getTitlesOwned():notify:');
        console.log('response: ', response);
      });
    };
    
    var parseVuduType = function(data) {
      // console.log('');
      // console.group('vuduFactory.parseVuduType()');
      // console.log('data', data);
      
      var item = {};
      
      // if(angular.isArray(data)){
      //   
      //   if(angular.isObject(data[0])){
      //     item = parseVuduType(data[0]);
      //   } else if(data.length == 1){
      //     item = data[0];
      //   } else {
      //     item = data;
      //   }
      //   
      // } else if(angular.isObject(data)){
      //   angular.forEach(data, function(value, key) {
      //     item[key] = parseVuduType(value);
      //   });
      // } else if(angular.isString(data)){
      //   item = data;
      // }
      
      if(data._type == 'content'){
        
        // if(!data.contentId || !data.contentId[0]) console.log('NOFIND: data.contentId');
        // if(!data.title || !data.title[0]) console.log('NOFIND: data.title');
        // if(!data.description || !data.description[0]) console.log('NOFIND: data.description');
        // if(!data.bestDashVideoQuality || !data.bestDashVideoQuality[0]) console.log('NOFIND: data.bestDashVideoQuality');
        // if(!data.country || !data.country[0]) console.log('NOFIND: data.country');
        // if(!data.distributionStudio || !data.distributionStudio[0]) console.log('NOFIND: data.distributionStudio');
        // if(!data.language || !data.language[0]) console.log('NOFIND: data.language');
        // if(!data.lengthSeconds || !data.lengthSeconds[0]) console.log('NOFIND: data.lengthSeconds');
        // if(!data.mpaaRating || !data.mpaaRating[0]) console.log('NOFIND: data.mpaaRating');
        // if(!data.placardUrl || !data.placardUrl[0]) console.log('NOFIND: data.placardUrl');
        // if(!data.posterCopyright || !data.posterCopyright[0]) console.log('NOFIND: data.posterCopyright');
        // if(!data.posterUrl || !data.posterUrl[0]) console.log('NOFIND: data.posterUrl');
        // if(!data.ratingsSummaries || !data.ratingsSummaries[0]) console.log('NOFIND: data.ratingsSummaries');
        // if(!data.releaseTime || !data.releaseTime[0]) console.log('NOFIND: data.releaseTime');
        // if(!data.starRating || !data.starRating[0]) console.log('NOFIND: data.starRating');
        // if(!data.studio || !data.studio[0]) console.log('NOFIND: data.studio');
        // if(!data.tomatoMeter || !data.tomatoMeter[0]) console.log('NOFIND: data.tomatoMeter');
        // if(!data.type || !data.type[0]) console.log('NOFIND: data.type');
        // if(!data.ultraVioletLogicalAssetId || !data.ultraVioletLogicalAssetId[0]) console.log('NOFIND: data.ultraVioletLogicalAssetId');
        
        item = {
          _type: data._type,
          
          contentId: data.contentId[0],
          title: data.title[0],
          description: data.description[0],
          
          bestAvailVideoQuality: data.bestDashVideoQuality ? data.bestDashVideoQuality[0] : null,
          country: data.country ? data.country[0] : null,
          distributionStudio: data.distributionStudio ? parseVuduType(data.distributionStudio[0]) : null,
          language: data.language ? data.language[0] : null,
          lengthSeconds: data.lengthSeconds ? data.lengthSeconds[0] : null,
          mpaaRating: data.mpaaRating ? data.mpaaRating[0] : null,
          placardUrl: data.placardUrl ? data.placardUrl[0] : null,
          posterCopyright: data.posterCopyright ? data.posterCopyright[0] : null,
          posterUrl: data.posterUrl ? data.posterUrl[0] : null,
          ratingsSummaries: data.ratingsSummaries ? parseVuduType(data.ratingsSummaries[0]) : null,
          releaseTime: data.releaseTime ? data.releaseTime[0] : null,
          starRating: data.starRating ? data.starRating[0] : 0,
          studio: data.studio ? parseVuduType(data.studio[0]) : null,
          tomatoMeter: data.tomatoMeter ? +data.tomatoMeter[0] : 0,
          type: data.type ? data.type[0] : null,
          isUV: data.ultraVioletLogicalAssetId && data.ultraVioletLogicalAssetId[0] ? true : false,
          
          // colorType: data.colorType ? data.colorType[0] : null,
          // 
          // containerId: data.containerId || null,
          // contentRating: parseVuduType(data.contentRating[0]),
          //           
          // bestDashVideoQuality: data.bestDashVideoQuality[0],
          // bestFlashVideoQuality: data.bestFlashVideoQuality[0],
          // bestLiveStreamVideoQuality: data.bestLiveStreamVideoQuality[0],
          // dashTrailerEditionId: data.dashTrailerEditionId[0],
          // flashTrailerEditionId: data.flashTrailerEditionId[0],
          // livestreamTrailerEditionId: data.livestreamTrailerEditionId[0],
          // streamableTrailerEditionId: data.streamableTrailerEditionId[0],
          // transportStreamTrailerEditionId: data.transportStreamTrailerEditionId[0],
          // hasSomeFlashEditions: data.hasSomeFlashEditions[0],
          // hasSomeLivestreamEditions: data.hasSomeLivestreamEditions[0],
          // hasSomeTransportStreamEditions: data.hasSomeTransportStreamEditions[0],
          // 
          // featured: data.featured[0],
          // hasAacAudioTrack: data.hasAacAudioTrack[0],
          // hasBonusWithTagExtras: data.hasBonusWithTagExtras[0],
          // hasSimilar: data.hasSimilar[0],
          // isGiftable: data.isGiftable[0],
          // 
          // tomatoCertifiedFresh: data.tomatoCertifiedFresh ? data.tomatoCertifiedFresh[0] : null,
          // tomatoIcon: data.tomatoIcon ? data.tomatoIcon[0] : null,
          // 
          // ultraVioletLogicalAssetId: data.ultraVioletLogicalAssetId ? data.ultraVioletLogicalAssetId[0] : null,
          // ultraVioletSyncStatus: data.ultraVioletSyncStatus ? data.ultraVioletSyncStatus[0] : null
        }
        
        item.titleSort = item.title.replace(/^(A|An|The)+\s+/i, '');
        if(item.mpaaRating == 'nrFamilyFriendly') item.mpaaRating = 'nrff';
        if(item.releaseTime) item.releaseYear = item.releaseTime.substr(0,4);
        
      } else if(data._type == 'contentList'){
        item = {
          _type: data._type,
          content: [],
          moreAbove: data.moreAbove[0] == 'true' ? true : false,
          moreBelow: data.moreBelow[0] == 'true' ? true : false,
          totalCount: data.totalCount[0]
          // zoom: zoomData?
        }
        angular.forEach(data.content, function(value, key) {
          item.content[key] = parseVuduType(value);
        });
      } else if(data._type == 'contentRating'){
        item = {
          _type: data._type,
          ratingSystem: data.ratingSystem ? data.ratingSystem[0] : null,
          ratingValue: data.ratingValue ? data.ratingValue[0] : null
        }
      } else if(data._type == 'distributionStudio'){
        item = {
          _type: data._type,
          name: data.name ? data.name[0] : null,
          studioId: data.studioId ? data.studioId[0] : null
        }
      } else if(data._type == 'ratingsSummaryList'){
        item = {
          _type: data._type,
          moreAbove: data.moreAbove[0] == 'true' ? true : false,
          moreBelow: data.moreBelow[0] == 'true' ? true : false,
          ratingsSummary: data.ratingsSummary ? parseVuduType(data.ratingsSummary[0]) : null
        }
      } else if(data._type == 'ratingsSummary'){
        item = {
          _type: data._type,
          reviewedId: data.reviewedId ? data.reviewedId[0] : null,
          reviewedType: data.reviewedType ? data.reviewedType[0] : null,
          starRatingsAvg: data.starRatingsAvg ? data.starRatingsAvg[0] : null,
          starRatingsCount: data.starRatingsCount ? data.starRatingsCount[0] : null
        }
      } else if(data._type == 'studio'){
        item = {
          _type: data._type,
          name: data.name ? data.name[0] : null,
          studioId: data.studioId ? data.studioId[0] : null
        }
      }
      
      // console.log('item:', item);
      
      // console.groupEnd();
      
      return item;
    };
    
    var parseVuduResponse = function(response) {
      // console.log('');
      // console.log('vuduFactory.parseVuduResponse()');
      // console.log('response', response);
      
      var results = {};
      
      if(response.data._type == 'error'){
        if(response.data.code && response.data.code[0]){
          response.data = { 
            error: true, 
            message: 'Error retreiving titles',
            status: response.data.code[0]
          };
        } else if(response.data.status && response.data.status){
          response.data = { 
            error: true, 
            message: 'Error retreiving titles',
            status: response.data.status
          };
        } else {
          response.data = { 
            error: true, 
            message: 'Error retreiving titles',
            status: 'unknownError'
          };
        }
        return $q.reject(response);
      } else {
        results = parseVuduType(response.data);
        
        // console.log('');
        // console.log('results:');
        // console.log(results);
      }
      
      return results;
    };
    
    // console.groupEnd();
    
    return {
      getTitlesOwned: getTitlesOwned,
      isAuthenticated: isAuthenticated,
      signIn: sessionKeyRequest,
      signOut: signOut
    };
  }).
  
  service('vuduService', function($rootScope, $http) {
    // console.log('');
    // console.group('vuduService');
    
    var url = 'https://api.vudu.com/api2/';
    var count = '5';
    
    var userId = '';
    // var sessionKey = '';
    var sessionKey = '';
        
    var isAuthenticated = function() {
      return (sessionKey) ? true : false;
    };
    
    var getTitlesOwned = function() {
      return $http.jsonp(url, { 
        params: {
          claimedAppId: 'fmbb-vudu-collection',
          format: 'application/json',
          _type: 'contentSearch',
          count: count,
          dimensionality: 'any',
          followup: ['ratingsSummaries', 'totalCount'],
          listType: 'rentedOrOwned',
          offset: '0',
          sessionKey: sessionKey,
          sortBy: '-purchaseTime',
          superType: 'movies',
          type: 'program',
          // type: 'bundle',
          userId: userId,
          callback: 'JSON_CALLBACK'
        }
      }).then(function (response) {
          // console.log('vuduService.getTitlesOwned():response: ', response);
          var result = response.data;
          return result;
        });
    };
    
    
    // $rootScope.$on('$routeChangeStart', function(current, next) {
    //  console.log('');
    //  console.group('$routeChangeStart');
    //  
    //  console.log('current: ', current);
    //  console.log('next: ', next);
    //  
    //  console.groupEnd();
    // });
    
    // console.groupEnd();
    
    return {
      isAuthenticated: isAuthenticated,
      getTitlesOwned: getTitlesOwned
    };
  });
