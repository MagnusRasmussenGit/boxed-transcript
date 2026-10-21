import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement } from 'claude-code'

const SHORT_NOTE_CHARS = 160
const PANE = 'response'
const PANE_TITLE = "Claude's response"

// The text the pane shows
const shown = atom({ plugin: 'boxed-transcript', key: 'shown' } as const, '')

const isShortNote = (text: string): boolean => !text.includes('\n') && text.length <= SHORT_NOTE_CHARS

// An answer cut at its code blocks, so each block can get a copy button under it. Only fences at
// the start of a line count: one indented inside a list item stays in the text, as splitting the
// list around it would break the list.
type Segment = { kind: 'text'; text: string } | { kind: 'code'; fenced: string; code: string; language: string }

const FENCE_OPEN = /^(`{3,}|~{3,})\s*([^\s`]*)/
// Behind a code block while its copy button is hovered, to show what the button copies:
// the theme's own hover tint, so it suits light and dark themes alike. Not the selection
// color, which would hide a mouse selection made in the block.
const COPY_HOVER_BG = 'userMessageBackgroundHover'

function splitAtCodeBlocks(text: string): Segment[] {
  const segments: Segment[] = []
  const lines = text.split('\n')
  let prose: string[] = []
  const flushProse = () => {
    if (prose.join('\n').trim()) segments.push({ kind: 'text', text: prose.join('\n').trim() })
    prose = []
  }

  for (let i = 0; i < lines.length; i++) {
    const open = FENCE_OPEN.exec(lines[i] ?? '')
    const marker = open?.[1]
    const close = marker && lines.findIndex((line, j) => j > i && new RegExp(`^${marker[0]}{${marker.length},}\\s*$`).test(line))
    // An unclosed fence (an answer still streaming) stays text until it closes
    if (!marker || !close || close < 0) {
      prose.push(lines[i] ?? '')
      continue
    }
    flushProse()
    segments.push({
      kind: 'code',
      fenced: lines.slice(i, close + 1).join('\n'),
      code: lines.slice(i + 1, close).join('\n'),
      language: open?.[2] ?? '',
    })
    i = close
  }
  flushProse()
  return segments
}

async function showInPane($: EngineInterface, text: string): Promise<void> {
  await update($, shown, () => text)
  await $.ui.open({ id: PANE, title: PANE_TITLE, focus: true, closeOnEscape: true })
}

export const register: Register = on => {
  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.origin.kind !== 'composer' || !e.props.text.trim()) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const label = (
      <Text color="suggestion" bold>
        {' You '}
      </Text>
    )
    return framed(Box, 'suggestion', label, <Text>{e.props.text.trim()}</Text>)
  })

  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    const text = e.props.text.trim()
    if (e.surface !== 'terminal' || e.props.isSummary || !text) return next(e)
    // Outside fullscreen the terminal does the selecting, and would copy the box along with
    // the text, so Claude Code draws the answer as usual there
    if (e.viewport?.isFullscreen !== true) return next(e)
    // Short notes between steps stay as Claude Code draws them; only answers are boxed
    if (isShortNote(text)) return next(e)
    const { Box, Text, Button, Markdown } = $.ui.resolve(e)

    // The label is a button: pressing it opens this answer in a pane, where it copies clean
    const label = (
      <Button key="open" plain onPress={() => void showInPane($, text)}>
        <Text color="claude" bold>
          {' Claude '}
        </Text>
      </Button>
    )
    const segments = splitAtCodeBlocks(text)
    if (!segments.some(s => s.kind === 'code')) return framed(Box, 'claude', label, <Markdown text={text} />)

    let blocks = 0
    const body = (
      <Box flexDirection="column">
        {segments.map((segment, i) => {
          if (segment.kind === 'text') {
            return (
              <Box flexDirection="column" marginTop={i ? 1 : 0}>
                <Markdown text={segment.text} />
              </Box>
            )
          }
          const { code, language } = segment
          const n = blocks++
          // One hover group per block: the button and its code light together. A group spans
          // the whole surface, so the message's id keeps blocks of different answers apart.
          const scope = `${e.requestId.slice(-48)}:code-${n}`
          return (
            <Box flexDirection="column" marginTop={i ? 1 : 0}>
              <Box flexDirection="column" hover={{ scope, backgroundColor: COPY_HOVER_BG }}>
                <Markdown text={segment.fenced} />
              </Box>
              <Box>
                <Button
                  key={`copy-${n}`}
                  hover={{ scope }}
                  label={language ? `Copy ${language}` : 'Copy'}
                  onPress={async press => {
                    const copied = await $.ui.copy({ text: code, surface: press.surface })
                    await $.ui.toast(copied.isCopied ? 'Copied the code block.' : `Could not copy: ${copied.reason}`)
                  }}
                />
              </Box>
            </Box>
          )
        })}
      </Box>
    )
    return framed(Box, 'claude', label, body)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Markdown } = $.ui.resolve(e)
    const text = await read($, shown)
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Button
            key="copy"
            label="Copy all (c)"
            hotkey="c"
            onPress={async press => {
              const copied = await $.ui.copy({ text, surface: press.surface })
              await $.ui.toast(copied.isCopied ? 'Copied the response.' : `Could not copy: ${copied.reason}`)
              if (copied.isCopied) await $.ui.close({ id: PANE })
            }}
          />
          <Button key="close" label="Close (q)" hotkey="q" role="dismiss" onPress={() => void $.ui.close({ id: PANE })} />
        </Box>
        <Box marginTop={1} flexDirection="column" paddingRight={2}>
          <Markdown text={text} />
        </Box>
      </Box>
    )
  })
}

type Element = (props: Record<string, unknown>, ...children: unknown[]) => RenderElement

function framed(Box: Element, color: string, label: RenderElement, body: RenderElement): RenderElement {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box flexDirection="column" borderStyle="round" borderColor={color} paddingX={1}>
        {body}
      </Box>
      <Box position="absolute" top={0} left={2}>
        {label}
      </Box>
    </Box>
  )
}
