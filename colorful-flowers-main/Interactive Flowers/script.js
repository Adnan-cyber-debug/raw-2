// Global Error Boundary for Diagnostics
window.addEventListener('error', (event) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100%';
  errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.95)';
  errorDiv.style.color = '#fff';
  errorDiv.style.padding = '15px';
  errorDiv.style.zIndex = '999999';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.style.fontSize = '13px';
  errorDiv.style.lineHeight = '1.4';
  errorDiv.style.whiteSpace = 'pre-wrap';
  errorDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
  errorDiv.innerText = `[DOM Runtime Error]\nMessage: ${event.message}\nSource: ${event.filename}\nLine: ${event.lineno}:${event.colno}\nStack: ${event.error ? event.error.stack : 'N/A'}`;
  document.body.appendChild(errorDiv);
});

let audioCtx = null;
let isMuted = false;
let nextNoteTime = 0;
let sequenceIndex = 0;
let timerId = null;

// Dynamic note to frequency converter
function getFreq(note) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const name = note.slice(0, -1);
  const octave = parseInt(note.slice(-1));
  const semitone = notes.indexOf(name);
  return 440 * Math.pow(2, (semitone - 9 + (octave - 4) * 12) / 12);
}

// Melody sequence (C - G - Am - F progression, slow music box arpeggio)
const melody = [
  // C Major
  { note: 'C3', duration: 1.2 }, { note: 'E3', duration: 1.2 }, { note: 'G3', duration: 1.2 }, { note: 'C4', duration: 1.2 },
  { note: 'E4', duration: 1.2 }, { note: 'C4', duration: 1.2 }, { note: 'G3', duration: 1.2 }, { note: 'E3', duration: 1.2 },
  // G Major
  { note: 'G2', duration: 1.2 }, { note: 'D3', duration: 1.2 }, { note: 'G3', duration: 1.2 }, { note: 'B3', duration: 1.2 },
  { note: 'D4', duration: 1.2 }, { note: 'B3', duration: 1.2 }, { note: 'G3', duration: 1.2 }, { note: 'D3', duration: 1.2 },
  // A Minor
  { note: 'A2', duration: 1.2 }, { note: 'E3', duration: 1.2 }, { note: 'A3', duration: 1.2 }, { note: 'C4', duration: 1.2 },
  { note: 'E4', duration: 1.2 }, { note: 'C4', duration: 1.2 }, { note: 'A3', duration: 1.2 }, { note: 'E3', duration: 1.2 },
  // F Major
  { note: 'F2', duration: 1.2 }, { note: 'C3', duration: 1.2 }, { note: 'F3', duration: 1.2 }, { note: 'A3', duration: 1.2 },
  { note: 'C4', duration: 1.2 }, { note: 'A3', duration: 1.2 }, { note: 'F3', duration: 1.2 }, { note: 'C3', duration: 1.2 }
];

// Initialize Audio Context on user interaction
function initAudio() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    console.warn("AudioContext not supported on this browser.");
    return;
  }
  audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  nextNoteTime = audioCtx.currentTime + 0.1;
  scheduler();
}

// Synthesize a soft bell/music-box sound
function playMusicBoxNote(freq, time, duration = 1.0) {
  if (isMuted || !audioCtx) return;

  try {
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;

    const osc2 = audioCtx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;

    const gainNode = audioCtx.createGain();
    const harmonicGain = audioCtx.createGain();
    
    harmonicGain.gain.value = 0.25;

    osc1.connect(gainNode);
    osc2.connect(harmonicGain);
    harmonicGain.connect(gainNode);
    
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.18, time + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc1.start(time);
    osc1.stop(time + duration);
    osc2.start(time);
    osc2.stop(time + duration);
  } catch (err) {
    console.error("Error playing synth note:", err);
  }
}

// Precision scheduler for continuous tempo
function scheduler() {
  if (!audioCtx) return;
  
  try {
    while (nextNoteTime < audioCtx.currentTime + 0.2) {
      const item = melody[sequenceIndex];
      const freq = getFreq(item.note);
      playMusicBoxNote(freq, nextNoteTime, item.duration);
      
      nextNoteTime += 0.45;
      sequenceIndex = (sequenceIndex + 1) % melody.length;
    }
    timerId = setTimeout(scheduler, 25);
  } catch (err) {
    console.error("Scheduler error:", err);
  }
}

// Twinkling stars generator
function createStars() {
  const container = document.getElementById('starsContainer');
  if (!container) return;
  
  const numStars = 65;
  for (let i = 0; i < numStars; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 75}%`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    container.appendChild(star);
  }
}

// Spawns a floating heart particle at coordinates
function spawnHeart(x, y, color = null) {
  const heart = document.createElement('div');
  heart.className = 'heart-particle';
  
  const sway = (Math.random() - 0.5) * 140;
  heart.style.setProperty('--sway', `${sway}px`);
  
  if (color) {
    heart.style.setProperty('--heart-color', color);
  } else {
    const colors = ['#ff2a6d', '#ff5c7c', '#ff85a1', '#f15bb5', '#9b5de5', '#fee440'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    heart.style.setProperty('--heart-color', randomColor);
  }
  
  heart.style.left = `${x}px`;
  heart.style.top = `${y}px`;
  
  const size = Math.random() * 10 + 12;
  heart.style.width = `${size}px`;
  heart.style.height = `${size}px`;
  
  const duration = Math.random() * 2.5 + 3.5;
  heart.style.animationDuration = `${duration}s`;
  
  document.body.appendChild(heart);
  
  setTimeout(() => {
    heart.remove();
  }, duration * 1000);
}

// Continuous passive heart generator loop
function startHeartRain() {
  setInterval(() => {
    if (!document.body.classList.contains('not-loaded')) {
      const x = Math.random() * window.innerWidth;
      const y = window.innerHeight - 20;
      spawnHeart(x, y);
    }
  }, 650);
}

// Play unique tactile chime when user clicks a flower top
function playChimeSound(index) {
  if (isMuted || !audioCtx) return;
  
  try {
    const chords = [880.00, 1046.50, 1318.51];
    const freq = chords[index % chords.length];
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.value = freq;
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (err) {
    console.error("Error playing chime sound:", err);
  }
}

// Romantic color palette cycle
const flowerColors = [
  { primary: '#ff219b', dark: '#b01066', light: '#ff60b6', name: 'Pink' },
  { primary: '#ff003c', dark: '#90001f', light: '#ff5c7c', name: 'Red' },
  { primary: '#ffffff', dark: '#aaaaaa', light: '#e5e5e5', name: 'White' },
  { primary: '#9b5de5', dark: '#52238b', light: '#d8b4fe', name: 'Purple' },
  { primary: '#ff9f1c', dark: '#a35f00', light: '#ffbf69', name: 'Orange' },
  { primary: '#fee440', dark: '#a39100', light: '#fff176', name: 'Yellow' },
  { primary: '#00f5d4', dark: '#009b86', light: '#86ffeb', name: 'Cyan' },
];

// Initialize flower clicks
function setupFlowerClicks() {
  const flowers = document.querySelectorAll('.flower');
  flowers.forEach((flower, idx) => {
    flower.dataset.colorIndex = '0';
    const leafs = flower.querySelector('.flower__leafs');
    
    if (leafs) {
      leafs.addEventListener('click', (e) => {
        e.stopPropagation();
        
        let currentIndex = parseInt(flower.dataset.colorIndex);
        let nextIndex = (currentIndex + 1) % flowerColors.length;
        flower.dataset.colorIndex = nextIndex.toString();
        
        const selectedColor = flowerColors[nextIndex];
        
        flower.style.setProperty('--flower-color', selectedColor.primary);
        flower.style.setProperty('--flower-color-dark', selectedColor.dark);
        flower.style.setProperty('--flower-color-light', selectedColor.light);
        
        playChimeSound(idx);
        
        const rect = leafs.getBoundingClientRect();
        const burstX = rect.left + rect.width / 2;
        const burstY = rect.top + rect.height / 2;
        for (let i = 0; i < 7; i++) {
          spawnHeart(burstX, burstY, selectedColor.primary);
        }
      });
    }
  });
}

// Master init function
function init() {
  createStars();
  setupFlowerClicks();
  
  const openBtn = document.getElementById('openBtn');
  const introOverlay = document.getElementById('introOverlay');
  const romanticCaption = document.getElementById('romanticCaption');
  const musicBtn = document.getElementById('musicBtn');
  
  if (openBtn && introOverlay) {
    openBtn.addEventListener('click', () => {
      // Fade out overlay
      introOverlay.classList.add('fade-out');
      
      try {
        initAudio();
      } catch (err) {
        console.warn("AudioContext setup failed:", err);
      }
      
      // Remove loaded block to grow flowers
      setTimeout(() => {
        document.body.classList.remove('not-loaded');
        
        if (romanticCaption) romanticCaption.classList.add('visible');
        if (musicBtn) musicBtn.classList.add('visible');
        
        startHeartRain();
      }, 300);
    });
  }
  
  if (musicBtn) {
    musicBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      if (isMuted) {
        musicBtn.textContent = '🔇';
        musicBtn.title = 'Unmute Music';
      } else {
        musicBtn.textContent = '🔊';
        musicBtn.title = 'Mute Music';
        if (audioCtx) {
          try {
            if (audioCtx.state === 'suspended') {
              audioCtx.resume();
            }
          } catch (e) {
            console.warn("Failed to resume AudioContext:", e);
          }
        }
      }
    });
  }
}

// Run immediately!
init();