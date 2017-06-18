$(document).ready(function(){

var database = firebase.database();

$("#btn-AddMarket").on("click", function() {



    var marketname = $('#marketNameAdd').val().trim();
    var address = $('#marketAddressAdd').val().trim();
    var city = $('#marketCityAdd').val().trim();
    var state = $('#marketStateAdd').val().trim();
    var zipcode = $('#marketZipAdd').val().trim();
    var products =$('#marketProductsAdd').val();

     

    database.ref().push({

      marketNameAdd: marketname,
      marketAddressAdd: address,
      marketCityAdd: city,
      marketStateAdd: state,
      marketZipAdd: zipcode,
      marketProductsAdd: products,

      

      

      

      

      timeAdded: firebase.database.ServerValue.TIMESTAMP

       });

      $("input").val('');

      return false;


      });


   
  
  










































});







  