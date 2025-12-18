import * as THREE from 'three';
import { Player } from './Player.js';
import { WeaponSystem } from './weapons/WeaponSystem.js';
import { Cigarette } from './weapons/Cigarette.js';
import { Insult } from './weapons/Insult.js';
import { Enemy } from './Enemy.js';
import { MusicPlayer } from './MusicPlayer.js';
import { TextureGenerator } from './TextureGenerator.js';

export class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1e272e);
        this.scene.fog = new THREE.Fog(0x1e272e, 10, 50);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.scene.add(this.camera); // CRITICAL: Camera must be in scene for children (weapons) to render!

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // Environment
        this.setupEnvironment();

        // Player
        this.player = new Player(this.camera, this.renderer.domElement, this.scene);

        // Weapons
        this.weaponSystem = new WeaponSystem(this.camera, this.scene, document.body);
        this.weaponSystem.addWeapon(new Cigarette());
        this.weaponSystem.addWeapon(new Insult());

        // Enemies
        this.enemies = [];
        this.lastEnemySpawn = 0;

        // UI Handling
        this.setupUI();

        // Music
        this.musicPlayer = new MusicPlayer();

        // Resize handler
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    setupEnvironment() {
        // Floor
        const floorTex = TextureGenerator.createFloorTexture();
        const floorGeometry = new THREE.PlaneGeometry(100, 100);
        const floorMaterial = new THREE.MeshStandardMaterial({
            map: floorTex,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // -- Perimeter Walls --
        const wallHeight = 10;
        const wallGeo = new THREE.PlaneGeometry(100, wallHeight);
        const perimeterTex = TextureGenerator.createWallTexture();
        perimeterTex.wrapS = THREE.RepeatWrapping;
        perimeterTex.wrapT = THREE.RepeatWrapping;
        perimeterTex.repeat.set(10, 1);

        const wallMat = new THREE.MeshStandardMaterial({ map: perimeterTex, side: THREE.DoubleSide });

        // North
        const wallN = new THREE.Mesh(wallGeo, wallMat);
        wallN.position.set(0, wallHeight / 2, -50);
        this.scene.add(wallN);

        // South
        const wallS = new THREE.Mesh(wallGeo, wallMat);
        wallS.position.set(0, wallHeight / 2, 50);
        wallS.rotation.y = Math.PI;
        this.scene.add(wallS);

        // East
        const wallE = new THREE.Mesh(wallGeo, wallMat);
        wallE.position.set(50, wallHeight / 2, 0);
        wallE.rotation.y = -Math.PI / 2;
        this.scene.add(wallE);

        // West
        const wallW = new THREE.Mesh(wallGeo, wallMat);
        wallW.position.set(-50, wallHeight / 2, 0);
        wallW.rotation.y = Math.PI / 2;
        this.scene.add(wallW);

        // Random Boxes (Walls)
        const boxGeo = new THREE.BoxGeometry(2, 2, 2);
        const wallTex = TextureGenerator.createWallTexture();
        const boxMat = new THREE.MeshStandardMaterial({ map: wallTex });

        for (let i = 0; i < 20; i++) {
            const box = new THREE.Mesh(boxGeo, boxMat);
            box.position.set(
                (Math.random() - 0.5) * 80,
                1,
                (Math.random() - 0.5) * 80
            );
            box.castShadow = true;
            box.receiveShadow = true;
            this.scene.add(box);
        }
    }

    setupUI() {
        const startScreen = document.getElementById('start-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const restartText = gameOverScreen.querySelector('p');

        const requestLock = () => {
            if (!this.player.controls.isLocked) {
                this.player.controls.lock();
            }

            // AudioContext must resume immediately on user gesture
            if (this.musicPlayer) {
                this.musicPlayer.resumeContext().then(() => {
                    if (!this.musicPlayer.isPlaying) {
                        this.musicPlayer.loadAndPlay('soundtrack.mid');
                    }
                });
            }
        };

        startScreen.addEventListener('click', requestLock);
        restartText.addEventListener('click', () => {
            // Reset Game
            this.resetGame();
            requestLock();
        });

        this.player.controls.addEventListener('lock', () => {
            startScreen.classList.remove('active');
            gameOverScreen.classList.remove('active');
        });

        this.player.controls.addEventListener('unlock', () => {
            if (this.player.health > 0) {
                startScreen.classList.add('active');
            }
        });
    }

    resetGame() {
        this.player.health = 100;
        this.enemies.forEach(e => this.scene.remove(e.mesh));
        this.enemies = [];
        this.updateHealthUI();
        document.getElementById('game-over-screen').classList.remove('active');
    }

    start() {
        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const delta = this.clock.getDelta();

        if (this.player.controls.isLocked) {
            this.player.update(delta);
            this.weaponSystem.update(delta);
            this.updateProjectiles(delta);
            this.updateEnemies(delta);
        }

        this.renderer.render(this.scene, this.camera);
    }

    updateProjectiles(delta) {
        if (this.scene.userData.projectiles) {
            for (let i = this.scene.userData.projectiles.length - 1; i >= 0; i--) {
                const proj = this.scene.userData.projectiles[i];

                // Move
                proj.position.addScaledVector(proj.userData.velocity, delta);

                // Gravity (only for cigarette butts)
                // Insult sprites are instances of THREE.Sprite which have no geometry property usually exposed like this or check type
                if (proj.isMesh) {
                    proj.userData.velocity.y -= 9.8 * delta;
                }

                // Collision with enemies
                let hitResult = false;
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    const dist = proj.position.distanceTo(enemy.mesh.position);
                    if (dist < 1.0) { // Hit radius
                        enemy.takeDamage(1);
                        hitResult = true;
                        break;
                    }
                }

                // Life or Hit
                proj.userData.life -= delta;
                if (hitResult || proj.userData.life <= 0 || proj.position.y < 0) {
                    this.scene.remove(proj);
                    this.scene.userData.projectiles.splice(i, 1);
                }
            }
        }
    }

    updateEnemies(delta) {
        // Spawn
        const time = performance.now() / 1000;
        if (time - this.lastEnemySpawn > 3.0 && this.enemies.length < 10) {
            this.lastEnemySpawn = time;
            this.spawnEnemy();
        }

        // Update
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(delta);

            if (enemy.health <= 0) {
                this.enemies.splice(i, 1);
            } else {
                // Player collision
                const dist = this.player.camera.position.distanceTo(enemy.mesh.position);
                if (dist < 1.5) {
                    this.player.health -= 10;
                    this.updateHealthUI();
                    // Simple knockback
                    const pushDir = new THREE.Vector3().subVectors(this.player.camera.position, enemy.mesh.position).normalize();
                    this.player.camera.position.addScaledVector(pushDir, 2.0);
                }
            }
        }
    }

    spawnEnemy() {
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 10;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const pos = new THREE.Vector3(x, 1, z);
        pos.add(this.player.camera.position);
        pos.y = 1;

        const enemy = new Enemy(pos, this.scene, this.player);
        this.enemies.push(enemy);
    }

    updateHealthUI() {
        const fill = document.getElementById('health-fill');
        if (fill) fill.style.width = Math.max(0, this.player.health) + '%';

        if (this.player.health <= 0) {
            this.player.controls.unlock();
            document.getElementById('game-over-screen').classList.add('active');
        }
    }
}
