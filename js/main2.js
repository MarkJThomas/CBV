// File: js/main.js

// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    // -------------------
    // Existing Variables
    // -------------------
    const locationSection = document.getElementById('location-section');
    const burger = document.querySelector('.burger');
    const navLinks = document.querySelector('.overlay-nav-links');
    const textSection = document.getElementById('text-section');
    const imageGallerySection = document.getElementById('image-gallery-section');

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
    // Intersection Observer for Sections
    // -------------------

    // Function to handle Intersection Observer for sections
    function handleSectionIntersection(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add 'visible' class to trigger CSS transitions
                entry.target.classList.add('visible');

                // If the target has an SVG with .additional-image, add .zoom-in
                const img = entry.target.querySelector('.additional-image');
                if (img) {
                    img.classList.add('zoom-in');
                }

                // Optionally, remove the observer after triggering
                observer.unobserve(entry.target);
            }
        });
    }

    // Define Intersection Observer options
    const sectionObserverOptions = {
        root: null,                // Uses the viewport as the container
        rootMargin: '0px',         // No margin around the root
        threshold: 0.3             // Trigger when 30% of the section is visible
    };

    // Create the Intersection Observer for sections
    const sectionObserver = new IntersectionObserver(handleSectionIntersection, sectionObserverOptions);

    // Start observing the sections if they exist
    const sections = [locationSection, textSection];
    sections.forEach(section => {
        if (section) {
            sectionObserver.observe(section);
        }
    });

     // -------------------
    // GSAP Animations
    // -------------------
    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // Reduced motion: Set elements to their final state
        const galleryItems = document.querySelectorAll('.gallery-item');
        // Images remain hidden
        gsap.set(galleryItems, { opacity: 0, scale: 1 });
        // Text is visible
        gsap.set('.concluding-text', { opacity: 1, y: 0 });
    } else {
        // Select all lanes
        const lanes = document.querySelectorAll('.lane');

        // Define the desired animation sequence explicitly
        const animationSequence = [
            { lane: 0, image: 0 }, // Lane 1, Image 1
            { lane: 2, image: 0 }, // Lane 3, Image 1
            { lane: 1, image: 0 }, // Lane 2, Image 1
            { lane: 0, image: 1 }, // Lane 1, Image 2
            { lane: 2, image: 1 }, // Lane 3, Image 2
            { lane: 1, image: 1 }, // Lane 2, Image 2
        ];

        // Create a GSAP timeline
        const galleryTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: imageGallerySection,
                start: 'top top',    // Start when top of section hits top of viewport
                end: 'bottom top',   // End when bottom of section hits top of viewport
                scrub: true,         // Smoothly scrubs the animation progress
                pin: true,           // Pin the section during the scroll
                markers: false,      // Set to true for debugging
                anticipatePin: 1,    // Smooth pinning
            }
        });

        // Initialize cumulative delay
        let cumulativeDelay = 0;

        const delayBetweenAnimations = 0.4; // seconds

        // Iterate through the animation sequence to animate images in the desired order
        animationSequence.forEach((item, index) => {
            const currentLane = lanes[item.lane];
            const currentImage = currentLane.querySelectorAll('.gallery-item')[item.image];

            galleryTimeline.fromTo(currentImage, 
                {
                    scale: 0.2,
                    opacity: 0
                },
                {
                    scale: 5,
                    opacity: 1,
                    duration: 1,
                    ease: 'power2.out',
                    onStart: () => {
                        currentImage.style.zIndex = 2; // Bring to front
                    },
                    onComplete: () => {
                        // Fade out after scaling
                        gsap.to(currentImage, {
                            opacity: 0,
                            duration: 0.2,
                            ease: 'power2.in',
                            onComplete: () => {
                                currentImage.style.zIndex = 1; // Reset z-index
                            }
                        });
                    }
                },
                `+=${cumulativeDelay}` // Apply cumulative delay
            );

            // Increment cumulativeDelay for next image
            cumulativeDelay = delayBetweenAnimations;
        });
// Add Concluding Text Animation
galleryTimeline.to('.concluding-text', {
    opacity: 1,
    scale: 1,
    duration: 1,
    ease: 'power2.out',
}, '+=0.5'); // Delay before concluding text appears
// Add Final Images Animation after Concluding Text
galleryTimeline.to('.final-images', {
    opacity: 1,
    y: 0,
    duration: 1,
    ease: 'power2.out',
}, '+=0.5'); // Delay after concluding text fades in

// Initially hide the concluding text
gsap.set('.concluding-text', { opacity: 0, scale: 0.8, y: 50 });
}

// =======================================================
// 1. Define Constants for Zoom Levels and Target Coordinates
// =======================================================

const INITIAL_ZOOM_LEVEL = 6; // Initial zoom level when the map is first loaded
const TARGET_ZOOM_LEVEL = 12;  // Zoom level after zooming
const TARGET_LATLNG = [-13.174972, -71.587117]; // Coordinates to zoom into (Wayqecha Biological Station)

// =======================================================
// 2. Initialize the Leaflet Map
// =======================================================

const map = L.map('interactive-map', {
    center: TARGET_LATLNG,      // Set initial center
    zoom: INITIAL_ZOOM_LEVEL,   // Set initial zoom level
    zoomControl: false,         // Disable default zoom controls
    dragging: false,            // Disable map dragging initially
    scrollWheelZoom: false,     // Disable scroll wheel zoom initially
    doubleClickZoom: false,     // Disable double-click zoom initially
    touchZoom: false,           // Disable touch zoom initially
    boxZoom: false,             // Disable box zoom initially
    keyboard: false             // Disable keyboard controls initially
}).setView(TARGET_LATLNG, INITIAL_ZOOM_LEVEL);

// =======================================================
// 3. Add Tile Layer to the Map
// =======================================================

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/' +
    'World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri &mdash; Source: Esri, i-cubed, USDA, USGS, ' +
                     'AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
}).addTo(map);

map.on('load', () => {
    console.log('Map fully loaded. Refreshing ScrollTrigger.');
    ScrollTrigger.refresh();
});

// =======================================================
// 4. Define Styles for GeoJSON Layers
// =======================================================

// Style function for wq.geojson layer
function styleWQ(feature) {
    return {
        color: "#1f78b4",        // Border color (steel blue)
        weight: 2,               // Border thickness
        opacity: 1,              // Border opacity
        fillColor: "#a6cee3",    // Fill color (light steel blue)
        fillOpacity: 0.5         // Fill opacity
    };
}

// Style function for manu.geojson layer
function styleManu(feature) {
    return {
        color: "#33a02c",        // Border color (forest green)
        weight: 2,               // Border thickness
        opacity: 1,              // Border opacity
        fillColor: "#b2df8a",    // Fill color (light green)
        fillOpacity: 0.5         // Fill opacity
    };
}

// =======================================================
// 5. Function to Fly to a Specified Location with Offset
// =======================================================

/**
 * Fly the map to a specified LatLng with a given zoom and offset.
 * @param {Object} map - Leaflet map instance.
 * @param {Object} latlng - Leaflet LatLng object where the marker is located.
 * @param {number} zoom - Target zoom level.
 * @param {Object} offset - Offset ratios (x: 0 to 1, y: 0 to 1).
 */
function flyToWithOffset(map, latlng, zoom, offset) {
    const mapSize = map.getSize(); // Get map dimensions in pixels

    // Desired marker position in pixels (e.g., 25% from the left, 50% vertically)
    const targetPoint = L.point(mapSize.x * offset.x, mapSize.y * offset.y);

    // Current marker position in pixels
    const markerPoint = map.latLngToContainerPoint(latlng);

    // Calculate the new center point in pixels
    const newCenterPoint = targetPoint.subtract(markerPoint.subtract(mapSize.divideBy(2)));

    // Convert the new center point back to LatLng
    const newCenterLatLng = map.containerPointToLatLng(newCenterPoint);

    // Fly to the new center with animation
    map.flyTo(newCenterLatLng, zoom, {
        duration: 1.5 // Duration of animation in seconds
    });

    // Add a listener for when the flyTo animation ends
    map.once('moveend', () => {
        console.log('flyToWithOffset completed. Now initiating pan.');
        panMap();
    });
}

// =======================================================
// 6. Initialize GeoJSON Layers
// =======================================================

const wqLayer = L.geoJSON(null, {  // Initially no data
    style: styleWQ,              // Apply wq style
    onEachFeature: onEachFeature // Interaction handler
});

const manuLayer = L.geoJSON(null, { // Initially no data
    style: styleManu,             // Apply manu style
    onEachFeature: onEachFeature  // Interaction handler
});

// =======================================================
// 7. Load GeoJSON Data into Layers
// =======================================================

function loadGeoJSON(url, layer) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            layer.addData(data);
            console.log(`GeoJSON data loaded from ${url}`);
        })
        .catch(error => console.error(`Error loading GeoJSON from ${url}:`, error));
}

// Load both GeoJSON layers
loadGeoJSON('geo/wq.geojson', wqLayer);     // Ensure the path is correct
loadGeoJSON('geo/manu.geojson', manuLayer); // Ensure the path is correct

// =======================================================
// 8. Define Interaction Handler for GeoJSON Features
// =======================================================

function onEachFeature(feature, layer) {
    if (feature.properties && feature.properties.name) {
        layer.on('click', function(e) {
            // Show a popup with the area's name and description
            const popupContent = `
                <strong>${feature.properties.name}</strong><br/>
                ${feature.properties.description}
            `;
            layer.bindPopup(popupContent).openPopup();

            // Optional: Show side panel with more info
            showMarkerInfoPanel(feature.properties);
        });
    }
}

// =======================================================
// 9. Create Custom Leaflet Control for Map Title
// =======================================================

const mapTitleControl = L.Control.extend({
    options: {
        position: 'topleft' // Position can be 'topleft', 'topright', 'bottomleft', 'bottomright'
    },

    onAdd: function (map) {
        // Create a div element for the title
        const container = L.DomUtil.create('div', 'leaflet-control-map-title');
        container.innerHTML = '<h1>Location</h1>';

        // Prevent map interactions when clicking the title
        L.DomEvent.disableClickPropagation(container);

        return container;
    }
});

// Add the custom title control to the map
map.addControl(new mapTitleControl());

// =======================================================
// 10. Add Title Marker to the Map
// =======================================================

// Define the coordinates where you want to place the title label
const titleCoordinates = [-12.013, -77.029]; // Example: Lima, Peru

// Create a DivIcon for the title
const titleIcon = L.divIcon({
    className: 'map-title-label', // Reference to your CSS class
    html: '<div>Lima</div>',      // HTML content for the label
    iconSize: [200, 30],          // Adjust size as needed
    iconAnchor: [100, 30],        // Adjust anchor point (centered)
    popupAnchor: [0, -30]         // Optional: position popup relative to icon
});

// Add the title marker to the map
const titleMarker = L.marker(titleCoordinates, { icon: titleIcon, interactive: false }).addTo(map);

// =======================================================
// 11. Hide the Side Panel Initially Using GSAP
// =======================================================

gsap.set('#side-panel', { xPercent: 100 }); // Hide side panel off-screen to the right
gsap.set('.final-images', { opacity: 0, y: 20 }); // Initially hide the final images

// =======================================================
// 12. Function to Pan the Map After FlyTo Completes
// =======================================================

/**
 * Pan the map by a specified offset after the flyTo animation completes.
 */
function panMap() {
    if (panTriggered) return;
    panTriggered = true;

    console.log('Pan initiated.');

    const panOffset = L.point(300, 0); // Adjust pixels as needed (300px to the right)

    map.panBy(panOffset, { animate: true, duration: 1 });

    // Listen for panend event to reveal the side panel
    map.once('moveend', () => {
        console.log('Pan completed. Side panel will be revealed.');
        revealSidePanel();
    });
}

// =======================================================
// 13. Function to Reveal the Side Panel
// =======================================================

/**
 * Reveal the side panel with GSAP animation.
 */
function revealSidePanel() {
    if (zoomInfoPanelShown) return;
    zoomInfoPanelShown = true;

    gsap.to('#info-panel', { xPercent: 0, duration: 0.5, ease: 'power1.out' });
    console.log('Side panel revealed.');
}

// =======================================================
// 14. Define Functions to Show and Hide the Side Panel
// =======================================================

/**
 * Show the information panel with provided content.
 * @param {string} content - HTML content to display inside the info panel.
 */
function showInfoPanel(content) {
    const infoPanel = document.getElementById('info-panel');
    infoPanel.classList.add('visible'); // Assuming CSS handles the 'visible' class

    // Insert the content into the info panel
    infoPanel.querySelector('.info-content').innerHTML = content;

    // Animate the panel into view using GSAP
    gsap.to('#info-panel', { x: 0, opacity: 1, duration: 0.5, ease: 'power1.out' });
}

/**
 * Hide the information panel.
 */
function hideInfoPanel() {
    const panel = document.getElementById('info-panel');

    // Animate the panel out of view using GSAP
    gsap.to('#info-panel', { 
        x: 300, 
        opacity: 0, 
        duration: 1, 
        ease: 'power2.in', 
        onComplete: () => {
            panel.classList.remove('visible');
            panel.querySelector('.info-content').innerHTML = ''; // Clear content
        }
    });

    // Reset marker icon if any is selected (if applicable)
    if (currentSelectedLayer) {
        currentSelectedLayer.setIcon(customMarkerIcon);
        currentSelectedLayer = null;
    }
}

/**
 * Show the zoom information in the side panel.
 */
function showZoomInfoPanel() {
    const content = `
        <h2 id="info-title">Wayqecha Biological Station</h2>
        <p>The Wayqecha Biological Station is a premier research facility located in the heart of the Andes. It serves as a hub for scientific studies and environmental conservation efforts.</p>
        <img src="images/wayqecha_station.jpg" alt="Wayqecha Biological Station" style="width: 100%; height: auto;"/>
        <a href="https://example.com/wayqecha" target="_blank">Learn More</a>
    `;
    showInfoPanel(content);
}

/**
 * Show marker-specific content in the side panel.
 * @param {Object} properties - Properties of the clicked GeoJSON feature.
 */
function showMarkerInfoPanel(properties) {
    const content = `
        <h2 id="info-title">${properties.name}</h2>
        <p>${properties.description}</p>
        ${properties.image ? `<img src="${properties.image}" alt="${properties.name}" style="width: 100%; height: auto;"/>` : ''}
        ${properties.more_info ? `<a href="${properties.more_info}" target="_blank">Learn More</a>` : ''}
    `;
    showInfoPanel(content);
}

// =======================================================
// 15. Event Listener for Closing the Side Panel
// =======================================================

document.getElementById('close-panel').addEventListener('click', hideInfoPanel);

// =======================================================
// 16. Function to Toggle GeoJSON Layers Based on Zoom Level
// =======================================================

let zoomInfoPanelShown = false;    // Flag to check if zoom info panel is shown
let currentSelectedLayer = null;   // Currently selected GeoJSON layer

/**
 * Toggle GeoJSON layers based on the current zoom level of the map.
 */
function toggleGeoJSONLayers() {
    const currentZoom = map.getZoom();
    console.log('Current Zoom:', currentZoom); // For debugging

    if (currentZoom >= 10) {
        // Add layers if not already added
        if (!map.hasLayer(wqLayer)) {
            map.addLayer(wqLayer);
            console.log('wqLayer added');
        }
        if (!map.hasLayer(manuLayer)) {
            map.addLayer(manuLayer);
            console.log('manuLayer added');
        }
        // Show side panel upon zoom in
        if (!zoomInfoPanelShown) { 
            showZoomInfoPanel();
            zoomInfoPanelShown = true;
        }
    } else {
        // Remove layers if they are present
        if (map.hasLayer(wqLayer)) {
            map.removeLayer(wqLayer);
            console.log('wqLayer removed');
        }
        if (map.hasLayer(manuLayer)) {
            map.removeLayer(manuLayer);
            console.log('manuLayer removed');
        }
        // Hide the side panel if it was shown due to zoom
        if (zoomInfoPanelShown) {
            hideInfoPanel();
            zoomInfoPanelShown = false;
        }
    }
}

// =======================================================
// 17. Initialize GeoJSON Layer Toggle and Listen to Zoom Changes
// =======================================================

// Initial toggle based on the default zoom level
toggleGeoJSONLayers();

// Listen to zoom changes to toggle layers accordingly
map.on('zoomend', toggleGeoJSONLayers);

// =======================================================
// 18. Register and Initialize GSAP ScrollTrigger for Pinning
// =======================================================

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
// Refresh ScrollTrigger after the map is rendered
ScrollTrigger.refresh();
// Create ScrollTrigger to pin the #map-section when it enters the viewport
ScrollTrigger.create({
    id: 'map-pin',
    trigger: '#map-section',
    start: 'top top',
    end: 'bottom bottom',
    pin: true,
    markers: true, // Enable markers for debugging
    onEnter: () => {
        console.log('Entered map section');
        document.getElementById('zoom-button').classList.add('visible');
        document.getElementById('zoom-button').classList.remove('hidden');
    },
    onLeave: () => {
        console.log('Left map section');
        document.getElementById('zoom-button').classList.add('hidden');
        document.getElementById('zoom-button').classList.remove('visible');
    }
});
// =======================================================
// 19. Add Event Listener to the Zoom Button
// =======================================================

document.getElementById('zoom-button').addEventListener('click', () => {
    const zoomButton = document.getElementById('zoom-button');

    console.log('Zoom button clicked. Initiating flyToWithOffset.');

    // Disable the button to prevent multiple clicks
    zoomButton.disabled = true;
    zoomButton.innerText = 'Zooming...';

    // Initiate flying to the target location with offset
    flyToWithOffset(map, L.latLng(-13.174972, -71.587117), TARGET_ZOOM_LEVEL, { x: 0.25, y: 0.5 });

    // After the flyTo and pan animations are complete, re-enable the button and unpin ScrollTrigger to allow scrolling
    setTimeout(() => {
        // Re-enable the button
        zoomButton.disabled = false;
        zoomButton.innerText = 'Zoom to Wayqecha';

        // Unpin the map section to allow scrolling to the next section
        ScrollTrigger.getById('map-pin').kill();
        console.log('ScrollTrigger pin removed. User can scroll to the next section.');

        // Optional: Smooth scroll to the next section (requires ScrollToPlugin)
        gsap.to(window, { 
            scrollTo: '#next-section', 
            duration: 1, 
            ease: 'power1.out' 
        });
    }, 3500); // 1.5s flyTo + 1s pan + 1s buffer = 3.5s total
});
    

});