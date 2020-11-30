    // Define the variables for the 3 layers
    var iris;
    var metro;
    var auto_partage;


    // Defien an OpenStreetMap Layer
    var osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: "OpenStreetMap"});


    // Custom style for iris which corresponds to the unemployment rate
    // Define a function that returns different colors depending on the value of tchom
    function getColor(tchom) {
    return tchom <= 9.56 ? '#e1bee7' :
           tchom <= 12.53  ? '#ba68c8' :
           tchom <= 15.97  ? '#8e24aa' :
                            '#4a148c';
    }

    // Define a style function for iris layer
    function style_iris(feature) {
    return {
        fillColor: getColor(feature.properties.tchom),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.8
        };
    }

    // Add interaction to the iris layer
    // Define a function for mouseover event
    function highlightFeature(e) {
        var layer = e.target;
        console.log(layer.feature.geometry.type);
        // For Taux de Chômage layer
        if (layer.feature.geometry.type == "Polygon") {
                layer.setStyle({
                weight: 4,
                color: '#00e676',
                dashArray: '',
                fillOpacity: 0.7        
            });
                // Add a tooltip to iris layer
                iris.bindTooltip("tchom : " + layer.feature.properties.tchom ,
                 {sticky: true, offset: L.point(-3,-3)});

        // For Lignes de Metro layer
        } else if (layer.feature.geometry.type == "LineString") {
            layer.setStyle({
                weight: 5,
                color: '#18ffff'
            });
            // Add a tooltip for metro layer
            metro.bindTooltip("Ligne : " + layer.feature.properties.ligne , {sticky: true, offset: L.point(-3,-3)});
        // For "Station Autopartage" Layer
        } else if (layer.feature.geometry.type == "Point") {
            console.log("test");
            layer.setStyle({
                color: '#18ffff',
                weight: 10,
            });
        }

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
            }
    }

    // Define a function for mouseout event
    function resetHighlight(e) {
        if (e.target.feature.geometry.type == "Polygon") {
            iris.resetStyle(e.target);
        } else if (e.target.feature.geometry.type == "LineString") {
            metro.resetStyle(e.target); 
        } else if (e.target.feature.geometry.type == "Point") {
            auto_partage.resetStyle(e.target);
        }
    }

    // Define a function for showing a popup on mouseclick
    function showPopup(e) {
        if (e.target.feature.geometry.type == "Polygon") {
        //map.fitBounds(e.target.getBounds());
        e.target.bindPopup("id : " + e.target.feature.properties.id +
                             "</br>Taux de Chômage : <b>" + e.target.feature.properties.tchom) + "</b>";
        }
    }


    // A function for adding listeners
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: showPopup
        });
    }


    // Add iris GeoJSON layer
    iris = L.geoJson(iris_geojson, {
        style: style_iris,
        onEachFeature: onEachFeature,
        attribution: "Data Grand Lyon",
    });



    // Add the metro GeoJSON layer
    metro = L.geoJson(metro_geojson, {
        style: function(feature) {
                switch (feature.properties.ligne) {
                    case 'A': return {color: "#ff0000", weight: 6, opacity: 0.7};
                    case 'B':   return {color: "#0000ff", weight: 6, opacity: 0.7};
                    case 'C': return {color: "#ffff00", weight: 6, opacity: 0.7};
                    case 'D': return {color: "#00bb55", weight: 6, opacity: 0.7};
                    }
                },
        onEachFeature: onEachFeature,
        attribution: "Data Grand Lyon",
                
        });

    // Define marker options
    var geojsonMarkerOptions = {
    radius: 3,
    fillColor: "#ff7800",
    color: "#111",
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8,
        };


    // Define the auto_partage layer
    auto_partage = L.geoJSON(auto_partage_geojson, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
    }, onEachFeature: onEachFeature,
    attribution: "Data Grand Lyon"

    });

    // Create buffer
    var auto_partage_buffer = L.geoJSON(auto_partage_geojson, {
    pointToLayer: function (feature, latlng) {
        return L.circle(latlng, 300);
    },
    }); 


    // Create the map object
    var map = L.map('map',{
        center: [45.759072, 4.824226],
        zoom: 12,
        layers: [osm, iris]
    });

    map.fitBounds(iris.getBounds());

    // Create two objects for the base map and the overlay maps
    var baseMap = {
        "Open Street Map": osm
    };

    var overlayMaps = {
        "Taux de Chômage": iris,
        "Lignes de Metro": metro,
        "Stations Auto Partage": auto_partage,
        "Auto Partage 300m Buffer": auto_partage_buffer
    };

    // Add  a Layer Control
    L.control.layers(baseMap, overlayMaps).addTo(map);

    // A function for reversing the coordinates within a list
    var reverseCoord = function(a) {
        var b = []
        for (var i = 0; i < a.length; i++) {
          b.push([a[i][1], a[i][0]]);
        }
        return b;
    }

    // Define icon
    var myIcon = L.icon({
      iconUrl: 'images/tram.png'
    });
    // Add animated markers
    var addMarkers = function() {
        for (var i = 3; i >= 0; i--) {
            var line = L.polyline(reverseCoord(metro.getLayers()[i].feature.geometry.coordinates)),
            animatedMarker = L.animatedMarker(line.getLatLngs(), {
            icon: myIcon,
            interval: i == 3 ? 50 :
                    i == 0 ? 80 :
                    250,
            onEnd: function() {
                this.remove();
            } });
            map.addLayer(animatedMarker);
        }
    }

    // Add audio element
    var audioElement = document.createElement('audio');
    audioElement.setAttribute('src', 'sounds/metro-departing-exterior-01.mp3');

    // Add the animated markers and audio when the metro layer is added to the map
    map.on('overlayadd', function(eo) {
    if (eo.name === 'Lignes de Metro'){
        map.setZoom(13);
        map.fitBounds(eo.layer.getBounds());
        setTimeout(addMarkers(), 10);
        // Play the sound of the metro
        audioElement.play();

        console.log(eo.layer.getBounds());
        }
    });

    // Reset the zoom when the metro layer is removed
        map.on('overlayremove', function(eo) {
    if (eo.name === 'Lignes de Metro'){
        // Reset zoom
        map.setZoom(12);
        map.fitBounds(eo.layer.getBounds()); 
        }
    });

    // Add Legend
    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 9.56, 12.53, 15.97],
            labels = [];

        // loop through our Taux de chômage intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }

        return div;
    };

    legend.addTo(map);

    // Remove the legend when the Taux de Chômage layer is removed from the map
    map.on('overlayremove', function(eo) {
    if (eo.name === 'Taux de Chômage'){
        legend.remove(map);
    }
    });

    // Add the legend when the Taux de Chômage layer is added to the map 
    map.on('overlayadd', function(eo) {
    if (eo.name === 'Taux de Chômage'){
        legend.addTo(map);
        map.setZoom(12);
        map.fitBounds(eo.layer.getBounds());
    }
    });