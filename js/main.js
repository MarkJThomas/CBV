// main.js

document.addEventListener('DOMContentLoaded', () => {

    // -------------------
    // Existing Variables
    // -------------------
    const locationSection = document.getElementById('location-section');
    const burger = document.querySelector('.burger');
    const navLinks = document.querySelector('.overlay-nav-links');
    const textSection = document.getElementById('text-section');
    const imageGallerySection = document.getElementById('image-gallery-section');
    const imageSection = document.getElementById('image-section');

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
    const sections = [locationSection, textSection, imageSection];
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
        // Remove horizontal scrolling panels
        // -------------------
        // Photo Sphere Viewer Initialization
        // -------------------
    
        // Remove code related to the map-section

        
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
    
        const delayBetweenAnimations = 0.8; // seconds
    
        // Iterate through the animation sequence to animate images in the desired order
        animationSequence.forEach((item, index) => {
            const currentLane = lanes[item.lane];
            const currentImage = currentLane.querySelectorAll('.gallery-item')[item.image];
    
            galleryTimeline.fromTo(currentImage, 
                {
                    scale: 0.1,
                    opacity: 0
                },
                {
                    scale: 4,
                    opacity: 1,
                    duration: 8,
                    ease: 'power2.out',
                    onStart: () => {
                        currentImage.style.zIndex = 2; // Bring to front
                    },
                    onComplete: () => {
                        // Fade out after scaling
                        gsap.to(currentImage, {
                            opacity: 0,
                            duration: 0.5,
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
            duration: 3,
            ease: 'power2.out',
        }, '+=5.5'); // Delay before concluding text appears
    
        // Initially hide the concluding text
        gsap.set('.concluding-text', { opacity: 0, y: +50 });

        // Add animation for final images
        galleryTimeline.to('.final-images', {
            opacity: 1,
            duration: 1,
            ease: 'power2.out',
            transform: 'translateY(0)',
        }, '+=0.5'); // Delay before final images appear

        // Set initial scale and opacity for the conclusion container
        gsap.set('.conclusion-container', { opacity: 0, scale: 0 });

        // Modify the timeline to animate the conclusion container
        galleryTimeline.to('.conclusion-container', {
            opacity: 1,
            scale: 1,
            duration: 3,
            ease: 'power2.out',
        }, '+=5.5'); // Start immediately after previous animation
    }

    // Initialize the Photo Sphere Viewer when the panorama section enters the viewport
    ScrollTrigger.create({
        trigger: '#panorama-section',
        start: 'top center',
        onEnter: () => {
            console.log('Panorama section entered');
            const viewer = new PhotoSphereViewer({
                panorama: 'images/PANO_LunchArea.jpg',
                container: 'panorama-viewer',
                navbar: true,
                loadingImg: 'images/loading.gif', // Optional loading image
            });
        },
        pin: true, // Pin the panorama section
        once: true, // Initialize only once
    });
    // Animate the additional image section when it enters the viewport
gsap.registerPlugin(ScrollTrigger);

gsap.fromTo(
    ".additional-image-section",
    { opacity: 0, scale: 0.95 }, // Initial state
    {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".additional-image-section",
            start: "top center", // Start animation when the section reaches the center of the viewport
            toggleActions: "play none none reverse", // Play animation on enter, reverse on leave
        },
    }
    
);
});
