import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On, PromptOrigin } from 'claude-code'

const ANSWER = 'Both are done.\n\n- **Agent Monitor** is pushed\n- **Ember** is applied'
const NOTE = 'Checking the config first:'
const PLUGIN = 'readable-layout-plain'

function engineBeneath(on: On): void {
  on('ui.render', { component: 'AssistantMessage' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine: {e.props.text}</Text>
  })
  on('ui.render', { component: 'UserMessage' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine: {e.props.text}</Text>
  })
}

const mountReply = ($: Engine, surface: 'terminal' | 'desktop', text: string, isSummary?: true) =>
  $.ui.mount({
    plugin: PLUGIN,
    surface,
    component: 'AssistantMessage',
    props: { text, isFirstOfReply: true, ...(isSummary ? { isSummary } : {}) },
  })

const mountPrompt = ($: Engine, surface: 'terminal' | 'desktop', text: string, origin: PromptOrigin = { kind: 'composer' }) =>
  $.ui.mount({ plugin: PLUGIN, surface, component: 'UserMessage', props: { text, origin, isExpanded: true } })

const fromEngine = { type: 'Text', text: 'engine:' } as const

const YOU_BG = '#E8EFF7'
const CLAUDE_BG = '#F7EEE6'

// Borders and side padding are drawn as characters that a mouse selection copies along with the text
const copiesAlong = (b: { props: Record<string, unknown> }): boolean =>
  Boolean(b.props.borderStyle || b.props.paddingX || b.props.padding)

describe('your messages', () => {
  test('sit under a You label, on a tinted background', async ($, on) => {
    engineBeneath(on)
    const ui = await mountPrompt($, 'terminal', '  fix the login bug  ')
    const boxes = await ui.findAll({ type: 'Box' })
    expect(boxes.some(b => b.props.backgroundColor === YOU_BG)).toBe(true)
    expect(boxes.some(copiesAlong)).toBe(false)
    expect((await ui.find({ type: 'Text', text: 'You' }))?.props).toMatchObject({ color: 'suggestion', bold: true })
    expect((await ui.find({ type: 'Text', text: 'login' }))?.text).toBe('fix the login bug')
    expect(await ui.find(fromEngine)).toBeUndefined()
  })

  test('leave notifications, other senders and other surfaces to the engine', async ($, on) => {
    engineBeneath(on)
    const mounts = [
      await mountPrompt($, 'terminal', 'Build finished', { kind: 'task-notification' }),
      await mountPrompt($, 'desktop', 'fix the login bug'),
    ]
    for (const ui of mounts) expect(await ui.find(fromEngine)).toBeDefined()
  })
})

describe("Claude's text", () => {
  test('an answer sits under a Claude label on a tinted background, bold included, rendered by the engine as markdown', async ($, on) => {
    engineBeneath(on)
    const ui = await mountReply($, 'terminal', ANSWER)
    const boxes = await ui.findAll({ type: 'Box' })
    expect(boxes.some(b => b.props.backgroundColor === CLAUDE_BG)).toBe(true)
    expect(boxes.some(copiesAlong)).toBe(false)
    expect((await ui.find({ type: 'Text', text: 'Claude' }))?.props).toMatchObject({ color: 'claude', bold: true })
    expect((await ui.findAll({ type: 'Markdown' })).map(m => m.text)).toEqual([ANSWER])
  })

  test('a one-line note is a quiet, indented line with space above it', async ($, on) => {
    engineBeneath(on)
    const ui = await mountReply($, 'terminal', NOTE)
    expect((await ui.find({ type: 'Box' }))?.props).toMatchObject({ marginTop: 1, paddingLeft: 2 })
    expect((await ui.find({ type: 'Markdown' }))?.props).toMatchObject({ dimColor: true, text: NOTE })
    expect((await ui.findAll({ type: 'Box' })).some(b => b.props.borderStyle)).toBe(false)
  })

  test('summaries and other surfaces are left to the engine', async ($, on) => {
    engineBeneath(on)
    for (const ui of [await mountReply($, 'terminal', ANSWER, true), await mountReply($, 'desktop', ANSWER)]) {
      expect(await ui.find(fromEngine)).toBeDefined()
    }
  })

  test('with boxes set to all, notes are tinted too', { options: { boxes: 'all' } }, async ($, on) => {
    engineBeneath(on)
    const ui = await mountReply($, 'terminal', NOTE)
    expect((await ui.findAll({ type: 'Box' })).some(b => b.props.backgroundColor === CLAUDE_BG)).toBe(true)
  })
})
