# ChromaBeat
**by Taneesha Panda**

My inspiration for ChromaBeat came from a combination of audio-visual works: Golan Levin's YellowTail, Eric Rosenbaum's Singing Fingers, and numerous audio visualizers I've seen online. There's a lot of spectral audio visualizers for EDM/dubstep music and I find them really mesmerizing — they make the invisible parts of sound visually tangible.

I wanted to bring that concept into an interactive form by turning sound into an expressive medium. This tool allows the brush itself to change with different parts of the sound spectrum while giving the user full control over color and gesture. The result is a creative space where music directly shapes the artwork being made.

## How it works

ChromaBeat uses the Fast Fourier Transform (FFT) from the p5.js sound library to analyze the loaded audio in real time. The signal is broken down into its component frequencies every frame, giving continuously updated energy levels for the bass, mid, and treble ranges. The strokes aren't static once drawn, as each stroke remembers which band it was painted with, and its width is recalculated every frame from that band's current energy. That means even strokes from a few seconds ago keep breathing and pulsing in sync with the music as the song plays on.

**Features:**

- Upload a local audio track (.mp3, .wav, .m4a)
- Full color picker for stroke color
- Three distinct frequency-reactive brushes — bass, mid, treble
- Click-and-drag drawing with variable-width, smoothed strokes
- Undo and clear canvas
- Light / dark theme toggle
- Keyboard shortcuts for fast band switching

**How to Use:**

1. Clone or download this repository.
2. Serve the folder with a local web server
3. Open the served address in your browser, load a track, and start drawing.