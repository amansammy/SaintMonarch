// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas'), alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// Load environment map for reflections
const cubeTextureLoader = new THREE.CubeTextureLoader();
const envMap = cubeTextureLoader.load([
    'https://threejs.org/examples/textures/cube/Bridge2/posx.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/negx.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/posy.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/negy.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/posz.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/negz.jpg'
]);

// Material configurations
const materials = {
    glass: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.1,
        transparent: true,
        transmission: 0.9,
        opacity: 0.8,
        reflectivity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        envMap: envMap,
        envMapIntensity: 1.0
    }),
    plastic: new THREE.MeshPhysicalMaterial({
        color: 0xff0000,
        metalness: 0,
        roughness: 0.3,
        envMap: envMap,
        envMapIntensity: 0.6
    }),
    gold: new THREE.MeshPhysicalMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.2,
        reflectivity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        envMap: envMap,
        envMapIntensity: 1.0
    }),
    wood: new THREE.MeshPhysicalMaterial({
        color: 0x8B4513,
        metalness: 0,
        roughness: 0.7,
        envMap: envMap,
        envMapIntensity: 0.3
    }),
    silver: new THREE.MeshPhysicalMaterial({
        color: 0xcccccc,
        metalness: 0.9,
        roughness: 0.1,
        reflectivity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        envMap: envMap,
        envMapIntensity: 1.0
    })
};

// Particle color map
const particleColors = {
    cyan: 0x00ffff,
    red: 0xff0000,
    yellow: 0xffff00,
    green: 0x00ff00,
    white: 0xffffff
};

// Load the STL file
let model;
let particleMaterial;
const loader = new THREE.STLLoader();
loader.load(
    '/static/models/logo.stl',
    (geometry) => {
        console.log('STL file loaded successfully');
        model = new THREE.Mesh(geometry, materials.glass);
        scene.add(model);

        // Center and scale the model
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        const center = box.getCenter(new THREE.Vector3());
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const initialScale = 20 / maxDim;
        model.scale.set(initialScale, initialScale, initialScale);
        model.position.sub(center.multiplyScalar(initialScale));

        model.userData.initialScale = initialScale;
        camera.position.z = 50;
        console.log('Initial scale:', initialScale, 'Max dimension:', maxDim);

        // Add particle system
        const particleCount = 200;
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const originalPositions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i += 3) {
            const radius = 5 + Math.random() * 5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            positions[i] = x;
            positions[i + 1] = y;
            positions[i + 2] = z;
            originalPositions[i] = x;
            originalPositions[i + 1] = y;
            originalPositions[i + 2] = z;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleMaterial = new THREE.PointsMaterial({
            color: particleColors.cyan,
            size: 0.2,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(particlesGeometry, particleMaterial);
        particles.position.copy(model.position);
        scene.add(particles);
        model.userData.particles = particles;
        model.userData.originalParticlePositions = originalPositions;
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('Error loading STL file:', error);
    }
);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Handle menu toggle
const menuIcon = document.querySelector('.menu-icon');
const materialMenu = document.getElementById('material-menu');
menuIcon.addEventListener('click', () => {
    materialMenu.classList.toggle('active');
    console.log('Menu toggled:', materialMenu.classList.contains('active') ? 'Shown' : 'Hidden');
});

// Handle material selection
document.querySelectorAll('input[name="material"]').forEach((input) => {
    input.addEventListener('change', (event) => {
        if (model && materials[event.target.value]) {
            model.material = materials[event.target.value];
            console.log('Material changed to:', event.target.value);
        }
    });
});

// Handle particle visibility toggle
const showParticlesCheckbox = document.getElementById('show-particles');
showParticlesCheckbox.addEventListener('change', (event) => {
    if (model && model.userData.particles) {
        if (!event.target.checked) {
            particleMaterial.opacity = 0;
        }
        console.log('Particles visibility:', event.target.checked ? 'Scroll-based' : 'Hidden');
    }
});

// Handle particle color selection
document.querySelectorAll('input[name="particle-color"]').forEach((input) => {
    input.addEventListener('change', (event) => {
        if (model && model.userData.particles && particleColors[event.target.value]) {
            particleMaterial.color.setHex(particleColors[event.target.value]);
            console.log('Particle color changed to:', event.target.value);
        }
    });
});

// Handle scroll to zoom, tilt, spin, particles, and background gradient
window.addEventListener('scroll', () => {
    if (!model) return;

    const scrollY = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollFraction = scrollY / documentHeight;

    // Zoom: Adjust model scale
    const minScaleFactor = 1.0;
    const maxScaleFactor = 3.0;
    const scaleFactor = minScaleFactor + (maxScaleFactor - minScaleFactor) * scrollFraction;
    const baseScale = model.userData.initialScale || 1;
    const newScale = baseScale * scaleFactor;
    model.scale.set(newScale, newScale, newScale);

    // Tilt: Slight rotation on X and Z axes
    const maxTilt = Math.PI / 8;
    model.rotation.x = maxTilt * scrollFraction;
    model.rotation.z = maxTilt * scrollFraction * 0.5;

    // Spin: Rotation on Y axis based on scroll
    const maxSpin = Math.PI * 2;
    model.rotation.y = maxSpin * scrollFraction;

    // Particle animation: Spread and fade in/out on scroll
    if (model.userData.particles && model.userData.originalParticlePositions) {
        const particles = model.userData.particles;
        const originalPositions = model.userData.originalParticlePositions;
        const particleSpread = 1 + scrollFraction * 2;
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] = originalPositions[i] * particleSpread;
            positions[i + 1] = originalPositions[i + 1] * particleSpread;
            positions[i + 2] = originalPositions[i + 2] * particleSpread;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // Fade particles based on scroll (only if checkbox is checked)
        if (showParticlesCheckbox.checked) {
            particleMaterial.opacity = scrollFraction;
        } else {
            particleMaterial.opacity = 0;
        }
    }

    // Dynamic background gradient
    document.body.style.background = `linear-gradient(to bottom, rgb(20, 20, ${50 + scrollFraction * 50}), rgb(${100 - scrollFraction * 80}, 20, 20))`;

    // Debug: Log scale, rotation, gradient, and particle opacity
    console.log('Scroll fraction:', scrollFraction, 'Scale:', newScale, 'Scale factor:', scaleFactor, 'Spin (radians):', model.rotation.y, 'Gradient:', document.body.style.background, 'Particle opacity:', particleMaterial ? particleMaterial.opacity : 'N/A');
});