import './lavan.css';

// Shared shell for the LAVAN Group pages: applies the LAVAN typography and palette (scoped to .lv).
export default function LavanGroupLayout({ children }: { children: React.ReactNode }) {
  return <div className="lv bg-[var(--lv-cream)]">{children}</div>;
}
