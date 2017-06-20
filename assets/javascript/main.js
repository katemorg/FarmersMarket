// // Initialize Firebase
// var config = {
//   apiKey: "AIzaSyCMqAsnjjRovdQtvPkQrpMV1T8hMcPfrZo",
//   authDomain: "farmers-market-1497106306900.firebaseapp.com",
//   databaseURL: "https://farmers-market-1497106306900.firebaseio.com",
//   projectId: "farmers-market-1497106306900",
//   storageBucket: "farmers-market-1497106306900.appspot.com",
//   messagingSenderId: "453822887828"
// };
// firebase.initializeApp(config);

// MY FIRE Firebase
var config = {
  apiKey: "AIzaSyB_56Il0271ry-cycR66ma3mOcLoMLX8M4",
  authDomain: "farmersmarket-c927a.firebaseapp.com",
  databaseURL: "https://farmersmarket-c927a.firebaseio.com",
  projectId: "farmersmarket-c927a",
  storageBucket: "farmersmarket-c927a.appspot.com",
  messagingSenderId: "765507152646"
};
firebase.initializeApp(config);

var database = firebase.database();
var markets = [];     // Holds all of the markets retrieved from the API call
var latlong = [];     // Holds all the lat/long coordinates of the markets (used to zoom google maps)
var markers = [];     // Holds all the markers placed on googlemap
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
 * Check if geolocation is available, if so ask user to use their location
 * If user approves get coordinates, reverse geocode the coordinates, and input into the zipcode text box
 * Currently calls the onlick event for button-search to then call the function to get markets
 */
$(function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);

    function error(err) {
      console.warn('ERROR(' + err.code + '): ' + err.message);
    }

    function success(pos) {
      var userCords = pos.coords;
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
      // displayOnMap();
    }
  } else {
    console.log("Geolocation does not work. Search manually");
  }
});

/**
 * Creates a new google map
 * Location is set to Chicago and zoomed out to show the US
 */
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 41.850033, lng: -87.6500523 },
    zoom: 3
  });
}

/**
 * Searches the USDA database using the zipcode the user input
 * Empties the markets[],, calls fucntion to remove all of the markers from the map
 * Calls fucntion to send and process request to USDA database
 */
$("#button-search").on("click", function() {
  event.preventDefault();
  var zipcode = $("#zip-code").val().trim();
  markets = [];
  deleteMarkers();
  $(".table tbody").empty();
  getMarkets(zipcode);
});

/**
 * Calls USDA api to get a list of farmers markets in a zipcode
 * Request is in JSONP
 */
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
          '<h3>' + name + '</h3>' +
          '<h5>' + currentMarket['Address'] + '</h5>' +
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

// function displayMarkets(detailresults) {
//   var currentMarket = detailresults.marketdetails;
//   var newRow = ' \
//     <tr> \
//       <td>' + name + '</td> \
//       <td>' + '<a href="' + currentMarket["GoogleLink"] + '">' + currentMarket["Address"] + '</a></td> \
//       <td>' + currentMarket["Schedule"] + '</td> \
//       <td>' + '<button type="button" class="btn btn-default btn-moreInfo" role="button" data-toggle="modal" data-target="#modal--moreInfo"><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span></button>' + '</td> \
//     </tr>';
//   $(".table tbody").append(newRow);
// }

// Populate the table with the list farmers markets
database.ref().on("value", function(snapshot) {
    var data = snapshot.val();
    if (data) {
      for (var key in data) {
        var thisObject = data[key];
      }
    } else {
      $(".table tbody").append("No farmers markets add one.");
    }
  },
  function(errorObject) {
    console.log("The read failed: " + errorObject.code);
    $(".table tbody").append("Error getting farmers markets schedule!");
  }
);

// Helps jQuery Validator work with the Bootstrap CSS
$.validator.setDefaults({
  highlight: function(element) {
    $(element).closest('.input-group').addClass('has-error');
  },
  unhighlight: function(element) {
    $(element).closest('.input-group').removeClass('has-error');
  },
  errorElement: 'span',
  errorClass: 'help-block',
  errorPlacement: function(error, element) {
    if (element.parent('.input-group').length) {
      error.insertAfter(element.parent());
    } else {
      error.insertAfter(element);
    }
  }
});

// Function to validate user input on form before submitting
$("#form--market-add").validate({
  rules: {
    marketNameAdd: "required",
    marketAddressAdd: "required",
    marketStateAdd: {
      required: true,
      stateUS: true
    },
    marketCityAdd: "required",
    marketZipAdd: {
      required: true,
      zipcodeUS: true
    },
    // marketProductsAdd: {
    //   required: true,
    // },
    marketContactAdd: {
      required: true,
      phoneUS: true
    }
  },
  submitHandler: function(form, event) {
    event.preventDefault();
  }
});

/**
 * Checks if a market is valid 
 * If valid adds the market to the database otherwise alert user of invalid fields
 */
$("#btn-AddMarket").on("click", function() {
  event.preventDefault();
  if ($("#form--market-add").valid()) {
    var marketname = $('#marketNameAdd').val().trim();
    var address = $('#marketAddressAdd').val().trim();
    var city = $('#marketCityAdd').val().trim();
    var state = $('#marketStateAdd').val().trim();
    var zipcode = $('#marketZipAdd').val().trim();
    var products = $('#marketProductsAdd').val();

    database.ref().push().set({
      name: marketname,
      address: address,
      city: city,
      state: state,
      zipcode: zipcode,
      products: products,
      timeAdded: firebase.database.ServerValue.TIMESTAMP
    }, function(error) {
      if (error) {
        console.log(error);
      } else {
        $("#form--market-add input").val("");
        $('#modal--market-add').modal('toggle');
      }
    });
  }
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

/**
 * Deletes all markers in the array by removing references to them.
 * Removes them from the map also
 */
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
