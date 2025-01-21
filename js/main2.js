document.addEventListener('DOMContentLoaded', () => {
    // Your Mapbox access token
    mapboxgl.accessToken = 'pk.eyJ1IjoibXQzNHRob21hcyIsImEiOiJjbHZmOXFneXIwYjVjMmxudnFvZGc5MTFmIn0.sPVg01T0am-g_W82-TRzzA';

    // Initialize the map
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [-71.9675, -13.5320],
        zoom: 8,
        interactive: false, // Initially disable interactions
    });

    // On map load
    map.on('load', () => {
        loadGeoJSONFiles(); // Load and display GeoJSON files first
        loadLocalRoute(); // use the local GeoJSON route
        addMarkerLayers(); // Add marker layers
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');
    });

    // Destinations data
    const destinations = [
        { latitude: -13.5196551, longitude: -71.9744293, title: 'Cusco', zoom: 12 },
        { latitude: -13.318208, longitude: -71.597450, title: 'Paucartambo', zoom: 12 },
        { latitude:  -13.199487, longitude: -71.617216, title: 'Manu Entrance', zoom: 13 },
        { latitude: -13.1747, longitude: -71.5872, title: 'Wayqecha', zoom: 14 },
    ];

    // Load GeoJSON files and display them on the map
    function loadGeoJSONFiles() {
        const geojsonFiles = [
            { url: 'geo/manu.geojson', id: 'geojson-layer-1', color: '#007AFF' },
            { url: 'geo/wq.geojson', id: 'geojson-layer-2', color: '#00FF00' },
        ];

        geojsonFiles.forEach((file) => {
            fetch(file.url)
                .then((response) => response.json())
                .then((data) => {
                    map.addSource(file.id, {
                        type: 'geojson',
                        data: data,
                    });

                    map.addLayer({
                        id: file.id,
                        type: 'fill', // You can change this to 'line', 'circle', etc., depending on your GeoJSON data
                        source: file.id,
                        paint: {
                            'fill-color': file.color,
                            'fill-opacity': 0.2,
                        },
                    }, 'route-line'); // Add the layer before the route line
                })
                .catch((error) => console.error(`Error loading ${file.url}:`, error));
        });
    }

    function loadLocalRoute() {
        map.addSource('route', {
            type: 'geojson',
            data: 'geo/cus_wq.geojson', // local GeoJSON file
        });

        map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
            },
            paint: {
                'line-color': '#FFD65A',
                'line-width': 4,
                'line-dasharray': [2, 4],
            },
        });
    }

    function addMarkerLayers() {
        const features = destinations.map((dest) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [dest.longitude, dest.latitude] },
            properties: { title: dest.title },
        }));

        map.addSource('markers', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features },
        });

        // Circle layer
        map.addLayer({
            id: 'marker-circles',
            type: 'circle',
            source: 'markers',
            paint: {
                'circle-radius': 10,
                'circle-color': '#FF5733',
                'circle-stroke-width': 1,
                'circle-stroke-color': 'rgba(0,0,0,0.15)',
            },
        });

        // Symbol layer for labels
        map.addLayer({
            id: 'marker-labels',
            type: 'symbol',
            source: 'markers',
            layout: {
                'text-field': ['get', 'title'],
                'text-font': ['Open Sans Semibold','Arial Unicode MS Bold'],
                'text-size': 12,
                'text-offset': [0, 1.5], // label above circle
                'text-anchor': 'top',
                'text-allow-overlap': true,
                'visibility': 'visible'
            },
            paint: {
                'text-color': '#000',
                'text-halo-color': 'rgba(255, 255, 255, 0.8)',
                'text-halo-width': 15,
                'text-halo-blur': 10,
            },
        });
    }

    // Highlight function for cards
    function highlightCard(index) {
        document.querySelectorAll('.destination-card').forEach((card, i) => {
            if (i === index) {
                card.classList.add('active');
                card.classList.remove('previous', 'next');
            } else if (i < index) {
                card.classList.add('previous');
                card.classList.remove('active', 'next');
            } else {
                card.classList.add('next');
                card.classList.remove('active', 'previous');
            }
        });
    }

    // Handle scrolling behavior
    const mapContainer = document.getElementById('map-container');
    const spacer = document.querySelector('.spacer');
    const totalScrollHeight = spacer.offsetHeight;
    const totalSegments = destinations.length;
    const segmentHeight = totalScrollHeight / totalSegments;

    let currentSegmentIndex = -1;
    let isUserInteracting = false;

    // Disable Mapbox interactions at start
    map.dragPan.disable();
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();
    map.keyboard.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();

    // Handle scrolling behavior
    mapContainer.addEventListener('scroll', () => {
        if (isUserInteracting) return;

        const scrollPosition = mapContainer.scrollTop;
        const totalProgress = scrollPosition / totalScrollHeight;
        let segmentIndex = Math.floor(totalProgress * totalSegments);
        segmentIndex = Math.max(0, Math.min(segmentIndex, totalSegments - 1));

        if (segmentIndex !== currentSegmentIndex) {
            currentSegmentIndex = segmentIndex;

            const destination = destinations[segmentIndex];
            const center = [destination.longitude, destination.latitude];
            const zoom = destination.zoom;

            map.easeTo({ center, zoom, duration: 1000 });
            highlightCard(segmentIndex);
        }
    });

    // Prevent default right-click context menu (optional)
    mapContainer.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    // Enable map interactions on map mouse down (left button)
    map.on('mousedown', (event) => {
        if (event.originalEvent.button === 0) { // left button
            isUserInteracting = true;
            map.dragPan.enable();
            map.scrollZoom.enable();
            map.boxZoom.enable();
            map.dragRotate.enable();
            map.keyboard.enable();
            map.doubleClickZoom.enable();
            map.touchZoomRotate.enable();
        }
    });

    // Disable map interactions on map mouse up (left button)
    map.on('mouseup', (event) => {
        if (event.originalEvent.button === 0) {
            isUserInteracting = false;
            map.dragPan.disable();
            map.scrollZoom.disable();
            map.boxZoom.disable();
            map.dragRotate.disable();
            map.keyboard.disable();
            map.doubleClickZoom.disable();
            map.touchZoomRotate.disable();
        }
    });
});
