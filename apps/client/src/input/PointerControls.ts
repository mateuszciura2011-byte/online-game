export type PointerCaptureState = {
  phase: string;
  menuOpen: boolean;
};

export class PointerControls {
  private canvas?: HTMLCanvasElement;

  shouldCapture(state: PointerCaptureState) {
    return state.phase === 'playing' && !state.menuOpen;
  }

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.tabIndex = 0;
  }

  capture(onError: () => void = () => undefined) {
    const canvas = this.canvas;
    if (!canvas) return;
    canvas.focus({ preventScroll: true });
    try {
      const request = canvas.requestPointerLock() as unknown as Promise<void> | void;
      void request?.catch(onError);
    } catch {
      onError();
    }
  }

  release() {
    if (typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }
}
