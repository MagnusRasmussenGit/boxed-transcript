# Boxed Transcript

Boxes your messages and Claude's answers in the Claude Code terminal, so you can see at a glance who is talking, and gives you clean ways to copy from them. Based on [Readable Layout](https://github.com/GarvitNangru/claude-code-mods/tree/main/mods/readable-layout) by Garvit Nangru (MIT).

## What changes

- **Your messages** sit in a box labeled **You**, in your theme's blue.
- **Claude's answers** sit in a box labeled **Claude**, in Claude's orange, in the fullscreen layout. Short notes between steps (one line, up to 160 characters) are left as Claude Code draws them.
- **Click the Claude label** to open that answer in a pane, where it copies without the box around it. Select text there, or press `c` for **Copy all**, which copies the answer's markdown and closes the pane. `q` or Esc closes it.
- **Code blocks get a copy button** under them, named by the block's language (`[ Copy sql ]`). Clicking it copies just the code, without the fences. Hovering the button gives its code block your theme's selection color, so you see what it copies. Code blocks indented inside a list item get no button, as the list would break around it.

In the classic layout (`/tui default`) Claude's answers are left as Claude Code draws them: there the terminal does the selecting, and would copy the box along with the text. Your messages are boxed in both layouts.

Everything else is drawn by Claude Code as usual: tool activity, notifications and the end-of-turn line.

## Installing

Type this at the Claude Code prompt:

```
/plugin install boxed-transcript --marketplace MagnusRasmussenGit/boxed-transcript
```

It asks whether to add this repo as a marketplace. Say `y` and pick a scope; the user scope loads it in every session.

To update it later, run `claude plugin update boxed-transcript@boxed-transcript`, then `/reload-plugins` in an open session. To remove it, run `/plugin uninstall boxed-transcript@boxed-transcript`.

## What a mod can't change

Claude Code draws these itself and doesn't pass them to mods:

- shell commands run with `!`
- the sticky copy of your last prompt at the top of the screen, shown once the prompt has scrolled out of view
- the pane's own border, which is why the pane doesn't help in the classic layout

## Differences from the original

- `hooks/markdown.tsx` and the `bold` setting are removed: bold text looks as it does in stock Claude Code.
- The `boxes` setting is removed. Short notes are always left to Claude Code.
- The custom end-of-turn rule is removed, so Claude Code's own turn-duration line is shown.
- Added: the clickable Claude label, the response pane and the copy buttons for code blocks.

## Development

From the repo folder:

```
claude plugin validate .
claude plugin test .
```

## License

MIT. See [LICENSE](LICENSE) for the original copyright notice.
