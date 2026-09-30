export interface PerformanceSample { fps: number; frameMs: number; }
export class PerformancePanel {
  private frameTimes: number[] = [];
  sample(deltaSeconds: number): PerformanceSample { const frameMs = Math.max(0, deltaSeconds * 1000); this.frameTimes.push(frameMs); if (this.frameTimes.length > 60) this.frameTimes.shift(); const averageMs = this.frameTimes.reduce((sum, value) => sum + value, 0) / this.frameTimes.length; return { frameMs, fps: averageMs ? Math.round(1000 / averageMs) : 0 }; }
  label(sample: PerformanceSample) { return `${sample.fps} FPS · ${sample.frameMs.toFixed(1)} ms`; }
}
