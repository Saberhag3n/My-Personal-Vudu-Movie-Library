'use strict';

angular.module('app.controllers', []).
  controller('AppCtrl', ['$scope', '$location', '$timeout', 'alertService', 'progressService', 'vuduFactory',
    function ($scope, $location, $timeout, alertService, progressService, vuduFactory) {
      
     
      $scope.alerts = alertService.alerts;
      $scope.closeAlert = alertService.close;
      
      $scope.progress = progressService;
      
      $scope.isLoggedIn = vuduFactory.isAuthenticated;
      
      $scope.logOut = function() {
        
        vuduFactory.signOut().then(function(response) {
          
          alertService.push('You have signed off');
          
          $location.url('/login');
        }, function(response) {
        });
        
      }
      
    }
  ]).
  filter('toExport', function() {
    return function(input) {
      var r = [];
      var i = 0;
      
      r.push([
        'contentId','title','bestStreamableVideoQuality','description','country','language','lengthSeconds','mpaaRating','posterUrl','starRatingsAvg','releaseTime','studioName','hasBonusWithTagExtras','tomatoMeter','type','isUV'
      ]);
      
      for(i = 0; i < input.length; i++){
        r.push([
          input[i].contentId,
          '"' + input[i].title.replace(/"/g, '""') + '"',
          input[i].country,
          input[i].bestStreamableVideoQuality,
          input[i].description,
          input[i].language,
          input[i].lengthSeconds,
          input[i].mpaaRating,
          input[i].posterUrl,
          input[i].starRatingsAvg,
          input[i].releaseTime,
          input[i].studio.name,
          input[i].hasBonusWithTagExtras,
          input[i].tomatoMeter,
          input[i].type,
          input[i].isUV
        ]);
      }
      
      return r;
    };
  }).
  filter('toCsv', function() {
    return function(input) {
      var rows = [];
      var r = '';
      var i = 0;
      
      for(i = 0; i < input.length; i++){
          rows.push(input[i].join(','));
      }
      
      r = rows.join('\r\n');
      
      return r;
    };
  }).
  filter('toDownload', function() {
    return function(input) {
      return 'data:attachment/csv,' + encodeURI(input);
    };
  }).
  controller('TitleListCtrl', ['$scope', '$filter', '$http', '$location', '$timeout', '$window', 'alertService', 'progressService', 'vuduFactory', 
    function ($scope, $filter, $http, $location, $timeout, $window, alertService, progressService, vuduFactory) {
     
      
      progressService.reset();
      
      $scope.displayAs = 'list';
      $scope.$watch('displayAs', function() {
        $window.ga('send', 'pageview', { page: $location.path() + '-as-' + $scope.displayAs });
      });
      
      $scope.query = '';
      $scope.orderProp = '';
      
      $scope.thumbs = {
        pageNum: 0,
        pageInationRange: [],
        pageSize: 36,
        pageTotal: function(){
          if($scope.filtered.titles.length && $scope.thumbs.pageSize > 0){
            return Math.ceil($scope.filtered.titles.length / $scope.thumbs.pageSize);
          } else {
            return 1;
          }
        }
      };
      
      $scope.$watch('thumbs.pageNum', function() {
        if($scope.thumbs.pageNum > $scope.thumbs.pageTotal() - 1){
          $scope.thumbs.pageNum = 0;
        } else if($scope.thumbs.pageNum < 0){
          $scope.thumbs.pageNum = $scope.thumbs.pageTotal() - 1;
        }
      });
      $scope.$watch('thumbs.pageTotal()', function() {
        if($scope.thumbs.pageNum > $scope.thumbs.pageTotal() - 1) $scope.thumbs.pageNum = $scope.thumbs.pageTotal() - 1;
      });
      $scope.$watch('thumbs.pageNum + thumbs.pageTotal()', function() {
        var page = +$scope.thumbs.pageNum; // force int
        var total = +$scope.thumbs.pageTotal();
        var pad = Math.min(Math.floor(total / 2), 3);
        
        if(total){
          $scope.thumbs.pageInationRange.length = 0;
          for(var i = page - pad; i <= page + pad; i++){
            if(i < 0){
              $scope.thumbs.pageInationRange.push(Math.abs(total + i) % total);
            } else {
              $scope.thumbs.pageInationRange.push(Math.abs(i) % total);
            }
          }
        }
      });
      
      $scope.titles = [];
      $scope.filtered = { titles: [] };
      $scope.totalCount = 0;
      
      var cnt = 0;
      var batchLimit = 100;
      
      var getTitles = function() {
               
        vuduFactory.getTitlesOwned(cnt).then(function(data) {
                   
          $scope.totalCount = data.totalCount;
          
          angular.forEach(data.content, function(value, key) {
            $scope.titles.push(value);
          });
          
                    
          if(data.moreBelow && cnt < (batchLimit - 1)){
            cnt++;
            
            progressService.type = '';
            progressService.value = Math.ceil($scope.titles.length * 100 / $scope.totalCount);
            
            getTitles();
          } else {
            
            progressService.value = 100;
            progressService.type = 'success';
          }
          
        }, function(response) {
                    
          if(response.data.error == true && response.data.status == 'authenticationExpired'){
            alertService.push('Authentication expired. Please sign off and sign in again.', 'warning');
          } else if(response.data.error == true && response.data.status){
            alertService.push('Error occurred. (' + response.data.status + ')', 'warning');
          } else {
            alertService.push('Unknown error occured. Please sign off and try again. If the problem persists, please wait an hour and/or let FattyMoBookyButt know in the vudu forums.', 'warning');
          }
          
        }, function(response) {
       
        });
        
      }
      getTitles();
           
      $scope.vuduLink = function(id) {
        window.open('http://www.vudu.com/movies/#!content/' + id);
      }
      
    }
  ]).
  controller('TitleDetailCtrl', ['$scope', '$routeParams',
    function ($scope, $routeParams) {
      
      $scope.id = $routeParams.id;
    }]).
  controller('UserCtrl', ['$scope', '$location', 'alertService', 'vuduFactory',
    function ($scope, $location, alertService, vuduFactory) {
      
      $scope.error = null;
      $scope.user = null;
      
      $scope.logIn = function() {

        
        alertService.clear();
        $scope.error = null;
        
        vuduFactory.signIn($scope.user.userName, $scope.user.password).then(function(response) {

          $location.url('/titles');
        }, function(response) {
          
          if(response.data && response.data.error){
            $scope.error = {
              message: response.data.message,
              status: response.data.status
            }
          } else {
            $scope.error = {
              message: 'Error occurred',
              status: 'unknownError'
            }
          }
        });
         
      }
      
    }]);
