import type { PlacementCategory } from './placement-category';

export type EditorialPick = {
  id: string;
  title: string;
  description: string;
  url: string;
  host: string;
  category: PlacementCategory;
  note: string;
};

export const editorialUpdated = '2026-11-08';

/**
 * Independently selected reading and browsing destinations, not paid placements.
 * Never include these entries in advertiser counts, paid weight, or sponsored rank.
 * Sources were checked on editorialUpdated; no affiliation or endorsement is implied.
 * Keep public/discover.xml in sync when updating this collection.
 */
export const editorialPicks: EditorialPick[] = [
  {
    id: 'public-domain-review',
    title: 'The Public Domain Review',
    description: 'Essays and unusual finds from the history of art, books and ideas.',
    url: 'https://publicdomainreview.org/',
    host: 'publicdomainreview.org',
    category: 'reading',
    note: 'Start with the collections: old maps, curious photographs and forgotten stories.',
  },
  {
    id: 'standard-ebooks',
    title: 'Standard Ebooks',
    description: 'Classic books carefully proofread and typeset for a better reading experience.',
    url: 'https://standardebooks.org/',
    host: 'standardebooks.org',
    category: 'reading',
    note: 'Volunteer-produced editions drawn from texts in the US public domain.',
  },
  {
    id: 'radio-garden',
    title: 'Radio Garden',
    description: 'Turn a globe and listen to live radio stations from different places.',
    url: 'https://radio.garden/',
    host: 'radio.garden',
    category: 'culture',
    note: 'Choose a place you have never visited and see what is playing.',
  },
  {
    id: 'window-swap',
    title: 'WindowSwap',
    description: 'Look through windows shared by people around the world.',
    url: 'https://www.window-swap.com/',
    host: 'window-swap.com',
    category: 'culture',
    note: 'A change of scenery, from somebody else’s everyday view.',
  },
  {
    id: 'fonts-in-use',
    title: 'Fonts In Use',
    description: 'See how typefaces work in real books, posters, packaging and websites.',
    url: 'https://fontsinuse.com/',
    host: 'fontsinuse.com',
    category: 'design',
    note: 'Browse by typeface, format or subject to find the detail you came for.',
  },
  {
    id: 'neal-fun',
    title: 'Neal.fun',
    description: 'Small interactive experiments, visualizations and games by Neal.',
    url: 'https://neal.fun/',
    host: 'neal.fun',
    category: 'other',
    note: 'An invitation to click around and find something unexpected.',
  },
];
