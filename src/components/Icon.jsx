import './Icon.css';

// Decorative by default; surrounding controls provide their accessible names.
export default function Icon({ name = 'arrow-up-right', className = '' }) {
  const paths = {
    'arrow-up-right': 'M6 18 18 6M6 6h12v12',
    'arrow-down-right': 'm6 6 12 12M6 18h12V6',
    'arrow-right': 'M4 12h16m-6-6 6 6-6 6',
    'arrow-left': 'M20 12H4m6-6-6 6 6 6',
    'arrow-up': 'M12 20V4m-6 6 6-6 6 6',
    'arrow-down': 'M12 4v16m-6-6 6 6 6-6',
    replay: 'M3 10a9 9 0 1 1 2 8M3 4v6h6',
    play: 'm8 5 11 7-11 7Z',
    pause: 'M8 5v14M16 5v14',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    car: 'm4 10 2-6h12l2 6M3 10h18v8H3Zm3 8v2m12-2v2M6 14h2m8 0h2',
  };
  return <svg className={`ui-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name] || paths['arrow-up-right']}/></svg>;
}
