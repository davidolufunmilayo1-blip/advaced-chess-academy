# Advaced Chess Academy ♛

A chess website with local and computer play, real multiplayer rooms, puzzles, interactive lessons, and game replay. No npm dependencies, accounts, or API keys are needed.

## Design and navigation

The site uses an original queen logo, a purple-and-cream palette, colorful activity cards, and shared navigation across Play, Online, Puzzles, Learn, Review, Study, Watch, and Community. Desktop uses a grouped sidebar; smaller screens have an expandable Menu. Search activities by name, or press `/` or Ctrl/Cmd+K to focus the menu search. A keyboard skip link goes straight to the main content.

Use **Night colors / Day colors** in the top bar to change the appearance. The choice is remembered in this browser. **Board focus** on the Play page hides the introduction and activity cards. **Make it yours** expands the game and board settings. The home page's **tiny challenge** opens the daily puzzle; the sidebar progress reflects actual completed puzzles and lessons.

The board now defaults to **Club violet**, with the previous Garden, Walnut, Ocean, and Slate choices still available.

Open **Your trophy shelf** on the Play page to see six achievement badges. Completing 1, 5, and all puzzles or lessons earns the corresponding badges; repeated completions do not add extra progress. The shelf updates as you practice using the progress saved in this browser.

## Academy Lab

Open **Academy lab** in the navigation or the Play page activity cards for eight learning activities: square colours, knight vision, piece paths, material maths, notation decoding, rules, opening recognition, and board memory. Choose Easier, Medium or Harder and a relaxed, 60-second or three-minute round of up to ten questions. Answer with buttons or number keys 1–4. Hints and skips do not earn points. Memory diagrams hide before you answer and return with the explanation.

Rounds leave your current game untouched; leaving the activity ends the round. Personal bests are compared only within matching activity, difficulty and timer settings. The last 30 nonempty rounds are saved in this browser; these new lab scores are not included in profile backup files. Rules, notation and opening questions use finite authored pools; board-vision and material questions are generated. Diagrams teach movement and memory and are not full legal game positions.

## Mistake clinic

After analysing a game in Review, select an inaccuracy, mistake, or blunder and choose **Practise this mistake**. The clinic saves up to 30 positions in this browser, with filters for completed positions and positions needing practice. Hints and revealed suggestions do not earn completion; retry without help to complete an exercise. Suggestions come from the bounded local analysis, not a guaranteed best-move engine. Saved positions are included in progress backups.

## Start the website

Install Node.js 22 or newer, then run this from the project folder:

```sh
npm start
```

Open **http://localhost:8001**. `PORT` changes the port and `HOST` changes the listening interface. The default listener is `0.0.0.0`, allowing other devices on your network to connect.

Opening `david.html` directly still supports local play, computer play, puzzles, and lessons. Online play requires the server.

## Play online

1. Open **Online**, enter a name, and choose a time control.
2. **Create a private game** generates an invitation. Give the game code or copied link to your friend.
3. Your friend opens the same website and joins with the code. The creator plays White and the joiner plays Black.
4. **Find an opponent** pairs two waiting guests who choose the same time control on this server. This does not connect to Chess.com or Lichess.

For two devices on the same Wi-Fi, both should open `http://YOUR_COMPUTER_LAN_IP:8001`. A `localhost` invitation only works on the computer running the server. To test on one computer, use two browser tabs or browser profiles.

Moves, timeouts, game results, and draw offers are checked by the server. Games include chat and reconnect support. The first move starts the clocks. Keep the game tab open: its private player credential is held in session storage and survives refresh. The **Online** page has a reconnect button. Leaving a board does not stop its clock; resign if you want to end the game.

Game data is stored in `.data/rooms.json`, with hashed player credentials. The server restores rooms after restart and deducts elapsed time from active clocks. Rooms expire after 24 hours without a move, chat message, or game action. Chat is limited to the latest 50 messages per room. `.data` is not served as a website asset.

## Train and learn

- **Train:** a 30-second coordinate sprint from either side of the board, a saved personal best, themed tactics practice, and a shortcut to the next unfinished lesson.
- **Game history:** automatically keeps up to 50 recent local, computer, and online game snapshots in this browser. Search, filter by completion, replay without changing your current board, download individual or combined PGNs, and remove saved games. Browser storage limits can prevent saving very long histories.

- **Puzzles:** 12 authored positions covering checkmate, material wins, a multi-move knight fork, and promotion. Filter by theme, get hints, reveal a solution, or use the rotating daily puzzle. Revealed solutions do not count as solved. The daily puzzle cycles through this small collection.
- **Learn:** 10 interactive lessons for all six pieces, castling, en passant, promotion, and checkmate.
- **Review:** Replay the current game with a move list, first/previous/next/last controls, material balance, and PGN download. Loading review takes a snapshot without changing your live game.
- Puzzle completions, lesson completions, and practice streaks stay in this browser. There are no cloud profiles or cross-device progress sync.

## Friend tournaments

Open **Tournaments**, enter a nickname and tournament name, choose a time control, and create a cup. Share the invitation with 1–7 friends, then the host clicks **Start tournament**. Invitations need a website address that all players can reach; localhost works only on the host computer.

Everyone plays everyone once in round-robin rounds. Odd player counts receive a bye with no points. The next round opens when every game in the current round finishes. **Play game** opens an actual server-validated online board. Wins score 1 point and draws ½; standings sort by points, then wins, with equal records sharing a place. Clocks start on the first move. Participants can resign or agree to a draw through the normal game controls.

The tournament picker retains up to 20 tournament sessions in the current browser tab. Keep the tab to retain your private player access; sessions survive refresh. Tournament data survives server restarts in `.data/tournaments.json`. That private file contains the credentials needed to reconnect participants to their assigned rooms and must not be published. Tournament rooms are retained so later rounds and replays continue working. Limits are 100 tournaments and 1,000 total rooms per server. There is no tournament withdrawal or host adjudication yet; unfinished games must finish before the next round opens.

## Community

Choose **Community** in the navigation, or open `http://localhost:8001/chess-extras/community.html`.

Players can choose a nickname, start conversations in Questions, Ideas & Tips, or Little Wins, reply, like posts, search, and filter by category, popularity, unanswered questions, or their own posts. Conversations have shareable links. Authors can delete their own posts and replies. Posting requires the server; posts are shared across visitors and survive restarts.

Community data is stored in `.data/community.json`. The browser saves an anonymous session token in local storage; the server stores only its hash. Nicknames are not verified identities and changing a nickname applies to new messages. Clearing browser storage loses the ability to manage earlier messages as their author.

Reporting hides the entire conversation immediately, including its replies, until the site owner restores or removes it. The **Moderator tools** link is at the bottom of the Community page. On first startup the server creates a private access key in `.data/community-moderator-key`; the site owner can read that local file and paste its value into the moderator form. The key is never served by the website or saved in browser storage. Alternatively, set `COMMUNITY_MODERATOR_KEY` to a secret of at least 24 characters before starting the server.

The community is intended for a small, supervised club. Reports require the site owner to review them; there is no staffed moderation service or automatic content review. Limits are 500 conversations, 50 replies per conversation, and a short posting cooldown. Back up `.data` to retain discussions and moderator access. No private messaging, email addresses, or birth dates are requested by the community feature.

## Watch chess

Choose **Watch** in the main navigation, or open `http://localhost:8001/chess-extras/watch.html`.

- Follow the current Lichess TV game on a native board using its public live feed, with player names, last-move highlighting, and synchronized clock updates.
- Select the Chess.com or chess24 Twitch channel. Streams are available when the broadcaster is on air; this site does not invent live status or viewer counts.
- Paste a YouTube video/live link or a Twitch channel URL to load that source. A publisher may disable embedding, so every selection also includes a direct link.
- Save favorite channels, filter the channel list, reload a player, or use focus mode.
- Open current tournament boards on Lichess, the Chess.com broadcast schedule, or FIDE news and events.

An internet connection is required. Twitch's embed requires a parent hostname and a minimum width of 400 pixels; small screens and file URLs receive a direct viewing link instead. YouTube playback uses its privacy-enhanced embed domain with autoplay disabled. The site cannot control provider outages, blocked third-party content, or stream availability.

Integration references: [Lichess TV API](https://lichess.org/api#tag/TV/operation/tvFeed), [Twitch video embeds](https://dev.twitch.tv/docs/embed/video-and-clips/), and [YouTube player parameters](https://developers.google.com/youtube/player_parameters). Tournament links point to the [Lichess broadcast directory](https://lichess.org/broadcast), [Chess.com schedule](https://www.chess.com/article/view/broadcasts), and [FIDE](https://www.fide.com/).

## Study room

Choose **Study** in the main navigation, or open `http://localhost:8001/chess-extras/index.html`.

- Play either side on a separate analysis board, step backward or forward, and explore a new continuation from any position.
- Import and copy FEN positions, including move counters and castling rights.
- Import one PGN game by pasting text or choosing a file. The main line is retained; comments and side variations are skipped. Export studies as PGN.
- Find up to three candidate moves with a lightweight two-ply search. Estimates are from White's perspective and are not Stockfish evaluations.
- Practice eight opening reference lines as White or Black, with automatic replies, hints, explanations, and completion tracking.
- Save up to 100 studies with notes, search your shelf, and download or restore JSON backups. Studies remain in this browser; back them up before clearing browser data.
- Load your last saved local game into analysis without changing the original game.

The study page also works by opening `chess-extras/index.html` directly. Browser storage for a file URL may differ from storage on localhost.

## Local and computer games

Choose your opponent, color, and optional 3/5/10/15-minute clock in **Make it your game**, then click **New game**. The computer has three lightweight search levels. Board themes, synthesized move sounds, hints, turn-based undo, resignation, PGN export, and automatic local saving are included.

Keyboard: **F** flips the board, **U** undoes, **H** gives a hint. Arrow keys navigate board squares and Enter selects. Hints and undo are unavailable online.

Local games resume from their saved clock when the page reopens; local clocks do not run while the page is closed. Opening several local-game tabs can overwrite the same local save.

## Public hosting

The public GitHub Pages edition is available at **https://davidolufunmilayo1-blip.github.io/advaced-chess-academy/**. It supports computer and same-device chess, puzzles, lessons, reviews and training. Online multiplayer, tournaments and shared community posts are disabled on that edition because they need a server.

The full server edition runs as one persistent Node server. Deploy it to a Node-compatible host with:

- Start command: `npm start`
- Node.js 22 or newer; no build command or dependency install required
- The host-provided `PORT` environment variable
- HTTPS through the host or a reverse proxy that preserves the request Host header
- Persistent storage for the project’s `.data` directory
- One application instance; the JSON room store is not designed for several replicas

A Dockerfile is included. Mount `/app/.data` as a persistent volume. A static-only website host cannot run the multiplayer API.

This is a casual chess site, not feature parity with Chess.com or Lichess: it does not include accounts, ratings, tournaments, anti-cheat, or a large puzzle database. The built-in computer is not Stockfish. Threefold repetition and the fifty-move rule are automatic draws. Timeout handling recognizes a bare opposing king as a draw but does not evaluate every position where checkmate is impossible.

## Checks and source layout

```sh
npm test
node tests/browser.cjs
```

`npm test` checks the rules, every training solution, and two-client multiplayer behavior including authentication, move validation, matchmaking, timeouts, chat, draws, and persisted recovery. These tests open a temporary localhost port.

The browser test uses an already-installed Chrome, with no downloads or packages. On macOS it finds the standard application location; elsewhere set `CHROME_PATH` to the browser executable. It checks desktop and mobile layouts, training, replay, and two-player interactions, and prints the temporary screenshot directory.

- `david.html`: main page and local/computer game controls
- `lib/chess-core.js`: shared browser/server chess rules
- `public/app.js` and `public/app.css`: navigation, online games, training, and replay
- `public/training.js`: puzzle and lesson content
- `server.cjs`: HTTP server, multiplayer API, and room persistence

## Tools

**Tools** provides a separate two-player clock for over-the-board games (1–180 minutes, 0–60 seconds increment), pause/resume and reset, a flippable coordinate reference, a searchable notation guide, and a personal notebook with text download. The clock continues when navigating within the page; reload resets it. Notes save only in this browser. These tools do not change your online game or its clock.

## Public discovery and sharing

The `/about.html` introduction page explains the real features and links to games, lessons, puzzles, study, watch, and community. The shared navigation includes a **Share club** button that copies this introduction link. It explains that a public address is needed when opened on localhost.

When deploying the Node server with persistent `.data` storage, set `PUBLIC_SITE_URL` to the exact public origin, for example `https://chess.example.com` (no path). The server then adds page-specific descriptions, Open Graph titles/descriptions, canonical URLs, WebSite structured data, `/robots.txt`, and `/sitemap.xml`. Without this setting, served pages are marked noindex and crawling is disallowed; local development URLs should not be submitted to search engines. No rankings, indexing, or visitor numbers are guaranteed. These changes do not deploy the site or submit it to Google.

`LAUNCH.md` contains ready-to-use announcement and first-event drafts. No messages have been sent. Reference: [Google’s developer guide to search](https://developers.google.com/search/docs/fundamentals/get-started-developers).

### Board arrows
Right-drag between squares to draw an arrow. On a laptop, press **A** or click **Arrow mode**, then click two squares or use a normal trackpad click and drag. On touch screens, enable **Arrow mode**, then tap a starting square and a destination (or drag). Turn Arrow mode off to move pieces. Drawing the same arrow again removes it; **Clear arrows** removes all annotations. Arrows follow the board when flipped and clear when the position changes. Annotations stay private to your browser and do not submit moves.

Choose a drawing colour (gold, red, green, blue) or select **Circle** to mark a square with one click. Right-clicking a square also draws a circle. Repeating a drawing in the same colour removes it; a different colour recolours it. **Undo drawing** reverses drawing changes, including clearing the board, without undoing chess moves. Drawing history resets when the chess position changes.

### More club rooms
The main menu includes **Chess glossary**, with 24 searchable definitions and topic filters, and **Checkmate guide**, with six explained patterns that open their matching practice puzzles. Both rooms preserve the current game. They can also be opened directly with `david.html#glossary` and `david.html#mates`.

### Endless puzzles and difficulty
Open **Puzzles** and choose **Endless puzzles** for unlimited generated mate-in-one practice. **Easy** uses fewer pieces, **Medium** adds distractions, and **Hard** requires exactly one legal mating move. These are board-complexity settings, not Elo ratings. Every solution is checked with the shared rules engine, including alternative promotions. **Next puzzle** generates another position; the last 200 generated positions are avoided, but positions can eventually repeat. The original theme filters and daily puzzle remain in **Guided collection**.

Endless solved counts are stored separately in this browser, with a capped list of 200 recent solved IDs to prevent immediate retry double-counting. Revealing a solution does not count as solving it. No external puzzle service or account is required.

### Endless learning
In **Learn**, choose **Start endless learning** or select the **Endless learning** collection. Practise all six pieces or select one. Easy gives a clear capture on an uncluttered board; Medium adds obstacles; Hard asks for the selected piece’s only capture that allows no legal immediate recapture. Every exercise includes a movement explanation, hint, show-the-move option, retry, and next lesson. Difficulty describes the exercise, not an Elo rating. These are generated movement and capture exercises; the original ten guided lessons still cover special rules and checkmate.

Learning scores are stored separately from puzzle and guided-lesson scores. Reveals do not count, and retrying a recently completed lesson does not add another point. The last 200 generated positions are avoided; eventual repeats remain possible.

### Guided lesson levels
**Learn → Guided lessons** now has 16 lessons: 7 Easy, 6 Medium, and 3 Hard. The guided Difficulty selector filters the catalogue; Next lesson stays within the selected level. New topics cover knight development, blocking check, pinned defenders, knight forks, rook skewers, and discovered checks. The three Hard lessons include an automatic opponent reply and a second player move; completion is awarded only after the full sequence. Hints follow the current step, and Show the move reveals the whole sequence without completion credit. Existing lesson IDs and progress are preserved, and the completion totals and scholar badge now use 16 lessons.

### Opening Explorer, Endgame Academy, and Puzzle Rush
The main menu includes three additional rooms with independent boards:

- **Opening Explorer:** eight curated opening lines with search, favourites, move-by-move replay, board flip, and White/Black practice. Correct moves advance the teaching line and automatically play the other side. Completion and favourites save locally. This is a teaching collection, not a statistical database.
- **Endgame Academy:** six guided mate-in-one finishing drills covering queen/king teamwork, rook ladders, both colours of back-rank mate, bishop teamwork, and promotion. Hints, reveal, retry, and separate completion tracking are included; revealed solutions do not earn completion.
- **Puzzle Rush:** 1-, 3-, or 5-minute generated-puzzle runs, a fixed difficulty or Climb mode (Medium after 5 solves, Hard after 10), three mistakes, and skip costing a mistake. Timers count elapsed wall-clock time. Leaving the room ends the run. Up to 20 runs are saved locally, with personal bests compared only across identical settings. No public rankings are claimed.

These rooms preserve the active game. Open directly with `david.html#openings`, `#endgames`, or `#rush`.

### Full move review
Open **Game review → Analyse all moves** to analyse every half-move of the loaded game. Saved-game Replay uses the same review panel; you can also paste a single PGN, including a custom FEN and starting move number. Review never changes the played game.

The local engine runs in a Web Worker with selectable maximum depths of 2, 3, or 4 plies and bounded node budgets; it keeps only completed search iterations and reports the actual completed depth per move. It extends short forcing captures/check evasions at leaf positions. Results are approximate and are not Stockfish or Chess.com ratings. Long-range tactics, repetition, and deeper positional play can be missed.

Each analysed move has a Best, Excellent, Good, Inaccuracy, Mistake, Blunder, Missed mate, or Forced label, evaluation from White’s perspective, evaluation loss, candidate moves, and an explanation. Ratings use loss thresholds of 1/25/60/120/250 centipawns; forced moves and missed forced mates are labelled separately. Per-side estimated accuracy averages `100 * exp(-loss / 180)`. The graph, error filter, next-mistake navigation, and suggested-move board preview help explore the results. Analysis can be stopped; partial results remain available. Annotated PGN export includes those results as comments.

### Character coaches
**Coaches** offers eight original fictional guides: Pip, Luna, Bolt, Moss, Nova, Sunny, Skye, and Zig. Choose a coach or use **Random coach**, which never immediately repeats the current coach. The optional surprise-on-visit setting, along with the selected coach, is saved locally. Choose from eight advice topics, cycle through written tips, or follow the coach’s practice link. Coach companion panels appear in Learn, Puzzles, and Game Review. These are authored character tips, not live human coaching or AI chat, and do not analyse or alter a live game.

### My Profile
Open **My profile** from the main menu or the top shortcut. Choose a nickname and one of eight avatars; preferences are saved locally and the nickname pre-fills new online games without renaming an active room. The profile shows your selected character coach, guided and endless learning totals, opening/endgame progress, saved-game count, 3-minute Climb personal best, puzzle streak, earned badges, and recent saved games. Figures come from existing local progress; there is no invented rating, public account, or cross-device sync. Clearing this browser’s data removes the profile and local progress.

### Expert difficulty
Choose **Puzzles → Puzzle collection → Expert · mate in two** for 16 verified challenges (eight positions, each playable from either colour). None has mate in one, every correct first move is accepted, and the challenge data covers every legal defensive reply. The opponent selects a legal reply and you must find checkmate on your second move. Legal-move markers are hidden; three legal but incorrect moves end an attempt. Hints turn the attempt into practice, and revealing the line does not earn completion. Retry starts a fresh attempt; Expert completions are stored separately from the guided and endless puzzle totals. This is a finite challenge collection, not additional infinite mate-in-two generation.

Hard computer mode now uses iterative search up to four plies with a 1.1-second search budget and short capture/check-evasion extensions. Completed iterations are retained when time runs out. This improves tactical play but is not a rated engine strength.

### Five puzzle difficulty choices
The Puzzles difficulty selector offers **Easiest**, **Easier**, **Normal / Medium**, **Harder**, and **Hardest**. Easiest generates sparse mate-in-one positions and highlights a starting piece; Easier adds a few pieces; Normal / Medium adds more distractions; Harder requires exactly one mating move. Hardest opens the existing 16 Expert mate-in-two challenges with no legal-move markers. Selecting any of the first four switches to generated practice; selecting Hardest switches to the Expert collection. The selector stays available in every collection, and returning from Expert to Endless restores the last generated level used in the current page session.

### Daily plans, opening review schedules, and backups
**Today’s plan** offers short and balanced practice goals, counts unique exercises actually completed that day, and displays seven days of activity. Guided and endless lessons, puzzles, opening sides, and endgames report completions; revealed or assisted Expert answers do not count. Dates use the local calendar. Up to 31 days of activity are stored in this browser.

**Opening Explorer** schedules White and Black independently. A clean completed line returns after 1, 3, 7, 14, and then 30 days. Mistakes or hints reset the interval to one day. Repeating a clean line before it is due does not advance its interval. The due-practice button starts an unseen or due side.

**My profile → Keep your progress** downloads a versioned JSON backup of the allowlisted profile, coach, guided/endless/Expert progress, opening favourites/completions/schedules, and endgame progress. It excludes games, room tokens, invitations, notes, and daily activity history. Import validates a file up to 1 MB and shows a preview. Merge unions completion lists, keeps higher endless totals, keeps the newer opening schedule per side, and preserves an existing profile/coach choice. Applying a merge reloads into the profile page and is blocked during an active online game. Storage writes are rolled back if a partial failure occurs, with a clear message if rollback itself fails.
