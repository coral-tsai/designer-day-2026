import {
  type DesignSystem,
  type Page,
  type SlideMeta,
  type SlideTransition,
  Step,
  Steps,
  useIsActivePage,
  useSlidePageNumber,
} from '@open-slide/core';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import campaignBanners from './assets/campaign-banners.webp';
import sheetsSync from './assets/google-sheets-sync.png';
import larryWall from './assets/larry-wall.png';
import robertHeinlein from './assets/robert-heinlein.png';
import casualTop from './assets/casualtop-choice.png';
import kratosTop from './assets/kratostop-choice.png';
import demoVideo from './assets/banner-demo.mp4';
import gamesCover from './assets/games-plugin-cover.webp';
import games1 from './assets/games-plugin-1.png';
import games2 from './assets/games-plugin-2.png';
import games3 from './assets/games-plugin-3.png';
import promoCover from './assets/promo-plugin-cover.webp';
import promo1 from './assets/promo-plugin-1.png';
import promo2 from './assets/promo-plugin-2.png';
import gamesBadge from './assets/games-plugin-badge.png';
import promoBadge from './assets/promo-plugin-badge.png';
import casinoBadge from './assets/casino-skill-badge.png';

export const design: DesignSystem = {
  palette: { bg: '#FFFFFF', text: '#101216', accent: '#0878E5' },
  fonts: {
    display:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", "Heiti TC", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", "Heiti TC", sans-serif',
  },
  typeScale: { hero: 160, body: 32 },
  radius: 18,
};

// Extra palette entries outside the DesignSystem shape.
const ink2 = '#30343B';
const muted = '#666D78';
const line = '#D9DEE6';
const surface = '#F7F8FA';
const blueSoft = '#EAF3FD';
const blueLine = 'rgba(8,120,229,0.22)';
const purple = '#6F63D9';
const purpleSoft = '#F0EEFF';
const red = '#C8463A';
const redSoft = '#FDEEEB';

const EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
const mono = '"SF Mono", ui-monospace, Menlo, Consolas, monospace';

// ── In-page motion (module-level, slide-keyed) ──────────────────────────────
// Every animation is gated on [data-lz-active="true"], which only the page
// currently on stage carries — thumbnails, overview and PDF export stay static.
const STYLE_ID = 'osd-styles-lazy-is-great';
const CSS = `
@keyframes lzRise { from { opacity: 0; transform: translate3d(0, 24px, 0); } to { opacity: 1; transform: none; } }
@keyframes lzPop { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: none; } }
@keyframes lzGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes lzFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes lzSpin { to { transform: rotate(360deg); } }
@keyframes lzSpinRev { to { transform: rotate(-360deg); } }
@keyframes lzPing { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.5); opacity: 0; } }
@keyframes lzDash { to { stroke-dashoffset: -32; } }
@keyframes lzSheen { 0%, 55% { transform: translateX(-160%) skewX(-18deg); opacity: 0; } 70% { opacity: 0.6; } 100% { transform: translateX(420%) skewX(-18deg); opacity: 0; } }
@keyframes lzKen { from { transform: scale(1); } to { transform: scale(1.07); } }
@keyframes lzBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes lzGlow { 0%, 100% { box-shadow: 0 0 0 0 transparent; } 50% { box-shadow: 0 0 0 12px var(--glow, rgba(8,120,229,0.18)); } }
.lz-grow { transform-origin: 50% 100%; }
/* A revealed <Step> rises in like the rest of the page. */
[data-lz-active="true"] [data-osd-step="revealed"] > * { animation: lzRise 620ms ${EXPO} both; }
[data-lz-active="true"] .lz-rise { animation: lzRise 760ms ${EXPO} both; animation-delay: calc(var(--d, 0) * 1ms); }
[data-lz-active="true"] .lz-pop { animation: lzPop 700ms ${EXPO} both; animation-delay: calc(var(--d, 0) * 1ms); }
[data-lz-active="true"] .lz-grow { animation: lzGrow 1200ms ${EXPO} both; animation-delay: calc(var(--d, 0) * 1ms); }
[data-lz-active="true"] .lz-float { animation: lzFloat 4.8s ease-in-out infinite; animation-delay: calc(var(--d, 0) * 1ms); }
[data-lz-active="true"] .lz-orbit { animation: lzSpin 28s linear infinite; }
[data-lz-active="true"] .lz-orbit-rev { animation: lzSpinRev 20s linear infinite; }
[data-lz-active="true"] .lz-ping::after { content: ''; position: absolute; inset: 0; border-radius: inherit; border: 3px solid currentColor; animation: lzPing 1.8s ease-out infinite; pointer-events: none; }
[data-lz-active="true"] .lz-dash { animation: lzDash 1.4s linear infinite; }
[data-lz-active="true"] .lz-sheen::after { content: ''; position: absolute; top: -20%; left: 0; width: 30%; height: 140%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent); animation: lzSheen 3.2s ease-out 800ms infinite; pointer-events: none; }
[data-lz-active="true"] .lz-ken { animation: lzKen 14s cubic-bezier(0.23, 1, 0.32, 1) 400ms both; transform-origin: 30% 30%; }
[data-lz-active="true"] .lz-blink { animation: lzBlink 1.6s ease-in-out infinite; }
[data-lz-active="true"] .lz-glow { animation: lzGlow 2.4s ease-in-out 600ms infinite; }
/* Nothing inside a hidden step animates until it is revealed (no spent or spoiled motion). */
[data-osd-step="pending"] *, [data-osd-step="pending"] *::after { animation: none !important; }
@media (prefers-reduced-motion: reduce) {
  [data-lz-active="true"] [class*="lz-"], [data-lz-active="true"] [class*="lz-"]::after,
  [data-lz-active="true"] [data-osd-step] > * { animation: none !important; }
}
`;
if (typeof document !== 'undefined') {
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== CSS) style.textContent = CSS;
}

// ── Page transition — one DNA for the whole deck ────────────────────────────
export const transition: SlideTransition = {
  duration: 280,
  exit: { duration: 280, easing: 'cubic-bezier(0.4, 0, 1, 1)', keyframes: [{ opacity: 1 }, { opacity: 1 }] },
  enter: {
    duration: 280,
    easing: EXPO,
    keyframes: [
      { opacity: 0, transform: 'translateX(calc(var(--osd-dir, 1) * 12px))' },
      { opacity: 1, transform: 'translateX(0)' },
    ],
  },
};

// ── Shared building blocks ──────────────────────────────────────────────────
const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
  position: 'relative',
  fontFamily: 'var(--osd-font-body)',
  overflow: 'hidden',
};

const heavy: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontWeight: 800,
  letterSpacing: '-0.02em',
};

const pageBg =
  'radial-gradient(1100px 760px at 100% 0%, rgba(8,120,229,0.07), transparent 62%), radial-gradient(700px 700px at 0% 100%, rgba(111,99,217,0.05), transparent 60%), var(--osd-bg)';

// Dark pages (1, 8, 15) re-scope these local vars; light pages use the fallbacks.
const darkBg =
  'radial-gradient(1100px 760px at 100% 0%, rgba(8,120,229,0.30), transparent 62%), radial-gradient(800px 800px at 0% 100%, rgba(111,99,217,0.20), transparent 60%), #0D1424';
const darkVars = {
  color: '#FFFFFF',
  '--lz-line': 'rgba(255,255,255,0.14)',
  '--lz-muted': 'rgba(255,255,255,0.6)',
  '--lz-ink2': 'rgba(255,255,255,0.82)',
  '--lz-hi': '#4FA3F7',
  '--lz-tile-bg': 'rgba(255,255,255,0.06)',
  '--lz-tile-border': 'rgba(79,163,247,0.4)',
  '--lz-card': 'rgba(255,255,255,0.05)',
  '--lz-strong': '#FFFFFF',
} as CSSProperties;

// Stay "active" for a moment after leaving, so looping/entrance animations on the
// outgoing page don't snap back while the next page fades in over it.
const useActive = () => {
  const active = useIsActivePage();
  const [linger, setLinger] = useState(active);
  useEffect(() => {
    if (active) {
      setLinger(true);
      return;
    }
    const t = setTimeout(() => setLinger(false), 450);
    return () => clearTimeout(t);
  }, [active]);
  return active || linger ? 'true' : 'false';
};

// Wrapper that plays an entrance animation when the page becomes active.
const R = ({
  d = 0,
  k = 'lz-rise',
  style,
  children,
}: {
  d?: number;
  k?: string;
  style?: CSSProperties;
  children: ReactNode;
}) => (
  <div className={k} style={{ ...style, ['--d' as string]: d } as CSSProperties}>
    {children}
  </div>
);

const Hi = ({ children, color = 'var(--lz-hi, var(--osd-accent))' }: { children: ReactNode; color?: string }) => (
  <span style={{ color }}>{children}</span>
);

const Kicker = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '0.16em',
      color: 'var(--lz-hi, var(--osd-accent))',
      lineHeight: 1.2,
    }}
  >
    {children}
  </div>
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 44,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: 20,
        color: `var(--lz-muted, ${muted})`,
      }}
    >
      <span>人因懶惰而偉大 · Coral Tsai</span>
      <span>
        <b style={{ fontSize: 26, color: 'var(--lz-strong, var(--osd-text))', fontWeight: 800 }}>
          {String(current).padStart(2, '0')}
        </b>{' '}
        / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
};

const LightPage = ({
  chip,
  title,
  dark,
  children,
}: {
  chip: string;
  title?: ReactNode;
  dark?: boolean;
  children: ReactNode;
}) => (
  <div
    data-lz-active={useActive()}
    style={{
      ...fill,
      background: dark ? darkBg : pageBg,
      color: 'var(--osd-text)',
      ...(dark ? darkVars : {}),
      padding: '96px 120px 120px',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <R d={0}>
      <Kicker>{chip}</Kicker>
    </R>
    {title && (
      <R d={80}>
        <h2 style={{ ...heavy, fontSize: 72, lineHeight: 1.25, margin: '22px 0 0' }}>{title}</h2>
      </R>
    )}
    <div style={{ marginTop: 56, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
    <Footer />
  </div>
);

const Arrow = ({ color = muted, size = 36 }: { color?: string; size?: number }) => (
  <div
    style={{
      fontSize: size,
      color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    →
  </div>
);

const card: CSSProperties = {
  background: '#FFFFFF',
  border: `2px solid ${line}`,
  borderRadius: 'var(--osd-radius)',
  boxSizing: 'border-box',
};

type IconName = 'sheet' | 'chat' | 'loop' | 'spark' | 'doc' | 'check' | 'user' | 'clock';
const Icon = ({ name, size = 40, color = 'currentColor' }: { name: IconName; size?: number; color?: string }) => {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {name === 'sheet' && (
        <>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" {...p} />
          <path d="M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15" {...p} />
        </>
      )}
      {name === 'chat' && <path d="M4.5 5.5h15v10h-9l-6 4.5z" {...p} />}
      {name === 'loop' && <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4.5H15" {...p} />}
      {name === 'spark' && (
        <path d="M12 3.5l2.1 5.9 5.9 2.1-5.9 2.1-2.1 5.9-2.1-5.9-5.9-2.1 5.9-2.1z" {...p} />
      )}
      {name === 'doc' && <path d="M6.5 3.5h7.5l4 4v13h-11.5zM14 3.5v4h4M9.5 12.5h5M9.5 16h5" {...p} />}
      {name === 'check' && (
        <>
          <circle cx="12" cy="12" r="8.5" {...p} />
          <path d="M8 12.2l2.7 2.7L16 9.5" {...p} />
        </>
      )}
      {name === 'user' && (
        <>
          <circle cx="12" cy="8.5" r="3.8" {...p} />
          <path d="M4.5 20c1.4-3.7 4.2-5.5 7.5-5.5s6.1 1.8 7.5 5.5" {...p} />
        </>
      )}
      {name === 'clock' && (
        <>
          <circle cx="12" cy="12" r="8.5" {...p} />
          <path d="M12 7.5V12l3 2" {...p} />
        </>
      )}
    </svg>
  );
};

const IconTile = ({ name, size = 88, solid }: { name: IconName; size?: number; solid?: boolean }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.24,
      background: solid ? 'var(--osd-accent)' : 'var(--lz-tile-bg, #F5F9FE)',
      border: solid ? '2px solid transparent' : `2px solid var(--lz-tile-border, ${blueLine})`,
      color: solid ? '#FFFFFF' : 'var(--lz-hi, var(--osd-accent))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      boxShadow: '0 10px 28px -14px rgba(8,120,229,0.45)',
      flexShrink: 0,
    }}
  >
    <Icon name={name} size={size * 0.48} />
  </div>
);

// Concentric rings with two orbiting dots — the deck's signature visual.
const Orbit = ({ left, top, children }: { left: number; top: number; children?: ReactNode }) => (
  <div style={{ position: 'absolute', left, top, width: 760, height: 760 }}>
    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid var(--lz-line, ${line})` }} />
    <div
      style={{ position: 'absolute', left: 120, top: 120, width: 520, height: 520, borderRadius: '50%', border: `2px solid var(--lz-line, ${line})` }}
    />
    <div
      style={{ position: 'absolute', left: 240, top: 240, width: 280, height: 280, borderRadius: '50%', border: `2px dashed var(--lz-tile-border, ${blueLine})` }}
    />
    <div className="lz-orbit" style={{ position: 'absolute', inset: 0 }}>
      <div
        style={{
          position: 'absolute',
          left: 371,
          top: -9,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'var(--osd-accent)',
          boxShadow: '0 0 0 8px rgba(8,120,229,0.12)',
        }}
      />
    </div>
    <div className="lz-orbit-rev" style={{ position: 'absolute', left: 120, top: 120, width: 520, height: 520 }}>
      <div
        style={{
          position: 'absolute',
          left: 253,
          top: 511,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: purple,
          boxShadow: '0 0 0 7px rgba(111,99,217,0.12)',
        }}
      />
    </div>
    {children}
  </div>
);

// ── 1 · Cover ───────────────────────────────────────────────────────────────
const Capsule = ({ children, hot }: { children: ReactNode; hot?: boolean }) => (
  <div
    style={{
      fontSize: 28,
      fontWeight: 700,
      padding: '16px 32px',
      borderRadius: 999,
      background: hot ? 'var(--osd-accent)' : 'var(--lz-card, #FFFFFF)',
      border: hot ? '2px solid transparent' : `2px solid var(--lz-line, ${line})`,
      color: hot ? '#FFFFFF' : `var(--lz-ink2, ${ink2})`,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

const Cover: Page = () => (
  <div data-lz-active={useActive()} style={{ ...fill, background: darkBg, ...darkVars }}>
    <Orbit left={1100} top={160}>
      <R k="lz-pop" d={500} style={{ position: 'absolute', left: 320, top: 320 }}>
        <IconTile name="spark" size={120} solid />
      </R>
      <R k="lz-pop" d={650} style={{ position: 'absolute', left: 560, top: 70 }}>
        <div className="lz-float" style={{ ['--d' as string]: 0 } as CSSProperties}>
          <IconTile name="sheet" />
        </div>
      </R>
      <R k="lz-pop" d={750} style={{ position: 'absolute', left: 30, top: 300 }}>
        <div className="lz-float" style={{ ['--d' as string]: 1200 } as CSSProperties}>
          <IconTile name="chat" />
        </div>
      </R>
      <R k="lz-pop" d={850} style={{ position: 'absolute', left: 520, top: 590 }}>
        <div className="lz-float" style={{ ['--d' as string]: 2400 } as CSSProperties}>
          <IconTile name="loop" />
        </div>
      </R>
    </Orbit>
    <div
      style={{
        position: 'relative',
        height: '100%',
        padding: '0 160px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <R d={0}>
        <Kicker>設計流程優化分享</Kicker>
      </R>
      <R d={100}>
        <h1 style={{ ...heavy, fontSize: 'var(--osd-size-hero)', lineHeight: 1.08, margin: '40px 0 36px', letterSpacing: '-0.035em' }}>
          <Hi>人因懶惰</Hi>
          <br />
          而偉大
        </h1>
      </R>
      <R d={220}>
        <p style={{ fontSize: 40, lineHeight: 1.5, margin: 0, color: `var(--lz-ink2, ${ink2})`, fontWeight: 600 }}>
          一個設計師把 <Hi>banner 生產</Hi>交給 <Hi>AI agent</Hi> 的故事
        </p>
      </R>
      <R d={340}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 64 }}>
          <Capsule>手貼多語系</Capsule>
          <Arrow color="var(--lz-hi, var(--osd-accent))" size={32} />
          <Capsule>Google Sheet Plugin</Capsule>
          <Arrow color="var(--lz-hi, var(--osd-accent))" size={32} />
          <Capsule hot>一句話交給 AI</Capsule>
        </div>
      </R>
      <R d={460}>
        <div style={{ width: 560, height: 2, background: `var(--lz-line, ${line})`, margin: '64px 0 28px' }} />
        <div style={{ fontSize: 30, fontWeight: 800 }}>Coral Tsai</div>
      </R>
    </div>
  </div>
);

// ── Agenda ──────────────────────────────────────────────────────────────────
const AgendaItem = ({ n, tag, title, desc, d }: { n: string; tag: string; title: string; desc: string; d: number }) => (
  <R d={d} style={{ height: '100%' }}>
    <div
      style={{
        ...card,
        height: '100%',
        boxSizing: 'border-box',
        padding: '36px 30px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <span style={{ ...heavy, fontSize: 56, color: 'var(--osd-accent)', lineHeight: 1 }}>{n}</span>
      <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.16em', color: muted, marginTop: 18 }}>{tag}</span>
      <span style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.3 }}>{title}</span>
      <span style={{ fontSize: 22, lineHeight: 1.5, color: muted, marginTop: 'auto' }}>{desc}</span>
    </div>
  </R>
);

const Agenda: Page = () => (
  <LightPage chip="AGENDA" title={<>今天想聊的<Hi>五件事</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24, height: 440 }}>
      <AgendaItem d={160} n="01" tag="WHY" title="為什麼想偷懶" desc="設計結束的地方，就是重複的開始" />
      <AgendaItem d={220} n="02" tag="HOW" title="我偷懶了兩次" desc="Google Sheet → Skill＋AI" />
      <AgendaItem d={280} n="03" tag="PROOF" title="真的有用嗎" desc="Demo、成效，換一個 AI 也行嗎" />
      <AgendaItem d={340} n="04" tag="TEAM" title="大家都有好做法" desc="InJoi、B2C、XitMent 合成一套模組" />
      <AgendaItem d={400} n="05" tag="NEXT" title="接下來" desc="Skill 是活的，Banner Kit 帶回家" />
    </div>
  </LightPage>
);

// ── 2 · Manifesto ───────────────────────────────────────────────────────────
// `focus` is where the face sits in the photo; `zoom` crops in so the head fills the frame.
const Quote = ({
  text,
  who,
  photo,
  focus,
  zoom,
}: {
  text: string;
  who: string;
  photo: string;
  focus: string;
  zoom: number;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
    <div
      style={{
        width: 150,
        height: 180,
        flexShrink: 0,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 16px 32px -18px rgba(16,18,22,0.5)',
      }}
    >
      <img
        src={photo}
        alt={who.replace(/^— /, '')}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain', objectPosition: '50% 50%', transform: `scale(${zoom})`, transformOrigin: focus }}
      />
    </div>
    <div style={{ borderLeft: '5px solid var(--osd-accent)', paddingLeft: 28 }}>
      <p style={{ fontSize: 32, lineHeight: 1.5, margin: 0, fontWeight: 600, color: ink2 }}>{text}</p>
      <p style={{ fontSize: 22, lineHeight: 1.4, margin: '14px 0 0', color: muted }}>{who}</p>
    </div>
  </div>
);

const Mantra = ({ n, from, to, color }: { n: string; from: string; to: string; color: string }) => (
  <div
    style={{
      height: '100%',
      background: surface,
      borderRadius: 'var(--osd-radius)',
      borderTop: `5px solid ${color}`,
      padding: '36px 44px',
      boxSizing: 'border-box',
      position: 'relative',
    }}
  >
    <div style={{ position: 'absolute', right: 36, top: 26, ...heavy, fontSize: 48, color: line }}>{n}</div>
    <div style={{ fontSize: 30, color: muted, fontWeight: 600 }}>{from}</div>
    <div style={{ fontSize: 30, color, margin: '10px 0' }}>↓</div>
    <div style={{ ...heavy, fontSize: 56, lineHeight: 1.2, color }}>{to}</div>
  </div>
);

const Manifesto: Page = () => (
  <LightPage chip="WHY · 懶惰宣言">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, marginTop: -8 }}>
      <R d={140}>
        <Quote
          text="「懶惰，是程式設計師的三大美德之一。」"
          who="— Larry Wall（Perl 語言作者）"
          photo={larryWall}
          focus="54% 4%"
          zoom={1.75}
        />
      </R>
      <R d={220}>
        <Quote
          text="「進步不是早起的人帶來的，而是懶人為了找更簡單的方法而帶來的。」"
          who="— Robert A. Heinlein，《Time Enough for Love》"
          photo={robertHeinlein}
          focus="84% 10%"
          zoom={2.2}
        />
      </R>
    </div>
    <R d={340}>
      <h2 style={{ ...heavy, fontSize: 66, lineHeight: 1.3, margin: '76px 0 0' }}>
        同一件事做三次，
        <Hi>我就想偷懶了。</Hi>
      </h2>
    </R>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36, marginTop: 56, height: 260 }}>
      <Steps>
        <Step duration={260}>
          <Mantra n="01" from="重複的" to="交給工具" color="var(--osd-accent)" />
        </Step>
        <Step duration={260}>
          <Mantra n="02" from="會錯的" to="交給流程" color={purple} />
        </Step>
        <Step duration={260}>
          <Mantra n="03" from="要判斷的" to="才交給人" color="var(--osd-text)" />
        </Step>
      </Steps>
    </div>
  </LightPage>
);

// ── 3 · Handmade era ────────────────────────────────────────────────────────
const NumStep = ({ n, text }: { n: string; text: string }) => (
  <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 20, padding: '0 24px', height: 52, borderRadius: 12 }}>
    <div style={{ ...heavy, fontSize: 28, color: 'var(--osd-accent)', width: 22 }}>{n}</div>
    <div style={{ fontSize: 26, fontWeight: 700 }}>{text}</div>
  </div>
);

const PainTag = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      fontSize: 24,
      fontWeight: 700,
      padding: '12px 24px',
      borderRadius: 999,
      background: redSoft,
      color: red,
    }}
  >
    {children}
  </div>
);

const Handmade: Page = () => (
  <LightPage chip="WHY · 起點" title={<>設計結束的地方，<Hi>就是重複的開始</Hi></>}>
    {/* Hero screenshot: every banner one past campaign needed (2000×684). */}
    <R k="lz-pop" d={160}>
      <div
        style={{
          position: 'relative',
          height: 459,
          borderRadius: 'var(--osd-radius)',
          overflow: 'hidden',
          background: '#1E1E1E',
          boxShadow: '0 40px 80px -48px rgba(16,18,22,0.55)',
        }}
      >
        {/* 2000×684 shown whole (height-bound, centred); the band's #1E1E1E matches the
            Figma canvas behind it. Thin blurred strips cover the 「BET & WIN」 lines;
            bands are in the screenshot's own pixel rows (y0–y1 of 684). */}
        <div className="lz-ken" style={{ position: 'relative', height: '100%', aspectRatio: '2000 / 684', margin: '0 auto' }}>
          <img
            src={campaignBanners}
            alt="過去一檔活動的全部 banner：所有版位 × 所有語系"
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          {[
            [0, 68, 90, 86],
            [0, 252, 2000, 274],
            [0, 392, 2000, 410],
            [0, 453, 2000, 469],
            [0, 495, 2000, 510],
            [0, 536, 2000, 550],
            [0, 566, 2000, 580],
            [0, 611, 2000, 626],
            [0, 645, 2000, 659],
          ].map(([x0, y0, x1, y1]) => (
            <div
              key={y0}
              style={{
                position: 'absolute',
                left: `${(x0 / 2000) * 100}%`,
                top: `${(y0 / 684) * 100}%`,
                width: `${((x1 - x0) / 2000) * 100}%`,
                height: `${((y1 - y0) / 684) * 100}%`,
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)',
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
      </div>
    </R>
    <div style={{ display: 'grid', gridTemplateColumns: '500px 1fr 560px', gap: 32, height: 178, marginTop: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <R d={360}>
          <NumStep n="1" text="有了主視覺設計" />
        </R>
        <R d={420}>
          <NumStep n="2" text="手動 resize 成每個版位" />
        </R>
        <R d={480}>
          <NumStep n="3" text="多語系、幣別一個一個貼上" />
        </R>
      </div>
      <R d={560} style={{ height: '100%' }}>
        <div
          style={{
            height: '100%',
            background: surface,
            borderRadius: 'var(--osd-radius)',
            padding: '0 32px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <div style={{ fontSize: 22, color: muted, fontWeight: 700, letterSpacing: '0.12em' }}>痛點</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <PainTag>重複勞動</PainTag>
            <PainTag>容易出錯</PainTag>
            <PainTag>時間錯置</PainTag>
          </div>
        </div>
      </R>
      <R k="lz-pop" d={640} style={{ height: '100%' }}>
        <div
          style={{
            height: '100%',
            background: 'var(--osd-accent)',
            color: '#FFFFFF',
            borderRadius: 'var(--osd-radius)',
            padding: '0 36px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{ position: 'absolute', right: -90, top: -120, width: 280, height: 280, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.22)' }}
          />
          <div style={{ position: 'relative', fontSize: 24, lineHeight: 1.4, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
            13 版位 × 12 語系 =
          </div>
          <div style={{ position: 'relative', ...heavy, fontSize: 64, lineHeight: 1.15, whiteSpace: 'nowrap', marginTop: 4 }}>
            156 張圖
          </div>
        </div>
      </R>
    </div>
  </LightPage>
);

// ── 5 · Evolution 1 ─────────────────────────────────────────────────────────
const BeforeAfterLine = ({ tag, text, good }: { tag: string; text: string; good?: boolean }) => (
  <div
    style={{
      height: '100%',
      boxSizing: 'border-box',
      borderRadius: 'var(--osd-radius)',
      padding: '0 32px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 8,
      background: good ? '#FFFFFF' : surface,
      border: good ? '2px solid var(--osd-accent)' : `2px solid ${line}`,
    }}
  >
    <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.16em', color: good ? 'var(--osd-accent)' : muted }}>{tag}</span>
    <span style={{ fontSize: 28, fontWeight: 700, color: good ? 'var(--osd-text)' : ink2 }}>{text}</span>
  </div>
);

const Evolution1: Page = () => (
  <LightPage chip="HOW · 第一次偷懶" title={<>把 Google Sheet 接進流程，<Hi>文案不再手貼</Hi></>}>
    <MiniFlow owners={{ '05': 'sheet' }} tags={{ '05': 'Sheet' }} />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 1fr', alignItems: 'stretch', height: 120 }}>
        <R d={180} style={{ height: '100%' }}>
          <BeforeAfterLine tag="BEFORE" text="逐格複製、切回 Figma 貼上，改一個字就全部重貼" />
        </R>
        <Arrow color="var(--osd-accent)" size={40} />
        <div className="lz-rise">
          <BeforeAfterLine tag="AFTER" text="文案集中一張 Sheet，Plugin 依語系自動填入" good />
        </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1161px 1fr', gap: 36, height: 387, marginTop: 30 }}>
      {/* The plugin we used: Google Sheets Sync (Figma Community page). 1504×500 */}
      <div className="lz-rise">
        <div
          style={{
            position: 'relative',
            height: 387,
            borderRadius: 'var(--osd-radius)',
            overflow: 'hidden',
            background: '#2B2B2B',
            boxShadow: '0 32px 64px -40px rgba(16,18,22,0.55)',
          }}
        >
          <img
            src={sheetsSync}
            alt="Google Sheets Sync：試算表的每一列自動帶入 Figma 卡片"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
          <div className="lz-rise">
            <div
              style={{
                height: 200,
                boxSizing: 'border-box',
                background: blueSoft,
                color: 'var(--osd-text)',
                borderRadius: 'var(--osd-radius)',
                padding: '0 40px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 700 }}>多語系貼字時間</span>
              <span style={{ ...heavy, fontSize: 60, color: 'var(--osd-accent)', lineHeight: 1.15, marginTop: 6 }}>↓ 約 【60%】</span>
            </div>
          </div>
          <div className="lz-rise">
            <div
              style={{
                height: 171,
                boxSizing: 'border-box',
                background: redSoft,
                borderRadius: 'var(--osd-radius)',
                padding: '0 28px',
                display: 'flex',
                alignItems: 'center',
                gap: 18,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: red,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                }}
              >
                缺點
              </span>
              <span style={{ fontSize: 24, lineHeight: 1.45, fontWeight: 600 }}>
                圖層沒命名好就會漏字——同一張 banner 出現<span style={{ color: red }}>兩種語系</span>
              </span>
            </div>
          </div>
      </div>
    </div>
  </LightPage>
);

// ── 6 · Evolution 2 ─────────────────────────────────────────────────────────
const ActCard = ({
  icon,
  n,
  title,
  children,
  hot,
}: {
  icon: IconName;
  n: string;
  title: string;
  children: ReactNode;
  hot?: boolean;
}) => (
  <div
    style={{
      ...card,
      height: '100%',
      padding: '40px 44px',
      background: hot ? 'var(--osd-accent)' : '#FFFFFF',
      border: hot ? '2px solid transparent' : `2px solid ${line}`,
      color: hot ? '#FFFFFF' : 'var(--osd-text)',
      position: 'relative',
    }}
  >
    <div style={{ position: 'absolute', right: 40, top: 32, ...heavy, fontSize: 52, color: hot ? 'rgba(255,255,255,0.35)' : line }}>
      {n}
    </div>
    {hot ? (
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: 'rgba(255,255,255,0.16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
        }}
      >
        <Icon name={icon} size={40} />
      </div>
    ) : (
      <IconTile name={icon} size={80} />
    )}
    <div style={{ fontSize: 40, fontWeight: 800, margin: '28px 0 20px' }}>{title}</div>
    <div style={{ fontSize: 28, lineHeight: 1.55, color: hot ? 'rgba(255,255,255,0.88)' : muted }}>{children}</div>
  </div>
);

// One of AI's three jobs, inside the blue AI card.
const AIJob = ({ n, title, desc }: { n: string; title: string; desc: string }) => (
  <div
    style={{
      height: 84,
      borderRadius: 14,
      background: 'rgba(255,255,255,0.14)',
      padding: '0 22px',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
    }}
  >
    <span
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: '#FFFFFF',
        color: 'var(--osd-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {n}
    </span>
    <span style={{ fontSize: 28, fontWeight: 800, whiteSpace: 'nowrap', width: 168 }}>{title}</span>
    <span style={{ fontSize: 23, lineHeight: 1.4, color: 'rgba(255,255,255,0.85)' }}>{desc}</span>
  </div>
);

const FlowArrow = () => (
  <div style={{ width: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'var(--osd-accent)' }}>
    →
  </div>
);

const Evolution2: Page = () => (
  <LightPage chip="HOW · 第二次偷懶" title={<>寫成 Skill，然後<Hi>一句話交給 AI</Hi></>}>
    <MiniFlow owners={{ '05': 'ai', '06': 'ai' }} tags={{ '05': 'AI', '06': 'AI' }} />
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr 484px', height: 432 }}>
        <div className="lz-rise">
          <ActCard icon="chat" n="01" title="我說一句話">
            <span
              style={{
                display: 'block',
                background: blueSoft,
                color: 'var(--osd-text)',
                borderRadius: 14,
                padding: '16px 20px',
              }}
            >「多語系」</span>
          </ActCard>
        </div>
        <div className="lz-rise">
          <div style={{ display: 'flex', height: '100%' }}>
            <FlowArrow />
            <div
              style={{
                flex: 1,
                background: 'var(--osd-accent)',
                color: '#FFFFFF',
                borderRadius: 'var(--osd-radius)',
                padding: '32px 32px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '0 28px 56px -32px rgba(8,120,229,0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: 'rgba(255,255,255,0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="spark" size={34} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.12em', opacity: 0.75 }}>02 · AI AGENT</div>
                  <div style={{ fontSize: 36, fontWeight: 800 }}>照著 Skill 跑完三件事</div>
                </div>
              </div>
              <AIJob n="1" title="聽懂一句話" desc="要做哪些母版、哪些語系" />
              <AIJob n="2" title="照 Skill 執行" desc="帶入斷好行的文案、換幣別、對位" />
              <AIJob n="3" title="檢查並回報" desc="截圖確認每張都排好" />
            </div>
          </div>
        </div>
        <div className="lz-rise">
          <div style={{ display: 'flex', height: '100%' }}>
            <FlowArrow />
            <div style={{ flex: 1 }}>
            <ActCard icon="user" n="03" title="我去做別的設計">
              想新主視覺、跟 PO 討論
              <span
                style={{
                  display: 'block',
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: `2px solid ${line}`,
                  fontSize: 24,
                }}
              >
                文案和斷行由 <b style={{ color: 'var(--osd-text)' }}>content writer</b> 先準備好
              </span>
            </ActCard>
            </div>
          </div>
        </div>
    </div>
      <div className="lz-rise">
        <h3 style={{ ...heavy, fontSize: 72, lineHeight: 1.25, margin: '36px 0 0' }}>
          從<Hi color={muted}>動手做</Hi>，變成<Hi>只出一張嘴</Hi>。
        </h3>
      </div>
  </LightPage>
);

// ── 6.5 · Inside the Skill — the resize flow ────────────────────────────────
const AskRow = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      height: 56,
      borderRadius: 12,
      background: '#FFFFFF',
      border: `2px solid ${line}`,
      padding: '0 18px',
      display: 'flex',
      alignItems: 'center',
      fontSize: 24,
      fontWeight: 700,
      boxSizing: 'border-box',
    }}
  >
    {children}
  </div>
);

const LoopRow = ({ n, children }: { n: string; children: ReactNode }) => (
  <div
    style={{
      height: 46,
      borderRadius: 12,
      background: 'rgba(255,255,255,0.14)',
      padding: '0 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      fontSize: 24,
      fontWeight: 700,
    }}
  >
    <span
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: '#FFFFFF',
        color: 'var(--osd-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {n}
    </span>
    {children}
  </div>
);

const PhaseHead = ({ n, title, light }: { n: string; title: string; light?: boolean }) => (
  <div style={{ marginBottom: 16 }}>
    <div
      style={{
        fontSize: 20,
        fontWeight: 800,
        letterSpacing: '0.14em',
        color: light ? 'rgba(255,255,255,0.75)' : 'var(--osd-accent)',
      }}
    >
      STEP {n}
    </div>
    <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4 }}>{title}</div>
  </div>
);

const phaseCard: CSSProperties = {
  height: '100%',
  borderRadius: 'var(--osd-radius)',
  padding: '30px 28px',
  boxSizing: 'border-box',
};

const PhaseArrow = () => (
  <div style={{ width: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'var(--osd-accent)' }}>
    →
  </div>
);

const SkillInside: Page = () => (
  <LightPage chip="HOW · Skill 長什麼樣" title={<>Skill 裡面，<Hi>寫的就是做法</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: '360px 328px 1fr 328px', height: 480 }}>
        <R d={160} style={{ height: '100%' }}>
          <div style={{ ...phaseCard, background: surface }}>
            <PhaseHead n="1" title="先問清楚" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <AskRow>要哪些版位？</AskRow>
              <AskRow>哪份 Sheet、哪個分頁？</AskRow>
              <AskRow>命名要不要加幣別？</AskRow>
              <AskRow>Figma 檔在哪？</AskRow>
            </div>
          </div>
        </R>
        <div className="lz-rise">
          <div style={{ display: 'flex', height: '100%' }}>
            <PhaseArrow />
            <div style={{ ...phaseCard, ...card, flex: 1 }}>
              <PhaseHead n="2" title="找到各版位母版" />
              <div style={{ fontSize: 24, lineHeight: 1.55, color: muted }}>
                設計師先做好每個版位的母版，AI 自己找到它們，讀出 headline、subtitle、CTA、T&amp;C 各是哪個圖層
              </div>
            </div>
          </div>
        </div>
        <div className="lz-rise">
          <div style={{ display: 'flex', height: '100%' }}>
            <PhaseArrow />
            <div
              style={{
                ...phaseCard,
                flex: 1,
                background: 'var(--osd-accent)',
                color: '#FFFFFF',
                boxShadow: '0 28px 56px -32px rgba(8,120,229,0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <PhaseHead n="3" title="每個版位 × 每個語系" light />
                <span style={{ fontSize: 40, opacity: 0.6, lineHeight: 1 }}>↻</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <R d={120}>
                  <LoopRow n="1">複製母版（絕不動原檔）</LoopRow>
                </R>
                <R d={190}>
                  <LoopRow n="2">填入 writer 斷好行的文案</LoopRow>
                </R>
                <R d={260}>
                  <LoopRow n="3">換上該語系的幣別與 T&amp;C</LoopRow>
                </R>
                <R d={330}>
                  <LoopRow n="4">命名 CasualTop_TH_THB</LoopRow>
                </R>
                <R d={400}>
                  <LoopRow n="5">截圖檢查：塞得下、沒漏字</LoopRow>
                </R>
              </div>
            </div>
          </div>
        </div>
        <div className="lz-rise">
          <div style={{ display: 'flex', height: '100%' }}>
            <PhaseArrow />
            <div style={{ ...phaseCard, ...card, flex: 1 }}>
              <PhaseHead n="4" title="回報給我" />
              <div style={{ fontSize: 24, lineHeight: 1.55, color: muted }}>
                列出產了哪些圖，告訴我哪裡要看
              </div>
            </div>
          </div>
        </div>
    </div>
    <R d={260}>
      <div style={{ fontSize: 22, color: muted, marginTop: 28 }}>
        取自 metamon 的 <b style={{ color: 'var(--osd-text)' }}>multi-lang</b> skill · 自動 resize 版位的{' '}
        <b style={{ color: 'var(--osd-text)' }}>resize</b> skill 還在開發中
      </div>
    </R>
  </LightPage>
);

// ── 7.5 · One rule, on a real banner (CasualTop 750×224) ─────────────────────
// Overlay boxes are in canvas px inside the 1680×600 stage. CasualTop is drawn at
// x=648, y=70, 1032×308 (×1.376 of 750×224); KratosTop below it at y=470, 1032×88
// (×0.876 of 1178×100).
const BANNER = { x: 648, y: 70, w: 1032, h: 308, s: 1032 / 750 };
const KT = { x: 648, y: 470, w: 1032, h: 1032 * (100 / 1178), s: 1032 / 1178 };
const box = (x0: number, y0: number, x1: number, y1: number, b = BANNER) => ({
  left: b.x + x0 * b.s,
  top: b.y + y0 * b.s,
  width: (x1 - x0) * b.s,
  height: (y1 - y0) * b.s,
});

// Blurs a region of a banner (brand logo, product name, playing cards) so the
// page shows the layout rules without the product content.
const Blur = ({ at }: { at: CSSProperties }) => (
  <div
    style={{
      position: 'absolute',
      ...at,
      borderRadius: 8,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      background: 'rgba(16,18,22,0.25)',
      pointerEvents: 'none',
    }}
  />
);
// Same, but in the banner's own pixel space (relative to the image's top-left).
const localBox = (x0: number, y0: number, x1: number, y1: number, s: number): CSSProperties => ({
  left: x0 * s,
  top: y0 * s,
  width: (x1 - x0) * s,
  height: (y1 - y0) * s,
});

const Mark = ({ at, label, tag }: { at: CSSProperties; label: string; tag: CSSProperties }) => (
  <>
    <div
      style={{
        position: 'absolute',
        ...at,
        border: '3px solid #4FA3F7',
        borderRadius: 10,
        background: 'rgba(79,163,247,0.14)',
        boxShadow: '0 0 0 4px rgba(79,163,247,0.18)',
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    />
    <div
      style={{
        position: 'absolute',
        ...tag,
        fontSize: 20,
        fontWeight: 800,
        padding: '5px 12px',
        borderRadius: 8,
        background: 'var(--osd-accent)',
        color: '#FFFFFF',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  </>
);

const RuleLine = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 12, fontSize: 22, lineHeight: 1.5, color: '#E6EDF7', margin: '6px 0' }}>
    <span style={{ color: '#4FA3F7', flexShrink: 0 }}>-</span>
    <span>{children}</span>
  </div>
);

const MdHead = ({ children }: { children: ReactNode }) => (
  <div style={{ fontSize: 22, fontWeight: 700, color: '#7CB8F7', margin: '14px 0 2px' }}>{children}</div>
);

const RulePage: Page = () => {
  const hl = box(64, 22, 416, 120);
  const sub = box(64, 120, 456, 146);
  const cta = box(64, 150, 196, 202);
  const face = box(566, 14, 636, 104);
  const ktSafe = box(174.5, 0, 1003.5, 100, KT);
  const ktSub = box(203, 69, 472, 89, KT);
  const ktHl = box(203, 36, 517, 69, KT);
  const ktCta = box(548, 39, 674, 86, KT);
  return (
    <LightPage chip="HOW · 規則長這樣" title={<>寫下一條規則，<Hi>AI 就照著做</Hi></>}>
      <div style={{ position: 'relative', height: 600 }}>
        <R k="lz-pop" d={260} style={{ position: 'absolute', left: BANNER.x, top: BANNER.y }}>
          <img
            src={casualTop}
            alt="CasualTop 750×224 master banner"
            style={{ width: BANNER.w, height: BANNER.h, display: 'block', borderRadius: 14, boxShadow: '0 32px 64px -36px rgba(16,18,22,0.6)' }}
          />
          <Blur at={localBox(408, 14, 514, 62, BANNER.s)} />
          <Blur at={localBox(294, 118, 420, 144, BANNER.s)} />
          <Blur at={localBox(466, 28, 560, 224, BANNER.s)} />
          <Blur at={localBox(640, 140, 712, 224, BANNER.s)} />
          <Blur at={localBox(636, 30, 666, 140, BANNER.s)} />
        </R>
        {/* Wrapper sits at the stage origin (padding, not margin, so nothing collapses) —
            overlays inside the steps are positioned from here. */}
        <R d={160} style={{ width: 600, height: 600, paddingTop: 20, boxSizing: 'border-box' }}>
          <div
            style={{
              height: 560,
              boxSizing: 'border-box',
              background: '#101216',
              borderRadius: 'var(--osd-radius)',
              padding: '0 32px 28px',
              fontFamily: mono,
            }}
          >
            <div
              style={{
                height: 56,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderBottom: '1px solid rgba(255,255,255,0.12)',
                fontSize: 20,
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
              <span style={{ marginLeft: 12 }}>resize/reference/placements.md</span>
            </div>
              <MdHead>## CasualTop — 750 × 224</MdHead>
              <div className="lz-rise">
                <RuleLine>常用的 master。</RuleLine>
                <div
                  style={{
                    position: 'absolute',
                    left: BANNER.x - 8,
                    top: BANNER.y - 8,
                    width: BANNER.w + 16,
                    height: BANNER.h + 16,
                    border: '3px dashed #0878E5',
                    borderRadius: 18,
                    boxSizing: 'border-box',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: BANNER.x,
                    top: BANNER.y - 56,
                    width: BANNER.w,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    fontFamily: 'var(--osd-font-body)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      padding: '6px 14px',
                      borderRadius: 8,
                      background: 'var(--osd-accent)',
                      color: '#FFFFFF',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    master · CasualTop 750 × 224
                  </span>
                </div>
              </div>
              <div className="lz-rise">
                <RuleLine>圖層角色（headline／subtitle／CTA／T&amp;C）以它為準。</RuleLine>
                <div style={{ position: 'absolute', left: 0, top: 0, fontFamily: 'var(--osd-font-body)' }}>
                  <Mark at={hl} label="headline" tag={{ left: hl.left, top: BANNER.y - 50 }} />
                  <Mark at={sub} label="subtitle" tag={{ left: sub.left + sub.width + 12, top: sub.top }} />
                  <Mark at={cta} label="CTA" tag={{ left: cta.left + cta.width + 12, top: cta.top + 18 }} />
                </div>
              </div>
              <MdHead>## 通用（所有版位）</MdHead>
              <div className="lz-rise">
                <RuleLine>角色的臉必須完整可見——至少整張臉要露出。</RuleLine>
                <div style={{ position: 'absolute', left: 0, top: 0, fontFamily: 'var(--osd-font-body)' }}>
                  <Mark at={face} label="臉要完整" tag={{ left: face.left - 8, top: face.top + face.height + 12 }} />
                </div>
              </div>
              <MdHead>## KratosTop — 1178 × 100</MdHead>
              <div className="lz-rise">
                <RuleLine>安全區：寬 829 px、水平置中——所有內容都留在這條帶狀範圍內。</RuleLine>
                <div style={{ position: 'absolute', left: 0, top: 0, fontFamily: 'var(--osd-font-body)' }}>
                  
                  <img
                    src={kratosTop}
                    alt="KratosTop 1178×100 banner"
                    style={{
                      position: 'absolute',
                      left: KT.x,
                      top: KT.y,
                      width: KT.w,
                      height: KT.h,
                      maxWidth: 'none', // wrapper is 0-wide; don't let a global img max-width squash it
                      borderRadius: 10,
                      boxShadow: '0 24px 48px -30px rgba(16,18,22,0.6)',
                    }}
                  />
                  <Blur at={box(200, 12, 266, 40, KT)} />
                  <Blur at={box(372, 68, 472, 88, KT)} />
                  <Blur at={box(746, 12, 828, 100, KT)} />
                  <Blur at={box(876, 10, 912, 100, KT)} />
                  {/* Dim what falls outside the safe area. */}
                  <div
                    style={{ position: 'absolute', left: KT.x, top: KT.y, width: ktSafe.left - KT.x, height: KT.h, background: 'rgba(0,0,0,0.5)', borderRadius: '10px 0 0 10px' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: ktSafe.left + ktSafe.width,
                      top: KT.y,
                      width: KT.x + KT.w - (ktSafe.left + ktSafe.width),
                      height: KT.h,
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: '0 10px 10px 0',
                    }}
                  />
                  <Mark
                    at={ktSafe}
                    label="安全區 829 px"
                    tag={{ left: ktSafe.left + ktSafe.width / 2 - 80, top: KT.y + KT.h + 12 }}
                  />
                </div>
              </div>
              <div className="lz-rise">
                <RuleLine>保留 subtitle——不要省略，縮小字級塞進 100 px 高度。</RuleLine>
                <div style={{ position: 'absolute', left: 0, top: 0, fontFamily: 'var(--osd-font-body)' }}>
                  <Mark at={ktHl} label="headline" tag={{ left: ktHl.left - 128, top: ktHl.top - 4 }} />
                  <Mark at={ktSub} label="subtitle 保留" tag={{ left: ktSub.left, top: KT.y + KT.h + 12 }} />
                  <Mark at={ktCta} label="CTA" tag={{ left: ktCta.left + ktCta.width + 10, top: ktCta.top + 6 }} />
                </div>
              </div>
          </div>
        </R>
      </div>
    </LightPage>
  );
};

// ── 8 · Demo ────────────────────────────────────────────────────────────────
// Plays (muted, from the start) when the page comes on stage; pauses when it leaves.
// Thumbnails never play — they only show the first frame.
const DemoVideo = () => {
  const active = useIsActivePage();
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [active]);
  return (
    <video
      ref={ref}
      src={demoVideo}
      muted
      playsInline
      controls
      preload="metadata"
      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000000' }}
    />
  );
};

// Compact header (title + time chip on one row) and a single row of beats under
// the video, so the recording gets as much height as the canvas allows.
const ImpactPill = ({ label, value, color, hot }: { label: string; value: string; color: string; hot?: boolean }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 10,
      padding: '6px 20px',
      borderRadius: 999,
      background: hot ? 'rgba(79,163,247,0.16)' : 'rgba(255,255,255,0.06)',
      border: hot ? '1px solid rgba(79,163,247,0.45)' : '1px solid rgba(255,255,255,0.12)',
      whiteSpace: 'nowrap',
    }}
  >
    <span style={{ fontSize: 24, fontWeight: 800 }}>{label}</span>
    <span style={{ fontSize: 20, color, fontWeight: 700 }}>約</span>
    <span style={{ ...heavy, fontSize: 34, color }}>{value}</span>
    <span style={{ fontSize: 20, color, fontWeight: 700 }}>分鐘</span>
  </div>
);

const Demo: Page = () => (
  <div
    data-lz-active={useActive()}
    style={{ ...fill, background: darkBg, color: 'var(--osd-text)', ...darkVars, padding: '56px 120px 0', display: 'flex', flexDirection: 'column' }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div>
        <R d={0}>
          <Kicker>PROOF · 實際操作</Kicker>
        </R>
        <R d={80}>
          <h2 style={{ ...heavy, fontSize: 56, lineHeight: 1.2, margin: '10px 0 0' }}>
            一句話，<Hi>看 AI 換好所有語系</Hi>
          </h2>
        </R>
      </div>
      <R d={260}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 12,
            padding: '10px 22px',
            borderRadius: 14,
            background: 'rgba(79,163,247,0.14)',
            border: '1px solid rgba(79,163,247,0.35)',
          }}
        >
          <span style={{ fontSize: 22, color: `var(--lz-muted, ${muted})`, fontWeight: 700, whiteSpace: 'nowrap' }}>130 張（10 語系）· 實際耗時</span>
          <span style={{ ...heavy, fontSize: 36, color: 'var(--lz-hi, var(--osd-accent))', whiteSpace: 'nowrap' }}>約 7 分鐘</span>
        </div>
      </R>
    </div>
    <R k="lz-pop" d={180} style={{ alignSelf: 'center', marginTop: 22 }}>
      <div
        style={{
          // Matches the recording's 1664×1080 frame, so no letterbox bars.
          width: 1110,
          height: 720,
          borderRadius: 'var(--osd-radius)',
          background: '#000000',
          border: '2px solid rgba(255,255,255,0.12)',
          boxSizing: 'border-box',
          boxShadow: '0 40px 80px -40px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}
      >
        <DemoVideo />
      </div>
    </R>
    {/* Revealed after the video: the time comparison (was its own page). */}
      <div className="lz-rise">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 20 }}>
          <ImpactPill label="手貼" value="120" color={`var(--lz-muted, ${muted})`} />
          <span style={{ fontSize: 28, color: `var(--lz-muted, ${muted})` }}>→</span>
          <ImpactPill label="Sheet 帶入" value="45" color="#A79CF5" />
          <span style={{ fontSize: 28, color: `var(--lz-muted, ${muted})` }}>→</span>
          <ImpactPill label="交給 AI" value="7" color="var(--lz-hi, var(--osd-accent))" hot />
          <span style={{ marginLeft: 18, fontSize: 24, color: `var(--lz-muted, ${muted})`, fontWeight: 700, whiteSpace: 'nowrap' }}>
            每套製作時間 <b style={{ ...heavy, fontSize: 34, color: 'var(--lz-hi, var(--osd-accent))' }}>↓ 94%</b>
          </span>
        </div>
      </div>
    <Footer />
  </div>
);

// ── 4 · End-to-end flow — where AI helps ─────────────────────────────────────
// 11-column grid: 6 stages with 5 arrow gutters, so the brackets below line up.
const flowCols = '1fr 36px 1fr 92px 1fr 36px 1fr 36px 1fr 36px 1fr';

type Owner = 'human' | 'sheet' | 'ai';
const ownerLook: Record<Owner, { bg: string; fg: string; border: string }> = {
  human: { bg: '#FFFFFF', fg: 'var(--osd-text)', border: line },
  sheet: { bg: purple, fg: '#FFFFFF', border: purple },
  ai: { bg: '#0878E5', fg: '#FFFFFF', border: '#0878E5' },
};

const FlowStage = ({ n, name, who, d }: { n: string; name: string; who: string; d: number }) => (
  <R d={d} style={{ height: '100%' }}>
    <div style={{ position: 'relative', height: '100%' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxSizing: 'border-box',
            borderRadius: 'var(--osd-radius)',
            background: '#FFFFFF',
            border: `2px solid ${line}`,
          }}
        />
            <div
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '28px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'center',
          color: 'var(--osd-text)',
        }}
      >
        <span style={{ fontSize: 22, fontWeight: 800, opacity: 0.55 }}>{n}</span>
        <span style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.25 }}>{name}</span>
        <span style={{ fontSize: 22, fontWeight: 700, opacity: 0.7 }}>{who}</span>
      </div>
    </div>
  </R>
);

// Compact version of the same flow for the two "lazy" pages.
const flowSteps: [string, string][] = [
  ['01', '收需求'],
  ['02', '主視覺'],
  ['03', '各版位母版'],
  ['04', '翻譯＋斷行'],
  ['05', '多語系＋幣別'],
  ['06', '檢查＋匯出'],
];
const MiniFlow = ({
  owners,
  tags,
}: {
  owners: Partial<Record<string, Owner>>;
  tags: Partial<Record<string, string>>;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
    {flowSteps.map(([n, name], i) => {
      const k = ownerLook[owners[n] ?? 'human'];
      return (
        <div key={n} style={{ display: 'contents' }}>
          {i > 0 && (
            <span style={{ fontSize: 20, color: muted }}>
              →
            </span>
          )}
          <div style={{ position: 'relative', flex: 1, height: 52 }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  boxSizing: 'border-box',
                  borderRadius: 12,
                  background: k.bg,
                  border: `2px solid ${k.border}`,
                }}
              />
                        <div
              style={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 20,
                fontWeight: 800,
                color: k.fg,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ opacity: 0.6 }}>{n}</span>
              {name}
              {tags[n] && <span style={{ fontSize: 16, opacity: 0.85 }}>· {tags[n]}</span>}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

// `note` marks a hand-off between stages (e.g. a review) with a small tag sitting on the arrow.
const FlowGap = ({ note }: { note?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 28, color: muted }}>
    {note && (
      <span
        style={{
          fontSize: 17,
          fontWeight: 800,
          padding: '2px 10px',
          borderRadius: 999,
          border: `2px solid ${line}`,
          background: '#FFFFFF',
          color: muted,
          whiteSpace: 'nowrap',
        }}
      >
        {note}
      </span>
    )}
    →
  </div>
);

// Marks which stages each "lazy" step took over: a label above and a pulsing
// frame around the stage cards. Lives in an absolute grid that mirrors flowCols.
const LazyMark = ({ col, row, label, color, glow, inset }: { col: string; row: string; label: string; color: string; glow: string; inset: number }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'grid',
      gridTemplateColumns: flowCols,
      gridTemplateRows: '46px 46px 1fr',
      pointerEvents: 'none',
    }}
  >
    <div style={{ gridColumn: col, gridRow: row, justifySelf: 'center', alignSelf: 'center' }}>
      <span style={{ fontSize: 20, fontWeight: 800, padding: '5px 16px', borderRadius: 999, background: color, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
    <div
      className="lz-glow"
      style={
        {
          gridColumn: col,
          gridRow: '3',
          margin: -inset,
          border: `3px dashed ${color}`,
          borderRadius: 'calc(var(--osd-radius) + 8px)',
          ['--glow' as string]: glow,
        } as CSSProperties
      }
    />
  </div>
);

const FullFlow: Page = () => (
  <LightPage chip="HOW · 全流程" title={<>從需求到交付，<Hi>一開始全靠手工</Hi></>}>
    <div style={{ position: 'relative', paddingTop: 92 }}>
      <div style={{ display: 'grid', gridTemplateColumns: flowCols, alignItems: 'center', height: 300 }}>
        <FlowStage d={140} n="01" name="收需求" who="PO" />
        <FlowGap />
        <FlowStage d={200} n="02" name="主視覺" who="設計師" />
        <FlowGap note="review" />
        <FlowStage d={260} n="03" name="各版位母版" who="設計師" />
        <FlowGap />
        <FlowStage d={320} n="04" name="翻譯＋斷行" who="Content writer" />
        <FlowGap />
        <FlowStage d={380} n="05" name="多語系＋幣別" who="設計師 手貼" />
        <FlowGap />
        <FlowStage d={440} n="06" name="檢查＋匯出" who="設計師 手動" />
      </div>
      <Steps>
        <Step duration={280}>
          <LazyMark col="9 / 12" row="2" label="最重複、最容易錯的兩段" color={red} glow="rgba(200,70,58,0.16)" inset={12} />
        </Step>
      </Steps>
    </div>
    <Steps>
      <Step duration={280}>
        <div
          style={{
            marginTop: 56,
            padding: '20px 40px',
            background: surface,
            borderRadius: 'var(--osd-radius)',
            ...heavy,
            fontSize: 38,
            textAlign: 'center',
          }}
        >
          每一段都靠人——<Hi>後面兩段，就是我偷懶的起點</Hi>
        </div>
      </Step>
    </Steps>
  </LightPage>
);

// ── TEAM opener — bridges the model test into the other teams' tools ────────
const TeamIntroCard = ({
  icon,
  badge,
  team,
  tool,
  how,
  hot,
  d,
}: {
  icon: IconName;
  badge?: string;
  team: string;
  tool: string;
  how: string;
  hot?: boolean;
  d: number;
}) => (
  <R d={d} style={{ height: '100%' }}>
    <div
      style={{
        ...card,
        height: '100%',
        boxSizing: 'border-box',
        padding: '28px 36px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 14,
        background: hot ? 'var(--osd-accent)' : '#FFFFFF',
        color: hot ? '#FFFFFF' : 'var(--osd-text)',
        border: hot ? '2px solid transparent' : `2px solid ${line}`,
      }}
    >
      {/* Plugin store badge (icon + name + tagline) — same box height on every card. */}
      <div style={{ height: 200, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {badge ? (
          <img src={badge} alt={`${tool} plugin`} style={{ maxHeight: 200, maxWidth: '100%', width: 'auto', height: 'auto', display: 'block', objectFit: 'contain' }} />
        ) : (
          <IconTile name={icon} size={120} />
        )}
      </div>
      <div style={{ ...heavy, fontSize: 44 }}>{team}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: hot ? '#FFFFFF' : 'var(--osd-accent)' }}>{tool}</div>
      <div style={{ fontSize: 24, lineHeight: 1.5, color: hot ? 'rgba(255,255,255,0.85)' : muted }}>{how}</div>
    </div>
  </R>
);

const TeamIntro: Page = () => (
  <LightPage chip="TEAM · 跨部門交流" title={<>跟別的部門聊完，<Hi>大家都有好做法</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, height: 520 }}>
      <TeamIntroCard d={160} icon="doc" badge={gamesBadge} team="InJoi" tool="Figma plugin · Banner Mill" how="版面固定、只換圖" />
      <TeamIntroCard d={240} icon="sheet" badge={promoBadge} team="B2C" tool="Figma plugin · Social Banner 產圖工具" how="只出 MKT 要的 Social Banner" />
      <TeamIntroCard d={320} icon="spark" badge={casinoBadge} team="XitMent" tool="AI ＋ Skill · Banner Kit" how="語系多、文案長短不一，要判斷" />
    </div>
  </LightPage>
);

// ── 10.5 · Other teams' plugins — screenshots ──────────────────────────────
// Each shot is drawn at a shared height; `blur` boxes are in the screenshot's own
// pixels and hide brand names in the plugin's help text.
type Shot = { src: string; w: number; h: number; alt: string; blur?: [number, number, number, number][] };

const ShotRow = ({ shots, height }: { shots: Shot[]; height: number }) => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
    {shots.map((sh, i) => (
      <R key={sh.alt} k="lz-pop" d={160 + i * 80}>
        <div
          style={{
            position: 'relative',
            width: (height * sh.w) / sh.h,
            height,
            borderRadius: 16,
            overflow: 'hidden',
            border: `2px solid ${line}`,
            boxShadow: '0 28px 56px -36px rgba(16,18,22,0.45)',
          }}
        >
          <img src={sh.src} alt={sh.alt} style={{ width: '100%', height: '100%', display: 'block' }} />
          {sh.blur?.map(([x0, y0, x1, y1]) => (
            <div
              key={`${x0}-${y0}`}
              style={{
                position: 'absolute',
                left: `${(x0 / sh.w) * 100}%`,
                top: `${(y0 / sh.h) * 100}%`,
                width: `${((x1 - x0) / sh.w) * 100}%`,
                height: `${((y1 - y0) / sh.h) * 100}%`,
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                borderRadius: 4,
              }}
            />
          ))}
        </div>
      </R>
    ))}
  </div>
);

// The four comparison rows (formerly their own page), under each team's screenshots.
const ShotInfo = ({ tool, rows }: { tool: string; rows: [string, string][] }) => (
  <R d={520}>
    <div style={{ marginTop: 22, background: surface, borderRadius: 'var(--osd-radius)', padding: '18px 32px 22px' }}>
      <span style={{ fontSize: 20, fontWeight: 800, padding: '4px 14px', borderRadius: 999, background: blueSoft, color: 'var(--osd-accent)', whiteSpace: 'nowrap' }}>
        {tool}
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, marginTop: 14 }}>
        {rows.map(([label, text]) => (
          <div key={label}>
            <div style={{ fontSize: 18, fontWeight: 800, color: muted, letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: 24, lineHeight: 1.45, marginTop: 6 }}>{text}</div>
          </div>
        ))}
      </div>
    </div>
  </R>
);

const GamesPlugin: Page = () => (
  <LightPage chip="TEAM · 跨部門交流 · InJoi" title={<>InJoi：<Hi>一張設計，一鍵轉成所有尺寸</Hi></>}>
    <ShotRow
      height={400}
      shots={[
        { src: gamesCover, w: 1040, h: 1186, alt: 'Banner Mill plugin 介紹頁' },
        { src: games1, w: 778, h: 1258, alt: 'Banner Auto Layout：選擇要排版的語系' },
        { src: games2, w: 790, h: 1260, alt: '產生多語系版位、樣式同步、Frame 前綴管理' },
        { src: games3, w: 778, h: 1256, alt: '執行日誌' },
      ]}
    />
    <ShotInfo
      tool="Figma plugin · Banner Mill"
      rows={[
        ['做法', '固定範本，只換背景與前景圖'],
        ['靠什麼省力', '一鍵轉成所有尺寸、語系'],
        ['優點', '快又穩，文字排版自動調整'],
        ['限制', '版面一改就要改程式'],
      ]}
    />
  </LightPage>
);

const PromoPlugin: Page = () => (
  <LightPage chip="TEAM · 跨部門交流 · B2C" title={<>B2C：<Hi>Excel 填文案，一鍵產生 Social Banner</Hi></>}>
    <ShotRow
      height={400}
      shots={[
        { src: promoCover, w: 1036, h: 1180, alt: 'Social Banner 產圖工具 plugin 介紹頁' },
        {
          src: promo1,
          w: 886,
          h: 1432,
          alt: '文字設定檔、背景圖、樣式與版面設定',
          blur: [
            [384, 966, 628, 1002],
            [366, 1002, 472, 1038],
          ],
        },
        {
          src: promo2,
          w: 906,
          h: 1422,
          alt: '顏色設定、產生／更新 banner、匯出 ZIP',
          blur: [
            [40, 1054, 152, 1090],
            [268, 1054, 388, 1090],
          ],
        },
      ]}
    />
    <ShotInfo
      tool="Figma plugin · Social Banner 產圖工具"
      rows={[
        ['做法', '只出 MKT 用的 Social Banner'],
        ['靠什麼省力', 'Excel 填文案，一鍵全部產生'],
        ['優點', '自動壓縮、匯出 ZIP'],
        ['限制', '新版型要再擴充 plugin'],
      ]}
    />
  </LightPage>
);

// ── 12 · Modules ────────────────────────────────────────────────────────────
const Question = ({ q, to }: { q: string; to: string }) => (
  <div
    style={{
      height: '100%',
      background: surface,
      borderRadius: 'var(--osd-radius)',
      borderLeft: '5px solid var(--osd-accent)',
      padding: '0 36px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <div style={{ fontSize: 34, fontWeight: 800 }}>{q}</div>
    <div style={{ fontSize: 22, color: 'var(--osd-accent)', marginTop: 4, fontWeight: 700 }}>→ 模組 {to}</div>
  </div>
);

const Letter = ({ l, small }: { l: string; small?: boolean }) => (
  <span
    style={{
      width: small ? 44 : 56,
      height: small ? 44 : 56,
      borderRadius: small ? 12 : 16,
      background: 'var(--osd-accent)',
      color: '#FFFFFF',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: small ? 24 : 30,
      flexShrink: 0,
    }}
  >
    {l}
  </span>
);

const ModuleRow = ({ l, name, who, from }: { l: string; name: string; who: string; from?: string }) => (
  <div
    style={{
      ...card,
      height: 80,
      padding: '0 28px',
      display: 'grid',
      gridTemplateColumns: '56px 220px 1fr auto',
      gap: 24,
      alignItems: 'center',
    }}
  >
    <Letter l={l} />
    <div style={{ fontSize: 32, fontWeight: 800 }}>{name}</div>
    <div style={{ fontSize: 26, color: muted }}>{who}</div>
    {from ? (
      <span
        style={{ fontSize: 20, fontWeight: 800, background: purpleSoft, color: purple, padding: '6px 16px', borderRadius: 999, whiteSpace: 'nowrap' }}
      >
        ← {from}
      </span>
    ) : (
      <span />
    )}
  </div>
);

const Modules: Page = () => (
  <LightPage chip="TEAM · 最終版" title={<>三個部門的做法，<Hi>合成一套模組</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: 48, height: 540 }}>
      <div style={{ display: 'grid', gridTemplateRows: 'repeat(4, 1fr)', gap: 14 }}>
        <R d={160} style={{ height: '100%' }}>
          <Question q="要新主視覺嗎？" to="A" />
        </R>
        <R d={240} style={{ height: '100%' }}>
          <Question q="要幾種尺寸？" to="B" />
        </R>
        <R d={320} style={{ height: '100%' }}>
          <Question q="要幾種語言？" to="C" />
        </R>
        <R d={360} style={{ height: '100%' }}>
          <Question q="要幾種幣別？" to="C" />
        </R>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <R d={400}>
          <ModuleRow l="A" name="主視覺" who="設計師" />
        </R>
        <R d={460}>
          <ModuleRow l="B" name="多尺寸" who="設計師做母版（resize skill 開發中）" from="B2C＋InJoi" />
        </R>
        <R d={520}>
          <ModuleRow l="C" name="多語系＋幣別" who="Writer 翻譯 → AI 帶入文案與幣別" from="B2C＋XitMent" />
        </R>
        <R d={580}>
          <ModuleRow l="D" name="固定範本" who="換字、換圖、換日期" from="InJoi" />
        </R>
        <R d={640}>
          <ModuleRow l="E" name="校對交付" who="AI 檢查、匯出壓縮，writer 校對" from="XitMent" />
        </R>
      </div>
    </div>
  </LightPage>
);

// ── 14 · Next ───────────────────────────────────────────────────────────────
const LoopNode = ({
  children,
  bg,
  fg = '#FFFFFF',
  outline,
}: {
  children: ReactNode;
  bg: string;
  fg?: string;
  outline?: string;
}) => (
  <div
    style={{
      height: 72,
      boxSizing: 'border-box',
      borderRadius: 999,
      border: outline ? `3px solid ${outline}` : 'none',
      background: bg,
      color: fg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 30,
      fontWeight: 800,
    }}
  >
    {children}
  </div>
);

const DownArrow = () => <div style={{ textAlign: 'center', fontSize: 28, color: muted, lineHeight: '44px' }}>↓</div>;


// Tiny banner wireframe: dark frame, a text block on one side, art on the other.
const LayoutSketch = ({ text, label }: { text: 'left' | 'right' | 'center'; label: string }) => {
  const justify = text === 'left' ? 'flex-start' : text === 'right' ? 'flex-end' : 'center';
  const art = (
    <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(124,184,247,0.55)', flexShrink: 0 }} />
  );
  const block = (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 92 }}>
      <span style={{ height: 10, borderRadius: 4, background: '#FFFFFF' }} />
      <span style={{ height: 6, width: '75%', borderRadius: 3, background: 'rgba(255,255,255,0.6)' }} />
      <span style={{ height: 12, width: 40, borderRadius: 6, background: '#0878E5', marginTop: 2 }} />
    </span>
  );
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          height: 80,
          borderRadius: 12,
          background: '#101216',
          padding: '0 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: text === 'center' ? 'center' : 'space-between',
          gap: 14,
        }}
      >
        {text === 'right' && art}
        <span style={{ display: 'flex', justifyContent: justify }}>{block}</span>
        {text === 'left' && art}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginTop: 10 }}>{label}</div>
    </div>
  );
};

const BannerType = ({ name, note }: { name: string; note: string }) => (
  <div
    style={{
      height: 104,
      borderRadius: 14,
      background: blueSoft,
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      boxSizing: 'border-box',
    }}
  >
    <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, color: 'var(--osd-accent)', whiteSpace: 'nowrap' }}>{name}</div>
    <div style={{ fontSize: 20, color: muted, marginTop: 6 }}>{note}</div>
  </div>
);

const Next: Page = () => (
  <LightPage chip="NEXT · Skill 是活的" title={<>Skill <Hi>是活的</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: '520px 1fr', gap: 48, height: 560 }}>
      <R d={160} style={{ height: '100%' }}>
        <div style={{ height: '100%', background: surface, borderRadius: 'var(--osd-radius)', padding: '32px 40px', boxSizing: 'border-box', position: 'relative' }}>
          <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 18 }}>越用越聰明</div>
          <div style={{ position: 'relative', paddingRight: 64 }}>
            <LoopNode bg={redSoft} fg={red} outline={red}>
              出錯
            </LoopNode>
            <DownArrow />
            <LoopNode bg="var(--osd-accent)">補一條規則</LoopNode>
            <DownArrow />
            <LoopNode bg={purple}>下次不再錯</LoopNode>
            {/* Dashed return path — the loop that keeps the Skill growing. */}
            <svg width="56" height="320" viewBox="0 0 56 320" style={{ position: 'absolute', right: 0, top: 0 }} aria-hidden>
              <path
                className="lz-dash"
                d="M6 284 H30 Q48 284 48 266 V54 Q48 36 30 36 H10"
                fill="none"
                stroke="#0878E5"
                strokeWidth="3"
                strokeDasharray="6 10"
                strokeLinecap="round"
              />
              <path d="M18 28 L8 36 L18 44" fill="none" stroke="#0878E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div
            style={{
              marginTop: 20,
              background: '#FFFFFF',
              border: `2px solid ${line}`,
              borderRadius: 14,
              padding: '14px 20px',
              fontSize: 22,
              lineHeight: 1.5,
              color: muted,
            }}
          >
            例：緬甸文缺字 → 補規則：改用 Noto Sans Myanmar
          </div>
        </div>
      </R>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <R d={240}>
          <div style={{ fontSize: 26, fontWeight: 800, color: muted, letterSpacing: '0.08em' }}>還在調整</div>
        </R>
          <div className="lz-rise">
            <div style={{ ...card, padding: '20px 36px', height: 262 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <span style={{ ...heavy, fontSize: 36, color: 'var(--osd-accent)' }}>1</span>
                <span style={{ fontSize: 30, fontWeight: 800 }}>resize 還在努力：沒辦法只用一種排版</span>
              </div>
              <div style={{ fontSize: 22, color: muted, marginTop: 6 }}>每次主視覺不同，文字的位置也跟著不同——<b style={{ color: 'var(--osd-accent)' }}>參考 InJoi 的 Banner Mill</b></div>
              <div style={{ display: 'flex', gap: 24, marginTop: 18 }}>
                <LayoutSketch text="left" label="文字靠左" />
                <LayoutSketch text="right" label="文字靠右" />
                <LayoutSketch text="center" label="文字置中" />
              </div>
            </div>
          </div>
          <div className="lz-rise">
            <div style={{ ...card, padding: '20px 36px', height: 222 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <span style={{ ...heavy, fontSize: 36, color: 'var(--osd-accent)' }}>2</span>
                <span style={{ fontSize: 30, fontWeight: 800 }}>Banner 有三種，要各自整理出規則</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: 16, marginTop: 24 }}>
                <BannerType name="Provider promo" note="供應商活動" />
                <BannerType name="Promotion_in-house" note="自家活動" />
                <BannerType name="Promotion_Network" note="Provider 提供設計" />
              </div>
            </div>
          </div>
      </div>
    </div>
      <div className="lz-rise">
        <div
          style={{
            marginTop: 20,
            padding: '14px 36px',
            background: surface,
            borderRadius: 'var(--osd-radius)',
            ...heavy,
            fontSize: 30,
            textAlign: 'center',
          }}
        >
          以後可能不用自己寫 Skill——<Hi>跟 AI 說一次，它幫你寫進 Skill</Hi>
        </div>
      </div>
  </LightPage>
);

// ── 13.5 · Model test — same exam, different AI ─────────────────────────────
// Fill in as tests finish; an empty string renders as 「測試中」.
const modelGroups: { tool: string; vendor: string; flag?: string; models: { name: string; time: string; tokens?: string; cost?: string; fit?: string }[] }[] = [
  {
    tool: 'Claude',
    vendor: 'Anthropic',
    models: [
      { name: 'Opus 5.5', time: '約 7 分', tokens: '約 4.5M', cost: '$3.69', fit: '長時間、多步驟的 agent 任務；複雜程式與知識工作' },
      { name: 'Sonnet 5.5', time: '約 13 分', tokens: '約 4.2M', cost: '$2.53', fit: '日常主力：寫作、程式、分析，兼顧速度與品質' },
      { name: 'Haiku 5.5', time: '約 18 分', tokens: '約 8.8M', cost: '$1.32', fit: '大量、要即時回應的小任務：分類、資料擷取、分流' },
    ],
  },
  {
    tool: 'Codex',
    vendor: 'OpenAI',
    flag: 'policy 限制',
    models: [
      { name: 'GPT-6 Astra（預設）', time: '約 8 分', fit: '需求不明確、資料互相矛盾、要權衡多條件；複雜系統與除錯' },
      { name: 'GPT-6.1 Sol', time: '約 15 分', fit: '日常寫作、研究、程式、簡報；需要判斷、反覆修改的完整交付' },
      { name: 'GPT-6 Luna', time: '約 34 分', fit: '範圍清楚的編修、分類、資料擷取，頻繁執行的例行工作' },
    ],
  },
];

const Cell = ({ v }: { v: string }) => (
  <span style={{ fontSize: 30, fontWeight: 800, color: v ? 'var(--osd-text)' : muted, opacity: v ? 1 : 0.6, fontVariantNumeric: 'tabular-nums' }}>
    {v || '測試中'}
  </span>
);

const ModelTest: Page = () => (
  <LightPage chip="PROOF · 模型測試" title={<>換一個 AI，<Hi>結果一樣嗎？</Hi></>}>
    <R d={160}>
      <div style={{ ...card, padding: '12px 40px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', minWidth: '0px', minHeight: '0px', maxWidth: 'none', maxHeight: 'none', flexShrink: '0', flexGrow: '0', flexBasis: 'auto', width: '1680px', height: '476.98px', translate: '0px 0px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '330px 150px 170px 140px 1fr',
            alignItems: 'center',
            height: 50,
            fontSize: 22,
            fontWeight: 800,
            color: muted,
            letterSpacing: '0.06em',
            borderBottom: `2px solid ${line}`,
          }}
        >
          <span>模型</span>
          <span>平均耗時</span>
          <span>Token 用量</span>
          <span>費用</span>
          <span>適合做什麼</span>
        </div>
        {/* Group labels and model rows share one grid, so every line gets the same height. */}
        <div style={{ flex: 1, display: 'grid', gridTemplateRows: `repeat(${modelGroups.reduce((n, g) => n + 1 + g.models.length, 0)}, 1fr)` }}>
          {modelGroups.flatMap((g) => [
            <div key={g.tool} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--osd-accent)' }}>{g.tool}</span>
              <span style={{ fontSize: 20, color: muted }}>{g.vendor}</span>
              {g.flag && <span style={{ fontSize: 20, fontWeight: 800, color: red }}>{g.flag}</span>}
            </div>,
            ...g.models.map((m) => (
              <div
                key={m.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '330px 150px 170px 140px 1fr',
                  alignItems: 'center',
                  borderTop: `1px solid ${line}`,
                }}
              >
                <span style={{ fontSize: 30, fontWeight: 800, paddingLeft: 20, whiteSpace: 'nowrap' }}>{m.name}</span>
                <Cell v={m.time} />
                <span style={{ fontSize: 26, fontWeight: 800, color: m.tokens ? 'var(--osd-text)' : muted, opacity: m.tokens ? 1 : 0.5, fontVariantNumeric: 'tabular-nums' }}>
                  {m.tokens ?? '—'}
                </span>
                <span style={{ fontSize: 26, fontWeight: 800, color: m.cost ? 'var(--osd-text)' : muted, opacity: m.cost ? 1 : 0.5, fontVariantNumeric: 'tabular-nums' }}>
                  {m.cost ?? '—'}
                </span>
                <span style={{ fontSize: 22, color: ink2, whiteSpace: 'nowrap' }}>{m.fit ?? ''}</span>
              </div>
            )),
          ])}
        </div>
      </div>
    </R>
    <Steps>
      <Step duration={280}>
        <div style={{ marginTop: 24, background: redSoft, borderRadius: 'var(--osd-radius)', padding: '18px 32px' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: red }}>Codex：一開始因內容政策，拒絕調整 banner</div>
          <div style={{ fontSize: 22, color: ink2, marginTop: 6 }}>特定產業相關內容可能直接被擋——選 AI 不只看能力，也要看能不能用在我們的內容上</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 999, background: 'var(--osd-accent)', color: '#FFFFFF' }}>
              TIPS
            </span>
            <span style={{ fontSize: 24, fontWeight: 700 }}>跟它說明是教學用途，就可以繼續調整</span>
          </div>
        </div>
      </Step>
    </Steps>
  </LightPage>
);

// ── 15.5 · Take home — Banner Kit ───────────────────────────────────────────
const SkillCard = ({
  name,
  module,
  what,
  say,
}: {
  name: string;
  module: string;
  what: string;
  say: string;
}) => (
  <div style={{ ...card, height: '100%', padding: '32px 40px', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: mono, fontSize: 40, fontWeight: 700, color: 'var(--osd-accent)' }}>{name}</span>
      <span
        style={{ fontSize: 20, fontWeight: 800, padding: '6px 14px', borderRadius: 999, background: purpleSoft, color: purple }}
      >
        {module}
      </span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.45, marginTop: 18 }}>{what}</div>
    <div style={{ fontSize: 24, color: muted, marginTop: 'auto' }}>
      對 AI 說：<b style={{ color: 'var(--osd-text)' }}>{say}</b>
    </div>
  </div>
);

const Cmd = ({ n, children }: { n: string; children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 20, height: 56 }}>
    <span
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {n}
    </span>
    <span style={{ fontFamily: mono, fontSize: 24, color: '#E6EDF7', whiteSpace: 'nowrap' }}>{children}</span>
  </div>
);

const TakeHome: Page = () => (
  <LightPage chip="NEXT · 帶回家" title={<>Banner Kit，<Hi>團隊一起用</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, height: 260 }}>
      <R d={160} style={{ height: '100%' }}>
        <SkillCard name="multi-lang" module="模組 C · 多語系" what="做好的各版位母版 → 換成每種語系文案，尺寸不變" say="「多語系」" />
      </R>
      <R d={260} style={{ height: '100%' }}>
        <SkillCard name="resize" module="開發中" what="一張 master → 全部版位，依比例重新排版（還在努力）" say="「resize」" />
      </R>
    </div>
    <R d={380}>
      <div
        style={{
          marginTop: 28,
          background: '#101216',
          color: '#FFFFFF',
          borderRadius: 'var(--osd-radius)',
          padding: '30px 44px',
          boxSizing: 'border-box',
          height: 340,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 12 }}>
          <span style={{ fontSize: 30, fontWeight: 800 }}>三步安裝</span>
          <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)' }}>在 Claude Code 裡輸入，只要做一次</span>
        </div>
        <R d={480}>
          <Cmd n="1">/plugin marketplace add http://git.coreop.net/coral.tsai16/metamon-skill</Cmd>
        </R>
        <R d={560}>
          <Cmd n="2">/plugin install metamon@metamon-skill</Cmd>
        </R>
        <R d={640}>
          <Cmd n="3">/reload-plugins</Cmd>
        </R>
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 18,
            borderTop: '1px solid rgba(255,255,255,0.14)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 22,
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          <a
            href="http://git.coreop.net/coral.tsai16/metamon-skill"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#7CB8F7', textDecoration: 'none', fontWeight: 700 }}
          >
            git.coreop.net/coral.tsai16/metamon-skill ↗
          </a>
          <span>需要這個 GitLab repo 的讀取權限 · 更新會自動同步</span>
        </div>
      </div>
    </R>
  </LightPage>
);

// ── 15 · Closing ────────────────────────────────────────────────────────────
const LazyStep = ({ n, from, to }: { n: string; from: string; to: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      fontSize: 30,
      fontWeight: 700,
      padding: '14px 30px 14px 14px',
      borderRadius: 999,
      background: 'var(--lz-card, #FFFFFF)',
      border: `2px solid var(--lz-line, ${line})`,
    }}
  >
    <span
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: `var(--lz-tile-bg, ${blueSoft})`,
        color: 'var(--lz-hi, var(--osd-accent))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: 22,
      }}
    >
      {n}
    </span>
    {from}，<Hi>{to}</Hi>
  </div>
);

const Closing: Page = () => (
  <div data-lz-active={useActive()} style={{ ...fill, background: darkBg, ...darkVars }}>
    <Orbit left={1260} top={-120} />
    <div
      style={{
        position: 'relative',
        height: '100%',
        padding: '0 160px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <R d={0}>
        <Kicker>THE LAZY MANIFESTO</Kicker>
      </R>
      <R d={100}>
        <h2 style={{ ...heavy, fontSize: 88, lineHeight: 1.25, margin: '40px 0 0', letterSpacing: '-0.03em' }}>
          偷懶不是終點，
          <br />
          <Hi>是每次都問：還能更懶嗎？</Hi>
        </h2>
      </R>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 64 }}>
        <R d={300}>
          <LazyStep n="01" from="重複的" to="交給工具" />
        </R>
        <R d={380}>
          <LazyStep n="02" from="會錯的" to="交給流程" />
        </R>
        <R d={460}>
          <LazyStep n="03" from="要判斷的" to="才交給人" />
        </R>
      </div>
      <R d={680} style={{ alignSelf: 'flex-start' }}>
        <div
          className="lz-sheen"
          style={{
            position: 'relative',
            overflow: 'hidden',
            marginTop: 56,
            fontSize: 32,
            fontWeight: 800,
            padding: '22px 44px',
            borderRadius: 999,
            background: 'var(--osd-accent)',
            color: '#FFFFFF',
            boxShadow: '0 20px 40px -20px rgba(8,120,229,0.6)',
          }}
        >
          歡迎一起試用、一起調整、一起偷懶 👋
        </div>
      </R>
    </div>
    <R d={820} style={{ position: 'absolute', right: 120, bottom: 96 }}>
      <div style={{ ...heavy, fontSize: 44 }}>
        謝謝大家 <Hi>·</Hi> Q&amp;A
      </div>
    </R>
  </div>
);

export const meta: SlideMeta = {
  title: '人因懶惰而偉大',
  createdAt: '2026-10-05T06:08:02.047Z',
};

export default [
  Cover,
  Agenda,
  Manifesto,
  Handmade,
  FullFlow,
  Evolution1,
  Evolution2,
  SkillInside,
  RulePage,
  Demo,
  ModelTest,
  TeamIntro,
  GamesPlugin,
  PromoPlugin,
  Modules,
  Next,
  TakeHome,
  Closing,
] satisfies Page[];

export const notes: (string | undefined)[] = [
  // 1 · 封面 0:20
  `【0:20】
大家好，我是 Coral，負責 XitMent 的 banner 設計。
今天分享我怎麼一路「偷懶」，把一檔活動的 banner 從一整個下午，變成幾分鐘。`,

  // 2 · 議程 0:15
  `【0:15】
今天想聊五件事：為什麼想偷懶、我偷懶了哪兩次、真的有用嗎、別的部門怎麼做，最後是接下來和大家可以帶回去的東西。`,

  // 3 · 懶惰宣言 1:00
  `【1:00】
Larry Wall 說，懶惰是程式設計師的美德；Heinlein 說，進步是懶人找更簡單的方法帶來的。
我的版本是：同一件事做三次，我就想偷懶了。我有三個原則——
（按 →）重複的，交給工具；
（按 →）會錯的，交給流程——像圖層命名、T&C 免責文字、斷行，以前都靠人記得，現在都寫成固定的規則和檢查順序；錯了一次就補一條規則，下次就不會再錯；
（按 →）要判斷的，才交給人。`,

  // 4 · 起點 0:45
  `【0:45】
以前做一套 banner：有了主視覺之後，要手動 resize 成每個版位，再把多語系和幣別一個一個貼上去。
（指向截圖）這是 Pragmatic Play 一檔活動的全部 banner——13 個版位乘 12 個語系，156 張圖。
重複、容易錯、又佔掉設計的時間。設計結束的地方，就是重複的開始。`,

  // 5 · 全流程 0:45
  `【0:45】
先把一開始的整條流程攤開：收需求、主視覺（先 review 過）、各版位母版、翻譯斷行，到多語系、檢查匯出，一共六段——每一段都靠人。
（按 →）其中最後兩段：多語系＋幣別要一張一張手貼，檢查＋匯出也是手動——最重複、也最容易錯。
（按 →）這兩段，就是我偷懶的起點。接下來看我偷懶了兩次，流程怎麼變。`,

  // 6 · 第一次偷懶 1:00
  `【1:00】
（流程縮到上方，05 變成紫色）第一次偷懶：把「多語系＋幣別」這段交給 Google Sheet。
以前是逐格複製、切回 Figma 貼上，改一個字就全部重貼。
接上 Google Sheet 後，文案集中一處，Plugin 依語系自動填入。
用的就是 Figma 社群的 Google Sheets Sync。
貼字時間少了大約【60%】。
但它靠圖層名稱對應，只要一個圖層沒命名好就會漏字，同一張 banner 出現兩種語系。所以後來，我連這一步都交給 AI。`,

  // 7 · 第二次偷懶 1:00
  `【1:00】
（上方流程：05、06 都變成 AI）第二次偷懶：把我的做法寫成 Skill，從多語系、幣別一路到檢查、匯出，一句話交給 AI。
我只要說一句，甚至只說「多語系」，
AI 就照 Skill 跑完：聽懂需求、帶入 content writer 斷好行的文案、換幣別、對位，再自己截圖檢查。
我就去做別的設計。
從動手做，變成動口說。關鍵不是 AI 多神，而是我把做法寫成了 Skill，不用每次重講。
重複的交給 AI，要判斷的留給人。至於省了多少時間，看完 Demo 再公布。`,

  // 8 · Skill 長什麼樣 1:00
  `【1:00】
Skill 裡寫的，就是我平常的做法：先問清楚版位、Sheet、命名、Figma 檔，
找到我先做好的各版位母版、認出各圖層，
每個版位、每個語系跑一輪：填文案、換幣別、命名，最後截圖檢查，
回報給我哪裡要看。
現在用的是 multi-lang；自動 resize 版位的 skill 還在開發中。
常有人問：為什麼不用 Figma 自己的 AI agent？因為我們的流程不只在 Figma 裡——要讀 Google Sheet、改 Figma、檢查、再匯出壓縮；而且版位、語系、幣別、T&C 這些規則是我們團隊自己的，寫成 Skill 才能共用、版控、隨時補。
來看一條規則實際長什麼樣。`,

  // 9 · 規則長這樣 1:00
  `【1:00】
規則實際長這樣，左邊是 Skill 原文。
CasualTop 是 master，
圖層角色以它為準，
角色的臉一定要完整。
下一步是 resize，規則已經先寫好：像 KratosTop，安全區 829 px、置中，
subtitle 一定保留。resize 還在努力中，但規則先寫好，AI 就有依據。
接下來，直接看它實際跑一次多語系。`,

  // 10 · Demo＋成效 3:00
  `【3:00】影片已 3 倍速（約 2 分 24 秒）、靜音、現場口述；實際耗時約 7 分鐘。
這次 Demo 的活動是 13 個版位 × 10 個語系，共 130 張（一般活動是 12 個語系）。
① 我說一句話。
② AI 執行中——中間切到 Skill 檔，看它照哪些規則在做。
③ 成品拼貼和產出清單。
公布答案：手貼每套約 120 分鐘、Sheet 約 45 分鐘、交給 AI 約 7 分鐘——就是剛剛影片那一次。
製作時間少了約 94%，校稿錯誤也大幅減少，我多出時間做真正的設計。（數據截至【X 月】，翻譯時間另計。）
（影片無法播放：改開本機版，或口頭帶過直接公布答案。）
錄製日期：【YYYY/MM/DD】。`,

  // 11 · 模型測試 0:45
  `【0:45】
常被問：換一個 AI 模型，結果會一樣嗎？我用同一份 Skill、同一套題目，讓 Claude 和 Codex 的不同模型各跑兩次，比平均耗時。
同樣 13 個版位 × 10 個語系、130 張：Claude Opus 約 7 分鐘、Sonnet 約 13 分鐘、Haiku 約 18 分鐘；Codex 的 GPT-6 Astra 約 8 分鐘（含一輪修正）、Sol 約 15 分鐘、Luna 約 34 分鐘。
Token 用量（含快取讀寫）：Opus 約 4.5M、Sonnet 約 4.2M、Haiku 約 8.8M——Haiku 繞的路最多，用掉將近兩倍。
費用：Opus $3.69、Sonnet $2.53、Haiku $1.32——Haiku token 最多卻最便宜，但時間最長；Opus 最貴，但最快、最不用人顧。
兩邊結果一樣：強模型最快（Opus、Astra），輕量模型最慢（Haiku、Luna）。輕量模型每一步回應快，但整套多語系要大量判斷，走錯、重試多，總時間就拉長了。
所以選模型看任務——跟開頭的原則一樣（依官方定位）：整套多語系這種長時間、要判斷的任務交給 Opus；日常工作用 Sonnet；大量、即時的小任務（分類、擷取資料）用 Haiku。Codex 那邊也一樣：Astra 最強、Sol 平衡、Luna 最快最省。
（按 →）Codex 一開始因為內容政策拒絕調整 banner——博弈相關內容可能直接被擋，所以選 AI 不只看能力，也要看能不能用在我們的內容上。
小 tips：我跟它說明這是教學用途之後，它就願意繼續調整了。
之後換模型或改 Skill，都會先用這套題目跑一次，結果一致才放行。`,

  // 12 · 跨部門交流 0:20
  `【0:20】
選 AI 要看任務；其實選工具也一樣。我去跟其他部門聊完，發現大家都有好做法——需求不同，有的部門根本不用 AI，也做得很好。
InJoi 和 B2C 寫成 Figma plugin，我們 XitMent 用 AI 照 Skill 做。先一個一個看。`,

  // 13 · InJoi 的 plugin 0:25
  `【0:25】
先看 InJoi：他們版面固定、只換圖，所以寫成 Figma plugin「Banner Mill」——一張設計一鍵轉成所有尺寸和語系，連各語系的文字排版都會依設定自動調整。
（指下方）優點是快、穩定；限制是版面一改就要改程式，需要有人維護。`,

  // 14 · B2C 的 plugin 0:25
  `【0:25】
再來是 B2C：他們只需要出給 MKT 的 Social Banner，尺寸固定、規則清楚，所以也寫成 plugin——Excel 填好多語文案、選底圖，調好顏色和版面，一鍵產生，還會自動壓縮、匯出 ZIP。
範圍小、規則清楚，plugin 剛好夠用；限制是綁定這組範本，新版型要再擴充。`,

  // 15 · 最終版模組 1:15
  `【1:15】
大家需求不同，各有適合的做法；有了 AI，規則用說的就能寫，每個人都能貢獻好做法。所以我把三個部門的做法合成一套模組，這是最終版。右邊標的是每個模組的來源：D 固定範本來自 InJoi，B 多尺寸來自 B2C 和 InJoi，C 多語系來自 B2C，C 交給 AI 和 E 的檢查交付來自我們 XitMent。
收到需求先問四題：要新主視覺嗎？幾種尺寸？幾種語言？幾種幣別？
A 主視覺設計師做；B 多尺寸目前也是設計師做母版，resize skill 還在開發；C 多語系和幣別交給 AI；D 固定範本最簡單；E 校對交付，AI 先檢查、命名、匯出壓縮，content writer 再校對。
想試的部門，建議從 D 固定範本開始。
一句話總結分工：文案交給專業的人，設計留給自己，生產交給 AI。`,

  // 16 · Skill 是活的 0:45
  `【0:45】
模組合好了，Skill 也要繼續長大——它是活的：出錯就補規則。像緬甸文顯示不出來，我補了「改用 Noto Sans Myanmar」，之後就沒再錯。
還在調整的有兩個：
resize 還在努力：排版沒有單一範本，文字有時靠左、靠右、置中——這部分可以參考 InJoi 的 Banner Mill，它已經能自動調整各語系的文字排版；
banner 有三種，要各自整理規則。下一步，是讓它不用我開口，Sheet 一更新就自己跑。
有人說，以後跟 AI 對話就能產所有 banner，不用寫 Skill 了。我覺得對一半：以後可能真的不用自己寫——跟 AI 說一次，它就會自己記進 Skill。但規則還是得存在：AI 再聰明，也不知道我們家的安全區、命名和字型規則；而且對話會結束，規則要留給下一個人、下一個模型用。所以不是不用寫，是改成 AI 幫我們寫，人負責判斷這條規則對不對。`,

  // 17 · 帶回家 0:30
  `【0:30】
這套 Banner Kit 團隊都能用：做好母版後，說「多語系」就能換好所有語系；resize 還在開發中，好了會自動更新給大家。三行指令裝好就能用。`,

  // 18 · 總結 0:20 + Q&A 5:00
  `【0:20】
偷懶不是終點，是每次都問自己：還能更懶嗎？
還記得開頭的三個原則嗎？重複的，交給工具；會錯的，交給流程；要判斷的，才交給人。
今天整套 Banner Kit，就是照這三句做出來的。謝謝大家，接下來開放 Q&A。

—— Q&A 準備（5:00）——
・為什麼不直接寫腳本或 plugin？腳本要有人寫、要維護；Skill 用文字寫，設計師自己就能調整。規則固定的部分（像 InJoi、B2C），寫 plugin 反而更適合。
・Google Sheet Plugin 為什麼不用了？它靠圖層名稱對應，命名一漏就會混語系；AI 會自己認圖層、截圖檢查。
・數字怎麼量的？從【起點】到【終點】，翻譯時間另計，檢查時間【有／沒有】包含。
・省下的時間做了什麼？【新主視覺／參與的討論】。
・AI 出錯怎麼辦？出錯 → 補規則 → 下次不再錯（緬甸文例子）。
・用的是哪個 AI agent？【工具名稱】＋【如何連接設計工具】。
・為什麼不用 Figma 自己的 AI agent？流程要跨工具（Google Sheet → Figma → 檢查 → 匯出壓縮），而且規則是團隊自己的，寫成 Skill 才能共用、版控、持續補規則。
・不同 AI 模型跑出來結果會不會不一樣？（見模型測試頁）會有差異，所以：固定使用的模型版本、準備幾組標準測試案例（固定母版＋文案）換模型或改 Skill 後先跑一次比對，再加上 AI 截圖檢查和 content writer 校對兩道關。
・急件可以當天上嗎？生產時間縮短了，但校對與確認仍需要時間——避免變成承諾。
・其他部門要怎麼開始？先從模組 D 固定範本試，再找我一起寫規則。`,
];
