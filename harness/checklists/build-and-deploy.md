# Verification Checklist: build-and-deploy

Read actual files/output. Do NOT trust the implementer's report.

## 1. app.json Validation (7 items)

- [ ] `app.json` exists in the project root
- [ ] `package_id` is present and in reverse-domain format (e.g. `com.example.demoglasses`, lowercase, no hyphens, at least 2 segments)
- [ ] `edition` is exactly the string `"202601"`
- [ ] `name` is present and 20 characters or fewer
- [ ] `version` is semver format (x.y.z)
- [ ] `entrypoint` is `"index.html"`
- [ ] `permissions` is a valid JSON array (may be empty)

## 2. Build Step (3 items)

- [ ] `npm run build` was executed inside the project directory
- [ ] `dist/` directory exists after the build
- [ ] `dist/index.html` exists (Vite output)

## 3. Pack Step (3 items)

- [ ] `npx evenhub pack app.json dist` was executed
- [ ] A file with the `.ehpk` extension exists in the project directory after packing
- [ ] The `.ehpk` filename reflects the app name or package_id (not a generic placeholder)

## 4. Error Handling & Guidance (3 items)

- [ ] If any step failed, the implementer surfaced troubleshooting guidance from the skill (not just a raw error dump)
- [ ] No missing required `app.json` fields were silently skipped
- [ ] The final report identifies the path to the produced `.ehpk` file (or clearly states which step failed)

## Scoring

- **Total items:** 16
- **Pass threshold:** 16/16 (all must pass)
- For each FAIL: explain what's wrong and whether it's an agent error or a skill guidance gap
- **Skill improvement suggestions:** list any changes to the SKILL.md that would prevent the failure
