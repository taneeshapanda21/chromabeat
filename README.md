# ChromaBeat
**by Taneesha Panda**

My inspiration for ChromaBeat came from a combination of generic spectral audio visualizers and a couple of specific audio-visual works — namely Golan Levin's YellowTail and Eric Rosenbaum's Singing Fingers. 

I wanted to bring that concept into an interactive form by turning sound into an expressive medium. This tool allows brush strokes to change with different parts of the sound spectrum while giving the user full control over color and gesture. It uses the Fast Fourier Transform (FFT) from the p5.js sound library to analyze audio, breaking down the signal into its component frequencies to get bass, mid, and treble ranges. The strokes aren't static either, as each stroke remembers which band it was painted with, and its width is recalculated every frame from that band's current energy. That means even strokes from a few seconds ago continue to pulse in sync with the music as it plays.

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