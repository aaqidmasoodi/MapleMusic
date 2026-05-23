export interface ZoomWindow {
  start: number
  end: number
}

export function getZoomWindow(
  zoomLevel: number,
  markerA: number | null,
  markerB: number | null,
  progress: number,
): ZoomWindow {
  if (zoomLevel <= 1) return { start: 0, end: 1 }

  const halfWindow = 1 / (2 * zoomLevel)
  let center: number
  if (markerA !== null && markerB !== null) {
    center = (markerA + markerB) / 2
  } else if (markerA !== null) {
    center = markerA
  } else if (markerB !== null) {
    center = markerB
  } else {
    center = progress
  }

  let start = center - halfWindow
  let end = center + halfWindow

  if (start < 0) {
    end -= start
    start = 0
  }
  if (end > 1) {
    start -= end - 1
    end = 1
  }

  return { start: Math.max(0, start), end: Math.min(1, end) }
}

/** Map a fraction (0-1) within the zoom window to an absolute position (0-1). */
export function windowToAbsolute(fraction: number, window: ZoomWindow): number {
  return window.start + fraction * (window.end - window.start)
}

/** Map an absolute position (0-1) to a fraction within the zoom window. */
export function absoluteToWindow(value: number, window: ZoomWindow): number {
  const range = window.end - window.start
  if (range <= 0) return 0
  return (value - window.start) / range
}
