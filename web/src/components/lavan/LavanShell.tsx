import '@/app/lavan-group/lavan.css';

// Applies the LAVAN Group look (palette + type scale, scoped to .lv) to pages outside /lavan-group,
// such as the soil-testing and real-estate landing pages.
export default function LavanShell({ children }: { children: React.ReactNode }) {
  return <div className="lv bg-[var(--lv-cream)]">{children}</div>;
}
