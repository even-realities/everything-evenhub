# Verification Checklist: quickstart

Read actual files on disk. Do NOT trust the implementer's report.

## 1. Project Structure (5 items)

- [ ] Project directory exists at expected path
- [ ] `package.json` exists
- [ ] `app.json` exists in project root
- [ ] `src/main.ts` exists
- [ ] `index.html` exists

## 2. Dependencies — package.json (5 items)

- [ ] `@evenrealities/even_hub_sdk` is in `dependencies`
- [ ] `@evenrealities/evenhub-cli` is in `devDependencies`
- [ ] `@evenrealities/evenhub-simulator` is in `devDependencies`
- [ ] `typescript` is in `devDependencies`
- [ ] `vite` is in `devDependencies`

## 3. app.json Validity (9 items)

- [ ] `package_id` exists and is reverse-domain format (lowercase, no hyphens, min 2 segments)
- [ ] `edition` is exactly `"202601"`
- [ ] `name` exists and is <= 20 characters
- [ ] `version` is semver format (x.y.z)
- [ ] `min_app_version` exists and is a string
- [ ] `min_sdk_version` exists, is a string, and is `"0.0.10"` or later
- [ ] `entrypoint` is `"index.html"`
- [ ] `permissions` is an empty array `[]` (demo app needs no permissions)
- [ ] `supported_languages` is an array with valid language codes

## 4. src/main.ts Code Quality (8 items)

- [ ] Imports `waitForEvenAppBridge` from `@evenrealities/even_hub_sdk`
- [ ] Imports `TextContainerProperty` from `@evenrealities/even_hub_sdk`
- [ ] Calls `await waitForEvenAppBridge()` to initialize bridge
- [ ] Creates a TextContainerProperty with `width: 576` and `height: 288` (full canvas)
- [ ] Sets `isEventCapture: 1` on exactly one container
- [ ] Calls `createStartUpPageContainer`
- [ ] Container positions are within valid range (x: 0-576, y: 0-288)
- [ ] `containerName` is <= 16 characters

## 5. Skill Instruction Adherence (5 items)

- [ ] Project name matches request ("demo-glasses")
- [ ] Used Vite with TypeScript (vanilla-ts or similar)
- [ ] All 8 steps from the skill were executed (not skipped)
- [ ] Vite boilerplate files removed (no `counter.ts`, `style.css`, or `assets/` in src/)
- [ ] Next steps were communicated (dev server, simulator, QR)

## 6. End-to-End Build Verification (2 items)

Run these commands inside the generated project directory:

- [ ] `npx tsc --noEmit` passes with 0 TypeScript errors
- [ ] `npm run build` succeeds (Vite produces dist/ output)

## Scoring

- **Total items:** 34
- **Pass threshold:** 34/34 (all must pass)
- For each FAIL: explain what's wrong and whether it's an agent error or a skill guidance gap
- **Skill improvement suggestions:** list any changes to the SKILL.md that would prevent the failure
