# Verification Checklist: cross-check

Scan ALL files matching `skills/*/SKILL.md`. For each item, grep the relevant pattern across all skill files, extract the claimed values, and verify they are identical. Quote file and line for any disagreement.

## 1. Display Constants (3 items)

- [ ] All skills that mention display resolution agree on the same width x height
- [ ] All skills that mention colour depth agree on the same bit depth and shade count
- [ ] All skills that mention line height agree on the same pixel value

## 2. Container Limits (3 items)

- [ ] All skills agree on the maximum total containers per page
- [ ] All skills agree on the maximum text/list containers per page
- [ ] All skills agree on the maximum image containers per page

## 3. Property Value Ranges (6 items)

- [ ] `borderColor` range is consistent across all skills that define it
- [ ] `borderWidth` range is consistent across all skills that define it
- [ ] `borderRadius` range is consistent across all skills that define it
- [ ] `paddingLength` range is consistent across all skills that define it
- [ ] Image container `width` range is consistent (min-max) across all skills
- [ ] Image container `height` range is consistent (min-max) across all skills

## 4. Character and Content Limits (3 items)

- [ ] `content` max length for `createStartUpPageContainer` is consistent across all skills (unit: characters or bytes must also agree)
- [ ] `content` max length for `textContainerUpgrade` is consistent across all skills
- [ ] `containerName` max length is consistent across all skills

## 5. SDK and Tool Versions (3 items)

- [ ] All references to `min_sdk_version` use the same version string
- [ ] If multiple skills state "Current version" for the SDK, they agree
- [ ] If multiple skills state the simulator or CLI version, they agree

## 6. isEventCapture Rule (2 items)

- [ ] All skills that describe `isEventCapture` agree on the rule (exactly one per page)
- [ ] No skill claims image containers support `isEventCapture` while another denies it

## Scoring

- **Total items:** 20
- **Pass threshold:** 20/20 (all must pass)
- For each FAIL: quote the conflicting values with file path and line number
- **Skill improvement suggestions:** identify which file should be the source of truth and which files need correction
