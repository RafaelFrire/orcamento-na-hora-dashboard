import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= RO as unknown as typeof ResizeObserver
window.HTMLElement.prototype.scrollIntoView ??= () => {}
window.HTMLElement.prototype.hasPointerCapture ??= () => false
window.HTMLElement.prototype.releasePointerCapture ??= () => {}

// Esperas assíncronas mais folgadas: evita falsos negativos em máquinas sob carga.
configure({ asyncUtilTimeout: 4000 })
