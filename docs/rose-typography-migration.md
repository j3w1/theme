# Rose typography migration — 4.0.0

D-033 corrects the canonical text hierarchy. Ordinary interface and prose are
`#e99499`; brighter labels are `#ffa2a7`; content titles and H1–H6 use the new
`color.text.heading` (`#f4eeee`). `color.text.highlight` is an explicit rare
highlight. Bold inherits context and never chooses a foreground by weight.

## Near-white audit

| Source/use | Classification and action |
| --- | --- |
| text.prose; site body/lede/blockquote; Claude subagent label | Ordinary: rose prose |
| Site/demo content H1–H6, command-dialog heading, Obsidian title/H1–H6 | Heading: migrate to text.heading |
| Obsidian --bold-color | Ordinary/contextual: inherit, including headings and muted text |
| text.on-action and action.primary.text | Ordinary control: bright rose passes all existing action fills |
| text.link-hover | Intentional transient hover highlight; retains paper.90 |
| text.on-selection, interaction.selection.text, interaction.text-selection.text, terminal.selection-text | Intentional selection; retain paper.90 |
| text.on-danger, action.destructive hover/filled text, status.danger.on-fill | Contrast-critical: retain paper.100 on existing danger fills |
| text.on-light and text.inverse; non-danger status on-fill | Dark foregrounds on light fills; retain explicit on-fill semantics |
| paper.90 and paper.100 primitives/provenance | Definitions, not consumer text assignments; retain |
| heritage-ansi prompt and extended terminal slot 15 | Historical/profile-specific terminal semantics; retain |
| Historical decisions, releases and reference evidence | Historical truth; do not rewrite |

Every port classifies the new roles; unsupported host hooks are disclosed.
Generated values change through tokens and mappings only. No global replacement
of white literals or changes to syntax/diagnostic palettes is performed.

## Upgrade

Pin version 4.0.0, regenerate consumers, replace heading uses of text.prose
with text.heading, and remove color rules attached solely to bold. Keep
selection and on-fill roles distinct. Windows chrome titles use default/bright
rose rather than the content-heading role. Obsidian uses this same hierarchy
in Reading View and CM6; Android receives the same generated two-file theme.
