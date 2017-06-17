var Market = "";
var Location = "";
var Products = "";
var Contact = "";
var Dates_Times = "";



var displayTime = function() {

  database.ref().on("child_added", function(childSnapshot) {


    var tableRow = $('<tr>').attr('id', todoCount).attr('data-key', childKey);
    var name = $('<td>').text(childSnapshot.val().name);
    var Location = $('<td>').text(childSnapshot.val().Location);
    var Products = $('<td>').text(childSnapshot.val().Products);
    var Contact = $('<td>').text(childSnapshot.val().Contact);
    var Market = childSnapshot.val();
    Market.id = childSnapshot.key;

    todoCount++;

    tableRow.append(nameCell).append(LocationCell).append(ProductsCell).append(ContactCell).append(MarketCell);

    $('tbody').append(tableRow);
  });
};

jsonObj = [];
'child_added'

function(column) {
  jsonObj.push(column);
}


$('#button-submit').on('click', function() {
  name = $('#name').val().trim();
  Location = $('#Location').val().trim();
  Products = $('#Products').val().trim();
  Contact = $('#Contact').val().trim();

  database.ref().push({
    name: name,
    Location: Location,
    Products: Products,
    Contact: Contact,


  });

  $('#name').val('');
  $('#Location').val('');
  $('#Products').val('');
  $('#Contact').val('');
  return false;


});

$(function() {});
