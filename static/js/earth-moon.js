import * as THREE from 'three';

let lastMoonOrbitLine = null;

export function createEarthMoon(scene) {
    const geometry = new THREE.SphereGeometry(6357, 64, 64);
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const moonGeometry = new THREE.SphereGeometry(1737, 32, 32);
    const moonMaterial = new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true });
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
    return new THREE.Vector3(moonX, moonY, moonZ);
}

export function showMoonOrbit(scene, moon, minDate, maxDate) {
    if (lastMoonOrbitLine) {
        scene.remove(lastMoonOrbitLine);
        lastMoonOrbitLine.geometry.dispose();
        lastMoonOrbitLine.material.dispose();
        lastMoonOrbitLine = null;
    }
    // First find a bunch of points along the orbit
    const points = [];
    const colors = [];
    const numPoints = 1000;
    const startTime = new Date();
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        // use the slider range for the range of times

        const time = new Date(minDate.getTime() + t * (maxDate.getTime() - minDate.getTime()));
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