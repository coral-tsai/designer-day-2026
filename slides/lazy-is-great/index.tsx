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
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import campaignBanners from './assets/campaign-banners.webp';
import sheetsSync from './assets/google-sheets-sync.png';
import larryWall from './assets/larry-wall.png';
import robertHeinlein from './assets/robert-heinlein.png';

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

// ── In-page motion (module-level, slide-keyed) ──────────────────────────────
// Every animation is gated on [data-lz-active="true"], which only the page
// currently on stage carries — thumbnails, overview and PDF export stay static.
const STYLE_ID = 'osd-styles-lazy-is-great';
const CSS = `
@keyframes lzRise { from { opacity: 0; transform: translate3d(0, 24px, 0); } to { opacity: 1; transform: none; } }
@keyframes lzPop { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: none; } }
@keyframes lzGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes lzStair { from { opacity: 0; transform: translate3d(0, 32px, 0) scale(0.97); } to { opacity: 1; transform: none; } }
@keyframes lzFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes lzSpin { to { transform: rotate(360deg); } }
@keyframes lzSpinRev { to { transform: rotate(-360deg); } }
@keyframes lzPing { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.5); opacity: 0; } }
@keyframes lzDash { to { stroke-dashoffset: -32; } }
@keyframes lzSheen { 0%, 55% { transform: translateX(-160%) skewX(-18deg); opacity: 0; } 70% { opacity: 0.6; } 100% { transform: translateX(420%) skewX(-18deg); opacity: 0; } }
@keyframes lzKen { from { transform: scale(1); } to { transform: scale(1.07); } }
@keyframes lzBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.lz-grow { transform-origin: 50% 100%; }
/* A revealed <Step> rises in like the rest of the page. */
[data-lz-active="true"] [data-osd-step="revealed"] > * { animation: lzRise 620ms ${EXPO} both; }
[data-lz-active="true"] .lz-rise { animation: lzRise 760ms ${EXPO} both; animation-delay: calc(var(--d, 0) * 1ms); }
[data-lz-active="true"] .lz-pop { animation: lzPop 700ms ${EXPO} both; animation-delay: calc(var(--d, 0) * 1ms); }
[data-lz-active="true"] .lz-grow { animation: lzGrow 1200ms ${EXPO} both; animation-delay: calc(var(--d, 0) * 1ms); }
[data-lz-active="true"] .lz-stair { animation: lzStair 820ms ${EXPO} both; animation-delay: calc(var(--d, 0) * 1ms); }
[data-lz-active="true"] .lz-float { animation: lzFloat 4.8s ease-in-out infinite; animation-delay: calc(var(--d, 0) * 1ms); }
[data-lz-active="true"] .lz-orbit { animation: lzSpin 28s linear infinite; }
[data-lz-active="true"] .lz-orbit-rev { animation: lzSpinRev 20s linear infinite; }
[data-lz-active="true"] .lz-ping::after { content: ''; position: absolute; inset: 0; border-radius: inherit; border: 3px solid currentColor; animation: lzPing 1.8s ease-out infinite; pointer-events: none; }
[data-lz-active="true"] .lz-dash { animation: lzDash 1.4s linear infinite; }
[data-lz-active="true"] .lz-sheen::after { content: ''; position: absolute; top: -20%; left: 0; width: 30%; height: 140%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent); animation: lzSheen 3.2s ease-out 800ms infinite; pointer-events: none; }
[data-lz-active="true"] .lz-ken { animation: lzKen 14s cubic-bezier(0.23, 1, 0.32, 1) 400ms both; transform-origin: 30% 30%; }
[data-lz-active="true"] .lz-blink { animation: lzBlink 1.6s ease-in-out infinite; }
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
  <LightPage chip="MANIFESTO · 懶惰宣言">
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
        我不是不想做事，
        <Hi>是不想做「重複」的事。</Hi>
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
  <LightPage chip="CHAPTER 1 · 起點" title={<>一張主視覺，<Hi>換來一整個下午</Hi></>}>
    {/* Hero screenshot: every banner one past campaign needed (2000×547). */}
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
        <img
          className="lz-ken"
          src={campaignBanners}
          alt="過去一檔活動的全部 banner：所有版位 × 所有語系"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            right: 24,
            bottom: 24,
            fontSize: 24,
            fontWeight: 800,
            padding: '10px 22px',
            borderRadius: 999,
            background: 'var(--osd-accent)',
            color: '#FFFFFF',
            boxShadow: '0 12px 28px -10px rgba(8,120,229,0.7)',
          }}
        >
          【活動名稱】的全部 banner · 共 156 張
        </div>
      </div>
    </R>
    <div style={{ display: 'grid', gridTemplateColumns: '500px 1fr 560px', gap: 32, height: 178, marginTop: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <R d={360}>
          <NumStep n="1" text="畫好一張主視覺" />
        </R>
        <R d={420}>
          <NumStep n="2" text="手動 resize 成每個版位" />
        </R>
        <R d={480}>
          <NumStep n="3" text="多語系文案一個一個貼" />
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

// ── 3.5 · Evolution map ─────────────────────────────────────────────────────
type Doer = 'human' | 'tool' | 'ai';
const doerStyle: Record<Doer, { bg: string; fg: string }> = {
  human: { bg: 'var(--osd-text)', fg: '#FFFFFF' },
  tool: { bg: purple, fg: '#FFFFFF' },
  ai: { bg: 'var(--osd-accent)', fg: '#FFFFFF' },
};

const TaskLine = ({ task, who, doer }: { task: string; who: string; doer: Doer }) => (
  <div
    style={{
      height: 76,
      background: '#FFFFFF',
      border: `2px solid ${line}`,
      borderRadius: 14,
      padding: '0 18px 0 24px',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}
  >
    <span style={{ fontSize: 26, fontWeight: 700, whiteSpace: 'nowrap' }}>{task}</span>
    <span
      style={{
        fontSize: 20,
        fontWeight: 800,
        padding: '6px 14px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
        background: doerStyle[doer].bg,
        color: doerStyle[doer].fg,
      }}
    >
      {who}
    </span>
  </div>
);

const StageCard = ({
  n,
  name,
  tagline,
  badge,
  color,
  hot,
  children,
}: {
  n: string;
  name: string;
  tagline: string;
  badge?: string;
  color: string;
  hot?: boolean;
  children: ReactNode;
}) => (
  <div
    style={{
      width: 500,
      height: 510,
      flexShrink: 0,
      background: hot ? '#FFFFFF' : surface,
      border: hot ? '3px solid var(--osd-accent)' : `2px solid ${line}`,
      boxShadow: hot ? '0 28px 56px -32px rgba(8,120,229,0.5)' : 'none',
      borderTop: `6px solid ${color}`,
      borderRadius: 'var(--osd-radius)',
      padding: '32px 36px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 34 }}>
      <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.16em', color }}>STAGE {n}</span>
      {badge && (
        <span
          style={{ fontSize: 20, fontWeight: 800, padding: '4px 14px', borderRadius: 999, background: color, color: '#FFFFFF' }}
        >
          {badge}
        </span>
      )}
    </div>
    <div style={{ ...heavy, fontSize: 52, lineHeight: 1.2, marginTop: 14 }}>{name}</div>
    <div style={{ fontSize: 26, color: muted, marginTop: 8 }}>{tagline}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 30 }}>{children}</div>
  </div>
);

const StageArrow = ({ color }: { color: string }) => (
  <div style={{ width: 72, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color }}>
    →
  </div>
);

const EvolutionMap: Page = () => (
  <LightPage chip="CHAPTER 2 · 進化路線" title={<>同一套流程，<Hi>偷懶了兩次</Hi></>}>
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <Steps>
        <R d={160}>
          <StageCard n="1" name="純手工" tagline="一張一張自己來" color="#8A919C">
            <TaskLine task="畫主視覺" who="設計師" doer="human" />
            <TaskLine task="貼多語系文案" who="設計師" doer="human" />
            <TaskLine task="resize 版位" who="設計師" doer="human" />
          </StageCard>
        </R>
        <Step duration={280}>
          <div style={{ display: 'flex', height: '100%' }}>
            <StageArrow color={purple} />
            <StageCard n="2" name="借力工具" tagline="文案交給 Sheet" badge="第一次偷懶" color={purple}>
              <TaskLine task="畫主視覺" who="設計師" doer="human" />
              <TaskLine task="貼多語系文案" who="Sheet Plugin" doer="tool" />
              <TaskLine task="resize 版位" who="設計師" doer="human" />
            </StageCard>
          </div>
        </Step>
        <Step duration={280}>
          <div style={{ display: 'flex', height: '100%' }}>
            <StageArrow color="var(--osd-accent)" />
            <StageCard
              n="3"
              name="交給 AI"
              tagline="一句話跑完全套"
              badge="第二次偷懶"
              color="#0878E5"
              hot
            >
              <TaskLine task="畫主視覺" who="設計師" doer="human" />
              <TaskLine task="帶入多語系文案" who="AI agent" doer="ai" />
              <TaskLine task="resize＋替換" who="AI agent" doer="ai" />
            </StageCard>
          </div>
        </Step>
      </Steps>
    </div>
  </LightPage>
);

// ── 5 · Evolution 1 ─────────────────────────────────────────────────────────
const CheckItem = ({ text, good }: { text: string; good?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 28, lineHeight: 1.4 }}>
    <span
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 19,
        fontWeight: 800,
        background: good ? 'var(--osd-accent)' : '#E9ECF1',
        color: good ? '#FFFFFF' : muted,
      }}
    >
      {good ? '✓' : '✕'}
    </span>
    <span style={{ color: good ? 'var(--osd-text)' : muted, fontWeight: good ? 700 : 500 }}>{text}</span>
  </div>
);

const BeforeAfterCard = ({ tag, label, good, children }: { tag: string; label: string; good?: boolean; children: ReactNode }) => (
  <div
    style={{
      ...card,
      height: '100%',
      padding: '26px 40px',
      background: good ? '#FFFFFF' : surface,
      border: good ? '3px solid var(--osd-accent)' : `2px solid ${line}`,
      boxShadow: good ? '0 24px 48px -28px rgba(8,120,229,0.45)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 6 }}>
      <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.16em', color: good ? 'var(--osd-accent)' : muted }}>
        {tag}
      </span>
      <span style={{ fontSize: 30, fontWeight: 800 }}>{label}</span>
    </div>
    {children}
  </div>
);

const Evolution1: Page = () => (
  <LightPage chip="EVOLUTION 1 · 第一次偷懶" title={<>把 Google Sheet 接進流程，<Hi>文案不再手貼</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 1fr', height: 300, alignItems: 'stretch' }}>
      <Steps>
        <R d={180} style={{ height: '100%' }}>
          <BeforeAfterCard tag="BEFORE" label="手動複製貼上">
            <CheckItem text="打開文案表逐格複製" />
            <CheckItem text="切回 Figma 逐一貼上對位" />
            <CheckItem text="多一種語言就多做一輪" />
            <CheckItem text="改字 = 全部重貼" />
          </BeforeAfterCard>
        </R>
        <Arrow color="var(--osd-accent)" size={44} />
        <Step duration={280}>
          <BeforeAfterCard tag="AFTER" label="Sheet 一次帶入" good>
            <CheckItem text="文案集中在一張 Sheet" good />
            <CheckItem text="Plugin 依語系自動填入" good />
            <CheckItem text="改字只改一個地方" good />
            <CheckItem text="貼錯幾乎歸零" good />
          </BeforeAfterCard>
        </Step>
      </Steps>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '981px 1fr', gap: 40, height: 327, marginTop: 36 }}>
      {/* The plugin we used: Google Sheets Sync (Figma Community page). 1504×500 */}
      <Steps>
      <Step duration={280}>
        <div
          style={{
            position: 'relative',
            height: 327,
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
      </Step>
      <Step duration={280}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
        <div style={{ flex: 1 }}>
          <div
            className="lz-sheen"
            style={{
              position: 'relative',
              overflow: 'hidden',
              height: '100%',
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
            <span style={{ ...heavy, fontSize: 72, color: 'var(--osd-accent)', lineHeight: 1.15, marginTop: 6 }}>↓ 約 【60%】</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 26, color: muted, lineHeight: 1.5 }}>
            用的是現成的 Figma 外掛 <b style={{ color: 'var(--osd-text)' }}>Google Sheets Sync</b>
            <br />
            不重造輪子，也是一種懶。
          </div>
        </div>
      </div>
      </Step>
      </Steps>
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
  <LightPage chip="EVOLUTION 2 · 第二次偷懶" title={<>寫成 Skill，然後<Hi>一句話交給 AI</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr 484px', height: 432 }}>
      <Steps>
        <Step duration={260}>
          <ActCard icon="chat" n="01" title="我說一句話">
            <span
              style={{
                display: 'block',
                background: blueSoft,
                color: 'var(--osd-text)',
                borderRadius: 14,
                padding: '16px 20px',
              }}
            >「resize」
「多語系」</span>
          </ActCard>
        </Step>
        <Step duration={260}>
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
              <AIJob n="1" title="聽懂一句話" desc="要哪些版位、哪些語系" />
              <AIJob n="2" title="照 Skill 執行" desc="帶入斷好行的文案、延展、對位" />
              <AIJob n="3" title="檢查並回報" desc="截圖確認每張都排好" />
            </div>
          </div>
        </Step>
        <Step duration={260}>
          <div style={{ display: 'flex', height: '100%' }}>
            <FlowArrow />
            <div style={{ flex: 1 }}>
            <ActCard icon="user" n="03" title="我去做別的設計">
              想新主視覺、跟企劃討論
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
        </Step>
      </Steps>
    </div>
    <Steps>
      <Step duration={280}>
        <h3 style={{ ...heavy, fontSize: 72, lineHeight: 1.25, margin: '56px 0 0' }}>
          從<Hi color={muted}>動手做</Hi>，變成<Hi>動口說</Hi>。
        </h3>
      </Step>
    </Steps>
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
  <LightPage chip="EVOLUTION 2 · Skill 長什麼樣" title={<>Skill 裡面，<Hi>寫的就是我的做法</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: '360px 328px 1fr 328px', height: 480 }}>
      <Steps>
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
        <Step duration={260}>
          <div style={{ display: 'flex', height: '100%' }}>
            <PhaseArrow />
            <div style={{ ...phaseCard, ...card, flex: 1 }}>
              <PhaseHead n="2" title="自己找 master" />
              <div style={{ fontSize: 24, lineHeight: 1.55, color: muted }}>
                依名稱和尺寸找到主圖（例如 CasualTop 750×224），讀出 headline、subtitle、CTA、T&amp;C 各是哪個圖層
              </div>
            </div>
          </div>
        </Step>
        <Step duration={260}>
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
                  <LoopRow n="1">複製 master（絕不動原檔）</LoopRow>
                </R>
                <R d={190}>
                  <LoopRow n="2">resize 到版位精確尺寸</LoopRow>
                </R>
                <R d={260}>
                  <LoopRow n="3">依新比例重新排版</LoopRow>
                </R>
                <R d={330}>
                  <LoopRow n="4">填入 writer 斷好行的文案</LoopRow>
                </R>
                <R d={400}>
                  <LoopRow n="5">命名 CasualTop_TH_THB</LoopRow>
                </R>
                <R d={470}>
                  <LoopRow n="6">截圖檢查：塞得下、沒裁到</LoopRow>
                </R>
              </div>
            </div>
          </div>
        </Step>
        <Step duration={260}>
          <div style={{ display: 'flex', height: '100%' }}>
            <PhaseArrow />
            <div style={{ ...phaseCard, ...card, flex: 1 }}>
              <PhaseHead n="4" title="回報給我" />
              <div style={{ fontSize: 24, lineHeight: 1.55, color: muted }}>
                列出產了哪些圖，告訴我哪裡要看
              </div>
            </div>
          </div>
        </Step>
      </Steps>
    </div>
    <R d={260}>
      <div style={{ fontSize: 22, color: muted, marginTop: 28 }}>
        取自 metamon 的 <b style={{ color: 'var(--osd-text)' }}>resize</b> skill · 只換語系不換尺寸時用{' '}
        <b style={{ color: 'var(--osd-text)' }}>multi-lang</b>，流程相同、但不 resize 也不重排
      </div>
    </R>
  </LightPage>
);

// ── 8 · Demo ────────────────────────────────────────────────────────────────
const DemoBeat = ({ n, title, time, desc }: { n: string; title: string; time: string; desc: string }) => (
  <div style={{ display: 'flex', gap: 24 }}>
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        border: '2px solid var(--lz-hi, var(--osd-accent))',
        color: 'var(--lz-hi, var(--osd-accent))',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 26,
        fontWeight: 800,
      }}
    >
      {n}
    </div>
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span style={{ fontSize: 32, fontWeight: 800 }}>{title}</span>
        <span style={{ fontSize: 22, color: 'var(--lz-hi, var(--osd-accent))', fontWeight: 700 }}>{time}</span>
      </div>
      <div style={{ fontSize: 26, lineHeight: 1.5, color: `var(--lz-muted, ${muted})`, marginTop: 8 }}>{desc}</div>
    </div>
  </div>
);

const Demo: Page = () => (
  <LightPage dark chip="DEMO · 實際操作" title={<>一句話，<Hi>看 AI 跑完整套流程</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: '1040px 1fr', gap: 64 }}>
      {/* Replace this frame with the demo <video> (slides/lazy-is-great/assets/demo.mp4). */}
      <R k="lz-pop" d={180}>
        <div
          style={{
            width: 1040,
            height: 585,
            borderRadius: 'var(--osd-radius)',
            background: '#070B14',
            border: '2px solid rgba(255,255,255,0.12)',
            boxSizing: 'border-box',
            boxShadow: '0 40px 80px -40px rgba(0,0,0,0.7)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(600px 400px at 80% 0%, rgba(8,120,229,0.35), transparent 70%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              fontSize: 22,
              fontWeight: 700,
              background: 'rgba(255,255,255,0.12)',
              color: '#FFFFFF',
              borderRadius: 999,
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span className="lz-blink" style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5A4E' }} />
            實際耗時 【X 分鐘】
          </div>
          <div
            className="lz-ping"
            style={{
              position: 'relative',
              width: 128,
              height: 128,
              borderRadius: '50%',
              background: 'var(--osd-accent)',
              color: 'var(--osd-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                marginLeft: 10,
                borderTop: '26px solid transparent',
                borderBottom: '26px solid transparent',
                borderLeft: '42px solid #FFFFFF',
              }}
            />
          </div>
          <div style={{ position: 'absolute', left: 32, bottom: 28, fontSize: 22, color: 'rgba(255,255,255,0.65)' }}>
            Demo 影片 · 約 2.5 分鐘 · 靜音，現場口述
          </div>
        </div>
      </R>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <R d={320}>
            <DemoBeat n="1" title="說一句話" time="約 20 秒" desc="直接對 AI agent 下指令" />
          </R>
          <R d={420}>
            <DemoBeat n="2" title="AI 執行中" time="快轉＋計時器" desc="中間切到 Skill 檔內容" />
          </R>
          <R d={520}>
            <DemoBeat n="3" title="成品拼貼" time="約 1 分鐘" desc="所有版位成品＋產出清單" />
          </R>
        </div>
        <R d={620}>
          <div style={{ fontSize: 22, lineHeight: 1.6, color: `var(--lz-muted, ${muted})` }}>
            錄製日期：【YYYY/MM/DD】
            <br />
            備案：本機另存一份影片檔
          </div>
        </R>
      </div>
    </div>
  </LightPage>
);

// ── 9 · Impact ──────────────────────────────────────────────────────────────
// Bar heights are proportional to 120 / 45 / 10 minutes (max = 320px).
// Update `h` together with the value when the real numbers come in.
const Bar = ({ value, h, color, d }: { value: string; h: number; color: string; d: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 200 }}>
    <R d={d + 500}>
      <div style={{ ...heavy, fontSize: 44, lineHeight: 1.2, marginBottom: 12, color }}>{value}</div>
    </R>
    <div
      className="lz-grow"
      style={{ ['--d' as string]: d, width: 140, height: h, background: color, borderRadius: '12px 12px 0 0' } as CSSProperties}
    />
  </div>
);

const BarLabel = ({ children }: { children: ReactNode }) => (
  <div style={{ width: 200, textAlign: 'center', fontSize: 28, fontWeight: 800 }}>{children}</div>
);

const StatCard = ({ label, big, color }: { label: string; big: string; color: string }) => (
  <div
    style={{
      height: '100%',
      background: surface,
      borderRadius: 'var(--osd-radius)',
      padding: '0 44px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      borderLeft: `5px solid ${color}`,
    }}
  >
    <div style={{ fontSize: 24, color: muted, fontWeight: 600 }}>{label}</div>
    <div style={{ ...heavy, fontSize: 60, lineHeight: 1.2, color, marginTop: 4 }}>{big}</div>
  </div>
);

const Impact: Page = () => (
  <LightPage chip="IMPACT · 成效總結" title={<>從 2 小時到 10 分鐘：<Hi>三次進化</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 560px', gap: 48, height: 560 }}>
      <div style={{ ...card, padding: '36px 56px 32px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 22, color: muted, fontWeight: 600 }}>單位：分鐘／套</div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            borderBottom: `2px solid ${line}`,
          }}
        >
          <Bar value="【120】" h={320} color="#B8BFCC" d={200} />
          <Bar value="【45】" h={120} color={purple} d={360} />
          <Bar value="【10】" h={27} color="#0878E5" d={520} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 20 }}>
          <BarLabel>手貼</BarLabel>
          <BarLabel>Sheet 帶入</BarLabel>
          <BarLabel>
            <Hi>交給 AI</Hi>
          </BarLabel>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 24 }}>
        <R d={700} style={{ height: '100%' }}>
          <StatCard label="每套製作時間" big="↓ 【92%】" color="#0878E5" />
        </R>
        <R d={800} style={{ height: '100%' }}>
          <StatCard label="校稿錯誤" big="大幅減少" color={purple} />
        </R>
        <R d={900} style={{ height: '100%' }}>
          <StatCard label="可專注的設計工作" big="＋1" color="#101216" />
        </R>
      </div>
    </div>
    <R d={1000}>
      <div style={{ fontSize: 22, color: muted, marginTop: 32 }}>註：目前階段數據（截至 【X 月】）・翻譯時間另計</div>
    </R>
  </LightPage>
);

// ── 10 · Other departments ──────────────────────────────────────────────────
const DeptCard = ({
  icon,
  name,
  approach,
  blocker,
  module,
}: {
  icon: IconName;
  name: string;
  approach: string;
  blocker: string;
  module: string;
}) => (
  <div style={{ ...card, height: '100%', padding: '44px 48px', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <IconTile name={icon} size={80} />
      <div style={{ ...heavy, fontSize: 52 }}>{name}</div>
    </div>
    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--osd-accent)', marginTop: 44 }}>
      他們的做法
    </div>
    <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.45, marginTop: 12 }}>{approach}</div>
    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.12em', color: red, marginTop: 36 }}>卡在哪</div>
    <div style={{ fontSize: 30, lineHeight: 1.5, color: muted, marginTop: 12 }}>{blocker}</div>
    <div
      style={{
        marginTop: 'auto',
        alignSelf: 'flex-start',
        fontSize: 22,
        fontWeight: 800,
        padding: '8px 18px',
        borderRadius: 999,
        background: blueSoft,
        color: 'var(--osd-accent)',
      }}
    >
      {module}
    </div>
  </div>
);

const Departments: Page = () => (
  <LightPage chip="BONUS · 跨部門交流" title={<>其他部門，<Hi>怎麼處理同樣的問題？</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, height: 560 }}>
      <R d={180} style={{ height: '100%' }}>
        <DeptCard
          icon="doc"
          name="Games"
          approach="設計有固定範本，每次只換背景圖和前景圖"
          blocker="【待填】"
          module="接近之後的模組 D · 固定範本"
        />
      </R>
      <R d={300} style={{ height: '100%' }}>
        <DeptCard
          icon="sheet"
          name="Promotion"
          approach="只產出 MKT 需要的尺寸，不做全版位"
          blocker="【待填】"
          module="接近之後的模組 B · 多尺寸"
        />
      </R>
    </div>
  </LightPage>
);

// ── 11 · Cross-team ─────────────────────────────────────────────────────────
const FindingCard = ({ n, title, desc, hot }: { n: string; title: string; desc?: string; hot?: boolean }) => (
  <div
    style={{
      ...card,
      height: '100%',
      padding: '48px 48px',
      background: hot ? 'var(--osd-accent)' : '#FFFFFF',
      border: hot ? '2px solid transparent' : `2px solid ${line}`,
      color: hot ? '#FFFFFF' : 'var(--osd-text)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {hot && (
      <>
        <div
          style={{ position: 'absolute', right: -140, bottom: -160, width: 420, height: 420, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }}
        />
        <div
          style={{ position: 'absolute', right: -60, bottom: -80, width: 260, height: 260, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.14)' }}
        />
      </>
    )}
    <div style={{ position: 'relative' }}>
      <div style={{ ...heavy, fontSize: 96, lineHeight: 1, color: hot ? 'rgba(255,255,255,0.55)' : blueLine }}>{n}</div>
      <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.35, margin: '40px 0 20px' }}>{title}</div>
      {desc && <div style={{ fontSize: 30, lineHeight: 1.6, color: hot ? 'rgba(255,255,255,0.85)' : muted }}>{desc}</div>}
    </div>
  </div>
);

const CrossTeam: Page = () => (
  <LightPage chip="BONUS · 跨部門交流" title={<>跟別的部門聊完，<Hi>我發現一件事</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36, height: 520 }}>
      <R d={180} style={{ height: '100%' }}>
        <FindingCard n="01" title="大家的痛點其實一模一樣" desc="resize、多語系、改字重來" />
      </R>
      <Steps>
        <Step duration={280}>
          <FindingCard n="02" title="各有各的小聰明" desc="有人用範本、有人訂命名規則，但都停在「靠人自律」" />
        </Step>
        <Step duration={280}>
          <FindingCard n="03" title="缺的是「可複製」的方法" hot />
        </Step>
      </Steps>
    </div>
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
    <div style={{ fontSize: 36, fontWeight: 800 }}>{q}</div>
    <div style={{ fontSize: 24, color: 'var(--osd-accent)', marginTop: 8, fontWeight: 700 }}>→ 模組 {to}</div>
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

const ModuleRow = ({ l, name, who, tag }: { l: string; name: string; who: string; tag?: string }) => (
  <div
    style={{
      ...card,
      height: 80,
      padding: '0 28px',
      display: 'grid',
      gridTemplateColumns: '56px 190px 1fr',
      gap: 24,
      alignItems: 'center',
    }}
  >
    <Letter l={l} />
    <div style={{ fontSize: 32, fontWeight: 800 }}>{name}</div>
    <div style={{ fontSize: 26, color: muted, display: 'flex', alignItems: 'center', gap: 16 }}>
      {who}
      {tag && (
        <span
          style={{ fontSize: 20, fontWeight: 800, background: purpleSoft, color: purple, padding: '4px 14px', borderRadius: 999 }}
        >
          {tag}
        </span>
      )}
    </div>
  </div>
);

const Combo = ({ name, children }: { name: string; children: ReactNode }) => (
  <div
    style={{
      height: 88,
      borderRadius: 'var(--osd-radius)',
      border: `2px dashed ${line}`,
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxSizing: 'border-box',
    }}
  >
    <span style={{ fontSize: 28, fontWeight: 800 }}>{name}</span>
    <span style={{ display: 'flex', gap: 8 }}>{children}</span>
  </div>
);

const Modules: Page = () => (
  <LightPage chip="METHOD · 設計模組" title={<>收到需求，<Hi>先問三個問題</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: 48, height: 456 }}>
      <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 18 }}>
        <R d={160} style={{ height: '100%' }}>
          <Question q="要新主視覺嗎？" to="A" />
        </R>
        <R d={240} style={{ height: '100%' }}>
          <Question q="要幾種尺寸？" to="B" />
        </R>
        <R d={320} style={{ height: '100%' }}>
          <Question q="要幾種語言？" to="C" />
        </R>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <R d={400}>
          <ModuleRow l="A" name="主視覺" who="設計師（AI 輔助發想）" />
        </R>
        <R d={460}>
          <ModuleRow l="B" name="多尺寸" who="AI 依 Skill 延展，人抽查" />
        </R>
        <R d={520}>
          <ModuleRow l="C" name="多語系" who="Content writer 翻譯 → AI 從 Sheet 帶入並套用" />
        </R>
        <R d={580}>
          <ModuleRow l="D" name="固定範本" who="AI 換字、換圖、換日期" tag="門檻最低" />
        </R>
        <R d={640}>
          <ModuleRow l="E" name="校對交付" who="AI 檢查、回報、命名打包，content writer 校對" />
        </R>
      </div>
    </div>
    <Steps>
    <Step duration={280}>
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', alignItems: 'center', gap: 24, marginTop: 36 }}>
      <div>
        <div style={{ fontSize: 22, color: muted, fontWeight: 800, letterSpacing: '0.08em' }}>組合範例</div>
      </div>
      <div>
        <Combo name="週期活動">
          <Letter l="D" small />
          <Letter l="E" small />
        </Combo>
      </div>
      <div>
        <Combo name="新活動單語系">
          <Letter l="A" small />
          <Letter l="B" small />
          <Letter l="E" small />
        </Combo>
      </div>
      <div>
        <Combo name="大型跨國活動">
          <Letter l="A" small />
          <Letter l="B" small />
          <Letter l="C" small />
          <Letter l="E" small />
        </Combo>
      </div>
    </div>
    </Step>
    </Steps>
  </LightPage>
);

// ── 13 · Rules into Skill ───────────────────────────────────────────────────
const SpecRow = ({ item, rule, last }: { item: string; rule: string; last?: boolean }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '180px 1fr',
      alignItems: 'center',
      height: 92,
      padding: '0 36px',
      borderBottom: last ? 'none' : `2px solid ${line}`,
    }}
  >
    <span style={{ fontSize: 32, fontWeight: 800 }}>{item}</span>
    <span style={{ fontSize: 28, color: muted }}>{rule}</span>
  </div>
);

const FixStep = ({ n, text, who, human }: { n: string; text: string; who: string; human?: boolean }) => (
  <div
    style={{
      ...card,
      height: 80,
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      border: human ? `3px solid ${purple}` : `2px solid ${line}`,
      background: human ? purpleSoft : '#FFFFFF',
    }}
  >
    <span style={{ fontSize: 34, fontWeight: 800, color: human ? purple : 'var(--osd-accent)', width: 28 }}>{n}</span>
    <span style={{ fontSize: 28, fontWeight: 700, flex: 1 }}>{text}</span>
    <span
      style={{
        fontSize: 20,
        fontWeight: 800,
        padding: '4px 12px',
        borderRadius: 999,
        background: human ? purple : blueSoft,
        color: human ? '#FFFFFF' : 'var(--osd-accent)',
        whiteSpace: 'nowrap',
      }}
    >
      {who}
    </span>
  </div>
);

const Rules: Page = () => (
  <LightPage chip="METHOD · 規則" title={<>把腦中的規則，<Hi>寫成一張表</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 700px', gap: 48, height: 428 }}>
      <R d={160} style={{ height: '100%' }}>
        <div style={{ ...card, height: '100%', overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr',
              alignItems: 'center',
              height: 60,
              padding: '0 36px',
              background: surface,
              borderBottom: `2px solid ${line}`,
              color: muted,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '0.08em',
            }}
          >
            <span>項目</span>
            <span>寫進 Skill 的規則</span>
          </div>
          <SpecRow item="版面" rule="每個版位的範本與對齊方式" />
          <SpecRow item="文字寬度" rule="每個文字框的最大寬度" />
          <SpecRow item="字級" rule="標題／副標／CTA 層級＋最小字級" />
          <SpecRow item="字型" rule="語系 × 字型對照表" last />
        </div>
      </R>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <R d={300}>
          <div style={{ fontSize: 28, fontWeight: 800, height: 40 }}>從文案到成品，照這個順序</div>
        </R>
        <Steps>
          <Step duration={260}>
            <FixStep n="1" text="Content writer 提供斷好行的文案" who="人" human />
          </Step>
          <Step duration={260}>
            <FixStep n="2" text="AI 依版位規格排版（安全區、字級）" who="規則" />
          </Step>
          <Step duration={260}>
            <FixStep n="3" text="AI 截圖檢查每一張" who="AI" />
          </Step>
          <Step duration={260}>
            <FixStep n="4" text="Content writer 校對、我最後確認" who="人" human />
          </Step>
        </Steps>
      </div>
    </div>
    <Steps>
      <Step duration={280}>
        <h3 style={{ ...heavy, fontSize: 52, lineHeight: 1.3, margin: '56px 0 0' }}>
          文案交給<Hi>專業的人</Hi>，設計留給<Hi>自己</Hi>，生產交給<Hi color={purple}>AI</Hi>。
        </h3>
      </Step>
    </Steps>
  </LightPage>
);

// ── 14 · Next ───────────────────────────────────────────────────────────────
const LoopNode = ({ children, bg, fg = '#FFFFFF' }: { children: ReactNode; bg: string; fg?: string }) => (
  <div
    style={{
      height: 72,
      borderRadius: 999,
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

type Rung = 'done' | 'here' | 'next' | 'future';
const Stair = ({ n, name, state, badge, d }: { n: number; name: string; state: Rung; badge?: string; d: number }) => {
  const look: Record<Rung, CSSProperties> = {
    done: { background: surface, color: 'var(--osd-text)', border: `2px solid ${line}` },
    here: { background: 'var(--osd-accent)', color: '#FFFFFF', border: '2px solid transparent' },
    next: { background: purpleSoft, color: 'var(--osd-text)', border: `2px dashed ${purple}` },
    future: { background: '#FFFFFF', color: muted, border: `2px solid ${line}` },
  };
  const numColor = state === 'here' ? 'rgba(255,255,255,0.6)' : state === 'next' ? purple : blueLine;
  return (
    <R k="lz-stair" d={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      {badge && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span
            className={state === 'here' ? 'lz-ping' : undefined}
            style={{
              position: 'relative',
              fontSize: 20,
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: 999,
              background: state === 'here' ? 'var(--osd-accent)' : purple,
              color: state === 'here' ? '#0878E5' : purple,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ position: 'relative', color: '#FFFFFF' }}>{badge}</span>
          </span>
        </div>
      )}
      <div
        style={{
          height: 120 + n * 46,
          borderRadius: '16px 16px 0 0',
          boxSizing: 'border-box',
          padding: '20px 16px',
          ...look[state],
        }}
      >
        <div style={{ ...heavy, fontSize: 44, lineHeight: 1, color: numColor }}>{n}</div>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3, marginTop: 14 }}>{name}</div>
      </div>
    </R>
  );
};

const Next: Page = () => (
  <LightPage chip="NEXT · 下一步" title={<>Skill <Hi>是活的</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: '520px 1fr', gap: 48, height: 600 }}>
      <R d={160} style={{ height: '100%' }}>
        <div style={{ height: '100%', background: surface, borderRadius: 'var(--osd-radius)', padding: '40px 44px', boxSizing: 'border-box', position: 'relative' }}>
          <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 28 }}>越用越聰明</div>
          <div style={{ position: 'relative', paddingRight: 64 }}>
            <LoopNode bg="#FFFFFF" fg={red}>
              <span style={{ border: `2px solid ${red}`, borderRadius: 999, padding: '6px 28px' }}>出錯</span>
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
              marginTop: 32,
              background: '#FFFFFF',
              border: `2px solid ${line}`,
              borderRadius: 14,
              padding: '18px 22px',
              fontSize: 24,
              lineHeight: 1.5,
              color: muted,
            }}
          >
            真實例子：【某次溢字後補上的規則】
          </div>
        </div>
      </R>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Steps>
        <Step duration={260}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: muted, letterSpacing: '0.08em' }}>AI 導入六層階梯</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 400, borderBottom: `2px solid ${line}` }}>
            <Stair d={60} n={1} name="AI 工具" state="done" />
            <Stair d={140} n={2} name="知識封裝（Skill）" state="here" badge="我們在這" />
            <Stair d={220} n={3} name="穩定代辦（Loop）" state="next" badge="下一步" />
            <Stair d={300} n={4} name="多 AI 接力" state="future" />
            <Stair d={380} n={5} name="多模型協作" state="future" />
            <Stair d={460} n={6} name="全流程自動化" state="future" />
          </div>
        </div>
        </Step>
        <Step duration={260}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 28, fontSize: 26 }}>
            <span style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>還在調整：</span>
            <span style={{ background: blueSoft, color: 'var(--osd-text)', borderRadius: 999, padding: '8px 22px' }}>
              【橫幅轉直式的重排】
            </span>
            <span style={{ background: blueSoft, color: 'var(--osd-text)', borderRadius: 999, padding: '8px 22px' }}>
              【特定語系溢字】
            </span>
          </div>
          <div style={{ fontSize: 20, color: muted, marginTop: 22 }}>階梯概念引自温明輝〈AI 導入的第一步〉</div>
        </Step>
        </Steps>
      </div>
    </div>
  </LightPage>
);

// ── 15.5 · Take home — Banner Kit ───────────────────────────────────────────
const mono = '"SF Mono", ui-monospace, Menlo, Consolas, monospace';

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
  <LightPage chip="TAKE HOME · 帶回家" title={<>Banner Kit，<Hi>你也能用</Hi></>}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, height: 260 }}>
      <R d={160} style={{ height: '100%' }}>
        <SkillCard name="resize" module="模組 B · 多尺寸" what="一張 master → 全部版位 × 全部語系，依比例重新排版" say="「resize」" />
      </R>
      <R d={260} style={{ height: '100%' }}>
        <SkillCard name="multi-lang" module="模組 C · 多語系" what="做好的各版位 → 同尺寸換成每種語系文案，不重排" say="「多語系」" />
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
const LazyStep = ({ n, text }: { n: string; text: string }) => (
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
        fontSize: 24,
      }}
    >
      {n}
    </span>
    {text}
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
          懶惰不是終點，
          <br />
          <Hi>是持續問一句：這還能不能更自動？</Hi>
        </h2>
      </R>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 64 }}>
        <R d={300}>
          <LazyStep n="1" text="找出重複的" />
        </R>
        <R d={360}>
          <Arrow color="var(--lz-hi, var(--osd-accent))" size={30} />
        </R>
        <R d={420}>
          <LazyStep n="2" text="寫成你的做法" />
        </R>
        <R d={480}>
          <Arrow color="var(--lz-hi, var(--osd-accent))" size={30} />
        </R>
        <R d={540}>
          <LazyStep n="3" text="交給 AI" />
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
  Manifesto,
  Handmade,
  EvolutionMap,
  Evolution1,
  Evolution2,
  SkillInside,
  Demo,
  Impact,
  Departments,
  CrossTeam,
  Modules,
  Rules,
  Next,
  TakeHome,
  Closing,
] satisfies Page[];

export const notes: (string | undefined)[] = [
  // 1 · 封面 0:30
  `【0:30】
大家好，我是 Coral。
今天想分享我怎麼一路「偷懶」，把 banner 製作從一整個下午變成幾分鐘。
（指向流程膠囊）從手貼多語系、到 Google Sheet Plugin、到現在一句話交給 AI——這就是今天的三站。`,

  // 2 · 懶惰宣言 1:00
  `【1:00】
先唸兩句話：Larry Wall 說懶惰是程式設計師的三大美德之一；Heinlein 說進步是懶人為了找更簡單的方法帶來的。
我不是不想做事，是不想做「重複」的事。
（按 → 逐張出現）重複的，交給工具；會錯的，交給流程；要判斷的，才交給人。
這三句話就是今天整場的地圖，後面每一頁都會回到這裡。`,

  // 3 · 純手工時代 1:00
  `【1:00】
先回到起點。以前做一套 banner：畫好主視覺、手動 resize 成每個版位、再把多語系文案一個一個貼進去。
（指向上方截圖）這是【活動名稱】一檔活動要的全部 banner——13 個版位乘上 12 個語系，就是 156 張圖。
痛點有三個：重複勞動、容易出錯、時間錯置。
這三件事都不需要創意，那就不該讓人來做。`,

  // 3.5 · 進化路線 0:45
  `【0:45】
那我怎麼「偷懶」？同一套流程，我偷懶了兩次。
第一階段是純手工：主視覺、貼文案、resize 全部自己來。
（按 →）第二階段借力工具：把貼文案交給 Sheet Plugin，這是第一次偷懶。
（按 →）第三階段交給 AI：連帶入文案也不用 Plugin 了，帶入文案、resize、替換全部交給 AI agent，這是第二次偷懶。
注意主視覺從頭到尾都在我手上——要判斷的，才交給人。
至於省了多少時間，先賣個關子，等看完 Demo 再公布。`,

  // 5 · 第一次偷懶 1:30
  `【1:30】
第一次偷懶，是善用現成工具。
以前：打開文案表逐格複製、切回 Figma 貼上對位、多一種語言就多一輪、改一個字就全部重貼。
（按 → 出現 AFTER）現在文案集中在一張 Sheet，Plugin 依語系自動填入，改字只改一個地方，貼錯幾乎歸零。
（按 → 出現截圖）用的是 Figma 社群現成的外掛 Google Sheets Sync——不重造輪子，也是一種懶。
（按 → 出現數字）多語系貼字時間大約少了【60%】。
（補一句）這一步後來也交給 AI 了，現在已經不用 Plugin，下一頁會看到。`,

  // 6 · 第二次偷懶 1:30
  `【1:30】
第二次偷懶，是把我的做法寫成 Skill。
（按 →）第一步，我只說一句話：「幫我把這張 banner resize 成全版位，換上 12 種語系」。
（按 →）第二步，AI agent 照著 Skill 跑完三件事：聽懂這句話要哪些版位、哪些語系；照 Skill 帶入 content writer 斷好行的文案、延展版位、對位；最後截圖檢查並回報，確認每張都排好。
（按 →）第三步，我去做別的設計：想新主視覺、跟企劃討論。文案和斷行都由 content writer 先準備好，我不用再一個一個調。
（按 →）從動手做，變成動口說。
關鍵不是 AI 有多神，而是我把「我的做法」寫成了 Skill——它記得我的做法，不用每次重新解釋。`,

  // 6.5 · Skill 長什麼樣＋口頭補充情境 1:30
  `【1:30】
那 Skill 裡面到底寫了什麼？其實就是我平常的做法，一步一步寫下來。
第一步，先問清楚：要哪些版位、用哪份 Sheet 哪個分頁、命名要不要加幣別、Figma 檔在哪。
（按 →）第二步，它自己去找 master，認出 headline、subtitle、CTA、T&C 各是哪個圖層。
（按 →）第三步是重點：每個版位、每個語系跑一輪——複製、resize、重新排版、填入 content writer 斷好行的文案、命名，最後截圖檢查有沒有塞不下或被裁到。
（按 →）第四步，回報給我：產了哪些圖、哪裡要看，我只要看那幾張。
這是 resize 的流程；只換語系不換尺寸的時候用 multi-lang，步驟一樣，只是不 resize。
（口頭補充：我不在，生產照跑）開會時，以前設計停擺，現在開完會只剩檢查；臨時改字，以前全部重貼，現在更新 Sheet、一句話重出；請假時，以前要等我回來，現在同事用同一個 Skill 就能接手。`,

  // 8 · Demo 3:00
  `【3:00】影片約 2.5 分鐘，靜音，現場口述。
① 先看我說一句話（約 20 秒）。
② AI 執行中——這段有快轉，看角落計時器，實際耗時【X 分鐘】。中間會切到 Skill 檔，讓大家看我寫了哪些規則。
③ 最後是成品拼貼和產出清單（約 1 分鐘）。
錄製日期：【YYYY/MM/DD】。影片若無法播放，改用本機備份檔。`,

  // 9 · 成效 1:00
  `【1:00】
三次進化的數字：手貼每套【120】分鐘、Sheet 帶入【45】分鐘、交給 AI【10】分鐘。
每套製作時間少了【92%】，校稿錯誤大幅減少，而且多出時間做真正需要設計的工作。
補充一下：這是目前階段的數據，截至【X 月】，翻譯時間另計。`,

  // 10 · 其他部門的做法 1:00
  `【1:00】
我也去看了其他部門怎麼做 banner。
Games：設計有固定範本，每次只換背景圖和前景圖——這其實就是後面會講的「固定範本」模組。
Promotion：只產出 MKT 需要的尺寸，不做全版位——這就是在「多尺寸」上做取捨。
他們卡在哪：【待填】。
大家其實都在偷懶，只是方法還停在各自的習慣裡。`,

  // 11 · 跨部門發現 1:00
  `【1:00】
後來我跟其他部門聊，發現三件事：
一、大家的痛點其實一模一樣——resize、多語系、改字重來。
（按 →）二、每個人都有自己的小聰明，有人用範本、有人訂命名規則，但都停在「靠人自律」。
（按 →）三、所以缺的不是工具，是「可複製」的方法。`,

  // 12 · 模組化 2:00
  `【2:00】
所以我把流程拆成模組。收到需求先問三個問題：要新主視覺嗎？要幾種尺寸？要幾種語言？
答案決定要用哪些模組：
A 主視覺——設計師做，AI 輔助發想。
B 多尺寸——AI 依 Skill 延展，人抽查。
C 多語系——content writer 翻譯，AI 從 Sheet 帶入並套用。
D 固定範本——AI 換字、換圖、換日期，門檻最低。
E 校對交付——AI 檢查、回報、命名打包，再由 content writer 校對。
（按 →）組合起來：週期活動是 D＋E；新活動單語系是 A＋B＋E；大型跨國活動是 A＋B＋C＋E。
固定範本最適合其他部門先帶回去試。`,

  // 13 · 把規則寫進 Skill 1:30
  `【1:30】
Skill 的核心，其實就是把腦中的規則寫成一張表：版面、文字寬度、字級、字型。
有了這張表，從文案到成品就是固定的順序：
（按 →）先由 content writer 提供斷好行的文案；
（按 →）AI 照版位規格排版——安全區、字級層級都寫在表裡，不用猜；
（按 →）AI 截圖檢查每一張；
（按 →）最後 content writer 校對，我做最後確認。
（按 →）所以整條流程的分工就是一句話：文案交給專業的人，設計留給自己，生產交給 AI。`,

  // 14 · 下一步 1:00
  `【1:00】
Skill 是活的：出錯，就補一條規則，下次就不再錯。
舉個真實例子：【某次溢字後補上的規則】。
（按 → 出現階梯）用温明輝〈AI 導入的第一步〉的六層階梯來看，我們在第二層「知識封裝」，下一步是第三層「穩定代辦」，讓它定期自己跑。
（按 →）目前還在調整的有：【橫幅轉直式的重排】、【特定語系溢字】。`,

  // 15.5 · 帶回家 0:45
  `【0:45】
最後，這套 Banner Kit 大家都可以直接用。
兩個 skill：要換尺寸就說「resize」，只換語系就說「多語系」——剛好對應剛剛的模組 B 和 C。
安裝只要三行指令，在 Claude Code 裡輸入一次就好；之後我更新 skill，大家會自動拿到新版。
需要 GitLab repo 的讀取權限，沒有的話會後找我。`,

  // 15 · 總結 0:30 + Q&A 2:00
  `【0:30】
最後一句：懶惰不是終點，是持續問一句——這還能不能更自動？
三步驟：找出重複的、寫成你的做法、交給 AI。
歡迎大家一起試用、一起調整、一起偷懶。謝謝大家，接下來開放 Q&A。

—— Q&A 準備（2:00）——
・為什麼不直接寫腳本？腳本要有人寫、要維護；對話式讓設計師自己就能調整。最穩定的步驟正是下一步要固化的部分。
・數字怎麼量的？從【起點】到【終點】，翻譯時間另計，檢查時間【有／沒有】包含。
・省下的時間做了什麼？【新主視覺／參與的討論】。
・AI 出錯怎麼辦？用第 14 頁的真實案例：出錯 → 補規則。
・用的是哪個 AI agent？【工具名稱】＋【如何連接設計工具】。
・急件可以當天上嗎？生產時間縮短了，但校對與確認仍需要時間——避免變成承諾。`,
];
