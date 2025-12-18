import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';

export class Enemy {
    constructor(position, scene, player) {
        this.scene = scene;
        this.player = player;
        this.speed = 3.0; // Slightly faster for sprites
        this.health = 3;

        // Cache texture (static ideally, but per instance is fine for prototype)
        if (!Enemy.texture) {
            Enemy.texture = TextureGenerator.createEnemyTexture();
        }

        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        this.mesh.position.y = 1.5; // Lift up a bit
        this.scene.add(this.mesh);

        // Color flash state
        this.flashTime = 0;
    }

    createMesh() {
        const material = new THREE.SpriteMaterial({ map: Enemy.texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 2, 1);
        sprite.userData.parent = this; // Back reference for raycasting collision? 
        // Note: Raycasting often checks Mesh, but dist check in Game.js uses position directly.

        // Add a collider mesh (invisible) if we needed precise raycasting avoiding, 
        // but our Game.js uses distanceTo() on the mesh position, which works for Sprites too.
        return sprite;
    }

    takeDamage(amount) {
        this.health -= amount;

        // Flash red/white
        this.mesh.material.color.setHex(0xff0000); // Visual feedback
        setTimeout(() => {
            if (this.health > 0) this.mesh.material.color.setHex(0xffffff);
        }, 100);

        if (this.health <= 0) {
            this.die();
            return true; // Dead
        }
        return false;
    }

    die() {
        this.scene.remove(this.mesh);
    }

    update(delta) {
        if (this.health <= 0) return;

        // Chase player
        const target = this.player.camera.position.clone();
        target.y = this.mesh.position.y; // Keep on same level

        const direction = new THREE.Vector3().subVectors(target, this.mesh.position).normalize();
        this.mesh.position.addScaledVector(direction, this.speed * delta);

        // Look at player? Sprites always face camera automatically!
        // No need for lookAt logic.
    }
}
