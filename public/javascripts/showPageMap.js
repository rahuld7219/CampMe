mapboxgl.accessToken = mapToken;
// create a default map
const map = new mapboxgl.Map({
        container: 'map', // container ID
        // style URL, can change style from streets-v11 to others like satellite-v9, etc.
        style: 'mapbox://styles/mapbox/streets-v11',
        center: campground.geometry.coordinates, // starting position [lng, lat]
        zoom: 11 // starting zoom
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

// Create a default Marker, colored black, rotated 15 degrees and add it to the map.
new mapboxgl.Marker({ color: 'black', rotation: 15 })
        .setLngLat(campground.geometry.coordinates)
        .setPopup(
                new mapboxgl.Popup({ offset: 25 }) // offest is how much above the marker popup should display
                        .setHTML(
                                `<h6>${campground.title}</h6><p>${campground.location}</p>`
                        )
        )
        .addTo(map);