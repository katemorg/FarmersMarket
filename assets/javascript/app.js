var map;
      function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 41.505493, lng: -81.6944},
          zoom: 8
        });
      }