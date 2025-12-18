import * as THREE from 'three';

export class TextureGenerator {
    static createFloorTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Base
        ctx.fillStyle = '#353b48';
        ctx.fillRect(0, 0, 512, 512);

        // Grid / Tiles
        ctx.strokeStyle = '#2f3542';
        ctx.lineWidth = 4;

        for (let i = 0; i <= 512; i += 64) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 512);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(512, i);
            ctx.stroke();
        }

        // Noise/Grim
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            ctx.fillStyle = Math.random() > 0.5 ? '#3a4050' : '#2a303c';
            ctx.fillRect(x, y, 4, 4);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(20, 20);
        return tex;
    }

    static createWallTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Brick-ish
        ctx.fillStyle = '#718093';
        ctx.fillRect(0, 0, 512, 512);

        ctx.fillStyle = '#616e7d';
        const brickH = 64;
        const brickW = 128;

        for (let y = 0; y < 512; y += brickH) {
            const offset = (y / brickH) % 2 === 0 ? 0 : brickW / 2;
            for (let x = -brickW; x < 512; x += brickW) {
                ctx.fillRect(x + offset + 2, y + 2, brickW - 4, brickH - 4);
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    static createEnemyTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Clear
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 256, 256);

        // Angry Face (Doom Imp style abstraction)
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(128, 128, 100, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(90, 100, 20, 0, Math.PI * 2);
        ctx.arc(166, 100, 20, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(90, 100, 5, 0, Math.PI * 2);
        ctx.arc(166, 100, 5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth (Screaming)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.ellipse(128, 170, 40, 50, 0, 0, Math.PI * 2);
        ctx.fill();

        // Teeth
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(110, 140);
        ctx.lineTo(115, 160);
        ctx.lineTo(120, 140);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(136, 140);
        ctx.lineTo(141, 160);
        ctx.lineTo(146, 140);
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }
}
