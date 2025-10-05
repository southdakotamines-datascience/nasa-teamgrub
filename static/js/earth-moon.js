import * as THREE from 'three';

let lastMoonOrbitLine = null;

export function createEarthMoon(scene) {
    const textureLoader = new THREE.TextureLoader();
    const geometry = new THREE.SphereGeometry(6357, 64, 64);
    // use a jpg for the earth texture
    const earthTexture = textureLoader.load('static/textures/8k_earth_daymap.jpg');
    // const earthNormalMap = textureLoader.load('static/textures/8k_earth_normal_map.tif');
    // const material = new THREE.MeshStandardMaterial({ map: earthTexture, normalMap: earthNormalMap });
    const material = new THREE.MeshBasicMaterial({ map: earthTexture });
    const sphere = new THREE.Mesh(geometry, material);
    // rotate the sphere to match Earth's axial tilt
    sphere.rotation.y = THREE.MathUtils.degToRad(23.44);
    scene.add(sphere);

    const moonGeometry = new THREE.SphereGeometry(1737, 32, 32);
    const moonTexture = textureLoader.load('static/textures/8k_moon.jpg');
    const moonMaterial = new THREE.MeshBasicMaterial({ map: moonTexture });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(384400, 0, 0); // Average distance from Earth to Moon in km
    scene.add(moon);

    return { earth: sphere, moon: moon };
}

export function updateMoonOrbit(moon, time = new Date()) {
    const moonPos = getMoonPositionAtTime(time);
    moon.position.copy(moonPos);
}

function getMoonPositionAtTime(time) {
    const atime = Astronomy.MakeTime(time);
    const moonGeo = Astronomy.GeoVector(Astronomy.Body.Moon, atime, true); // true = center on Earth
    const AU_TO_KM = 149597870.7; // km per astronomical unit
    const moonX = moonGeo.x * AU_TO_KM;
    const moonY = moonGeo.y * AU_TO_KM;
    const moonZ = moonGeo.z * AU_TO_KM;
    const moonVector = new THREE.Vector3(moonX, moonY, moonZ);
    // rotate the moon vector to make it closer to the ecliptic plane visually
    const axialTilt = THREE.MathUtils.degToRad(23.44);
    const rotationMatrix = new THREE.Matrix4().makeRotationX(axialTilt);
    moonVector.applyMatrix4(rotationMatrix);
    return moonVector;
}

export function showMoonOrbit(scene, moon, date) {
    if (lastMoonOrbitLine) {
        scene.remove(lastMoonOrbitLine);
        lastMoonOrbitLine.geometry.dispose();
        lastMoonOrbitLine.material.dispose();
        lastMoonOrbitLine = null;
    }
    // First find a bunch of points along the orbit
    const points = [];
    const colors = [];
    const numPoints = 10000;
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        // use the slider range for the range of times
        // make it show only the last month of the orbit
        const monthAgo = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
        const time = new Date(monthAgo.getTime() + t * (date.getTime() - monthAgo.getTime()));
        const moonPos = getMoonPositionAtTime(time);
        points.push(new THREE.Vector3(moonPos.x, moonPos.y, moonPos.z));
        // invert the alpha so the orbit fades out at the far end
        const alpha = t;
        colors.push(1, 1, 1, alpha);
    }
    // Create a geometry from the points
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
    orbitGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    const orbitMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
    });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    lastMoonOrbitLine = orbitLine;
    scene.add(orbitLine);
}

export function addSunLight(scene) {
    const sunLight = new THREE.PointLight(0xffffff, 0.5);
    sunLight.position.set(150000000, 0, 0); // Approximate distance to Sun in km
    scene.add(sunLight);
    const ambientLight = new THREE.AmbientLight(0x222222); // Dim ambient light
    scene.add(ambientLight);
    return sunLight;
}