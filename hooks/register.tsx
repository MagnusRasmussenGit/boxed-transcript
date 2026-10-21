import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement } from 'claude-code'

const SHORT_NOTE_CHARS = 160
const PANE = 'response'
const PANE_TITLE = "Claude's response"

// The text the pane shows
const shown = atom({ plugin: 'readable-layout-plain', key: 'shown' } as const, '')

const isShortNote = (text: string): boolean => !text.includes('\n') && text.length <= SHORT_NOTE_CHARS

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
    return framed(Box, 'claude', label, <Markdown text={text} />)
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
