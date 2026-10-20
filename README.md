# Readable Layout (plain)

A trimmed version of [Readable Layout](https://github.com/GarvitNangru/claude-code-mods/tree/main/mods/readable-layout) by Garvit Nangru (MIT). It keeps one part of it: your messages sit in a box labeled **You**, in your theme's blue, so you can see at a glance where each of your prompts starts.

Everything else is drawn by Claude Code as usual: Claude's responses, tool activity, shell commands, notifications and the end-of-turn line. Claude's responses keep Claude Code's own mouse selection, which leaves out the bullet and indent, so copying from them stays clean.

## Installing

Type this at the Claude Code prompt:

```
/plugin install readable-layout-plain --marketplace MagnusRasmussenGit/readable-layout-plain
```

It asks whether to add this repo as a marketplace. Say `y` and pick a scope; the user scope loads it in every session.

To update it later, run `claude plugin update readable-layout-plain@readable-layout-plain`, then `/reload-plugins` in an open session. To remove it, run `/plugin uninstall readable-layout-plain@readable-layout-plain`.

## Differences from the original

- Only your messages are boxed. Claude's responses are left to Claude Code, because a box around them gets copied along with the text when you select it with the mouse.
- `hooks/markdown.tsx` and the `bold` setting are removed: bold text looks as it does in stock Claude Code.
- The `boxes` setting is removed, as Claude's text is no longer boxed.
- The custom end-of-turn rule is removed, so Claude Code's own turn-duration line is shown.

Shell commands run with `!` can't be boxed: Claude Code draws those rows itself and doesn't pass them to mods.

## Development

From the repo folder:

```
claude plugin validate .
claude plugin test .
```

## License

MIT. See [LICENSE](LICENSE) for the original copyright notice.
