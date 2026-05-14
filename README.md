Creative coding major project repository


Testing

working
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

User Input Text Here

---

### Perlin Noise & Randomness

This mechanic makes the scene feel alive at all times. p5.js's `noise()` animates the entire world simultaneously- grass sways in coordinated wind motion, water ripples across noise-displaced vertices, clouds drift, rain particles follow winding paths and terrain has organic undulation. The `random()` function ensures every flower planted is unique- a different petal count, size, colour and stem curve each click. Noise and randomness together make sure the scene is never static and no interaction looks identical. This reflects nature's unpredictability inspired by the continuous textured motion of *Nomadic Tribe*.

**p5.js functions:** `noise()`, `noiseSeed()`, `random()`, `beginShape()`, `vertex()`

---

### Time-Based

Time-based Text Here

---

### Audio

Audio Text Here

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

