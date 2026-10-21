// Markdown text of one of Claude's responses
export type ResponseText = string

declare module 'claude-code' {
  interface PluginState {
    'boxed-transcript': {
      // The text the response pane shows
      shown: ResponseText
    }
  }
}
