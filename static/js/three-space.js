import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createEarthMoon } from './earth-moon.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500000);
const renderer = new THREE.WebGLRenderer();

function init() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    const rendererDomElement = renderer.domElement;

    const controls = new OrbitControls(camera, rendererDomElement);

    renderer.domElement.addEventListener('wheel', (event) => {
        event.preventDefault();
        event.stopPropagation();
    }, {passive: false}); // Use { passive: false } to ensure preventDefault works


    camera.position.z = 15000;
    const earthMoon = createEarthMoon(scene);
}

init();

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();