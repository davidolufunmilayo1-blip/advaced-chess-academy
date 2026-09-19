# Public chess website

The separate academy is published on GitHub Pages:
https://davidolufunmilayo1-blip.github.io/advaced-chess-academy/

GitHub Pages publishes `main` from the repository root. `index.html` opens `david.html`; `.nojekyll` keeps the existing assets unchanged. `about.html` is the public introduction and share destination.

Computer and same-device games, puzzles, lessons, game review, study tools and the Academy Lab run in the browser. Progress stays in that browser. GitHub Pages cannot run the Node server, so online multiplayer, friend tournaments and shared community posts are explicitly unavailable in this edition.

The Kiddo Sprout public games card links here; the academy remains a separate website. Its published card source is `public-site/games/index.html` in `hammy-boy/KiddoSprout-Family-Hub`.

For the full server edition, use a persistent Node-compatible host, run `npm start`, and configure `PUBLIC_SITE_URL`, `PORT` and a persistent `DATA_DIR`. Do not scale the JSON-backed server to multiple instances. No server hosting service has been deployed.
