import * as THREE from "three";

let meteorPathLine = null;
let meteorPositionSphere = null;
export function drawMeteorPath(scene, struct) {
    if (!struct || !struct.positions || struct.positions.length < 2) return;
    if (meteorPathLine) {
        scene.remove(meteorPathLine);
        meteorPathLine.geometry.dispose();
        meteorPathLine.material.dispose();
        meteorPathLine = null;
    }

    const positions = struct.positions;
    const points = positions.map(pos => {
        const { x, y, z } = pos.geocentric_position_km;
        return new THREE.Vector3(x, y, z);
    });

    if (!points) return;
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const line = new THREE.Line(geometry, material);
    meteorPathLine = line;
    scene.add(line);
}

export function drawMeteorPosition(scene, date, struct) {
    if (!struct || struct.positions.length === 0) return;
    if (meteorPositionSphere) {
        scene.remove(meteorPositionSphere);
        meteorPositionSphere.geometry.dispose();
        meteorPositionSphere.material.dispose();
        meteorPositionSphere = null;
    }
    const positions = struct.positions;
    // Find the position closest to the given date
    const targetTime = new Date(date).getTime();
    let closestPosition = positions[0];
    let closestTimeDiff = Math.abs(closestPosition.timestamp - targetTime)
    for (const pos of positions) {
        const timeDiff = Math.abs(pos.timestamp - targetTime);
        if (timeDiff < closestTimeDiff) {
            closestPosition = pos;
            closestTimeDiff = timeDiff;
        }
    }
    // create a huge sphere at that position
    const { x, y, z } = closestPosition.geocentric_position_km;
    const geometry = new THREE.SphereGeometry(500000, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    meteorPositionSphere = sphere;
    scene.add(sphere);
    return sphere
}