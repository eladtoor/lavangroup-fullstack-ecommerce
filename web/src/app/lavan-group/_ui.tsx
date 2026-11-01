import Image from 'next/image';
import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa';

// Shared building blocks for the LAVAN Group pages (private folder: not a route).

export const PHONE_DISPLAY = '050-5342813';
export const PHONE_INTL = '+972505342813';
export const WHATSAPP_URL = 'https://wa.me/972505342813';

export type Img = { src: string; alt: string; w: number; h: number };

export function SectionHead({
  id,
  kicker,
  title,
  lead,
  light = false,
}: {
  id: string;
  kicker: string;
  title: string;
  lead?: string;
  light?: boolean;
}) {
  return (
    <div className="mb-10 max-w-3xl">
      <p className="lv-kicker" dir="ltr" style={{ textAlign: 'right' }}>
        {kicker}
      </p>
      <h2 id={id} className={`lv-serif mt-3 text-3xl sm:text-4xl leading-tight ${light ? 'text-white' : 'text-[var(--lv-ink)]'}`}>
        {title}
      </h2>
      <span className="lv-rule mt-5" aria-hidden="true" />
      {lead && (
        <p className={`mt-5 text-base sm:text-lg leading-relaxed font-light ${light ? 'text-white/80' : 'text-[var(--lv-muted)]'}`}>
          {lead}
        </p>
      )}
    </div>
  );
}

export function Bullets({ items, light = false }: { items: string[]; light?: boolean }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className={`flex items-start gap-3 ${light ? 'text-white/90' : 'text-[var(--lv-text)]'}`}>
          <span className="mt-[0.7em] h-px w-4 shrink-0 bg-[var(--lv-gold)]" aria-hidden="true" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Photo({ img, className = '', priority = false }: { img: Img; className?: string; priority?: boolean }) {
  return (
    <div className={`lv-zoom overflow-hidden bg-[var(--lv-sand)] ${className}`}>
      <Image
        src={img.src}
        alt={img.alt}
        width={img.w}
        height={img.h}
        unoptimized
        priority={priority}
        className="lv-img h-full w-full object-cover"
      />
    </div>
  );
}

export function ContactBand({ title, text, waText }: { title: string; text?: string; waText?: string }) {
  const wa = waText ? `${WHATSAPP_URL}?text=${encodeURIComponent(waText)}` : WHATSAPP_URL;
  return (
    <section className="bg-[var(--lv-ink)] text-white" aria-labelledby="contact-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20 grid gap-8 lg:grid-cols-[1.4fr_1fr] items-center">
        <div>
          <p className="lv-kicker" dir="ltr" style={{ textAlign: 'right' }}>
            CONTACT
          </p>
          <h2 id="contact-heading" className="lv-serif mt-3 text-3xl sm:text-4xl">
            {title}
          </h2>
          {text && <p className="mt-4 max-w-xl text-white/75 font-light leading-relaxed">{text}</p>}
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-stretch">
          <a href={`tel:${PHONE_INTL}`} title={`התקשרו – ${PHONE_DISPLAY}`} className="lv-btn">
            <FaPhoneAlt aria-hidden="true" />
            <span dir="ltr">{PHONE_DISPLAY}</span>
          </a>
          <a href={wa} target="_blank" rel="noopener noreferrer" title="שיחת וואטסאפ" className="lv-btn-ghost">
            <FaWhatsapp aria-hidden="true" />
            וואטסאפ
          </a>
        </div>
      </div>
    </section>
  );
}
