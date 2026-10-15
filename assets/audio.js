(function (root) {
  const bus = {
    ctx: null,
    muted: false,
    voice: true,
    token: 0,

    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },

    tone(freq, when, dur, type, gain) {
      const ctx = this.ensure();
      if (!ctx || this.muted) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(gain || 0.08, when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(when);
      o.stop(when + dur + 0.02);
    },

    click() {
      const ctx = this.ensure();
      if (!ctx) return;
      this.tone(520, ctx.currentTime, 0.06, "triangle", 0.04);
    },

    tick() {
      const ctx = this.ensure();
      if (!ctx) return;
      this.tone(340, ctx.currentTime, 0.045, "square", 0.03);
    },

    correct() {
      const ctx = this.ensure();
      if (!ctx) return;
      const t = ctx.currentTime;
      this.tone(523, t, 0.12, "sine", 0.07);
      this.tone(659, t + 0.09, 0.12, "sine", 0.07);
      this.tone(784, t + 0.18, 0.2, "sine", 0.08);
    },

    wrong() {
      const ctx = this.ensure();
      if (!ctx) return;
      const t = ctx.currentTime;
      this.tone(196, t, 0.16, "sawtooth", 0.03);
      this.tone(155, t + 0.12, 0.2, "triangle", 0.04);
    },

    fanfare() {
      const ctx = this.ensure();
      if (!ctx) return;
      const t = ctx.currentTime;
      [523, 659, 784, 1046].forEach((f, i) => this.tone(f, t + i * 0.11, 0.22, "sine", 0.07));
    },

    cancelSpeak() {
      this.token += 1;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    },

    speak(text, onend) {
      if (!this.voice || !window.speechSynthesis || !text) {
        if (onend) onend();
        return;
      }
      const token = ++this.token;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "tr-TR";
      u.rate = 0.96;
      u.pitch = 1.04;
      const voices = window.speechSynthesis.getVoices();
      const tr = voices.find((v) => /tr[-_]TR/i.test(v.lang)) || voices.find((v) => /^tr/i.test(v.lang));
      if (tr) u.voice = tr;
      u.onend = () => {
        if (token === this.token && onend) onend();
      };
      u.onerror = () => {
        if (token === this.token && onend) onend();
      };
      window.speechSynthesis.speak(u);
    }
  };

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {};
  }

  root.MatAudio = bus;
})(typeof window !== "undefined" ? window : globalThis);
