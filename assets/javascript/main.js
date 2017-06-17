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
var database = firebase.database();
var markets = [];

function farmersMarket() {
  this.id = null;
  this.name = null;
  this.address = null;
  this.googleLink = null;
  this.products = null;
  this.schedule = null;
}

// Search function
$(function() {
  $("#button-search").on("click", function() {
    var zipcode = $("#zip-code").val().trim();
    markets = [];
    $(".table tbody").empty();
    getMarkets(zipcode);
  });
  $("#searchZip").on("click", function() {
    var zipcode = $("#zip-code").val().trim();
    getMarkets(zipcode);
  });

});


function getMarkets(zip) {
  $.ajax({
    type: "GET",
    contentType: "application/json; charset=utf-8",
    url: "https://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=" + zip,
    dataType: 'jsonp',
    jsonpCallback: 'marketResultHandler'
  });
}

//iterate through the JSON result object.
function marketResultHandler(detailresults) {
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

function getDetails(market, index) {
  var id = market.id;
  var name = market.name;
  name = name.replace(/\d+\.\d+/, " ");

  window['detailResultHandler' + id] = function(data) {
    var currentMarket = data.marketdetails;
    var newRow = ' \
    <tr data-name="' + name + '" data-address="' + currentMarket['Address'] + '" data-schedule="' + currentMarket['Schedule'] + '" data-products="' + currentMarket['Products'] + '" data-contact="' + currentMarket['Contact'] + '"> \
      <td>' + name + '</td> \
      <td>' + '<a href="' + currentMarket["GoogleLink"] + '">' + currentMarket["Address"] + '</a></td> \
      <td>' + currentMarket["Schedule"] + '</td> \
      <td>' + '<button type="button" class="btn btn-default btn-moreInfo" role="button" data-toggle="modal" data-target="#modal--moreInfo"><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span></button>' + '</td> \
    </tr>';
    $(".table tbody").append(newRow);
  }

  $.ajax({
    type: "GET",
    contentType: "application/json; charset=utf-8",
    url: "https://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id=" + id,
    dataType: 'jsonp',
    jsonpCallback: 'detailResultHandler' + id
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
        // console.log(data[key]);


        // Add new row here
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


// Populate modal fields
$("#btn-AddMarket").on("click", function() {
  event.preventDefault();
  $("#form--market-add").valid();
  // var trainID = $(this).closest("tr").attr("data-id");
  // var trainRef = database.ref().child(trainID);
  // trainRef.on('value', function(snapshot) {
  //   var trainEdit = snapshot.val();
  //   if (trainEdit) {
  //     $("#trainNameEdit").val(trainEdit.trainName).attr("data-id", trainID);
  //     $("#trainDestinationEdit").val(trainEdit.trainDestination);
  //     $("#trainTimeEdit").val(trainEdit.trainTime);
  //     $("#trainFrequencyEdit").val(trainEdit.trainFrequency);
  //   }
  // });
});


$(".table").on("click", ".btn-moreInfo", function() {
  event.preventDefault();
  var marketName = $(this).closest("tr").attr("data-name");
  var address = $(this).closest("tr").attr("data-address");
  var products = $(this).closest("tr").attr("data-products");

  $(".moreInfo-name").html(marketName);
  $(".moreInfo-products").html(products);
});
