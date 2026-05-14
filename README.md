Creative coding major project repository

### Quiz 10 - Major Project Pitch

# The Living Landscape

## Part 1: Project Direction

**Project Path:** Original Artwork

### Vision & Inspiration

*The Living Landscape* is an interactive artwork in p5.js. It's a nature scene where the viewer's actions shape an ecosystem. Nurturing actions flourish it while damaging actions causes collapse.

Our primary inspiration is *Nomadic Tribe* by makemepulse (2019), an interactive experience showing how a natural environment can feel emotionally alive and responsive to user input. Another inspiration is Studio Ghibli's *Princess Mononoke* (1997) where every human action carries a lasting environmental consequence showing fragile balance between people and nature. Visually, the organic flowing motion of p5.js generative noise artworks (p5js.org) influenced our approach to animating the entire scene continuously, not just individual elements. Together these works define our direction - a living nature scene driven by interactivity.

---

### Inspiration Sources

#### 1. *Nomadic Tribe* by makemepulse (2019)
An interactive journey through an animated natural world. The way the environment feels alive and responsive even in stillness inspired our approach to a scene that breathes on its own.

[https://2019.makemepulse.com/](https://2019.makemepulse.com/)

![Nomadic Tribe by makemepulse](https://2019.makemepulse.com/assets/img/makemepulse-wishes-2019.jpg)

---

#### 2. *Princess Mononoke* by Studio Ghibli / Hayao Miyazaki (1997)
Miyazaki's film depicts nature and human civilisation in fragile, consequential balance. Every action toward the forest has a visible, lasting effect on the world. This directly shapes our project's core concept.

[Princess Mononoke -  Trailer](https://youtu.be/4OiMOHRDs14?si=ACdBvhGvAndIO91N)

![Princess Mononoke Forest Scene](assets/princess_mononoke.png)

---

#### 3. *p5.js Noise & Generative Art Examples* by  p5js.org
Generative artworks demonstrating Perlin noise producing organic, living visual systems like flowing fields, terrain and particle motion inspires us how to think about animating our scene as a whole rather than element by element.

[p5.js Examples](https://p5js.org/examples/)

[Perlin Noise - Flow Field
by arthurrc](https://editor.p5js.org/arthurrc/sketches/Bya9WiAnm)

![p5.js Noise Example](assets/p5js_noise_inspiration.png)

---

## Part 2: Mechanics

### User Input

The user input mechanic controls user interactions within the living landscape. Different forms of clicking will result in various behaviors of the ecosystem. A left-click plants a flower, while clicking and dragging scatters seeds across the terrain, leaving a trail of wildflowers that bloom after a short delay. Double-clicking a tree summons a bird’s nest, drawing birds to the branches and filling the scene with chirping audio. In addition, environmental behaviors will result from specific keypresses: R calls down rain, accelerating the growth of surrounding flowers, while X introduces damage, such as trees falling, water clouding with murk, and flowers wilting. Three consecutive X presses will also push the ecosystem into full collapse. As a result, each user action has a visible consequence, making them feel a great sense of responsibility for the ecosystem they are shaping. This directly reflects our theme of human choices carrying real, lasting impact on nature.

**p5.js functions:** `mousePressed()`, `mouseDragged()`, `doubleClicked()`, `keyPressed()`

(Angel Huang)

---

### Perlin Noise & Randomness

This mechanic makes the scene feel alive at all times. p5.js's `noise()` animates the entire world simultaneously- grass sways in coordinated wind motion, water ripples across noise-displaced vertices, clouds drift, rain particles follow winding paths and terrain has organic undulation. The `random()` function ensures every flower planted is unique- a different petal count, size, colour and stem curve each click. Noise and randomness together make sure the scene is never static and no interaction looks identical. This reflects nature's unpredictability inspired by the continuous textured motion of *Nomadic Tribe*.

**p5.js functions:** `noise()`, `noiseSeed()`, `random()`, `beginShape()`, `vertex()`

(Shweta Kamble)

---

### Time-Based

Time-based

The time-based mechanism would give the ecosystem its emotional rhythm, where each action triggers a cascading delay of actions and consequences, making the response feel more natural than instant. Like when you click a flow, the tree grows, and the river becomes clearer, or two after a few seconds. A health threshold would activate the project's wow moment, in which the sky would slowly transition to dusk, and fireflies would appear, growing in number with sustained positive interaction rather than being directly triggered. On the other hand, there's a destructive path: collapse unfolds gradually over many frames. Time transforms clicks into consequences and consequences into story, creating a world that grows and deteriorates at its own pace.

**p5.js functions:** `millis()`, `frameCount`, `lerp()`

(Rachel Seah)

---

### Audio

The audio mechanic is the emotional voice of the ecosystem it is the living state of the world reflected in real time with layered nature sounds driven by frequency analysis. The audio layer doesn’t just play background music; it actively analyses the frequency content of ambient soundscapes and uses those values to drive the animation of visual elements in the scene.

The mechanic uses p5. sound’s FFT (Fast Fourier Transform) analyser to split the audio into different frequency bands. Water ripples across the river surface are driven by bass frequencies, the low rumble of wind and earth, making the water pulse, swell with deeper tones. Birdsong and the rustling of leaves fill out the mid frequencies and animate the sway speed of grass and the shimmer of tree canopies so that the visual world breathes in rhythm with the natural soundscape. Treble frequencies – the bright chirp of birds and trickle of water – generate glittering particle effects at the edges of trees and along the riverbank, adding visual sparkle to high-pitched moments.

Importantly, the audio layer responds to the ecosystem health score that is set by the user input mechanic. When the ecosystem is thriving, a layered nature soundscape plays rich with birdsong, flowing water and wind through the leaves, and visuals are vibrant and energetic. As health fades, the soundscape gradually recedes, instruments dropping off one by one. At collapse, an ominous low drone takes over, and visuals desaturate and slow. This makes the audio a direct emotional analogue to the state of the world; the audience hears the ecosystem dying before they see it.

**p5.js functions:** `loadSound()`, `p5.FFT()`, `fft.analyze()`, `fft.getEnergy()`, `p5.Amplitude()`, `amp.getLevel()`, `map()`, `song.play()`, `song.pause()`

(Nishant Reddy)

---

## Part 3: Putting It Together

All four mechanics share a single canvas, unified by one concept- ecosystem health. User input raises or lowers an invisible health score. Perlin noise animates the entire world continuously, giving the scene life independent of the user. Time-based events create cascading consequences like a flower click leads to tree growth seconds later, sustained health tips the world into dusk and fireflies appear. Audio reflects ecosystem state in real time, shifting from rich layered nature sounds to silence as damage accumulates. No mechanic works alone, each feeds into the others making the world feel like one connected living system.

---

## Interaction Reference
| Interaction |  What Happens |
|---|---|
| Left click on ground | Flower grows with unique random petals |
| Click & drag on ground |  Seed trail --> wildflower path blooms after delay |
| Double click on a tree |  Bird nest forms, birds arrive, chirping plays |
| Press **R** key | Rain shower --> speeds up growth |
| Press **X** key |  Environmental damage- trees fall, water gets murkier |
| Press **X** key 3+ times | Collapse- sky darkens, trees wither, drone plays |
| Health threshold reached |  Dusk transition --> fireflies appear (earned, not triggered) |
| Passive / no interaction |  Grass sways, water ripples, clouds drift |

---

