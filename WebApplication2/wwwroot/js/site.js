// Initialize the map
var map = L.map('map', { zoomControl: false }).setView([58.1599, 8.0182], 13);

// Add event listeners to custom zoom buttons
document.getElementById('zoom-in').onclick = function () {
    map.zoomIn();
};
document.getElementById('zoom-in').title = "Zoom inn";
document.getElementById('zoom-out').onclick = function () {
    map.zoomOut();
};
document.getElementById('zoom-out').title = "Zoom ut";

//Add map tilelayer (Map image)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Initialize the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Variable to store the current drawing mode
var currentMode = null;

// Initialize an array to store shape information
var shapesList = [];

// Function to show shape selection popup
function showShapeSelectionPopup(latlng) {
    var popupContent = L.DomUtil.create('div', 'shape-selection-popup');
    popupContent.innerHTML = `
        <button class="shape-button" id="markershapebutton"   data-shape="Marker">  <i class="fa-solid fa-location-dot"></i> Markør  </button>
        <button class="shape-button" id="circleshapebutton"   data-shape="Circle">  <i class="fa-regular fa-circle"></i>     Sirkel  </button>
        <button class="shape-button" id="polylineshapebutton" data-shape="Line">    <i class="fa-solid fa-minus"></i>        Linje   </button>
        <button class="shape-button" id="polygonshapebutton"  data-shape="Polygon"> <i class="fa-solid fa-diamond"></i>      Polygon </button>
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
        polyline: shapeType === 'Line',
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

    // Add this timeout to reset currentMode if drawing doesn't start
    setTimeout(function () {
        if (currentMode === shapeType) {
            currentMode = null;
        }
    }, 500);
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
    var comment = prompt("Legg til en kommentar for denne markeringen:");
    if (comment) {
        layer.bindPopup(comment);

        // Add shape info to the list
        shapesList.push({
            id: L.stamp(layer),
            type: event.layerType,
            comment: comment
        });

        // Update the shapes list display
        updateShapesList();
    }

    // Reset the drawing mode
    currentMode = null;
});

// Event handler when drawing starts
map.on(L.Draw.Event.DRAWSTART, function (event) {
    // No need to store the draw control
});

// Event handler when drawing stops
map.on('draw:drawstop', function () {
    currentMode = null;
});

// Add a button to center on user's location
L.Control.LocateButton = L.Control.extend({
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        var button = L.DomUtil.create('a', 'locate-button', container);
        button.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>'; // Font Awesome icon
        button.href = '#';
        button.title = 'Sentrer på min plassering';

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
    var radius = e.accuracy / 2;
    userLocMarker = L.marker(e.latlng).addTo(map)
        .bindPopup("Du er innen " + radius + " meter fra dette punktet").openPopup();
    userLocCircle = L.circle(e.latlng, radius).addTo(map);
});

// Handle location error event
map.on('locationerror', function (e) {
    alert("Lokasjon tillatelser nektet, eller ikke tilgjengelige.");
});

// Add the geocoder control
var geocoder = L.Control.geocoder({
    defaultMarkGeocode: false, // Prevent default marker to allow custom behavior
    placeholder: "Søk..."
}).addTo(map);

geocoder.getContainer().setAttribute('title', 'Søk etter steder'); // Add text when hovering over button

geocoder.on('markgeocode', function (e) {
    var latlng = e.geocode.center;
    map.setView(latlng, 16); // Set the map view to the selected location
    L.marker(latlng).addTo(map) // Optionally add a marker at the selected location
        .bindPopup(e.geocode.name)
        .openPopup();
});

// Function to update the shapes list display
function updateShapesList() {
    var listContainer = document.getElementById('shapes-list');
    listContainer.innerHTML = '';
    if (shapesList.length === 0) {
        listContainer.innerHTML = '<p>Ingen kommentarer enda.</p>';
        return;
    }
    var ul = document.createElement('ul');
    shapesList.forEach(function (shape) {
        var li = document.createElement('li');
        li.innerHTML = `
            <strong>${shape.type}</strong>: ${shape.comment}
            <button onclick="editCorrection(${shape.id})">Rediger</button>
            <button onclick="deleteCorrection(${shape.id})">Slett</button>
        `;
        li.onclick = function (e) {
            if (e.target.tagName !== 'BUTTON') {
                var layer = drawnItems.getLayer(shape.id);
                if (layer) {
                    if (layer.getBounds) {
                        map.fitBounds(layer.getBounds());
                    } else if (layer.getLatLng) {
                        map.setView(layer.getLatLng(), 16);
                    }
                    if (layer.getPopup()) layer.openPopup();
                }
            }
        };
        ul.appendChild(li);
    });
    listContainer.appendChild(ul);
}

// Function to edit a correction
function editCorrection(id) {
    var shapeIndex = shapesList.findIndex(shape => shape.id === id);
    if (shapeIndex !== -1) {
        var shape = shapesList[shapeIndex];
        var newComment = prompt("Rediger kommentar:", shape.comment);
        if (newComment !== null) {
            shape.comment = newComment;
            var layer = drawnItems.getLayer(id);
            if (layer) {
                layer.setPopupContent(newComment);
            }
            updateShapesList();
        }
    }
}

// Function to delete a correction
function deleteCorrection(id) {
    var shapeIndex = shapesList.findIndex(shape => shape.id === id);
    if (shapeIndex !== -1) {
        var layer = drawnItems.getLayer(id);
        if (layer) {
            drawnItems.removeLayer(layer);
        }
        shapesList.splice(shapeIndex, 1);
        updateShapesList();
    }
}

// Add event listeners for editing and deleting shapes
map.on(L.Draw.Event.EDITED, function (e) {
    var layers = e.layers;
    layers.eachLayer(function (layer) {
        var id = L.stamp(layer);
        var index = shapesList.findIndex(shape => shape.id === id);
        if (index !== -1) {
            var newComment = prompt("Oppdater kommentar for denne formen:", shapesList[index].comment);
            if (newComment) {
                shapesList[index].comment = newComment;
                layer.setPopupContent(newComment);
                updateShapesList();
            }
        }
    });
});

map.on(L.Draw.Event.DELETED, function (e) {
    var layers = e.layers;
    layers.eachLayer(function (layer) {
        var id = L.stamp(layer);
        shapesList = shapesList.filter(shape => shape.id !== id);
    });
    updateShapesList();
});

// Remove overlay when button pressed
document.addEventListener('DOMContentLoaded', function () {
    const button = document.querySelector('#welcometext button');
    button.addEventListener('click', function () {
        const overlay = document.getElementById('startupoverlay');
        overlay.remove();
    });

    // Initialize the shapes list
    updateShapesList();
});