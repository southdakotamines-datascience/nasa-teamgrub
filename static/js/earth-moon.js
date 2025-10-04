import * as THREE from "three";

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