// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
// Initialize the map
var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl;
var currentShape;
var reportedErrors = []; // Array to store all reported errors

//
//
//
//Functions to allow drawing different shapes
//Select what shape you want to draw
map.on('click', function (e) {
    if (!drawControl) {
        showShapeSelectionPopup(e.latlng);
    }
});

function showShapeSelectionPopup(latlng) {
    var popup = L.popup()
        .setLatLng(latlng)
        .setContent(
            '<button onclick="selectShape(\'marker\')">Marker</button>' +
            '<button onclick="selectShape(\'circle\')">Circle</button>' +
            '<button onclick="selectShape(\'polyline\')">Line</button>' +
            '<button onclick="selectShape(\'polygon\')">Polygon</button>'
        )
        .openOn(map);
}


function selectShape(shapeType) {
    map.closePopup();

    if (drawControl) {
        map.removeControl(drawControl);
    }

    var drawOptions = {
        draw: {
            marker: shapeType === 'marker',
            circle: shapeType === 'circle',
            polyline: shapeType === 'polyline',
            polygon: shapeType === 'polygon',
            rectangle: false,
            circlemarker: false
        },
        edit: false
    };

    drawControl = new L.Control.Draw(drawOptions);
    map.addControl(drawControl);

    new L.Draw[shapeType.charAt(0).toUpperCase() + shapeType.slice(1)](map).enable();
}


map.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;
    drawnItems.addLayer(layer);
    currentShape = layer;

    addCommentToShape(layer);
});

//Add comment when creating marker
function addCommentToShape(layer) {
    var comment = prompt("Please enter a comment for this error:");

    if (comment !== null) {
        // Store the shape data and comment
        var shapeData = layer.toGeoJSON();
        var errorReport = {
            id: Date.now(), // Unique identifier
            shape: shapeData,
            comment: comment
        };
        reportedErrors.push(errorReport);

        // Assign the ID to the layer so it can be found later
        layer.customId = errorReport.id; // Custom property to store the unique ID

        // Add a popup to the shape with the comment and an edit button
        var popupContent = `
          <p>${comment}</p>
          <button onclick="editComment(${errorReport.id})">Edit Comment</button>
      `;
        layer.bindPopup(popupContent).openPopup();

        console.log('Error report:', errorReport);
    } else {
        // If no comment provided, remove the shape
        drawnItems.removeLayer(layer);
    }

    // Remove the draw control after the shape is created
    if (drawControl) {
        map.removeControl(drawControl);
        drawControl = null;
    }
}

//Edit marker commet
function editComment(id) {
    var errorReport = reportedErrors.find(report => report.id === id);
    if (errorReport) {
        var newComment = prompt("Edit your comment:", errorReport.comment);
        if (newComment !== null) {
            errorReport.comment = newComment;

            // Find the layer associated with the given id using customId
            var layer = drawnItems.getLayers().find(layer => layer.customId === id);
            if (layer) {
                // Update the popup content
                var popupContent = `
                  <p>${newComment}</p>
                  <button onclick="editComment(${id})">Edit Comment</button>
              `;
                layer.setPopupContent(popupContent);  // Update the content
                layer.openPopup();  // Open the updated popup
            } else {
                console.warn('Layer not found for id:', id);
            }

            console.log('Updated error report:', errorReport);
        }
    }
}


// Function to get all reported errors
function getReportedErrors() {
    return reportedErrors;
}

//
//
//
// Function to save errors locally as a JSON file
function saveErrorsLocally() {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportedErrors));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "map_errors.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Add a button to save errors
var saveButton = L.control({ position: 'bottomright' });
saveButton.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'save-button');
    div.innerHTML = '<button onclick="saveErrorsLocally()">Save Errors</button>';
    return div;
};
saveButton.addTo(map);

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
map.on('locationfound', function (e) {
    var radius = e.accuracy / 2;
    L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();
    L.circle(e.latlng, radius).addTo(map);
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

//
//
//
//Overlay on page load
// Function to handle the overlay dismissal
function dismissOverlay() {
    var overlay = document.getElementById('instructionOverlay');
    overlay.style.display = 'none'; // Hide the overlay
}

// Event listener for the button click to dismiss the overlay
document.getElementById('closeOverlayButton').addEventListener('click', dismissOverlay);

// Optionally, you can add an event listener to dismiss the overlay when the user clicks on the map itself
map.on('click', function () {
    dismissOverlay();
});
