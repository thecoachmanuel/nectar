// ─── Web Audio API Synthesizer for Incoming Order Notifications ─────────────
// Generates a pleasant, rich 3-tone chime bell alert without needing external MP3s

class OrderSoundAlert {
  private audioCtx: AudioContext | null = null;

  private initContext() {
    if (!this.audioCtx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  /**
   * Play a pleasant 3-tone notification chime for new orders
   */
  public playOrderChime() {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Note sequence: D5 (587.33Hz) -> F#5 (739.99Hz) -> A5 (880Hz) -> D6 (1174.66Hz)
      const notes = [
        { freq: 587.33, start: now, duration: 0.2 },
        { freq: 739.99, start: now + 0.12, duration: 0.25 },
        { freq: 880.00, start: now + 0.24, duration: 0.4 },
        { freq: 1174.66, start: now + 0.38, duration: 0.6 },
      ];

      notes.forEach(({ freq, start, duration }) => {
        if (!this.audioCtx) return;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        // Exponential decay envelope
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(start);
        osc.stop(start + duration);
      });
    } catch (e) {
      console.warn("Audio chime playback suppressed by browser policy:", e);
    }
  }
}

export const orderSoundAlert = new OrderSoundAlert();
