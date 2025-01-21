// main.js

document.addEventListener('DOMContentLoaded', () => {

    // -------------------
    // Existing Variables
    // -------------------
    const burger = document.querySelector('.burger');
    const navLinks = document.querySelector('.overlay-nav-links');
    const textSection = document.getElementById('text-section');
    const imageGallerySection = document.getElementById('image-gallery-section');
    const destinationPanel = document.getElementById('destination-panel');
    const mapSection = document.getElementById('map-section');
    const mapOverlay = document.getElementById('map-overlay');
    const enterMapBtn = document.getElementById('enter-map-btn');

    // -------------------
    // Navigation Toggle
    // -------------------
    if (burger && navLinks) {
        burger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            burger.classList.toggle('toggle');
        });
    } else {
        console.warn('Burger or navLinks element not found');
    }

    // -------------------
    // GSAP Animations
    // -------------------

    // -------------------
    // Map Section
    // -------------------
    // Your Mapbox access token
    mapboxgl.accessToken = 'pk.eyJ1IjoibXQzNHRob21hcyIsImEiOiJjbHZmOXFneXIwYjVjMmxudnFvZGc5MTFmIn0.sPVg01T0am-g_W82-TRzzA';

    // Initialize the map
    const map = new mapboxgl.Map({
        container: 'map', // Ensure this ID matches the HTML
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [-71.9675, -13.5320], // Initial center (Cusco)
        zoom: 8,                      // Initial zoom level
    });

    // Disable scroll zoom on the map
    map.scrollZoom.disable();

    // On map load
    map.on('load', () => {
        loadGeoJSONFiles(); // Load and display GeoJSON files
        loadLocalRoute();   // Load the local route
        addMarkerLayers();  // Add marker layers
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');
    });

    // Destinations data
    const destinations = [
        { latitude: -13.5196551, longitude: -71.9744293, title: 'Cusco', zoom: 12 },
        { latitude: -13.318208, longitude: -71.597450, title: 'Paucartambo', zoom: 12 },
        { latitude: -13.199487, longitude: -71.617216, title: 'Manu Entrance', zoom: 13 },
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
                        type: 'fill',
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
            data: 'geo/cus_wq.geojson', // Local GeoJSON file
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
                'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-size': 20,
                'text-offset': [0, 1.5], // Label above circle
                'text-anchor': 'top',
                'text-allow-overlap': true,
                'visibility': 'visible'
            },
            paint: {
                'text-color': '#000',
                'text-halo-color': 'rgba(255, 255, 255, 0.8)',
                'text-halo-width': 15,
                'text-halo-blur': 0,
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

    // Variables to track map interactions
    let isUserInteracting = false;
    let currentSegmentIndex = -1;
    const totalDestinations = destinations.length;

    // Event listeners for map interactions
    function enableMapInteractions() {
        map.dragPan.enable();
        map.boxZoom.enable();
        map.dragRotate.enable();
        map.keyboard.enable();
        map.doubleClickZoom.enable();
        map.touchZoomRotate.enable();
        // scrollZoom remains disabled
    }

    function disableMapInteractions() {
        map.dragPan.disable();
        map.boxZoom.disable();
        map.dragRotate.disable();
        map.keyboard.disable();
        map.doubleClickZoom.disable();
        map.touchZoomRotate.disable();
    }

    // Initially, disable map interactions except for left mouse drag
    disableMapInteractions();

    // Enable map interactions on mousedown (left button)
    map.on('mousedown', (event) => {
        if (event.originalEvent.button === 0) { // Left mouse button
            isUserInteracting = true;
            map.dragPan.enable();
        }
    });

    // Disable map interactions on mouseup
    map.on('mouseup', () => {
        isUserInteracting = false;
        map.dragPan.disable();
    });

    // For touch devices
    map.on('touchstart', () => {
        isUserInteracting = true;
        map.dragPan.enable();
    });

    map.on('touchend', () => {
        isUserInteracting = false;
        map.dragPan.disable();
    });

    // Map transitions based on scroll position using GSAP ScrollTrigger
    gsap.to({}, {
        scrollTrigger: {
            trigger: mapSection,
            start: 'top top',
            end: `+=${totalDestinations * 100}%`,
            scrub: true,
            pin: true,
            anticipatePin: 1,
            onUpdate: (self) => {
                if (isUserInteracting) return; // Don't update map if user is interacting
                const progress = self.progress; // Value between 0 and 1
                const segment = progress * (totalDestinations - 1);
                const segmentIndex = Math.round(segment);

                if (segmentIndex !== currentSegmentIndex && segmentIndex < totalDestinations) {
                    currentSegmentIndex = segmentIndex;

                    const destination = destinations[segmentIndex];
                    const center = [destination.longitude, destination.latitude];
                    const zoom = destination.zoom;

                    map.easeTo({ center, zoom, duration: 1000 });
                    highlightCard(segmentIndex);
                }
            },
        },
    });

    // Hide the overlay when the user scrolls into the map section
    ScrollTrigger.create({
        trigger: mapSection,
        start: 'top center',
        onEnter: () => {
            if (mapOverlay && mapOverlay.style.display !== 'none') {
                mapOverlay.style.display = 'none';
            }
        },
    });

    // Optional: Allow users to manually remove the overlay
    if (enterMapBtn) {
        enterMapBtn.addEventListener('click', () => {
            mapOverlay.style.display = 'none';
        });
    }

    // Optional: Prevent default right-click context menu (if desired)
    map.getCanvas().addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

});

// Register GSAP and ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Select all bird items
const birdItems = document.querySelectorAll('.bird-item');

// Animate each bird item
birdItems.forEach((item) => {
    gsap.to(item, {
        scrollTrigger: {
            trigger: item,
            start: 'top 80%',
            toggleActions: 'play none none none',
            // markers: true, // Uncomment for debugging
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'easeOut',
    });
});
