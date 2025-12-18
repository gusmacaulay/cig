import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';

export class MusicPlayer {
    constructor() {
        this.isPlaying = false;
        this.synths = [];
    }

    // Call this immediately on user interaction
    resumeContext() {
        return Tone.start();
    }

    async loadAndPlay(url) {
        // Ensure ready (idempotent)
        await Tone.loaded();

        const midi = await Midi.fromUrl(url);

        // Setup synths
        const now = Tone.now() + 0.5;

        midi.tracks.forEach(track => {
            // Simple synth for each track
            const synth = new Tone.PolySynth(Tone.Synth, {
                envelope: {
                    attack: 0.02,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 1
                }
            }).toDestination();

            // Lower volume
            synth.volume.value = -10;

            this.synths.push(synth);

            track.notes.forEach(note => {
                synth.triggerAttackRelease(
                    note.name,
                    note.duration,
                    note.time + now,
                    note.velocity
                );
            });
        });

        this.isPlaying = true;
        console.log("Started playing MIDI");
    }
}
