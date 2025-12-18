import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement, scene) {
        this.camera = camera;
        this.scene = scene;
        this.controls = new PointerLockControls(camera, domElement);

        // Initial position
        this.camera.position.y = 1.6; // Eye height

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        this.speed = 10.0;
        this.health = 100;

        this.setupInput();
    }

    setupInput() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }

    update(delta) {
        // Friction / Deceleration
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        // Direction based on input
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize(); // Ensure consistent speed in all directions

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * this.speed * 10.0 * delta; // Note: -z is forward in Three.js default if we use moveForward/Right
        // Actually PointerLockControl's moveForward/Right helpers handle local space.
        // Let's stick to standard manual velocity for now for more control, but use the control object to get direction.

        // Wait, PointerLockControls has moveForward/moveRight methods which are easier.
        // But for physics-y feeling (sliding), velocity is better.

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 400.0 * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 400.0 * delta;

        // Apply movement
        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        // -- Physics Constraints --

        // 1. Ground Clamp (No floating/flying)
        this.camera.position.y = 1.6;
        // Reset vertical velocity if we had any
        this.velocity.y = 0;

        // 2. Map Boundaries (Hard limits at +/- 49 to avoid clipping wall)
        const limit = 48;
        if (this.camera.position.x < -limit) this.camera.position.x = -limit;
        if (this.camera.position.x > limit) this.camera.position.x = limit;
        if (this.camera.position.z < -limit) this.camera.position.z = -limit;
        if (this.camera.position.z > limit) this.camera.position.z = limit;
    }
}
