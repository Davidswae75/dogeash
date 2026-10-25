<script setup lang="ts">
// 2px-stroke line icons with round caps, drawn with currentColor.
// Guide icons are duotone: a soft currentColor fill under the line art, with solid paw-print details.
export type IconName =
  | 'check' | 'shield' | 'home' | 'compound' | 'estate' | 'business'
  | 'sun' | 'moon' | 'auto' | 'search' | 'info' | 'arrow-right' | 'menu'
  | 'shield-paw' | 'alert-bell' | 'power-out' | 'patrol' | 'family' | 'wallet' | 'monthly-cost'
  | 'watchful-eye' | 'heart-paw' | 'clock' | 'scale' | 'child' | 'poison' | 'warning' | 'heat'
  | 'noise' | 'travel' | 'x' | 'minus'

const props = withDefaults(defineProps<{ name: IconName, size?: number, strokeWidth?: number }>(), { size: 20, strokeWidth: 2 })

const paths: Record<IconName, string> = {
  'check': '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  'shield': '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  'home': '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  'compound': '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M8 20v-8l4-3 4 3v8"/><path d="M2.5 9h3M18.5 9h3"/>',
  'estate': '<path d="M2 20h20"/><path d="M4 20V11l4-3 4 3v9"/><path d="M12 20v-7l4-3 4 3v7"/>',
  'business': '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  'moon': '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  'auto': '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
  'search': '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'menu': '<path d="M4 7h16M4 12h16M4 17h16"/>',
  'shield-paw': '<path d="M12 2.8l7.5 2.9v5.8c0 4.6-3.2 8.2-7.5 9.7-4.3-1.5-7.5-5.1-7.5-9.7V5.7z" fill="currentColor" fill-opacity=".22" stroke="none"/><path d="M12 2.8l7.5 2.9v5.8c0 4.6-3.2 8.2-7.5 9.7-4.3-1.5-7.5-5.1-7.5-9.7V5.7z"/><path d="M9.47 12.94a2.53 2.09 0 1 0 5.06 0a2.53 2.09 0 1 0 -5.06 0zM8.1 9.86a1.04 1.04 0 1 0 2.08 0a1.04 1.04 0 1 0 -2.08 0zM9.86 7.99a1.04 1.04 0 1 0 2.08 0a1.04 1.04 0 1 0 -2.08 0zM12.06 7.99a1.04 1.04 0 1 0 2.08 0a1.04 1.04 0 1 0 -2.08 0zM13.82 9.86a1.04 1.04 0 1 0 2.08 0a1.04 1.04 0 1 0 -2.08 0z" fill="currentColor" stroke="none"/>',
  'alert-bell': '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" fill="currentColor" fill-opacity=".22" stroke="none"/><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/><path d="M2.8 9.5a9.5 9.5 0 0 1 2.4-5M21.2 9.5a9.5 9.5 0 0 0-2.4-5"/>',
  'power-out': '<path d="M13.5 2.5L5.5 13.5h6l-1 8 8-11.5h-6z" fill="currentColor" fill-opacity=".22" stroke="none"/><path d="M13.5 2.5L5.5 13.5h6l-1 8 8-11.5h-6z"/><path d="M3 3l18 18"/>',
  'patrol': '<path d="M4.98 18.67a2.42 1.99 0 1 0 4.84 0a2.42 1.99 0 1 0 -4.84 0zM3.67 15.73a1 1 0 1 0 2 0a1 1 0 1 0 -2 0zM5.35 13.94a1 1 0 1 0 2 0a1 1 0 1 0 -2 0zM7.45 13.94a1 1 0 1 0 2 0a1 1 0 1 0 -2 0zM9.13 15.73a1 1 0 1 0 2 0a1 1 0 1 0 -2 0z" fill="currentColor" stroke="none"/><path d="M14.18 12.87a2.42 1.99 0 1 0 4.84 0a2.42 1.99 0 1 0 -4.84 0zM12.87 9.93a1 1 0 1 0 2 0a1 1 0 1 0 -2 0zM14.55 8.14a1 1 0 1 0 2 0a1 1 0 1 0 -2 0zM16.65 8.14a1 1 0 1 0 2 0a1 1 0 1 0 -2 0zM18.33 9.93a1 1 0 1 0 2 0a1 1 0 1 0 -2 0z" fill="currentColor" stroke="none"/><path d="M7 2.5a3.6 3.6 0 1 0 3 5.8 3 3 0 0 1-3-5.8z" fill="currentColor" fill-opacity=".22" stroke="none"/><path d="M7 2.5a3.6 3.6 0 1 0 3 5.8 3 3 0 0 1-3-5.8z"/><path d="M19.6 5.4h.01M21.2 3h.01"/>',
  'family': '<path d="M5.3 7a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0 -6.4 0z" fill="currentColor" fill-opacity=".22" stroke="none"/><circle cx="8.5" cy="7" r="3.2"/><path d="M2.8 20.5v-1.2a5.7 5.7 0 0 1 11.4 0v1.2"/><circle cx="17.3" cy="10.3" r="2.3"/><path d="M14.3 20.5v-.6a3 3 0 0 1 6 0v.6"/>',
  'wallet': '<path d="M3.5 8.5h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" fill="currentColor" fill-opacity=".22" stroke="none"/><path d="M3.5 8.5h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2H16v3"/><path d="M20.5 12.5h-3.8a2 2 0 0 0 0 4h3.8"/><path d="M15.9 14.5a0.9 0.9 0 1 0 1.8 0a0.9 0.9 0 1 0 -1.8 0z" fill="currentColor" stroke="none"/>',
  'monthly-cost': '<path d="M3.5 10V7.5A2.5 2.5 0 0 1 6 5h12a2.5 2.5 0 0 1 2.5 2.5V10z" fill="currentColor" fill-opacity=".22" stroke="none"/><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M9.6 18.2v-5.4l4.8 5.4v-5.4M8.4 15.3h7.2"/>',
  'watchful-eye': '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><path d="M8.4 12a3.6 3.6 0 1 0 7.2 0a3.6 3.6 0 1 0 -7.2 0z" fill="currentColor" fill-opacity=".22" stroke="none"/><circle cx="12" cy="12" r="3.6"/><path d="M10.5 12a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0z" fill="currentColor" stroke="none"/>',
  'heart-paw': '<path d="M12 20.2s-8-4.7-8-10.6A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 8 2.5c0 5.9-8 10.6-8 10.6z" fill="currentColor" fill-opacity=".22" stroke="none"/><path d="M12 20.2s-8-4.7-8-10.6A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 8 2.5c0 5.9-8 10.6-8 10.6z"/><path d="M9.82 13.93a2.18 1.8 0 1 0 4.36 0a2.18 1.8 0 1 0 -4.36 0zM8.63 11.27a0.9 0.9 0 1 0 1.8 0a0.9 0.9 0 1 0 -1.8 0zM10.15 9.65a0.9 0.9 0 1 0 1.8 0a0.9 0.9 0 1 0 -1.8 0zM12.05 9.65a0.9 0.9 0 1 0 1.8 0a0.9 0.9 0 1 0 -1.8 0zM13.57 11.27a0.9 0.9 0 1 0 1.8 0a0.9 0.9 0 1 0 -1.8 0z" fill="currentColor" stroke="none"/>',
  'clock': '<path d="M4 13a8 8 0 1 0 16 0a8 8 0 1 0 -16 0z" fill="currentColor" fill-opacity=".22" stroke="none"/><circle cx="12" cy="13" r="8"/><path d="M12 8.8V13l2.8 2M9.5 2.5h5M19.2 5.8l1.3-1.3"/>',
  'scale': '<path d="M12 4.5v15.5M7.5 20h9M4.5 7h15"/><path d="M10.6 4.3a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0 -2.8 0z" fill="currentColor" stroke="none"/><path d="M4.5 7l-2.6 6.4a2.6 2.6 0 0 0 5.2 0zM19.5 7l-2.6 6.4a2.6 2.6 0 0 0 5.2 0z" fill="currentColor" fill-opacity=".22" stroke="none"/><path d="M4.5 7l-2.6 6.4a2.6 2.6 0 0 0 5.2 0zM19.5 7l-2.6 6.4a2.6 2.6 0 0 0 5.2 0z"/>',
  'child': '<path d="M9 6.2a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z" fill="currentColor" fill-opacity=".22" stroke="none"/><circle cx="12" cy="6.2" r="3"/><path d="M9 11h6l2 6.5h-2.2V21H9.2v-3.5H7z" fill="currentColor" fill-opacity=".22" stroke="none"/><path d="M9 11h6l2 6.5h-2.2V21H9.2v-3.5H7z"/><path d="M9.3 12.3L5.5 10M14.7 12.3l3.8-2.3"/>',
  'poison': '<path d="M3.5 13.5h17a8.5 7 0 0 1-17 0z" fill="currentColor" fill-opacity=".22" stroke="none"/><path d="M3.5 13.5h17a8.5 7 0 0 1-17 0z"/><path d="M12 2.6l4.2 7H7.8z"/><path d="M12 5.3v1.4M12 8.1h.01"/>',
  'warning': '<path d="M12 3.5L21.5 20h-19z" fill="currentColor" fill-opacity=".22" stroke="none"/><path d="M12 3.5L21.5 20h-19z"/><path d="M12 10v4.5M12 17.2h.01"/>',
  'heat': '<path d="M7 14.4V5a2 2 0 0 1 4 0v9.4a3.7 3.7 0 1 1-4 0z"/><path d="M9 17.6V9.5"/><path d="M7.3 17.6a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0 -3.4 0z" fill="currentColor" stroke="none"/><path d="M15.2 8.5a2.3 2.3 0 1 0 4.6 0a2.3 2.3 0 1 0 -4.6 0z" fill="currentColor" fill-opacity=".22" stroke="none"/><circle cx="17.5" cy="8.5" r="2.3"/><path d="M17.5 3v1M22 8.5h-1M20.7 5.3l-.7.7M20.7 11.7l-.7-.7M17.5 14v-1M14.3 5.3l.7.7"/>',
  'noise': '<path d="M3 9.2a4.6 4.6 0 0 1 0 6.6M5.8 6.6a8.3 8.3 0 0 1 0 11.8"/><path d="M10.5 20.5V13l5.25-4.2L21 13v7.5z" fill="currentColor" fill-opacity=".22" stroke="none"/><path d="M10.5 20.5V13l5.25-4.2L21 13v7.5z"/><path d="M14.5 20.5v-3.5h2.5v3.5"/>',
  'travel': '<path d="M6 7h12a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5v-8A2.5 2.5 0 0 1 6 7z" fill="currentColor" fill-opacity=".22" stroke="none"/><rect x="3.5" y="7" width="17" height="13" rx="2.5"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M8 7v13M16 7v13"/>',
  'x': '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  'minus': '<path d="M6 12h12"/>',
}
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="props.strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="paths[props.name]"
  />
</template>
