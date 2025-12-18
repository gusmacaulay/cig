import * as THREE from 'three';
import { GameConfig } from '../config.js';

export class Insult {
    constructor() {
        this.name = "Insult";
        this.lastFireTime = 0;
        this.fireRate = 1.0; // Slower fire rate

        this.insults = GameConfig.insults;

        this.mesh = this.createMesh();
        this.mesh.visible = false;

        // Add to camera/hand group
        this.mesh.position.set(0.4, -0.4, -0.5);

        // Init TTS
        this.synth = window.speechSynthesis;
        this.voices = [];
        // Voices load asynchronously
        if (this.synth && this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => {
                this.voices = this.synth.getVoices();
            };
        }
        // Try get immediately too
        if (this.synth) this.voices = this.synth.getVoices();
    }

    createMesh() {
        // Just a placeholder "open hand" or "mouth" or invisible?
        // Let's make a simple "Megaphone" shape
        const group = new THREE.Group();

        const coneGeo = new THREE.ConeGeometry(0.1, 0.3, 32, 1, true);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.rotation.x = -Math.PI / 2;
        group.add(cone);

        const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x2f3542 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.rotation.x = Math.PI / 2; // Perpendicular to cone
        handle.position.y = -0.1;
        handle.position.z = 0.05;
        group.add(handle);

        return group;
    }

    onEquip() { }

    canFire() {
        return (performance.now() / 1000) - this.lastFireTime > this.fireRate;
    }

    fire(scene, camera) {
        this.lastFireTime = performance.now() / 1000;

        // Pick random insult
        const text = this.insults[Math.floor(Math.random() * this.insults.length)];
        const texture = this.createInsultTexture(text);

        // Speak it!
        this.speak(text);

        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);

        // Spawn in front of player
        const vector = new THREE.Vector3(0, 0, -1);
        vector.applyQuaternion(camera.quaternion);
        sprite.position.copy(camera.position).add(vector);

        // Size it up
        sprite.scale.set(1.5, 0.75, 1);

        // Add projectile logic (Insult flies forward!)
        sprite.userData = {
            velocity: vector.multiplyScalar(15),
            life: 3.0
        };

        scene.add(sprite);
        if (!scene.userData.projectiles) scene.userData.projectiles = [];
        scene.userData.projectiles.push(sprite);

        // Visual recoil
        this.mesh.rotation.x += 0.2;
        setTimeout(() => this.mesh.rotation.x -= 0.2, 100);
    }

    createInsultTexture(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Initial clean
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 512, 256);

        // Text style
        ctx.font = 'Bold 48px Arial';
        ctx.fillStyle = '#ff4757';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow
        ctx.shadowColor = "black";
        ctx.shadowBlur = 10;

        ctx.strokeText(text, 256, 128);
        ctx.fillText(text, 256, 128);

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    speak(text) {
        if (!this.synth) return;

        // Clear queue to prevent backlog
        this.synth.cancel();

        const utter = new SpeechSynthesisUtterance(text);
        utter.volume = 1.0;

        if (this.voices.length === 0) {
            this.voices = this.synth.getVoices();
        }

        // Expanded Voice Priority: 
        let voice = this.voices.find(v =>
            (v.name.includes('Australian') || v.lang.includes('en-AU')) &&
            (v.name.includes('Male') || v.name.includes('James') || v.name.includes('Direct'))
        );

        if (!voice) {
            voice = this.voices.find(v => v.lang.includes('en-AU'));
        }

        // Fallback to any English Male
        if (!voice) {
            voice = this.voices.find(v => v.lang.includes('en') && v.name.includes('Male'));
        }

        if (voice) utter.voice = voice;

        // Tweak pitch/rate for "manliness"
        utter.pitch = 0.8; // Deeper
        utter.rate = 0.9; // Slightly slower

        this.synth.speak(utter);
    }

    update(delta) { }
}
