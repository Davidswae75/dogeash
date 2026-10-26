// Custom page meta read by the layouts
export interface AuthPanelMeta {
  variant: 'day' | 'night'
  title: string
  outline: string
  text: string
}

declare module '#app' {
  interface PageMeta {
    /** default layout: 'full' shows the full footer (Home); everything else gets quick links */
    footer?: 'full'
    /** dashboard layout: the top bar title */
    title?: string
    /** auth layout: the side panel beside the form */
    authPanel?: AuthPanelMeta
  }
}

export {}
