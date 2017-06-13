function farmersMarket() {
  this.id = null;
  this.name = null;
  this.address = null;
  this.googleLink = null;
  this.products = null;
  this.schedule = null;
}

var markets = [];

function getMarkets(zip) {
  $.ajax({
    type: "GET",
    contentType: "application/json; charset=utf-8",
    // submit a get request to the restful service mktDetail.
    // url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id=" + id,
    url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=" + zip,
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
  console.log(markets);

  $.each(markets, function(index, value) {
    // console.log(markets[index].id);
    getDetails(markets[index]);
    // getDetails(parseInt(markets[index].id))
  });
}

function getDetails(market) {
  var id = market.id;
  var name = market.name;

  window['detailResultHandler' + id] = function(data) {
    var currentMarket = data.marketdetails;
    var newRow = ' \
    <tr> \
      <td>' + name + '</td> \
      <td>' + '<a href="' + currentMarket["GoogleLink"] + '">' + currentMarket["Address"] + '</a></td> \
      <td>' + currentMarket["Products"] + '</td> \
      <td></td> \
      <td>' + currentMarket["Schedule"] + '</td> \
    </tr>';
    console.log(newRow);
    $(".table tbody").append(newRow);
  }

  $.ajax({
    type: "GET",
    contentType: "application/json; charset=utf-8",
    // submit a get request to the restful service mktDetail.
    url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id=" + id,
    // url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=" + zip,
    dataType: 'jsonp',
    jsonpCallback: 'detailResultHandler' + id
  });
  console.log(id);
}

function detailResultHandler(detailresults) {
  var currentMarket = detailresults.marketdetails;
  var newRow = ' \
    <tr> \
      <td>' + 'NAME GOES HERE' + '</td> \
      <td>' + '<a href="' + currentMarket["GoogleLink"] + '">' + currentMarket["Address"] + '</a></td> \
      <td>' + currentMarket["Products"] + '</td> \
      <td></td> \
      <td>' + currentMarket["Schedule"] + '</td> \
    </tr>';
  console.log(newRow);
  $(".table tbody").append(newRow);
}

$(function() {
  getMarkets(44121);
  // console.log(markets);

});
