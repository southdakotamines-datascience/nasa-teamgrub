import * as THREE from 'three';

let lastMoonOrbitLine = null;
let lastEarthOrbitLine = null;

export function createEarthMoon(scene) {
    const textureLoader = new THREE.TextureLoader();
    const geometry = new THREE.SphereGeometry(6357, 64, 64);
    // use a jpg for the earth texture
    const earthTexture = textureLoader.load('static/textures/8k_earth_daymap.jpg');
    // const earthNormalMap = textureLoader.load('static/textures/8k_earth_normal_map.tif');
    // const material = new THREE.MeshStandardMaterial({ map: earthTexture, normalMap: earthNormalMap });
    const material = new THREE.MeshBasicMaterial({ map: earthTexture });
    const earth = new THREE.Mesh(geometry, material);
    // set heliocentric position
    earth.position.set(149597870.7, 0, 0); // 1 AU in km
    // rotate the sphere to match Earth's axial tilt
    earth.rotation.y = THREE.MathUtils.degToRad(23.44);
    scene.add(earth);

    const moonGeometry = new THREE.SphereGeometry(1737, 32, 32);
    const moonTexture = textureLoader.load('static/textures/8k_moon.jpg');
    const moonMaterial = new THREE.MeshBasicMaterial({ map: moonTexture });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(149597870.7+384400, 0, 0); // Average distance from Earth to Moon in km
    scene.add(moon);

    return { earth: earth, moon: moon };
}

export function updateMoonOrbit(moon, time = new Date()) {
    // const moonPos = getGeocentricMoonPositionAtTime(time);
    const moonPos = getHeliocentricMoonPositionAtTime(time);
    moon.position.copy(moonPos);
}

export function updateEarthOrbit(earth, time = new Date()) {
    const earthPos = getHeliocentricEarthPositionAtTime(time);
    earth.position.copy(earthPos);
}

function getHeliocentricEarthPositionAtTime(time) {
    const atime = Astronomy.MakeTime(time);
    const earthHelio = Astronomy.HelioVector(Astronomy.Body.Earth, atime);
    const AU_TO_KM = 149597870.7; // km per astronomical unit
    const earthX = earthHelio.x * AU_TO_KM;
    const earthY = earthHelio.y * AU_TO_KM;
    const earthZ = earthHelio.z * AU_TO_KM;
    return new THREE.Vector3(earthX, earthY, earthZ);
}


function getHeliocentricMoonPositionAtTime(time) {
    const earthPos = getHeliocentricEarthPositionAtTime(time);
    const moonPos = getGeocentricMoonPositionAtTime(time);
    return new THREE.Vector3().addVectors(earthPos, moonPos);
}

function getGeocentricMoonPositionAtTime(time) {
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

function getGeocentricSunPositionAtTime(time) {
    const atime = Astronomy.MakeTime(time);
    const sunGeo = Astronomy.GeoVector(Astronomy.Body.Sun, atime, true); // true = center on Earth
    const AU_TO_KM = 149597870.7; // km per astronomical unit
    const sunX = sunGeo.x * AU_TO_KM;
    const sunY = sunGeo.y * AU_TO_KM;
    const sunZ = sunGeo.z * AU_TO_KM;
    return new THREE.Vector3(sunX, sunY, sunZ);
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
        const moonPos = getHeliocentricMoonPositionAtTime(time);
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

export function showEarthOrbit(scene, earth, date) {
    if (lastEarthOrbitLine) {
        scene.remove(lastEarthOrbitLine);
        lastEarthOrbitLine.geometry.dispose();
        lastEarthOrbitLine.material.dispose();
        lastEarthOrbitLine = null;
    }
    // First find a bunch of points along the orbit
    const points = [];
    const colors = [];
    const numPoints = 10000;
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        // use the slider range for the range of times
        // make it show only the last year
        const monthAgo = new Date(date.getTime() - 366 * 24 * 60 * 60 * 1000);
        const time = new Date(monthAgo.getTime() + t * (date.getTime() - monthAgo.getTime()));
        const earthPos = getHeliocentricEarthPositionAtTime(time);
        points.push(new THREE.Vector3(earthPos.x, earthPos.y, earthPos.z));
        // invert the alpha so the orbit fades out at the far end
        // const alpha = t;
        colors.push(0, 0, 1, 1);
    }
    // Create a geometry from the points
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
    orbitGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    const orbitMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
    });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    lastEarthOrbitLine = orbitLine;
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

export function createSunSphere(scene) {
    const textureLoader = new THREE.TextureLoader();
    const sunGeometry = new THREE.SphereGeometry(696340, 64, 64); // Sun radius in km
    // const sunTexture = textureLoader.load('static/textures/8k_sun.jpg');
    // const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 0, 0); // Heliocentric position
    scene.add(sun);
    return sun;
}

export function updateSunPositionGeocentric(sun, time = new Date()) {
    const sunPos = getGeocentricSunPositionAtTime(time);
    sun.position.copy(sunPos);
}