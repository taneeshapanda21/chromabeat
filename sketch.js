/*** ChromaBeat — audio reactive drawing tool

1. load an audio file (.mp3, .wav, .m4a)
2. pick a color
3. choose a frequency band to paint with (bass / mid / treble)
4. click and drag on the canvas to draw
5. press "Clear canvas" (or C) to reset

Shortcuts: 1 = bass, 2 = mid, 3 = treble, C = clear

***/

let input; let soundFile = null; let fft;
let toolbar;
let controlsGroup = null;
let trackStatus = null; let statusLabel = null;
let colorPicker;
let currentBand = "treble"; let strokes = []; let currentStroke = null;
let bandButtons = {};
let canvasHolder;
let eqEl, eqBassEl, eqMidEl, eqTrebleEl;
let isLightMode = false;
let themeToggleButton = null;

// custom playback controls
let playButton = null; let muteButton = null; let seekSlider = null; let isSeeking = false; let prevVolume = 1;

function setup() {
  canvasHolder = select('#canvas-holder');
  const c = createCanvas(canvasHolder.elt.clientWidth, canvasHolder.elt.clientHeight);
  c.parent(canvasHolder);
  background(0);
  fft = new p5.FFT();

  eqEl = select('#eq');
  eqBassEl = select('#eqBass');
  eqMidEl = select('#eqMid');
  eqTrebleEl = select('#eqTreble');

  toolbar = select('#toolbar');

  // upload group 
  let uploadGroup = createDiv();
  uploadGroup.addClass('toolbar-group');
  uploadGroup.parent(toolbar);

  input = createFileInput(handleFile);
  input.parent(uploadGroup);
  input.style('display', 'none');

  let uploadBtn = createButton('Load track ↑');
  uploadBtn.addClass('btn btn-upload');
  uploadBtn.parent(uploadGroup);
  uploadBtn.mousePressed(() => input.elt.click());

  trackStatus = createDiv('');
  trackStatus.addClass('track-status');
  trackStatus.parent(uploadGroup);

  let statusDot = createSpan('');
  statusDot.addClass('dot');
  statusDot.parent(trackStatus);

  statusLabel = createSpan('No track loaded');
  statusLabel.addClass('label');
  statusLabel.parent(trackStatus);

  // playback group
  controlsGroup = createDiv();
  controlsGroup.addClass('toolbar-group playback');
  controlsGroup.parent(toolbar);
  controlsGroup.hide();

  // color group 
  let colorGroup = createDiv();
  colorGroup.addClass('toolbar-group color-row');
  colorGroup.parent(toolbar);

  let colorLabel = createP('Color');
  colorLabel.addClass('group-label');
  colorLabel.parent(colorGroup);

  colorPicker = createColorPicker('#3fe0e8');
  colorPicker.parent(colorGroup);

  // band group 
  let bandGroup = createDiv();
  bandGroup.addClass('toolbar-group band-group');
  bandGroup.parent(toolbar);

  let bandLabel = createP('Paint with');
  bandLabel.addClass('group-label');
  bandLabel.parent(bandGroup);

  let buttonsContainer = createDiv();
  buttonsContainer.addClass('band-buttons');
  buttonsContainer.parent(bandGroup);

  const bands = [
    { key: 'treble', label: 'Treble' },
    { key: 'mid', label: 'Mid' },
    { key: 'bass', label: 'Bass' }
  ];

  for (const b of bands) {
    let btn = createButton(b.label);
    btn.addClass('band-btn');
    btn.attribute('data-band', b.key);
    btn.parent(buttonsContainer);
    btn.mousePressed(() => setBand(b.key));
    bandButtons[b.key] = btn;
  }

  // actions 
  let actionsGroup = createDiv();
  actionsGroup.addClass('toolbar-group actions-row');
  actionsGroup.parent(toolbar);

  let undoBtn = createButton('Undo');
  undoBtn.addClass('btn btn-clear');
  undoBtn.parent(actionsGroup);
  undoBtn.mousePressed(() => {
    if (strokes.length > 0) strokes.pop();
  });

  let resetBtn = createButton('Clear canvas');
  resetBtn.addClass('btn btn-clear');
  resetBtn.parent(actionsGroup);
  resetBtn.mousePressed(clearCanvas);

  actionsGroup.style('display', 'flex');
  resizeCanvas(canvasHolder.elt.clientWidth, canvasHolder.elt.clientHeight);

  let themeGroup = createDiv();
  themeGroup.addClass('toolbar-group');
  themeGroup.parent(toolbar);

  let themeLabel = createP('Theme');
  themeLabel.addClass('group-label');
  themeLabel.parent(themeGroup);

  themeToggleButton = createButton('Light mode');
  themeToggleButton.addClass('btn btn-theme');
  themeToggleButton.parent(themeGroup);
  themeToggleButton.mousePressed(toggleLightMode);

  applyTheme();
  updateThemeButton();
  setBand(currentBand);
}

function setBand(key) {
  currentBand = key;
  for (const k in bandButtons) {
    if (k === key) bandButtons[k].addClass('is-active');
    else bandButtons[k].removeClass('is-active');
  }
}

function toggleLightMode() {
  isLightMode = !isLightMode;
  applyTheme();
  updateThemeButton();
}

function updateThemeButton() {
  if (!themeToggleButton) return;
  themeToggleButton.html(isLightMode ? 'Dark mode' : 'Light mode');
}

function applyTheme() {
  document.body.classList.toggle('light-mode', isLightMode);
  if (canvasHolder) {
    background(isLightMode ? 255 : 0);
  }
}

function clearCanvas() {
  strokes = [];
  background(isLightMode ? 255 : 0);
}

function setTrackStatus(text, loaded) {
  statusLabel.elt.textContent = text;
  if (loaded) trackStatus.addClass('is-loaded');
  else trackStatus.removeClass('is-loaded');
}

function updateEqualizer(bass, mid, treble) {
  if (!eqEl.hasClass('is-live')) eqEl.addClass('is-live');
  eqBassEl.style('height', map(bass, 0, 255, 6, 22) + 'px');
  eqMidEl.style('height', map(mid, 0, 255, 6, 22) + 'px');
  eqTrebleEl.style('height', map(treble, 0, 255, 6, 22) + 'px');
}

function draw() {
  background(isLightMode ? 255 : 0);

  if (soundFile) {
    fft.analyze();
    let bass = fft.getEnergy("bass");
    let mid = fft.getEnergy("mid");
    let treble = fft.getEnergy("treble");

    updateEqualizer(bass, mid, treble);

    let bassSize   = map(bass,   0, 255, 20, 60);
    let midSize    = map(mid,    0, 255, 5, 60);
    let trebleSize = map(treble, 0, 255, 5, 20);

    let bpulse = map(bass, 0, 255, 0, 40);
    let mpulse = map(mid, 0, 255, 0, 30);
    let tpulse = map(treble, 0, 255, 0, 20);

    let brushSize;
    if (currentBand === "bass") {
      let x = bass / 255;
      brushSize = constrain(20 + 70 * pow(x, 2.2), 20, 90); 
    } else if (currentBand === "mid") {
      let x = mid / 255;
      brushSize = constrain(10 + 55 * x, 10, 65);
    } else {
      let x = treble / 255;
      brushSize = constrain(4 + 24 * pow(x, 0.5), 4, 28);
    }

    // smoothen out strokes
    for (let s of strokes) {
      if (!s.points || s.points.length === 0) continue;
      // pulse depends on the stroke's band
      let energy = fft.getEnergy(s.band);
      let pulse = map(energy, 0, 255, 0, 40);

      // offset point arrays for a variable-width polygon
      const left = [];
      const right = [];
      for (let i = 0; i < s.points.length; i++) {
        const p = s.points[i];
        const base = p.baseSize || 20;
        const w = (base + pulse) / 2;

        // compute direction vector using neighboring points
        let prev = s.points[i - 1] || p;
        let next = s.points[i + 1] || p;
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;

        let nx = -dy;
        let ny = dx;
        const len = sqrt(nx * nx + ny * ny) || 1;
        nx = (nx / len) * w;
        ny = (ny / len) * w;

        left.push({ x: p.x + nx, y: p.y + ny });
        right.push({ x: p.x - nx, y: p.y - ny });
      }

      noStroke();
      fill(s.color);
      beginShape();
      for (let v of left) vertex(v.x, v.y);
      for (let j = right.length - 1; j >= 0; j--) vertex(right[j].x, right[j].y);
      endShape(CLOSE);

      const first = s.points[0];
      const last = s.points[s.points.length - 1];
      const firstW = ((first.baseSize || 20) + pulse);
      const lastW = ((last.baseSize || 20) + pulse);
      circle(first.x, first.y, firstW);
      circle(last.x, last.y, lastW);
    }

    if (seekSlider && !isSeeking && typeof soundFile.duration === 'function' && soundFile.duration() > 0) {
      try {
        seekSlider.value(soundFile.currentTime() / soundFile.duration());
      } catch (e) {
        // ignore
      }
    }

    if (mouseIsPressed && mouseInCanvas()) {
      if (!currentStroke) {
        currentStroke = { points: [], color: colorPicker.color(), band: currentBand };
        strokes.push(currentStroke);
      }
      // avoid duplicate points
      const pts = currentStroke.points;
      if (pts.length === 0 || dist(mouseX, mouseY, pts[pts.length - 1].x, pts[pts.length - 1].y) > 1) {
        pts.push({ x: mouseX, y: mouseY, baseSize: 20});
      }
    } else {
      currentStroke = null;
    }
  }
}

function mouseInCanvas() {
  return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}

function keyPressed() {
  // ignore shortcuts while typing into the seek slider or similar controls
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (key === '1') setBand('bass');
  else if (key === '2') setBand('mid');
  else if (key === '3') setBand('treble');
  else if (key === 'c' || key === 'C') clearCanvas();
}

function handleFile(file) {
  if (file.type !== "audio") {
    setTrackStatus("Please choose an audio file", false);
    return;
  }

  // stop and remove previous soundFile if it exists
  if (soundFile) {
    try { soundFile.stop(); } catch (e) {}
    try { soundFile.disconnect(); } catch (e) {}
    soundFile = null;
  }

  controlsGroup.html('');
  controlsGroup.hide();
  setTrackStatus("Loading…", false);

  soundFile = loadSound(
    file.data,
    () => {
      fft.setInput(soundFile);
      setTrackStatus(file.name, true);
      buildPlaybackControls();

      try { soundFile.setVolume(prevVolume); } catch (e) {}
      try { soundFile.onended(() => { if (playButton) playButton.html('▶'); }); } catch (e) {}
    },
    () => {
      setTrackStatus("Couldn't load that file", false);
    }
  );
}

function buildPlaybackControls() {
  playButton = createButton('▶');
  playButton.addClass('icon-btn');
  playButton.parent(controlsGroup);
  playButton.mousePressed(() => {
    if (!soundFile) return;
    if (soundFile.isPlaying()) {
      soundFile.pause();
      playButton.html('▶');
    } else {
      try { soundFile.play(); } catch (e) {}
      playButton.html('⏸');
    }
  });

  // muteButton = createButton('🔈');
  // muteButton.addClass('icon-btn');
  // muteButton.parent(controlsGroup);
  // muteButton.mousePressed(() => {
  //   if (!soundFile) return;
  //   try {
  //     const v = soundFile.getVolume();
  //     if (v > 0) {
  //       prevVolume = v;
  //       soundFile.setVolume(0);
  //       muteButton.html('🔊');
  //     } else {
  //       soundFile.setVolume(prevVolume || 1);
  //       muteButton.html('🔈');
  //     }
  //   } catch (e) {
  //     // ignore
  //   }
  // });

  seekSlider = createSlider(0, 1, 0, 0.001);
  seekSlider.parent(controlsGroup);
  seekSlider.input(() => {
    if (!soundFile) return;
    isSeeking = true;
    const frac = seekSlider.value();
    const dur = soundFile.duration() || 0;
    const newT = frac * dur;
    try {
      const wasPlaying = soundFile.isPlaying();
      soundFile.jump(newT);
      if (!wasPlaying) soundFile.pause();
    } catch (e) {
      // ignore
    }
  });
  seekSlider.changed(() => { isSeeking = false; });

  controlsGroup.style('display', 'flex');
  resizeCanvas(canvasHolder.elt.clientWidth, canvasHolder.elt.clientHeight);
}

function windowResized() {
  resizeCanvas(canvasHolder.elt.clientWidth, canvasHolder.elt.clientHeight);
}
