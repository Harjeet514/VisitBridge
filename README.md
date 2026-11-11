# VisitBridge

VisitBridge is an interactive home nursing visit prototype presented in an iPhone frame. It follows the VisitBridge Figma design from the splash screen through arrival, fracture care, medication documentation, and the visit outcome.

## Run locally

Serve the repository with any static HTTP server. Run this command from the repository directory, then open [localhost:8080](http://localhost:8080).

```sh
python3 -m http.server 8080
```

The app uses native HTML, CSS, and JavaScript modules. It runs without a build step or API keys.

## Try the flows

- Open Robert’s visit, confirm he is home, and review the fracture record or the X-ray reports.
- Save a visit assessment, record a medication with the on-screen keyboard or the signed order shortcut, and review and sign the visit.
- Choose **Patient unavailable** to log a missed visit and request coordinator follow-up, or confirm that Robert is away and reschedule.
- Use **Restart demo** to start a fresh visit and try another path.

The patient, visit, and care data are fictional. Edits stay in the current browser session.

## Ontario Design System

VisitBridge uses Ontario’s colour palette and typography, with published button, field, hint, and error styles from `@ongov/ontario-design-system-complete-styles` 9.2.2. The styles are bundled in `vendor/ontario/` and fitted to the mobile prototype. The web app uses Ontario’s Raleway Modified and Open Sans. The companion Figma file uses standard Raleway and Open Sans with editable VisitBridge components.

[Ontario Design System documentation](https://designsystem.ontario.ca/)

## Project structure

- `index.html` sets up the iPhone frame.
- `styles.css` defines the design tokens and reusable layouts.
- `ui.js` renders the shared controls and screen shell.
- `screens.js` defines the screens and sample visit data.
- `app.js` connects navigation, form editing, and the visit state.

## Design and asset credits

- Published reference X-rays by Latip et al., *Cureus* (2025), [Figure 1](https://pmc.ncbi.nlm.nih.gov/articles/PMC11847165/figure/FIG1/) and [Figure 3](https://pmc.ncbi.nlm.nih.gov/articles/PMC11847165/figure/FIG3/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- The Ontario Design System styles, Raleway Modified, and Open Sans ship with their license files in `vendor/ontario/`.
