# Crew Health Companion

**Autonomous astronaut health self-assessment and decision support, built for the NASA Space Apps Challenge.**

🔗 **Live demo:** https://coderony1.github.io/nasa-crew-health-companion/

![Screenshot of Crew Health Companion](screenshot.png)
![alt text](image.png)

## The problem

Missions to the Moon and Mars are getting longer. On a Mars mission, communication with Earth can be delayed by about 20 minutes each way, so astronauts cannot always wait for a flight surgeon. They need to be able to check their own health, understand what the numbers mean, and know what to do next.

## Our solution

Crew Health Companion is a visual, interactive web tool where the astronaut **enters their own measurements** and checks any part of the body at any time. Nothing is pre-filled: each body region starts as "No data" and changes color only after the astronaut logs a reading.

### Features

- **Interactive human body:** click the brain, eyes, heart, lungs, gut, spine, muscles or skin to open that region.
- **Self-entered data:** simple forms for each region (for example pulse and blood pressure, glucose in mg/dL, sleep hours, mood, SpO2, temperature).
- **Color-coded status:** gray (no data), green (normal), yellow (caution), red (critical), shown on the body and on the cards.
- **Guidance for each region:** what the body part does, how spaceflight affects it, how to measure it, recommended actions, and when to contact the flight surgeon.
- **Crew Readiness Score** computed only from the regions the astronaut has measured.
- **Mission context selector:** ISS, Transit Orion, Lunar Base, Mars Habitat.
- **Anatomy layers:** All / Skin / Muscle / Skeleton / Organs.
- **History and trends** for past readings, stored locally in the browser.


## How it connects to NASA's Human Research Program

NASA's Human Research Program groups spaceflight risks into five hazards. Our app links each body region and indicator to them:

| Hazard | Example effects we track |
|---|---|
| Space radiation | Immune and overall health indicators |
| Isolation and confinement | Mood, sleep, stress |
| Distance from Earth | Need for self-assessment and clear escalation guidance |
| Gravity fields | Bone, muscle, cardiovascular and fluid changes |
| Hostile / closed environments | Temperature, breathing, hydration, nutrition |

## How to run it locally

No build step is needed.

```bash
git clone https://github.com/codeRony1/nasa-crew-health-companion.git
cd nasa-crew-health-companion
```

Then either open `index.html` in your browser, or use the **Live Server** extension in VS Code.

## Tech

HTML, CSS and vanilla JavaScript, with SVG for the body figure. Data is saved in the browser's `localStorage`, so no server or account is needed and nothing leaves the user's device.

## Important note

This is a **prototype for decision support only**. It uses general reference ranges and is **not a medical diagnosis tool**. Real medical decisions must involve qualified flight surgeons and medical staff.

## Sources and credits

- NASA Human Research Program, *Five Hazards of Human Spaceflight*: https://www.nasa.gov/hrp/hazards
- NASA Human Research Roadmap: https://humanresearchroadmap.nasa.gov/
- NASA-STD-3001, Space Flight Human-System Standard
- Body figure artwork: TODO (add the source and license of `body.svg`, or say it was drawn by us)
- Space background: built with CSS and SVG by our team
- General reference ranges: TODO (list the sources used, for example WHO or the American Heart Association)

## Feedback

Found a bug or have an idea? Please open an [Issue](../../issues) or use our feedback form: TODO (add Google Form link).

