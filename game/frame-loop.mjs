// Sleep between interactions; keep scheduling only while a visual is animating.
export class FrameLoop {
 constructor(draw, {request = callback => requestAnimationFrame(callback), cancel = id => cancelAnimationFrame(id), interval = 1000 / 30} = {}) {
  this.draw = draw; this.request = request; this.cancel = cancel; this.interval = interval;
  this.pending = null; this.last = null; this.stopped = false;
  this.tick = time => {
   this.pending = null;
   if (this.stopped) return;
   if (this.last !== null && time - this.last < this.interval) { this.invalidate(); return; }
   this.last = time;
   if (this.draw(time)) this.invalidate();
  };
 }
 invalidate() { if (!this.stopped && this.pending === null) this.pending = this.request(this.tick); }
 destroy() { this.stopped = true; if (this.pending !== null) this.cancel(this.pending); this.pending = null; }
}
