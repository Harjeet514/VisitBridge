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
- Type an entry, leave the field or close the tab, then reopen the prototype. Choose **Resume draft** to continue with the saved text. The save strip confirms when the draft has been written to this device, and provides a retry action if saving fails.
- Open the bell to review a changed visit time or a new visit assignment. Acknowledge each update to clear its unread status. **Preview schedule update**, beneath the phone, delivers another example change and updates the upcoming schedule.
- Use **Restart demo** to start a fresh visit and try another path.

The patient, visit, and care data are fictional. Visit records and unfinished drafts are stored in IndexedDB in the same browser on this device. Restart demo replaces the saved example visit. Clearing browser data also removes these records. Concurrent saves merge field changes inside a database transaction.

Schedule updates are interactive examples delivered within the prototype. They demonstrate an unread inbox, changed times, new assignments, and acknowledgment. A live scheduling service and operating-system push notifications would require a connected backend.

## Changes after prototype testing

- Medication administration uses separate date and time controls. Invalid or missing values block review; the chosen values appear in the saved medication record.
- Reassessment uses one pain score from 0–10 across entry, the response card, and visit review. Patient comments have a separate optional field.
- **Open rescheduled visit**, on Home and the confirmation screen, continues into care. The afternoon appointment time follows arrival, assessment, medication, response, completion, and the completed schedule.
- Existing browser drafts migrate to the structured fields. Unfinished date/time and pain entries can also be resumed.

The [Figma testing review](https://www.figma.com/design/WG9qRkS62R9TH7rb4eUzzR/Untitled?node-id=218-857) documents the original problems and design changes.

## Regression checks

Run `npm test` with Node.js. The focused tests cover date/time validation, old draft migration, pain-score consistency, rescheduled entry points, and the afternoon time context. Browser walkthroughs cover the interactive flows.

## Ontario Design System

VisitBridge uses Ontario’s colour palette and typography, with published button, field, hint, and error styles from `@ongov/ontario-design-system-complete-styles` 9.2.2. The styles are bundled in `vendor/ontario/` and fitted to the mobile prototype. The web app uses Ontario’s Raleway Modified and Open Sans. The companion Figma file uses standard Raleway and Open Sans with editable VisitBridge components.

[Ontario Design System documentation](https://designsystem.ontario.ca/)

## Project structure

- `index.html` sets up the iPhone frame.
- `styles.css` defines the design tokens and reusable layouts.
- `ui.js` renders the shared controls and screen shell.
- `screens.js` defines the screens and sample visit data.
- `app.js` connects navigation, form editing, and the visit state.
- `draft-store.js` persists and recovers visit records and drafts on the device.
- `care-record.js` validates structured entries and supplies the current visit time context.
- `visit-updates.js` supplies the sample assignments and schedule changes.

## Design and asset credits

- Published reference X-rays by Latip et al., *Cureus* (2025), [Figure 1](https://pmc.ncbi.nlm.nih.gov/articles/PMC11847165/figure/FIG1/) and [Figure 3](https://pmc.ncbi.nlm.nih.gov/articles/PMC11847165/figure/FIG3/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- The Ontario Design System styles, Raleway Modified, and Open Sans ship with their license files in `vendor/ontario/`.

