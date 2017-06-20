$(function() {

  var idnumber = []; //market id number
  var latlong = []; //latitude and longitude of user
  var marker_all = []; //sets positioning of all markers
  var marketName = []; //name of market
  var mapinfo = null; //sets markers on map
  var userCords;
  var markerpositioning = [];
  
    //starts geolocation
  if (navigator.geolocation) {
    function error(err) {
      console.warn('ERROR(' + err.code + '): ' + err.message);
    }
         //returns usercordinates
    function success(pos) {
      userCords = pos.coords;
      $.get(
        "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + userCords.latitude + ", " + userCords.longitude + "&sensor=true",
        function(response) {
          var searchKey = "postal_code";
          var zipcodeObject = null;
          for (var i = 0; i < response.results[0].address_components.length; i++) {
            var thisAddressObject = response.results[0].address_components[i];
            var addressTypes = thisAddressObject.types;
            var search = addressTypes.indexOf(searchKey);
            if (search > -1) {
              zipcodeObject = thisAddressObject;
              // alert(zipcodeObject.short_name);
              $("#zip-code").val(zipcodeObject.short_name);
              $("#button-search").click();
              break;
            }
          }
          if (zipcodeObject !== null) {
            console.log(zipcodeObject);
          }
        }
      );
      displayOnMap();
    }
            //displays users current location 
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    alert('Geolocation is not supported in your browser');
  }
        //ends geolocation
  
  //maps settings
  var mapsettings = {
    zoom: 3,
    center: new google.maps.LatLng(37.09024, -95.712891),
    panControl: false,
    panControlOptions: {
      position: google.maps.ControlPosition.BOTTOM_RIGHT
    },
    zoomControl: true,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.LARGE,
      position: google.maps.ControlPosition.LEFT_CENTER
    },
    scaleControl: false

  };
      //displays infowindow when clicking on marker
  mapinfo = new google.maps.InfoWindow({
    content: "loading..."
  });
  
      //starts up google maps and puts the data inside map div
  map = new google.maps.Map(document.getElementById('map'), mapsettings);

      //sets variables
  function displayOnMap() {
    var userZip = $("#textZip").val();
    var accessURL;

    if (userZip) {
      accessURL = "https://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=" + userZip;
    } else {
      accessURL = "https://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat=" + userCords.latitude + "&lng=" + userCords.longitude;
    }

    //grabs zip code and uses it to return market ids in area
    $.ajax({
      type: "GET",
      contentType: "application/json; charset=utf-8",
      url: accessURL,
      dataType: 'jsonp',
      success: function(data) {
        $.each(data.results, function(i, val) {
          idnumber.push(val.id);
          marketName.push(val.marketname);
        });

        //uses market id to get detailed information 
        var counter = 0;
        $.each(idnumber, function(k, v) {
          $.ajax({
            type: "GET",
            contentType: "application/json; charset=utf-8",
            url: "https://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id=" + v,
            dataType: 'jsonp',
            success: function(data) {
              //pulls latitude and longitude and separates it
             //converts values to floats
              for (var key in data) {
                var results = data[key];
                var googleLink = results['GoogleLink'];
                var latLong = decodeURIComponent(googleLink.substring(googleLink.indexOf("=") + 1, googleLink.lastIndexOf("(")));
                var split = latLong.split(',');
                var latitude = parseFloat(split[0]);
                var longitude = parseFloat(split[1]);
                 
                //sets markers
                myLatlng = new google.maps.LatLng(latitude, longitude);

                marker_all = new google.maps.Marker({
                  position: myLatlng,
                  map: map,
                  title: marketName[counter],
                  html: '<div class="markerPop">' +
                    '<h1>' + marketName[counter].substring(4) + '</h1>' +
                    '<h3>' + results['Address'] + '</h3>' +
                    '<p>' + results['Products'].split(';') + '</p>' +
                    '<p>' + results['Schedule'] + '</p>' +
                    '</div>'
                });

                //puts latitude and longitude in an array
                //puts all markers in an array
                latlong.push(myLatlng);
                markerpositioning.push(marker_all);
                counter++;
              };

              google.maps.event.addListener(marker_all, 'click', function() {
                mapinfo.setContent(this.html);
                mapinfo.open(map, this);
              });

              //creates array of markers you want to show on map
              //setup boundries for map
              var bounds = new google.maps.LatLngBounds();
              for (var i = 0, LtLgLen = latlong.length; i < LtLgLen; i++) {
                bounds.extend(latlong[i]);
              }
              
              //fit data to boundries of map
              map.fitBounds(bounds);
            }
          });
        });
      }
    });
    return false; //stop form from submitting
  }
});
