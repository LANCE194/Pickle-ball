import { Link } from 'react-router-dom';
import { peso } from '../lib/format';
import { apiUrl } from '../lib/api';
import { accessibleColor, readableTextColor } from '../lib/color';
import { colors } from '../theme/tokens';
import Button from './Button';
import Card from './Card';

const DEFAULT_BRAND = {
  name: 'DinkNest',
  meaning: "Dink is pickleball's soft game; nest is a welcoming home for players to connect, play, and grow.",
};
const DEFAULT_COURTS = [
  { id: 'preview-1', name: 'Court 1', court_number: 1, type: 'Indoor', offpeak_rate: 300, peak_rate: 400 },
  { id: 'preview-2', name: 'Court 2', court_number: 2, type: 'Indoor', offpeak_rate: 300, peak_rate: 400 },
];

/** Renders the approved site design in both the editor preview and the public landing page. */
export default function SitePreview({
  config,
  width = 'desktop',
  dark = false,
  courts = [],
  events = [],
  availability,
  onBook,
  isLive = false,
  clubId,
}) {
  const theme = config.theme;
  const canvasWidth = { mobile: 375, tablet: 768, desktop: '100%' }[width];
  const background = dark ? colors.navy : theme.background;
  const foreground = dark ? colors.offwhite : theme.text;
  const brand = config.brand || DEFAULT_BRAND;
  const menu = Object.entries(config.menu || {}).filter(([key]) => key !== 'login');
  const safeCourts = courts.length ? courts : (isLive ? [] : DEFAULT_COURTS);
  const assetUrl = path => path ? apiUrl(`/api/files/${path}${clubId ? `?club_id=${encodeURIComponent(clubId)}` : ''}`) : null;
  const style = {
    '--site-primary': theme.primary,
    '--site-accent': theme.accent,
    '--site-background': background,
    '--site-text': foreground,
    '--site-heading-font': `'${theme.headingFont}', Poppins, sans-serif`,
    '--site-body-font': `'${theme.bodyFont}', Inter, system-ui, sans-serif`,
    width: isLive ? '100%' : canvasWidth,
    maxWidth: isLive ? 'none' : '100%',
    backgroundColor: background,
    color: foreground,
    fontFamily: `'${theme.bodyFont}', Inter, system-ui, sans-serif`,
  };

  return <div
    className={`site-renderer ${isLive ? 'guest-home' : 'mx-auto overflow-hidden rounded-card border line'}`}
    style={style}
    data-template={config.template}
  >
    {config.banner?.enabled && config.banner.text && <div className="text-center text-sm py-2 px-3 font-medium" style={{ background: theme.accent, color: readableTextColor(theme.accent) }}>{config.banner.text}</div>}
    {!isLive && <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: `${foreground}22` }}>
      <strong className="site-brand-lockup min-w-0 truncate" style={{ color: accessibleColor(theme.primary, background, foreground), fontFamily: `'${theme.headingFont}', Poppins, sans-serif` }}>
        {config.logo ? <img src={assetUrl(config.logo)} alt={`${brand.name} logo`} className="h-8" /> : brand.name}
      </strong>
      <span className="flex-1" />
      {menu.map(([key, label]) => <span key={key} className="hidden text-xs md:inline">{label}</span>)}
      <span className="rounded-card px-3 py-1.5 text-sm font-semibold" style={{ background: theme.accent, color: readableTextColor(theme.accent) }}>Book Now</span>
    </div>}

    {config.sections.filter(section => section.visible && (isLive ? section.kind !== 'footer' : true)).map((section, sectionIndex) => {
      const content = section.content;
      if (section.kind === 'hero') {
        const heroStyle = content.image
          ? { background: `linear-gradient(rgba(11,31,58,.7),rgba(11,31,58,.76)), url(${assetUrl(content.image)}) center/cover` }
          : { background: `linear-gradient(125deg, var(--site-primary, ${colors.court}), ${colors.navy})` };
        return <section key={section.id} className={`landing-hero text-white ${content.image ? 'landing-hero-image' : ''}`} style={heroStyle}>
          <div className="max-w-page mx-auto px-4 py-12 md:py-20">
            <div className="brand-story site-brand-lockup max-w-2xl items-start">
              <span className="brand-orb mt-1" aria-hidden="true" />
              <div>
                <p className="font-heading text-sm font-bold uppercase tracking-[.18em]" style={{ color: accessibleColor(theme.accent, colors.navy, colors.offwhite) }}>{brand.name}</p>
                <p className="landing-meaning mt-2">{brand.meaning}</p>
              </div>
            </div>
            <h1 className="landing-title mt-8 max-w-3xl font-bold" style={{ fontFamily: `'${theme.headingFont}', Poppins, sans-serif`, fontSize: width === 'mobile' ? '2rem' : width === 'tablet' ? '2.6rem' : 'clamp(2.6rem, 5vw, 3.75rem)' }}>{content.title}</h1>
            <p className="mt-4 max-w-xl text-lg text-white/85">{content.subtitle}</p>
            <div className="mt-7">
              {isLive
                ? <Button variant="book" onClick={onBook} className="cta-glow min-h-[56px] px-7 text-lg" style={{ backgroundColor: theme.accent, color: readableTextColor(theme.accent) }}>{content.button || 'Book Now'}</Button>
                : <span className="cta-glow inline-flex min-h-[44px] items-center rounded-card px-4 font-semibold" style={{ background: theme.accent, color: readableTextColor(theme.accent) }}>{content.button || 'Book Now'}</span>}
            </div>
          </div>
        </section>;
      }

      if (section.kind === 'footer') {
        return <footer key={section.id} className="px-5 py-5 text-sm border-t" style={{ borderColor: `${foreground}22` }}>
          {content.text}
          <div className="flex flex-wrap gap-3 mt-2">{(content.links || []).map(link => <a key={link.url} href={link.url} style={{ color: accessibleColor(theme.primary, background, foreground) }}>{link.label}</a>)}</div>
        </footer>;
      }

      return <section key={section.id} className="landing-section max-w-page mx-auto px-4 py-8 md:py-10" style={{ animationDelay: `${Math.min(sectionIndex * 90, 450)}ms` }}>
        <h2 className="mb-5" style={{ fontFamily: `'${theme.headingFont}', Poppins, sans-serif` }}>{content.title}</h2>
        {section.kind === 'courts_rates' && <>{safeCourts.length
          ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{safeCourts.map((court, index) => <Card key={court.id || court.name || index} className="landing-card">
            <h3>{court.name}</h3>
            <p className="muted">Court {court.court_number}, {court.type}</p>
            <p className="mt-2 font-semibold">Off-peak {peso(court.offpeak_rate)}, peak {peso(court.peak_rate)}</p>
          </Card>)}</div>
          : <p className="muted">No courts are available yet.</p>}
          {isLive && <><h3 className="mt-7 mb-3">Open times today</h3>{availability}</>}</>}
        {section.kind === 'events' && (events.length
          ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{events.map(event => <Card key={event.id} className="landing-card">
            {event.image_path && <img src={assetUrl(event.image_path)} alt="" className="rounded-card mb-3 w-full h-40 object-cover" loading="lazy" />}
            <h3>{event.title}</h3>
            {event.date_label && <p className="muted">{event.date_label}</p>}
            <p className="mt-2 line-clamp-3">{event.body}</p>
          </Card>)}</div>
          : <p className="muted">No events right now. Check back soon.</p>)}
        {section.kind === 'gallery' && <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{(content.images || []).map(image => <img key={image} src={assetUrl(image)} alt="Club photo" className="landing-card rounded-card w-full h-40 object-cover shadow-card" loading="lazy" />)}</div>}
        {section.kind === 'testimonials' && <div className="grid gap-3 sm:grid-cols-2">{(content.items || []).map((item, index) => <Card key={index}><p>{item.text}</p><p className="muted mt-2">{item.name}</p></Card>)}</div>}
        {section.kind === 'about_contact' && <Card>
          <p>{content.text}</p>
          {content.address && <p className="mt-2">{content.address}</p>}
          {content.phone && <p>{content.phone}</p>}
          {content.email && <p>{content.email}</p>}
          {content.mapQuery && (isLive
            ? <div className="mt-3 rounded-card overflow-hidden"><iframe title="Map" className="w-full h-64 border-0" loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(content.mapQuery)}&output=embed`} /></div>
            : <p className="muted mt-2">Map: {content.mapQuery}</p>)}
          <div className="mt-3">{isLive
            ? <Link to="/about" className="inline-flex min-h-[44px] items-center rounded-card px-3 py-2 font-semibold no-underline" style={{ background: theme.accent, color: readableTextColor(theme.accent) }}>Send us a message</Link>
            : <span className="inline-flex min-h-[44px] items-center rounded-card px-3 py-2 font-semibold" style={{ background: theme.accent, color: readableTextColor(theme.accent) }}>Send us a message</span>}</div>
        </Card>}
      </section>;
    })}
  </div>;
}
