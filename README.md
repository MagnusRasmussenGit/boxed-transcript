# Readable Layout (plain)

A trimmed version of [Readable Layout](https://github.com/GarvitNangru/claude-code-mods/tree/main/mods/readable-layout) by Garvit Nangru (MIT). It keeps the conversation layout and drops the bold-text recoloring, so every message is rendered by Claude Code's own markdown renderer.

## What changes

- **Your messages** sit under a **You** label in your theme's blue, on a soft blue background.
- **Claude's answers** sit under a **Claude** label in Claude's orange, on a soft warm background. Anything longer than a line or two counts as an answer.
- **Claude's short notes** between steps become quiet, indented lines with a blank line above each one.

Messages have no borders or side padding, so text you select with the mouse copies without extra characters. The background tints are made for a light theme.

Bold text, code blocks, tables, quotes, everything else inside a message, and the end-of-turn line look exactly as they do in stock Claude Code.

## Installing

Type this at the Claude Code prompt:

```
/plugin install readable-layout-plain --marketplace MagnusRasmussenGit/readable-layout-plain
```

It asks whether to add this repo as a marketplace. Say `y` and pick a scope; the user scope loads it in every session.

To update it later, run `claude plugin update readable-layout-plain@readable-layout-plain`, then `/reload-plugins` in an open session. To remove it, run `/plugin uninstall readable-layout-plain@readable-layout-plain`.

## Settings

`Claude text to label` in `/config`:

- `answers` (the default) labels and tints replies of more than a line or two and shows one-line notes as quiet lines.
- `all` labels and tints everything Claude writes, notes included.

For a mod loaded from a folder, set it in `~/.claude/settings.json`:

```json
{ "pluginConfigs": { "readable-layout-plain": { "options": { "boxes": "all" } } } }
```

## Differences from the original

- `hooks/markdown.tsx` is removed. Message text goes straight to the built-in `<Markdown>` component.
- The `bold` setting is removed.
- The custom end-of-turn rule is removed, so Claude Code's own turn-duration line is shown.
- Bordered boxes are replaced by a label and a background tint, so copying text with the mouse doesn't pick up border characters.
- The bold-text and end-of-turn tests are removed.

## Development

From the repo folder:

```
claude plugin validate .
claude plugin test .
```

## License

MIT. See [LICENSE](LICENSE) for the original copyright notice.
