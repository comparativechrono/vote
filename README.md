# Live recap

An interactive recap lecture for GM2 Research and Statistical Skills: the material of Leonardo’s lectures in weeks 2 and 3, as slides with interactive graphs, 51 questions that students answer on their phones, and live results.

- **`present.html`** is what you show: the recap as slides, a graph to play with on each recap slide, the questions with their live results, the QR code and the comments sent from phones.
- **`index.html`** is what students open by scanning the QR code: it follows your slides, takes their votes, numbers, free-text answers and comments, and afterwards lets them revise every slide and question on their own.

GitHub Pages serves the pages. Votes go to a small **Google Apps Script web app** attached to a Google Sheet you own, so there is no server to run and nothing to pay for.

```
phones ──┐                       ┌── Google Apps Script web app (apps-script/Code.gs)
         ├── GitHub Pages ──────►│     keeps the votes and comments in the script's storage
you ─────┘   (these pages)       └── the Google Sheet: "Export" copies a session into it
```

Without the web app the pages run in **demo mode**: the same server code runs in your browser and votes stay there, which is enough to rehearse.

## Set it up once (about 15 minutes)

### 1. The Google Sheet and its script

1. Create a Google Sheet (go to [sheets.new](https://sheets.new)) and name it, for example, *GM2 live recap*.
2. In the sheet, choose **Extensions ▸ Apps Script**. Delete the code in the editor, paste in the whole of [`apps-script/Code.gs`](apps-script/Code.gs), and press **Save** (the disk icon).
3. Go back to the sheet and reload the page. A **Live recap** menu appears after a few seconds.
4. Choose **Live recap ▸ Set the presenter key…**. Google asks you to authorise the script the first time: choose your account; if you see *Google hasn’t verified this app*, choose **Advanced**, then **Go to … (unsafe)**: the app is yours. The script can use only this spreadsheet (the first line of `Code.gs` says so).
5. Type a passphrase of at least 6 characters. This **presenter key** is what stops anyone else from moving the slides on the phones or reading the comments. Students never see it.

### 2. Make the script a web app

1. In the Apps Script editor, choose **Deploy ▸ New deployment**. Click the gear icon next to *Select type* and choose **Web app**.
2. Set **Execute as: Me** and **Who has access: Anyone**. *Anyone* (not *Anyone with a Google account*) lets phones vote without signing in. Some institutional Google accounts don’t offer *Anyone*; a personal Google account does.
3. Click **Deploy**, authorise again if asked, and copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy…/exec`.

### 3. Point the pages at it, and publish them

1. In this repository, edit [`js/config.js`](js/config.js) and paste the URL between the quotes of `backendUrl: ''`. Commit the change to `main`.
2. In the repository’s **Settings ▸ Pages**, under *Build and deployment*, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and **Save**.

After a minute or two the pages are at:

- presenter: **https://comparativechrono.github.io/vote/present.html**
- students: **https://comparativechrono.github.io/vote/** (the QR code points here)

### 4. Check it

Open the presenter page, press **S** for Settings, type the presenter key, then **Save** and **Test the connection**. Open the student page on your phone: within a few seconds the title slide shows *1 phone connected*.

## Run the lecture

Open the presenter page on the lecture computer and press **F** for full screen. The title slide shows the QR code and a dot for each phone that joins.

| Key | What it does |
|---|---|
| → Space Page Down | The next step: on a question, show the results, then the answer, then go on to the next slide |
| ← Page Up | Back a step |
| ↓ ↑ | The next or previous section |
| M | All sections and slides: click one to go there |
| 14, then Enter | Go to question 14 |
| R, A, V | Show the results, show the answer, open or close voting |
| C | Comments sent from phones, newest first; hide any you don’t want on screen |
| J | The QR code, large, for latecomers |
| X twice | Clear the votes of this question, to ask it again |
| S | Settings |
| ? | All the keys |

A presentation clicker works: it sends Page Down and Page Up, which step through each question (vote, results, answer) and on to the next slide. Voting opens when a question appears and closes when you show the answer. The rail of small squares at the top shows where you are: click any square to jump there.

Questions come in four kinds: a choice of answers, a number (shown as a dot plot, with the right answer as a line), a rating (the confidence question at the start and the end, shown side by side at the end) and free text (shown as notes you can hide one by one).

Phones show each recap slide’s points as you reach them, with *Try the graph yourself*, and a box for comments or questions at any time. Comments are anonymous: each phone has a random number, and no names are collected.

## After the lecture

- In Settings, **Copy votes to the sheet** (or **Live recap ▸ Export the current session** in the sheet) writes the session’s votes and comments into two new tabs of the Google Sheet.
- Students can keep using the page to revise: **Revise on your own** shows every recap slide and question, and checks their answers on the phone.
- For the next lecture, use a new **session** name (Settings, or `session` in `js/config.js`), so its votes are kept apart. Once a session is exported you can delete it with **Live recap ▸ Clear an old session…**. The script’s storage holds about 500 KB, roughly two lectures of votes; the presenter page warns when it is getting full.

## Change the questions

Everything on the slides is in [`js/content.js`](js/content.js): sections, recap slides (title, points, the graph to show) and questions (text, options, the index of the right answer from 0, the explanation, and where the material is in Leonardo’s lectures). Keep a question’s `id` once people have voted on it, because votes are stored under it. The graphs are in [`js/demos.js`](js/demos.js).

If you change `apps-script/Code.gs`, paste it into the Apps Script editor again and choose **Deploy ▸ Manage deployments**, the pencil icon, **Version: New version**, **Deploy**. The web app keeps its URL. (The web app runs the last deployed version, not the code in the editor.)

## Rehearse

- **Demo mode**: open `present.html?demo`, then the student page in a few more tabs of the same browser; each tab is a phone. In Settings, **Add 30 simulated phones** fills the results with plausible votes.
- **A local server**: `node dev/server.mjs` (Node 18 or later) serves the pages and answers as the web app does, by running `Code.gs`. It prints the addresses to open.
- **Load**: `node dev/load-test.mjs --url <web app URL> --key <presenter key>` simulates 60 phones for three minutes against the real web app, then deletes its votes and puts the lecture back where it was. Run it well before a lecture, not during one. Against the local server with Google-like delays (`--latency 300-1500`), 60 phones made about 9 requests a second, with 8 running at once on average and at most 22, below Google’s limit of 30 at a time for one account.

## Limits worth knowing

- Phones check for the next slide every 6 to 8 seconds, so they follow you within a few seconds. `pollStudentMs` in `js/config.js` changes that; shorter waits mean more requests.
- A free Google account allows 50,000 storage reads and writes a day and 30 requests at the same time; a lecture of 60 students uses a few thousand reads and writes.
- The web app’s address is public (it is in `js/config.js`), so anyone who finds it could send votes or comments. The slides, the results and the comments need the presenter key, and you can hide any comment.

## Files

| Path | What it is |
|---|---|
| `present.html`, `index.html` | The presenter’s page and the students’ page |
| `js/content.js` | The recap: sections, slides and questions |
| `js/demos.js`, `js/stats.js` | The interactive graphs, and the statistics they compute (checked against R and SciPy) |
| `js/present.js`, `js/student.js`, `js/render.js` | The two pages, and what they share |
| `js/api.js`, `js/gas-shim.js`, `js/config.js` | Talking to the web app, demo mode, settings |
| `apps-script/Code.gs` | The web app, to paste into Apps Script |
| `dev/` | The local server, the load test and the font script |
| `css/`, `fonts/` | Styles and fonts |

The graphs use the figures from Leonardo’s lectures; where a graph needs individual data points (birth weights, mothers’ weights, the ALL probe), they are simulated to match the lectures’ summaries, and the graph says so. Fonts and the QR code library are open source: see [THIRD_PARTY.md](THIRD_PARTY.md).
