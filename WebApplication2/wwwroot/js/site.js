// Initialize the map
var map = L.map('map', { zoomControl: false }).setView([51.505, -0.09], 13);

// Add event listeners to custom zoom buttons
document.getElementById('zoom-in').onclick = function () {
    map.zoomIn();
};
document.getElementById('zoom-out').onclick = function () {
    map.zoomOut();
};

//Add map tilelayer (Map image)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Initialize the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Variable to store the current drawing mode
var currentMode = null;

// Function to show shape selection popup
function showShapeSelectionPopup(latlng) {
    var popupContent = L.DomUtil.create('div', 'shape-selection-popup');
    popupContent.innerHTML = `
        <button class="shape-button" data-shape="Marker">Marker</button>
        <button class="shape-button" data-shape="Circle">Circle</button>
        <button class="shape-button" data-shape="Polyline">Line</button>
        <button class="shape-button" data-shape="Polygon">Polygon</button>
    `;

    // Add click event listeners to buttons
    var buttons = popupContent.querySelectorAll('.shape-button');
    buttons.forEach(function (button) {
        L.DomEvent.on(button, 'click', function (e) {
            L.DomEvent.stopPropagation(e);
            selectShape(this.getAttribute('data-shape'), latlng);
        });
    });

    var popup = L.popup()
        .setLatLng(latlng)
        .setContent(popupContent)
        .openOn(map);
}

// Function to select shape and start drawing
function selectShape(shapeType, latlng) {
    map.closePopup();

    var drawOptions = {
        marker: shapeType === 'Marker' ? { startingPoint: latlng } : false,
        circle: shapeType === 'Circle',
        polyline: shapeType === 'Polyline',
        polygon: shapeType === 'Polygon',
        rectangle: false,
        circlemarker: false
    };

    var shape = new L.Draw[shapeType](map, drawOptions[shapeType.toLowerCase()]);
    shape.enable();

    if (shapeType === 'Marker') {
        shape.setLatLng(latlng);
    }

    currentMode = shapeType;
}

// Event handler for map clicks
map.on('click', function (e) {
    if (!currentMode) {
        showShapeSelectionPopup(e.latlng);
    }
});

// Event handler for when a shape is created
map.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;
    drawnItems.addLayer(layer);

    // Prompt for a comment
    var comment = prompt("Please enter a comment for this shape:");
    if (comment) {
        layer.bindPopup(comment);
    }

    // Reset the drawing mode
    currentMode = null;
});

// Event handler for when drawing starts
map.on(L.Draw.Event.DRAWSTART, function (event) {
    // No need to store the draw control
});


//
//
//
// Add a button to center on user's location
L.Control.LocateButton = L.Control.extend({
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        var button = L.DomUtil.create('a', 'locate-button', container);
        button.innerHTML = '<i class="fas fa-map-marker-alt"></i>'; // Font Awesome icon
        button.href = '#';
        button.title = 'Center on your location';

        L.DomEvent.on(button, 'click', function (e) {
            L.DomEvent.preventDefault(e);
            map.locate({ setView: true, maxZoom: 16 });
        });

        return container;
    }
});

map.addControl(new L.Control.LocateButton({ position: 'bottomright' }));

// Handle location found event
var userLocMarker = {};
var userLocCircle = {};
map.on('locationfound', function (e) {
    //Remove marker and circle if they already exist
    if (userLocMarker != undefined) {
        map.removeLayer(userLocMarker);
    };
    if (userLocCircle != undefined) {
        map.removeLayer(userLocCircle);
    };
    //Create marker and circle on position
    L.circle()
    var radius = e.accuracy / 2;
    userLocMarker =L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();
    userLocCircle = L.circle(e.latlng, radius).addTo(map);
});

// Handle location error event
map.on('locationerror', function (e) {
    alert("Location access denied or unavailable.");
});

//
//
//
// Add the geocoder control
L.Control.geocoder({
    defaultMarkGeocode: false  // Prevent default marker to allow custom behavior
})
    .on('markgeocode', function (e) {
        var latlng = e.geocode.center;
        map.setView(latlng, 16);  // Set the map view to the selected location
        // Optionally add a marker at the selected location
        L.marker(latlng).addTo(map)
            .bindPopup(e.geocode.name)
            .openPopup();
    })
    .addTo(map);


// Wait for the DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Select the button inside the overlay
    const button = document.querySelector('#welcometext button');

    // Add a click event listener to the button
    button.addEventListener('click', function () {
        // Select the overlay div
        const overlay = document.getElementById('startupoverlay');

        // Remove the overlay from the DOM
        overlay.remove();
    });
});