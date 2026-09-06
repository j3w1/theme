# Port verification checklist

Structural checks (automated): native format parses; every used key is
allowed; every required role is mapped, inherited, unsupported-with-reason or
out of scope; generated artifact is current; documentation links resolve;
manifest and artifact agree.

Real-target checks (manual, recorded in `evidence/`):

- [ ] Plain text, comments, strings, keywords, numbers in three language families
- [ ] Long lines, invalid or unknown symbols
- [ ] Selection, selection with search matches, current line, caret over selection
- [ ] Diagnostics: error, warning, info, hint, unused, deprecated
- [ ] Diff: added, removed, modified, conflict; textual markers preserved
- [ ] Terminal or console ANSI, if the host has one: normal and bright slots, bold-as-bright, reset, reverse video
- [ ] Focus indicator present on every control the format touches
- [ ] Inherited and fallback surfaces look intentional
- [ ] Screenshot per fixture with application version, OS, font, scaling, profile, fixture revision and artifact digest

A successful parse is a structural pass, not verification.
