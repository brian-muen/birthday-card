/** "Sending…" with the three dots stepping on and off, like a busy system. */
export default function BlinkDots({ label }: { label: string }) {
  return (
    <span>
      {label}
      <span className="os-dots" aria-hidden="true">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
    </span>
  );
}
