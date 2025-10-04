import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {createEarthMoon, showMoonOrbit, updateMoonOrbit} from './earth-moon.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500000000);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);
const earthMoon = createEarthMoon(scene);
const sliderMinDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // one month ago
const sliderMaxDate = new Date(); // Now
const sliderMin = 0
const sliderMax = 1000;
const focusScale = 2.5; // Adjust for desired framing
let currentlyFocusedObject = null;


function focusOnObject(object, buttonId = null, preserveZoom = false) {
    // make the button appear pressed
    if (buttonId) {
        document.getElementById(buttonId).classList.add('active');
        // Unpress other buttons
        ['focus-earth-btn', 'focus-moon-btn'].forEach(id => {
            if (id !== buttonId) {
                document.getElementById(id).classList.remove('active');
            }
        });
    }
    currentlyFocusedObject = object;
    const currentDistance = camera.position.distanceTo(controls.target);
    controls.target.copy(object.position);
    // Move camera along current direction, keeping distance proportional to object size
    const direction = new THREE.Vector3()
        .subVectors(camera.position, controls.target)
        .normalize();
    const distance = preserveZoom ? currentDistance : object.geometry.parameters.radius * focusScale;
    camera.position.copy(
        controls.target.clone().add(direction.multiplyScalar(distance))
    );
    controls.update();
}

const slider = document.getElementById('datetime-slider');
const valueDisplay = document.getElementById('datetime-value');


// Map slider value to timestamp
function sliderToDate(val) {
    const t = sliderMinDate.getTime() + (val - sliderMin) / (sliderMax - sliderMin) * (sliderMaxDate.getTime() - sliderMinDate.getTime());
    return new Date(t);
}

function updateSlider() {
    const date = sliderToDate(slider.value);
    valueDisplay.textContent = date.toLocaleString();
    updateMoonOrbit(earthMoon.moon, date);
    // Redraw the orbit to have the max being the current date
    // and the min being the date - range of the slider
    const newMinDate = new Date(date.getTime() - (sliderMaxDate.getTime() - sliderMinDate.getTime()));
    showMoonOrbit(scene, earthMoon.moon, newMinDate, date);
    // If currently focused object is set, refocus to adjust for new position
    if (currentlyFocusedObject) {
        focusOnObject(currentlyFocusedObject, null, true);
    }
}

slider.addEventListener('input', updateSlider);



function init() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    renderer.domElement.addEventListener('wheel', (event) => {
        event.preventDefault();
        event.stopPropagation();
    }, {passive: false}); // Use { passive: false } to ensure preventDefault works


    camera.position.z = 15000;
    document.getElementById('focus-earth-btn').onclick = () => {
        if (currentlyFocusedObject === earthMoon.earth) {
            currentlyFocusedObject = null;
            document.getElementById('focus-earth-btn').classList.remove('active');
            return;
        }
        focusOnObject(earthMoon.earth, 'focus-earth-btn');
    };
    document.getElementById('focus-moon-btn').onclick = () => {
        if (currentlyFocusedObject === earthMoon.moon) {
            currentlyFocusedObject = null;
            document.getElementById('focus-moon-btn').classList.remove('active');
            return;
        }
        focusOnObject(earthMoon.moon, 'focus-moon-btn');
    };

    focusOnObject(earthMoon.earth, 'focus-earth-btn');

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

    // Initialize display
    updateSlider();
    showMoonOrbit(scene, earthMoon.moon, sliderMinDate, sliderMaxDate);
}

init();

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();