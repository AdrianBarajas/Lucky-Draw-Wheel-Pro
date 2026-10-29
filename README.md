# Lucky Draw Wheel

A web app for running random draws with an interactive wheel. Add participants, spin the wheel, and reveal the winner.

**Demo:** [adrianbarajas.github.io/Lucky-Draw-Wheel-Pro](https://adrianbarajas.github.io/Lucky-Draw-Wheel-Pro/)

## Features

- Add participants separated by lines or commas.
- Shuffle the list, remove duplicates, or remove a winner after a draw.
- Set the spin duration and change the wheel colors.
- View the winner history.
- Toggle sound and dark mode.
- Switch the interface between Spanish and English.
- Save preferences and data in your browser.

## Run locally

No dependencies or build step are required. From the project directory, start a local server:

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser. You can also open `index.html` directly, but using a local server is recommended.

The app loads Tailwind CSS, Google Fonts, Font Awesome, and Canvas Confetti from CDNs, so an internet connection is required for those resources.

## Publish with GitHub Pages

The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) automatically deploys the site when the `main` branch is updated. To enable it in the repository:

1. Open **Settings > Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Push a commit to `main` or run **Deploy to GitHub Pages** from the **Actions** tab.

The published URL and deployment status are shown in the workflow run.

## Technologies

- HTML, CSS, and JavaScript (ES modules).
- Tailwind CSS and libraries loaded from CDNs.
