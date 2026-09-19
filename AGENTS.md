# Repository Guidelines

## Project Structure & Module Organization

This repository is a VitePress site for a Chinese technical blog. Root-level Markdown files (`index.md`, `api-examples.md`, and `markdown-examples.md`) provide the home page and examples. Long-form articles belong in `notes/` (for example, `notes/RoboMasterReview.md`). Site configuration lives in `.vitepress/config.mts`; theme overrides are in `.vitepress/theme/` (TypeScript and CSS). Store referenced images in `images/` and videos in `video/`, using paths that work with the configured `/my-blog/` base URL. Generated output under `.vitepress/dist/` should not be edited manually.

## Build, Test, and Development Commands

Install the locked dependency set before working:

```bash
npm ci
```

Run the local authoring server with hot reload:

```bash
npm run docs:dev
```

Build the production site (the same build used by CI):

```bash
npm run docs:build
```

Preview an already-built site locally:

```bash
npm run docs:preview
```

The `npm test` script is currently a placeholder and exits with an error; validate documentation changes with a successful production build instead.

## Coding Style & Naming Conventions

Use Markdown with clear Chinese headings, short paragraphs, and fenced code blocks tagged with the language. Keep front matter at the top of each page. Follow the existing two-space style in `.vitepress/config.mts`, use single quotes in TypeScript, and keep configuration comments concise. Name article files and media with descriptive PascalCase or snake-free names (for example, `RoboMasterReview.md`, `competition_video1.mp4`).

## Testing Guidelines

There is no automated unit-test suite or coverage requirement. Before submitting content or theme changes, run `npm run docs:build` and inspect affected pages with `npm run docs:preview`; verify internal links, math formulas, image/video loading, and the browser console for errors.

## Commit & Pull Request Guidelines

History uses both Chinese summaries and Conventional Commit-style prefixes (`feat:`, `fix:`). Write an imperative, focused subject (optionally prefixed with `feat:`, `fix:`, or `docs:`), and keep unrelated edits out of the commit. Pull requests should explain the user-visible change, list validation commands, link relevant issues, and include screenshots or a preview URL for layout/theme changes. Ensure the Pages build passes before requesting review.

## Deployment & Configuration Notes

Pushes to `main` trigger `.github/workflows/deploy.yml`, which runs `npm ci`, builds VitePress with Node 20, and deploys `.vitepress/dist` to GitHub Pages. Preserve the `base: '/my-blog/'` setting and avoid committing secrets or local cache artifacts.
