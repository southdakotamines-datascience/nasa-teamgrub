import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {createEarthMoon, createSunSphere, showMoonOrbit, updateMoonOrbit, updateSunPosition} from './earth-moon.js';
import {fetchNeoByDateCenter, fetchNeoPositions} from "./api-request-manager.js";
import {drawMeteorPath, drawMeteorPosition} from "./meteor-manager.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500000000000);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);
const earthMoon = createEarthMoon(scene);
let meteor = null;
let sliderMinDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // one month ago
let sliderMaxDate = new Date(); // Now
const sliderMin = 0
const sliderMax = 1000;
const focusScale = 2.5; // Adjust for desired framing
let currentlyFocusedObject = null;
let meteorPositionsData = null; // Store fetched meteor positions data
let sun = null;

const slider = document.getElementById('datetime-slider');
const valueDisplay = document.getElementById('datetime-value');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');

// Initialize with default dates
const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // one month ago
const defaultEnd = new Date().toISOString().slice(0, 10);
startDateInput.value = defaultStart;
endDateInput.value = defaultEnd;
const earthLabel = createLabel('Earth');
const moonLabel = createLabel('Moon');
const sunLabel = createLabel('Sun');
const meteorLabel = createLabel('Meteor');

// Set slider min/max based on datepickers
function updateDateRange() {
    sliderMinDate = new Date(startDateInput.value);
    sliderMaxDate = new Date(endDateInput.value);
    if (sliderMinDate.getTime() < sliderMaxDate.getTime()) {
        const formattedMin = sliderMinDate.toISOString().slice(0, 10);
        const formattedMax = sliderMaxDate.toISOString().slice(0, 10);
        // Fetch NEO data for the new range
        // fetchNeosByDateRange(formattedMin, formattedMax).then(r => console.log(r));
        fetchNeoPositions("3542519", formattedMin, formattedMax).then(positions => {
            meteorPositionsData = positions;
            drawMeteorPosition(scene, sliderToDate(slider.value), positions);
            drawMeteorPath(scene, positions)
        })
    }
    updateSlider();
}

function debounce(fn, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

const debouncedShowMoonOrbit = debounce((scene, moon, date) => {
    showMoonOrbit(scene, moon, date);
}, 50);

const debouncedNeoFetchCenter = debounce((date) => {
    const formattedDate = date.toISOString().slice(0, 10);
    fetchNeoByDateCenter(formattedDate).then(r => console.log(r));
}, 500);

startDateInput.addEventListener('change', updateDateRange);
endDateInput.addEventListener('change', updateDateRange);

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

// Map slider value to date
function sliderToDate(val) {
    const t = sliderMinDate.getTime() + (val - sliderMin) / (sliderMax - sliderMin) * (sliderMaxDate.getTime() - sliderMinDate.getTime());
    return new Date(t);
}

function updateSlider() {
    const date = sliderToDate(slider.value);
    valueDisplay.textContent = date.toLocaleString();
    updateMoonOrbit(earthMoon.moon, date);
    // updateSunPosition(sun, date);
    drawMeteorPath(scene, date, meteorPositionsData);
    meteor = drawMeteorPosition(scene, date, meteorPositionsData);
    debouncedShowMoonOrbit(scene, earthMoon.moon, date);
    debouncedNeoFetchCenter(date);
    // If currently focused object is set, refocus to adjust for new position
    if (currentlyFocusedObject) {
        focusOnObject(currentlyFocusedObject, null, true);
    }
}

slider.addEventListener('input', updateSlider);

function createLabel(name) {
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = name;
    document.body.appendChild(label);
    return label;
}

function updateLabelPosition(label, object3D, camera, renderer) {
    const vector = object3D.position.clone().project(camera);
    const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
    const y = ( -vector.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
}

// Usage example:
// In your animation/render loop:
updateLabelPosition(earthLabel, earthMoon.earth, camera, renderer);

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
    sun = createSunSphere(scene);
    updateDateRange();
    updateSlider();
    showMoonOrbit(scene, earthMoon.moon, sliderToDate(slider.value));
    // addSunLight(scene);
    // plot x,y,z axes for reference
    // const axesHelper = new THREE.AxesHelper(10000);
    // scene.add(axesHelper);
}

init();

function animate() {
    requestAnimationFrame(animate);
    updateLabelPosition(earthLabel, earthMoon.earth, camera, renderer);
    updateLabelPosition(moonLabel, earthMoon.moon, camera, renderer);
    updateLabelPosition(sunLabel, sun, camera, renderer);
    if (meteor) {
        updateLabelPosition(meteorLabel, meteor, camera, renderer);
    }
    controls.update();
    renderer.render(scene, camera);
}
animate();