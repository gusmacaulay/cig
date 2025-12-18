import * as THREE from 'three';

export class WeaponSystem {
    constructor(camera, scene, domElement) {
        this.camera = camera;
        this.scene = scene;
        this.domElement = domElement; // For events

        this.weapons = [];
        this.currentWeaponIndex = 0;

        // Weapon container linked to camera so it moves with player
        this.weaponGroup = new THREE.Group();
        this.camera.add(this.weaponGroup);

        // Setup input for switching/firing
        this.isMouseDown = false;
        this.domElement.addEventListener('mousedown', () => this.fire());
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    }

    addWeapon(weapon) {
        this.weapons.push(weapon);
        weapon.mesh.visible = false;
        this.weaponGroup.add(weapon.mesh);

        // Initialize first weapon
        if (this.weapons.length === 1) {
            this.switchWeapon(0);
        }
    }

    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            // Hide current
            if (this.weapons[this.currentWeaponIndex]) {
                this.weapons[this.currentWeaponIndex].mesh.visible = false;
            }

            // Show new
            this.currentWeaponIndex = index;
            this.weapons[this.currentWeaponIndex].mesh.visible = true;
            this.weapons[this.currentWeaponIndex].onEquip();

            // UI Update (Quick and dirty direct DOM manipulation for prototype)
            const nameEl = document.getElementById('weapon-name');
            if (nameEl) nameEl.innerText = this.weapons[this.currentWeaponIndex].name;
        }
    }

    fire() {
        const weapon = this.weapons[this.currentWeaponIndex];
        if (weapon && weapon.canFire()) {
            weapon.fire(this.scene, this.camera);
        }
    }

    onKeyDown(e) {
        if (e.code === 'Digit1') this.switchWeapon(0);
        if (e.code === 'Digit2') this.switchWeapon(1);
    }

    update(delta) {
        const weapon = this.weapons[this.currentWeaponIndex];
        if (weapon) {
            weapon.update(delta);
        }
    }
}
