import * as THREE from 'three';

export class Cigarette {
    constructor() {
        this.name = "Cigarette";
        this.lastFireTime = 0;
        this.fireRate = 0.5; // Seconds

        this.mesh = this.createMesh();

        // Doom-style positioning (Fixed to camera)
        // Values tweaked for "FPS hand"
        // Doom-style positioning (Fixed to camera)
        // Moved back to prevent clipping (Near plane 0.1)
        this.mesh.position.set(0.15, -0.25, -0.7);
        this.mesh.rotation.y = -0.1;
        this.mesh.rotation.x = 0.05;

        this.smokeParticles = [];
    }

    createMesh() {
        const group = new THREE.Group();

        // 1. The Hand (Simple voxel style)
        const handGeo = new THREE.BoxGeometry(0.15, 0.15, 0.5);
        const handMat = new THREE.MeshStandardMaterial({ color: 0xe1b12c });
        const hand = new THREE.Mesh(handGeo, handMat);
        hand.position.set(0.1, -0.15, 0.2); // Relative to pivot
        hand.rotation.y = -0.3;
        group.add(hand);

        // 2. The Cigarette (Held by hand)
        const cigGroup = new THREE.Group();

        // Filter
        const filterGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.05, 16);
        const filterMat = new THREE.MeshStandardMaterial({ color: 0xe67e22 });
        const filter = new THREE.Mesh(filterGeo, filterMat);
        filter.position.y = -0.075;
        cigGroup.add(filter);

        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf1f2f6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.025;
        cigGroup.add(body);

        // Ash
        const ashGeo = new THREE.CylinderGeometry(0.015, 0.014, 0.02, 16);
        const ashMat = new THREE.MeshStandardMaterial({ color: 0x57606f, emissive: 0xff4757, emissiveIntensity: 0.8 });
        const ash = new THREE.Mesh(ashGeo, ashMat);
        ash.position.y = 0.11;
        this.tip = ash;
        cigGroup.add(ash);

        // Position cigarette relative to hand
        cigGroup.rotation.x = -Math.PI / 2; // Point forward
        cigGroup.rotation.y = 0.4; // Point slightly inward
        cigGroup.position.set(-0.05, 0, -0.15); // Sticking out of hand

        group.add(cigGroup);

        return group;
    }

    onEquip() { }

    canFire() {
        return (performance.now() / 1000) - this.lastFireTime > this.fireRate;
    }

    fire(scene, camera) {
        this.lastFireTime = performance.now() / 1000;

        // Animation: Flick
        this.mesh.rotation.x += 0.2;
        this.mesh.position.y -= 0.05;
        setTimeout(() => {
            this.mesh.rotation.x -= 0.2;
            this.mesh.position.y += 0.05;
        }, 100);

        this.createProjectile(scene, camera);
    }

    createProjectile(scene, camera) {
        const geo = new THREE.SphereGeometry(0.02);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff4757 });
        const projectile = new THREE.Mesh(geo, mat);

        const vector = new THREE.Vector3();
        this.tip.getWorldPosition(vector);
        projectile.position.copy(vector);

        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);

        // Random spread
        dir.x += (Math.random() - 0.5) * 0.1;
        dir.y += (Math.random() - 0.5) * 0.1;

        projectile.userData = {
            velocity: dir.multiplyScalar(25),
            life: 2.0
        };

        scene.add(projectile);
        // Dirty add to global
        if (!scene.userData.projectiles) scene.userData.projectiles = [];
        scene.userData.projectiles.push(projectile);
    }

    update(delta) {
        // Idle sway
        const time = performance.now() / 1000;
        this.mesh.position.y = -0.25 + Math.sin(time * 1.5) * 0.015;
        this.mesh.position.x = 0.15 + Math.cos(time * 1.0) * 0.01;
    }
}
