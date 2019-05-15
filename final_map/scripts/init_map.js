//CALLED ON BY THE API
function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        mapTypeControl: false,
        center: { lat: 33.472113, lng: -88.791291 },
        zoom: 16
    });

    var redCoords = [
        { lat: 33.455, lng: -88.826 },
        { lat: 33.455, lng: -88.809 },
        { lat: 33.439, lng: -88.809 },
        { lat: 33.439, lng: -88.826 }
    ];
    var redPoly = new google.maps.Polygon({
        map: map,
        paths: redCoords,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0,
        draggable: true,
        geodesic: true,
        editable: true
    });

    var clickHandler = new ClickEventHandler(map, origin);

    //LOADS DIRECTIONS 
    new AutocompleteDirectionsHandler(map);

    //LOADS SEARCH BOX
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // SUGGESTS RESULTS AROUND VIEWPORT
    map.addListener('bounds_changed', function () {
        searchBox.setBounds(map.getBounds());
    });

    var markers = [];

    // ADDS DETAILS
    searchBox.addListener('places_changed', function () {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        // CLEARS MARKERS
        markers.forEach(function (marker) {
            marker.setMap(null);
        });
        markers = [];

        // ICON NAME AND LOCATION
        var bounds = new google.maps.LatLngBounds();
        var poly = document.getElementById('changesearch_poly');
        if (poly.checked) {
            places.forEach(function (place) {
                if (google.maps.geometry.poly.containsLocation(place.geometry.location, redPoly)) {
                    if (!place.geometry) {
                        console.log("Returned place contains no geometry");
                        return;
                    }
                    var icon = {
                        url: place.icon,
                        size: new google.maps.Size(71, 71),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(17, 34),
                        scaledSize: new google.maps.Size(25, 25)
                    };

                    // CREATES A MARKER FOR EACH TYPE
                    markers.push(new google.maps.Marker({
                        map: map,
                        icon: icon,
                        title: place.name,
                        position: place.geometry.location
                    }));

                    if (place.geometry.viewport) {
                        bounds.union(place.geometry.viewport);
                    } else {
                        bounds.extend(place.geometry.location);
                    }
                    map.fitBounds(bounds);
                }
            });
        }
        else {
            places.forEach(function (place) {
                if (!place.geometry) {
                    console.log("Returned place contains no geometry");
                    return;
                }
                var icon = {
                    url: place.icon,
                    size: new google.maps.Size(71, 71),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17, 34),
                    scaledSize: new google.maps.Size(25, 25)
                };

                // CREATES A MARKER FOR EACH TYPE
                markers.push(new google.maps.Marker({
                    map: map,
                    icon: icon,
                    title: place.name,
                    position: place.geometry.location
                }));

                if (place.geometry.viewport) {
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }
                map.fitBounds(bounds);
            });
        }



    });



    redPoly.addListener('dragend', function () {


        // CLEARS MARKERS
        markers.forEach(function (marker) {
            marker.setMap(null);
        });
        markers = [];
    });
}

function AutocompleteDirectionsHandler(map) {
    //GETS MAP INFO
    this.map = map;
    this.originPlaceId = null;
    this.destinationPlaceId = null;
    this.travelMode = 'WALKING';
    this.directionsService = new google.maps.DirectionsService;
    this.directionsDisplay = new google.maps.DirectionsRenderer;
    this.directionsDisplay.setMap(map);
    //SETS USERS CHOICES AS VARS
    var originInput = document.getElementById('origin-input');
    var destinationInput = document.getElementById('destination-input');
    var modeSelector = document.getElementById('mode-selector');
    var arrival = document.getElementById('arrivalTime');


    var originAutocomplete = new google.maps.places.Autocomplete(originInput);
    // ONLY SHOW THE DATA FIELDS I NEED
    originAutocomplete.setFields(['place_id']);

    var destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput);
    // ONLY SHOW THE DATA FIELDS I NEED
    destinationAutocomplete.setFields(['place_id']);


    //TAKES IN TRAVEL OPTIONS
    this.setupClickListener('changemode-walking', 'WALKING');
    this.setupClickListener('changemode-transit', 'TRANSIT');
    this.setupClickListener('changemode-driving', 'DRIVING');

    //ORIGIN AND DESTINATION
    this.setupPlaceChangedListener(originAutocomplete, 'ORIG');
    this.setupPlaceChangedListener(destinationAutocomplete, 'DEST');

    //CREATES ICONS OVER MAP
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(
        destinationInput);
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(modeSelector);
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(arrival)
}

// CHECKS IF RADIO BUTTONS ARE CHANGED
AutocompleteDirectionsHandler.prototype.setupClickListener = function (
    id, mode) {
    var radioButton = document.getElementById(id);
    var me = this;

    radioButton.addEventListener('click', function () {
        me.travelMode = mode;
        me.route();
    });
};

//SETS ORIG AND DEST AND ADDS ALERTS
AutocompleteDirectionsHandler.prototype.setupPlaceChangedListener = function (
    autocomplete, mode) {
    var me = this;
    autocomplete.bindTo('bounds', this.map);

    autocomplete.addListener('place_changed', function () {
        var place = autocomplete.getPlace();

        if (!place.place_id) {
            window.alert('Please select an option from the dropdown list.');
            return;
        }
        if (mode === 'ORIG') {
            me.originPlaceId = place.place_id;
        } else {
            me.destinationPlaceId = place.place_id;
        }
        me.route();
    });
};
//SETS ROUTE
AutocompleteDirectionsHandler.prototype.route = function () {
    if (!this.originPlaceId || !this.destinationPlaceId) {
        return;
    }
    var me = this;

    this.directionsService.route(
        {
            origin: { 'placeId': this.originPlaceId },
            destination: { 'placeId': this.destinationPlaceId },
            travelMode: this.travelMode
        },
        function (response, status) {
            if (status === 'OK') {
                me.directionsDisplay.setDirections(response);
                document.getElementById("time").innerHTML = me.directionsDisplay.directions.routes[0].legs[0].duration.text;
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
};

var ClickEventHandler = function (map, origin) {
    this.origin = origin;
    this.map = map;
    this.directionsService = new google.maps.DirectionsService;
    this.directionsDisplay = new google.maps.DirectionsRenderer;
    this.directionsDisplay.setMap(map);
    this.placesService = new google.maps.places.PlacesService(map);
    this.infowindow = new google.maps.InfoWindow;
    this.infowindowContent = document.getElementById('infowindow-content');

    this.infowindow.setContent(this.infowindowContent);

    this.map.addListener('click', this.handleClick.bind(this));

};

ClickEventHandler.prototype.handleClick = function (event) {
    console.log('You clicked on: ' + event.latLng);
    // If the event has a placeId, use it.
    if (event.placeId) {
        console.log('You clicked on place:' + event.placeId);

        // Calling e.stop() on the event prevents the default info window from
        // showing.
        // If you call stop here when there is no placeId you will prevent some
        // other map click event handlers from receiving the event.
        event.stop();
        this.getPlaceInformation(event.placeId);
    }
};

ClickEventHandler.prototype.getPlaceInformation = function (placeId) {
    var me = this;
    this.placesService.getDetails({ placeId: placeId }, function (place, status) {
        if (status === 'OK') {
            me.infowindow.close();
            me.infowindow.setPosition(place.geometry.location);
            me.infowindowContent.children['place-icon'].src = place.icon;
            me.infowindowContent.children['place-name'].textContent = place.name;
            me.infowindowContent.children['place-id'].textContent = place.place_id;
            me.infowindowContent.children['place-address'].textContent =
                place.formatted_address;
            me.infowindow.open(me.map);
        }
    });
};

function logVisit() {
    localStorage.places += document.getElementById("place-name").innerHTML + "   ||||||   " + document.getElementById("place-address").innerHTML + "<br>";
    showLogs()
}

function showLogs() {
    localStorage.places = localStorage.places;
    document.getElementById("logsText").innerHTML = localStorage.places;
    document.getElementById("logs").style.display = "inherit";
}

function logClear() {
    localStorage.places = "";
    showLogs();
}

function hideLogs() {
    document.getElementById("logs").style.display = "none";
}