import type { Register } from 'claude-code'

export const register: Register = on => {
  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.origin.kind !== 'composer' || !e.props.text.trim()) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column" marginTop={1}>
        <Box flexDirection="column" borderStyle="round" borderColor="suggestion" paddingX={1}>
          <Text>{e.props.text.trim()}</Text>
        </Box>
        <Box position="absolute" top={0} left={2}>
          <Text color="suggestion" bold>
            {' You '}
          </Text>
        </Box>
      </Box>
    )
  })
}
