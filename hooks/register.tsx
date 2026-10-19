import type { Register, RenderElement } from 'claude-code'

const SHORT_NOTE_CHARS = 160

const isShortNote = (text: string): boolean => !text.includes('\n') && text.length <= SHORT_NOTE_CHARS

export const register: Register = (on, options) => {
  const boxesAll = options.boxes === 'all'

  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.origin.kind !== 'composer' || !e.props.text.trim()) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return framed(Box, Text, 'You', 'suggestion', <Text>{e.props.text.trim()}</Text>)
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
    return framed(Box, Text, 'Claude', 'claude', <Markdown text={text} />)
  })

}

type Element = (props: Record<string, unknown>, ...children: unknown[]) => RenderElement

function framed(Box: Element, Text: Element, title: string, color: string, body: RenderElement): RenderElement {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box flexDirection="column" borderStyle="round" borderColor={color} paddingX={1}>
        {body}
      </Box>
      <Box position="absolute" top={0} left={2}>
        <Text color={color} bold>
          {` ${title} `}
        </Text>
      </Box>
    </Box>
  )
}
