import type { Register, RenderElement } from 'claude-code'

const SHORT_NOTE_CHARS = 160

// Soft tints for a light theme. A background adds no characters, so text selected with the mouse copies clean.
const YOU_BG = '#E8EFF7'
const CLAUDE_BG = '#F7EEE6'

const isShortNote = (text: string): boolean => !text.includes('\n') && text.length <= SHORT_NOTE_CHARS

export const register: Register = (on, options) => {
  const boxesAll = options.boxes === 'all'

  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.origin.kind !== 'composer' || !e.props.text.trim()) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return labeled(Box, Text, 'You', 'suggestion', YOU_BG, <Text>{e.props.text.trim()}</Text>)
  })

  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    const text = e.props.text.trim()
    if (e.surface !== 'terminal' || e.props.isSummary || !text) return next(e)
    const { Box, Text, Markdown } = $.ui.resolve(e)

    if (!boxesAll && isShortNote(text)) {
      return (
        <Box flexDirection="row" marginTop={1} paddingLeft={2}>
          <Text color="subtle">{'· '}</Text>
          <Markdown text={text} dimColor />
        </Box>
      )
    }
    return labeled(Box, Text, 'Claude', 'claude', CLAUDE_BG, <Markdown text={text} />)
  })
}

type Element = (props: Record<string, unknown>, ...children: unknown[]) => RenderElement

// A colored label line, then the message on a tinted background. No borders or side padding,
// which a mouse selection would copy along with the text.
function labeled(Box: Element, Text: Element, title: string, color: string, bg: string, body: RenderElement): RenderElement {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color={color} bold>
        {title}
      </Text>
      <Box flexDirection="column" backgroundColor={bg}>
        {body}
      </Box>
    </Box>
  )
}
