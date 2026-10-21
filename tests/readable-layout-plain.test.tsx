import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On, PromptOrigin } from 'claude-code'

const PLUGIN = 'readable-layout-plain'
const ANSWER = 'Both are done.\n\n- **Agent Monitor** is pushed\n- **Ember** is applied'
const NOTE = 'Checking the config first:'

// What the engine was asked to do, as the stubs beneath the plugin saw it
type Seen = { opened: string[]; closed: string[]; copied: string[]; toasts: string[] }

function engineBeneath(on: On, canCopy = true): Seen {
  const seen: Seen = { opened: [], closed: [], copied: [], toasts: [] }
  on('ui.render', { component: 'AssistantMessage' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine: {e.props.text}</Text>
  })
  on('ui.render', { component: 'UserMessage' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine: {e.props.text}</Text>
  })
  // Stand-ins for calls on $ answer { value }, what the call resolves to
  on('ui.open', (_$, e) => {
    seen.opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('ui.close', (_$, e) => {
    seen.closed.push(e.id)
    return { value: undefined }
  })
  on('ui.copy', (_$, e) => {
    if (!canCopy) return { value: { isCopied: false, reason: 'no-clipboard' } }
    seen.copied.push(e.text)
    return { value: { isCopied: true } }
  })
  on('ui.toast', (_$, e) => {
    seen.toasts.push(e.text)
    return { value: undefined }
  })
  return seen
}

const mountReply = (
  $: Engine,
  surface: 'terminal' | 'desktop',
  text: string,
  isSummary?: true,
  isFullscreen = true,
) =>
  $.ui.mount({
    plugin: PLUGIN,
    surface,
    component: 'AssistantMessage',
    props: { text, isFirstOfReply: true, ...(isSummary ? { isSummary } : {}) },
    viewport: { columns: 120, rows: 40, isFullscreen },
  })

const mountPrompt = ($: Engine, surface: 'terminal' | 'desktop', text: string, origin: PromptOrigin = { kind: 'composer' }) =>
  $.ui.mount({ plugin: PLUGIN, surface, component: 'UserMessage', props: { text, origin, isExpanded: true } })

const mountPane = ($: Engine) =>
  $.ui.mount({
    plugin: PLUGIN,
    surface: 'terminal',
    component: 'Pane',
    requestId: 'response',
    props: {
      title: "Claude's response",
      isFocused: true,
      bodyColumns: 80,
      placement: 'inline',
      scroll: { offset: 0, bodyRows: 20 },
      view: {},
    },
  })

const fromEngine = { type: 'Text', text: 'engine:' } as const

describe('your messages', () => {
  test('sit in a box labeled You', async ($, on) => {
    engineBeneath(on)
    const ui = await mountPrompt($, 'terminal', '  fix the login bug  ')
    const boxes = await ui.findAll({ type: 'Box' })
    expect(boxes.some(b => b.props.borderStyle === 'round' && b.props.borderColor === 'suggestion')).toBe(true)
    expect((await ui.find({ type: 'Text', text: 'You' }))?.text).toBe(' You ')
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
  test('an answer sits in a box whose Claude label is a button', async ($, on) => {
    engineBeneath(on)
    const ui = await mountReply($, 'terminal', ANSWER)
    const boxes = await ui.findAll({ type: 'Box' })
    expect(boxes.some(b => b.props.borderStyle === 'round' && b.props.borderColor === 'claude')).toBe(true)
    expect(await ui.find({ type: 'Button', key: 'open' })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: 'Claude' }))?.text).toBe(' Claude ')
    expect((await ui.findAll({ type: 'Markdown' })).map(m => m.text)).toEqual([ANSWER])
  })

  test('a one-line note is left to the engine', async ($, on) => {
    engineBeneath(on)
    const ui = await mountReply($, 'terminal', NOTE)
    expect(await ui.find(fromEngine)).toBeDefined()
    expect(await ui.find({ type: 'Button' })).toBeUndefined()
  })

  test('outside fullscreen, answers and notes are left to the engine, so the terminal copies them clean', async ($, on) => {
    engineBeneath(on)
    for (const text of [ANSWER, NOTE]) {
      const ui = await mountReply($, 'terminal', text, undefined, false)
      expect(await ui.find(fromEngine)).toBeDefined()
      expect(await ui.find({ type: 'Button' })).toBeUndefined()
    }
  })

  test('summaries and other surfaces are left to the engine', async ($, on) => {
    engineBeneath(on)
    for (const ui of [await mountReply($, 'terminal', ANSWER, true), await mountReply($, 'desktop', ANSWER)]) {
      expect(await ui.find(fromEngine)).toBeDefined()
    }
  })
})

describe('copy buttons for code blocks', () => {
  const QUERY = 'SELECT id, email\nFROM users\nWHERE active = true;'
  const SQL_ANSWER = `Here is the query:\n\n\`\`\`sql\n${QUERY}\n\`\`\`\n\nIt returns active users.`

  test('a code block gets a button that copies just the code', async ($, on) => {
    const seen = engineBeneath(on)
    const ui = await mountReply($, 'terminal', SQL_ANSWER)
    expect((await ui.findAll({ type: 'Markdown' })).map(m => m.text)).toEqual([
      'Here is the query:',
      `\`\`\`sql\n${QUERY}\n\`\`\``,
      'It returns active users.',
    ])
    expect((await ui.find({ type: 'Button', key: 'copy-0' }))?.props).toMatchObject({ label: 'Copy sql' })

    await ui.press({ key: 'copy-0' })
    expect(seen.copied).toEqual([QUERY])
    expect(seen.toasts).toEqual(['Copied the code block.'])
  })

  test('each block gets its own button; one with no language is just Copy', async ($, on) => {
    const seen = engineBeneath(on)
    const ui = await mountReply($, 'terminal', 'Run:\n\n```\nnpm test\n```\n\nThen:\n\n~~~bash\ngit push\n~~~')
    expect((await ui.find({ type: 'Button', key: 'copy-0' }))?.props).toMatchObject({ label: 'Copy' })
    expect((await ui.find({ type: 'Button', key: 'copy-1' }))?.props).toMatchObject({ label: 'Copy bash' })
    await ui.press({ key: 'copy-1' })
    expect(seen.copied).toEqual(['git push'])
  })

  test('an indented block inside a list, or one still streaming, gets no button', async ($, on) => {
    engineBeneath(on)
    for (const text of ['1. Run this:\n   ```\n   npm test\n   ```\n2. Done', 'Here it comes:\n\n```sql\nSELECT 1']) {
      const ui = await mountReply($, 'terminal', text)
      expect((await ui.findAll({ type: 'Markdown' })).map(m => m.text)).toEqual([text])
      expect(await ui.find({ type: 'Button', key: 'copy-0' })).toBeUndefined()
    }
  })
})

describe('the response pane', () => {
  test('pressing the Claude label opens that answer in the pane', async ($, on) => {
    const seen = engineBeneath(on)
    const reply = await mountReply($, 'terminal', ANSWER)
    await reply.press({ key: 'open' })
    expect(seen.opened).toEqual(['response'])
    const pane = await mountPane($)
    expect((await pane.findAll({ type: 'Markdown' })).map(m => m.text)).toEqual([ANSWER])
  })

  test('Copy all puts the raw text on the clipboard, says so and closes the pane', async ($, on) => {
    const seen = engineBeneath(on)
    const reply = await mountReply($, 'terminal', ANSWER)
    await reply.press({ key: 'open' })
    const pane = await mountPane($)
    await pane.press({ key: 'copy' })
    expect(seen.copied).toEqual([ANSWER])
    expect(seen.toasts).toEqual(['Copied the response.'])
    expect(seen.closed).toEqual(['response'])
  })

  test('a copy that fails says why and leaves the pane open', async ($, on) => {
    const seen = engineBeneath(on, false)
    const pane = await mountPane($)
    await pane.press({ key: 'copy' })
    expect(seen.toasts).toEqual(['Could not copy: no-clipboard'])
    expect(seen.closed).toEqual([])
  })

  test('the buttons show their hotkeys', async ($, on) => {
    engineBeneath(on)
    const pane = await mountPane($)
    expect((await pane.find({ type: 'Button', key: 'copy' }))?.props).toMatchObject({ label: 'Copy all (c)', hotkey: 'c' })
    expect((await pane.find({ type: 'Button', key: 'close' }))?.props).toMatchObject({ label: 'Close (q)', hotkey: 'q' })
  })

  test('Close closes the pane', async ($, on) => {
    const seen = engineBeneath(on)
    const pane = await mountPane($)
    await pane.press({ key: 'close' })
    expect(seen.closed).toEqual(['response'])
  })
})
