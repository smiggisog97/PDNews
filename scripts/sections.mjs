// The fixed set of sections a brief can use. Order is the order they print in
// an issue. `name` is the key the content uses (the brief's own heading);
// `title` is how the site shows it (sentence case); `slug` names the URL filter
// and the section's drawing.
export const SECTIONS = [
  { name: 'AI Industry News', title: 'AI industry news', slug: 'industry', short: 'Industry' },
  { name: 'Product Design & UX', title: 'Product design and UX', slug: 'design-ux', short: 'Design and UX' },
  { name: 'New AI Tools', title: 'New AI tools', slug: 'tools', short: 'Tools' },
  { name: 'Trends to Watch', title: 'Trends to watch', slug: 'trends', short: 'Trends' },
  { name: 'Product Design Inspiration', title: 'Product design inspiration', slug: 'inspiration', short: 'Inspiration' },
  { name: 'GitHub & Open Source', title: 'GitHub and open source', slug: 'open-source', short: 'Open source' },
  { name: 'Social Buzz', title: 'Social buzz', slug: 'social', short: 'Social' },
  { name: 'Learning Corner', title: 'Learning corner', slug: 'learning', short: 'Learning' },
  { name: 'Opportunities', title: 'Opportunities', slug: 'opportunities', short: 'Opportunities' },
  { name: "Today's Experiment", title: "Today's experiment", slug: 'experiment', short: 'Experiment' },
];

export const SECTION_BY_NAME = Object.fromEntries(SECTIONS.map((s) => [s.name, s]));
