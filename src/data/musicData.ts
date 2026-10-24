import { Track, Playlist } from '../types/music';

export const CURATED_TRACKS: Track[] = [
  {
    id: 'PEM0Vs8jf1w',
    title: 'golden hour',
    artist: 'JVKE',
    album: 'this is what ____ feels like',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    duration: 213,
  },
  {
    id: 'H5v3kku4y6Q',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    duration: 167,
  },
  {
    id: 'eVli-tstM5E',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    album: 'Short n\' Sweet',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    duration: 175,
  },
  {
    id: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    duration: 200,
  },
  {
    id: 'd5gf9dXHeG4',
    title: 'BIRDS OF A FEATHER',
    artist: 'Billie Eilish',
    album: 'HIT ME HARD AND SOFT',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    duration: 196,
  },
  {
    id: '34Na4j8AVgA',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    album: 'Starboy',
    thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    duration: 230,
  },
  {
    id: 'jfKfPfyJRdk',
    title: 'lofi hip hop radio - beats to relax/study to',
    artist: 'Lofi Girl',
    album: 'Chill Beats',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&auto=format&fit=crop&q=80',
    duration: 3600,
  },
  {
    id: 'dX3k_QDnzHE',
    title: 'Midnight City',
    artist: 'M83',
    album: 'Hurry Up, We\'re Dreaming',
    thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
    duration: 243,
  },
  {
    id: 'sBzrzS1Ag_g',
    title: 'The Less I Know The Better',
    artist: 'Tame Impala',
    album: 'Currents',
    thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
    duration: 216,
  },
  {
    id: '7wtfhZwyrcc',
    title: 'Believer',
    artist: 'Imagine Dragons',
    album: 'Evolve',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    duration: 204,
  },
  {
    id: 'TUVcZfQe-Kw',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    thumbnail: 'https://images.unsplash.com/photo-1520523839898-507127027a6c?w=600&auto=format&fit=crop&q=80',
    duration: 203,
  },
  {
    id: 'waAlgFq9Xq8',
    title: 'After Dark',
    artist: 'Mr.Kitty',
    album: 'Time',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    duration: 259,
  },
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-todays-hits',
    title: "Today's Biggest Hits",
    description: 'The hottest tracks right now across pop, r&b, and alternative.',
    creator: 'YouTube Music',
    category: 'hits',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    tracks: [
      CURATED_TRACKS[0], // golden hour
      CURATED_TRACKS[1], // As It Was
      CURATED_TRACKS[2], // Espresso
      CURATED_TRACKS[3], // Blinding Lights
      CURATED_TRACKS[4], // BIRDS OF A FEATHER
      CURATED_TRACKS[10], // Levitating
    ],
  },
  {
    id: 'pl-chill-lofi',
    title: 'Chill Lofi & Beats',
    description: 'Relaxing ambient and instrumental lo-fi beats to unwind.',
    creator: 'YouTube Music',
    category: 'relax',
    coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&auto=format&fit=crop&q=80',
    tracks: [
      CURATED_TRACKS[6], // lofi radio
      CURATED_TRACKS[7], // Midnight City
      CURATED_TRACKS[8], // Tame Impala
      CURATED_TRACKS[11], // After Dark
      CURATED_TRACKS[0], // golden hour
    ],
  },
  {
    id: 'pl-workout-hype',
    title: 'High Energy Workout',
    description: 'Fast-paced, heavy-hitting anthems to push your limits.',
    creator: 'YouTube Music',
    category: 'workout',
    coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    tracks: [
      CURATED_TRACKS[9], // Believer
      CURATED_TRACKS[5], // Starboy
      CURATED_TRACKS[3], // Blinding Lights
      CURATED_TRACKS[10], // Levitating
    ],
  },
  {
    id: 'pl-night-drive',
    title: 'Late Night Synth Drive',
    description: 'Retro synthwave, dark pop, and late-night highway atmosphere.',
    creator: 'YouTube Music',
    category: 'commute',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    tracks: [
      CURATED_TRACKS[11], // After Dark
      CURATED_TRACKS[7], // Midnight City
      CURATED_TRACKS[8], // Tame Impala
      CURATED_TRACKS[5], // Starboy
      CURATED_TRACKS[3], // Blinding Lights
    ],
  },
  {
    id: 'pl-focus-flow',
    title: 'Deep Focus & Flow',
    description: 'Instrumental clarity to keep your mind locked in the zone.',
    creator: 'YouTube Music',
    category: 'focus',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    tracks: [
      CURATED_TRACKS[6], // lofi radio
      CURATED_TRACKS[0], // golden hour
      CURATED_TRACKS[8], // Tame Impala
      CURATED_TRACKS[7], // Midnight City
    ],
  },
];
