'Use Strict';

angular.module('app.controllers', []).
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