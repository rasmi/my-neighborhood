angular.module('myneighborhood', ['ui.bootstrap', 'nvd3', 'uiGmapgoogle-maps', 'ngGeolocation'])
.factory('_', ['$window', function($window){
	return $window._;
}])
.config(['uiGmapGoogleMapApiProvider', function (GoogleMapApi) {
	GoogleMapApi.configure({
		libraries: 'visualization',
		visualRefresh: true
	});
}])
.controller('homeCtrl', ['$scope', '$http', '_', 'uiGmapGoogleMapApi', '$geolocation', function($scope, $http, _, GoogleMapApi, $geolocation) {	
	$http.get('username').success(function(data){ 
		$scope.username = data;
	});

	$scope.heatmaplayer;
	$scope.complaintData;

	$scope.defaultLocation = {
		latitude: 40.7127,
		longitude: -74.0059
	};

	GoogleMapApi.then(function(maps) {

	$scope.map = {
		center: $scope.defaultLocation,
		zoom: 11,
		heatLayerCallback: function (layer) {
			$scope.heatmaplayer = layer;
	  	}
	};

	$scope.chartoptions = {
		"chart": {
			"type": "pieChart",
			"height": 550,
			"x": function(d){return d.label;},
			"y": function(d){return d.value;},
			"showLegend": false,
			"transitionDuration": 500
		}
	};

	$scope.frequency = [];
	$scope.position;
	$scope.zipcode = "";
	$scope.category = "HEATING";
	$scope.categories = [];
	$scope.$watch('zipcode', function(newValue, oldValue) {
		//console.log("NEW ZIPCODE: " + newValue);
		if (newValue.length == 5){
			$http.get('categories', {
				params: {"zipcode": $scope.zipcode}
			})
			.success(function(data) {
				$scope.categories = data['categories'];
				$scope.frequency = data['frequency'];
				$scope.getComplaintData($scope.category);
				if (oldValue !== "" || oldValue.length == 4 || oldValue.length == 6) {
					// Just use geolocation the first time, don't lookup coordinates.
					$scope.centerzipcode($scope.zipcode);
				}
			});
		}
	});

	$scope.getComplaintData = function(cat){
		$scope.category = cat;
		if ($scope.category.length > 0) {
			$http.get('complaints', {
				params: {
					"zipcode": $scope.zipcode,
					"complaint_type": $scope.category
				}
			}).success(function(data) {
				$scope.complaintData = data.locations;
				//console.log("COMPLAINT DATA:");
				//console.log($scope.complaintData);
				var latlngdata = []
				_.forEach($scope.complaintData, function(coordinate) {
					latlngdata.push(new google.maps.LatLng(coordinate[0], coordinate[1]));
				});
				var heatArray = new google.maps.MVCArray(latlngdata);
				$scope.heatmaplayer.setData(heatArray);
			});
		}
	};

	$scope.centerzipcode = function(zipcode) {
		$http.get('http://api.geonames.org/postalCodeLookupJSON', {
			params: {
				"postalcode": zipcode,
				"country": "US",
				"username": $scope.username
			}}).success(function(data) {
				var ziplocation = {
					"latitude": data.postalcodes[0]['lat'],
					"longitude": data.postalcodes[0]['lng']
				} ;
				$scope.map.center = ziplocation;
				//$scope.map.zoom = 15;
			});
	};

	/*
	//TODO: Update data when map center is dragged.
	$scope.$watch('map', function(newValue, oldValue) {
		console.log("NEW CENTER");
	}, true)
	*/

	$scope.$watch('position', function(newValue, oldValue) {
		//console.log("NEW POSITION");
		if (newValue) {
		$http.get('http://api.geonames.org/findNearbyPostalCodesJSON', {
			params: {
				"formatted" : "true",
				"lat": $scope.position.latitude,
				"lng": $scope.position.longitude,
				"username": $scope.username
			}}).success(function(data) {
				var ziplocation = data.postalCodes[0];
				$scope.zipcode = ziplocation['postalCode'];
			});
		}
	}, true);

	$scope.$watch('map.center', function() {
		$scope.position = $scope.map.center;
	}, true);

	$geolocation.getCurrentPosition().then(function(position) {
		var coordinates = position.coords;
		if ((coordinates.longitude < -74.25 || coordinates.longitude > -73.65) ||
			(coordinates.latitude < 40.45 || coordinates.latitude > 40.90)) {
			// Coordinates not in NYC, just use default location.
			coordinates = $scope.defaultLocation;
		}
		return coordinates;
	}, function() {
		// Error, no location detected.
		return $scope.defaultLocation;
	}).then(function(coordinates) {
		$scope.map.center = coordinates;
		$scope.map.zoom = 15;
		$scope.position = coordinates;
	});

	});
}]);