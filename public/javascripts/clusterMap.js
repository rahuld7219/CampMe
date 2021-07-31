/*
This Mapbox cluster-map expects source data as a geoJSON with an array of objects under a key named "features"
with each object of "features" having a "geometry" and a "properties" field
*/


mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
    container: 'cluster-map', // container ID in which the map display
    style: 'mapbox://styles/mapbox/light-v10', // style URL
    center: [-103.59179687498357, 40.66995747013945], // starting map center position, [lng, lat]
    zoom: 3 // starting zoom
});

map.on('load', function () {
    // Add a new source from our GeoJSON data and
    // set the 'cluster' option to true. GL-JS will
    // add the point_count property to your source data.
    map.addSource('campgrounds', {
        type: 'geojson',
        // Point to our campgrounds GeoJSON data
        data: campgrounds,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
    });

    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'campgrounds',
        filter: ['has', 'point_count'],
        paint: {
            // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
            // with three steps to implement three types of circles:
            //   * Blue, 15px circles when point count is less than 10
            //   * Yellow, 20px circles when point count is between 10 and 30
            //   * Pink, 25px circles when point count is greater than or equal to 30
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#00bcd4',
                10,
                '#2196f3',
                30,
                '#3f51b5'
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                15,
                10,
                20,
                30,
                25
            ]
        }
    });

    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'campgrounds',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}', // text on the cluster circle, here it shows number of points in a cluster
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        }
    });

    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'campgrounds',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#11b4da',
            'circle-radius': 10,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
        }
    });

    // inspect a cluster on click, .i.e, below code runs when a cluster is clicked
    map.on('click', 'clusters', function (e) {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('campgrounds').getClusterExpansionZoom(
            clusterId,
            function (err, zoom) {
                if (err) return;

                map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            }
        );
    });

    // When a click event occurs on a feature in
    // the unclustered-point layer, open a popup at
    // the location of the feature, with
    // description HTML from its properties.
    // .i.e, below code runs when a unclustered point is clicked
    map.on('click', 'unclustered-point', function (e) {
        console.log(e.features[0])
        const coordinates = e.features[0].geometry.coordinates.slice();

        // properties.popupMarkup is a virtual in our campground schema at backend
        //(we can setup a popup markup here at front-end also by writing logic in Javascript, but we prefer to write most logic at backend)
        const { popupMarkup } = e.features[0].properties;

        // Ensure that if the map is zoomed out such that
        // multiple copies of the feature are visible, the
        // popup appears over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupMarkup)
            .addTo(map);
    });
    // below code runs when mouse enter on a cluster
    map.on('mouseenter', 'clusters', function () {
        map.getCanvas().style.cursor = 'pointer';
    });
    // below code runs when mouse leaves from a cluster
    map.on('mouseleave', 'clusters', function () {
        map.getCanvas().style.cursor = '';
    });
});