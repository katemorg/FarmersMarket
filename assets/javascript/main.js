var database = firebase.database();
var markets = [];
var latlong = [];
var markers = [];
var map = null;

function farmersMarket() {
  this.id = null;
  this.name = null;
  this.address = null;
  this.googleLink = null;
  this.products = null;
  this.schedule = null;
}

/**
 * Set up the google map and place on to paage
 */
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 41.850033, lng: -87.6500523 },
    zoom: 3
  });
}

$("#button-search").on("click", function() {
  var zipcode = $("#zip-code").val().trim();
  markets = [];
  deleteMarkers();
  codeAddress(zipcode);
  $(".table tbody").empty();
  getMarkets(zipcode);
});

//Call this wherever needed to actually handle the display
function codeAddress(zipCode) {
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({ 'address': zipCode }, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      //Got result, center the map and put it out there
      map.setCenter(results[0].geometry.location);
      map.zoom = 10;
    } else {
      alert("Geocode was not successful for the following reason: " + status);
    }
  });
}

/****************************************************************
 * Calls USDA api to get a list of farmers markets in a zipcode
 * Request is in JSONP
 **************************************************************/
function getMarkets(zip) {
  $.ajax({
    type: "GET",
    contentType: "application/json; charset=utf-8",
    url: "https://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=" + zip,
    dataType: 'jsonp',
    success: function(detailresults) {
        var marketList = detailresults.results;
        for (var key in marketList) {
          var newMarket = new farmersMarket();
          newMarket.id = marketList[key].id;
          newMarket.name = marketList[key].marketname;
          markets.push(newMarket);
        }

        $.each(markets, function(index, value) {
          getDetails(markets[index], index);
        });
      }
      // jsonpCallback: 'marketResultHandler'
  });
}

/**
 * Calls USDA farmers market to get the indiviual details for a specific market given the ID
 * Call back function is generated dynamically because of how JSONP works
 * Call back function adds each market to the table on the page
 **/
function getDetails(market, index) {
  var id = market.id;
  var name = market.name;
  name = name.replace(/\d+\.\d+/, " "); // Removes the distance from the zipcode which is in the name of the market returned from the API

  $.ajax({
    type: "GET",
    contentType: "application/json; charset=utf-8",
    url: "https://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id=" + id,
    dataType: 'jsonp',
    success: function(data) {
      var currentMarket = data.marketdetails;

      // Add to table
      var newRow = ' \
    <tr data-name="' + name + '" data-address="' + currentMarket['Address'] + '" data-schedule="' + currentMarket['Schedule'] + '" data-products="' + currentMarket['Products'] + '" data-contact="' + currentMarket['Contact'] + '"> \
      <td>' + '<button type="button" class="btn btn-default btn-moreInfo" role="button" data-toggle="modal" data-target="#modal--moreInfo"><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span></button>' + '</td> \
      <td>' + name + '</td> \
      <td>' + '<a href="' + currentMarket["GoogleLink"] + '">' + currentMarket["Address"] + '</a></td> \
      <td>' + currentMarket["Schedule"] + '</td> \
    </tr>';
      $(".table tbody").append(newRow);


      // Add to map
      var googleLink = currentMarket["GoogleLink"];
      var latLong = decodeURIComponent(googleLink.substring(googleLink.indexOf("=") + 1, googleLink.lastIndexOf("(")));
      var splitCoords = latLong.split(',');
      var latitude = parseFloat(splitCoords[0]);
      var longitude = parseFloat(splitCoords[1]);

      var myLatlng = new google.maps.LatLng(latitude, longitude);

      var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: name,
        html: '<div class="markerPop">' +
          '<h1>' + name.substring(4) + '</h1>' +
          '<h3>' + currentMarket['Address'] + '</h3>' +
          '<p>' + currentMarket['Products'].split(';') + '</p>' +
          '<p>' + currentMarket['Schedule'] + '</p>' +
          '</div>'
      });
      markers.push(marker);
      latlong.push(myLatlng);

      google.maps.event.addListener(marker, 'click', function() {
        var mapinfo = new google.maps.InfoWindow();
        mapinfo.setContent(this.html);
        mapinfo.open(map, this);
      });

      var bounds = new google.maps.LatLngBounds();
      for (var i = 0, LtLgLen = latlong.length; i < LtLgLen; i++) {
        bounds.extend(latlong[i]);
      }
      map.fitBounds(bounds);
    }
  });
}

function displayMarkets(detailresults) {
  var currentMarket = detailresults.marketdetails;
  var newRow = ' \
    <tr> \
      <td>' + name + '</td> \
      <td>' + '<a href="' + currentMarket["GoogleLink"] + '">' + currentMarket["Address"] + '</a></td> \
      <td>' + currentMarket["Schedule"] + '</td> \
      <td>' + '<button type="button" class="btn btn-default btn-moreInfo" role="button" data-toggle="modal" data-target="#modal--moreInfo"><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span></button>' + '</td> \
    </tr>';
  $(".table tbody").append(newRow);

}

// Populate the table with the list farmers markets
database.ref().on("value", function(snapshot) {
    var data = snapshot.val();
    $(".table tbody").empty();
    if (data) {
      for (var key in data) {
        var thisObject = data[key];
      }
    } else {
      $(".table tbody").append("No farmers markets add one.")
    }
  },
  function(errorObject) {
    console.log("The read failed: " + errorObject.code)
    $(".table tbody").append("Error getting farmers markets schedule!");
  }
);

// Function to validate user input on form before submitting
$("#form--market-add").validate({
  rules: {
    marketNameAdd: "required",
    marketAddressAdd: "required",
    marketStateAdd: "required",
    marketCityAdd: "required",
    marketZipAdd: "required",
    marketProductsAdd: {
      required: true,
    },
    marketContactAdd: {
      required: true,
    }
  },
  submitHandler: function(form, event) {
    event.preventDefault();
  }
});

function addMarket() {
  database.ref().push({
    id: market.id,
    name: market.name,
    address: market.address,
    googleLink: market.googleLink,
    products: market.products,
    schedule: market.schedule,
  });
}


$("#btn-AddMarket").on("click", function() {
  event.preventDefault();
  $("#form--market-add").valid();
});

/**
 * Displays the info about a specific market in a popup modal
 * The button is generated dynamically when adding a market to the page
 **/
$(".table").on("click", ".btn-moreInfo", function() {
  event.preventDefault();
  var marketName = $(this).closest("tr").attr("data-name");
  var address = $(this).closest("tr").attr("data-address");
  var products = $(this).closest("tr").attr("data-products");
  var schedule = $(this).closest("tr").attr("data-schedule");
  /*var contact = $(this).closest("tr").attr("data-contact");*/

  $(".moreInfo-name").html(marketName);
  $("#moreInfo-products").html(products);
  $("#moreInfo-address").html(address);
  $("#moreInfo-schedule").html(schedule);
  /*$("#moreInfo-contact").html(contact);*/
});

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers.length = 0;
  latlong.length = 0;
}

$(".btn-findMarket").on("click", function() {
  $(".for-search").toggle();
});
