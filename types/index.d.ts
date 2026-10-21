// Markdown text of one of Claude's responses
export type ResponseText = string

declare module 'claude-code' {
  interface PluginState {
    'readable-layout-plain': {
      // The text the response pane shows
      shown: ResponseText
    }
  }
}
