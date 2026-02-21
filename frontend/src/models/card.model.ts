export interface Card {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  content: string;
}

export interface CardItem {
  title: string;
  description: string;
  icon: string;
  color: string;
  content: string;
  link?: string;
}

export interface WindowEntry {
  id: string;
  title: string;
  minimized: boolean;
  focused: boolean;
}

export interface BottomPanelTab {
  id: string;
  label: string;
  icon: string;
  content: string;
}

export interface SearchResult {
  query: string;
  results: Card[];
}

export const TECH_CARDS: Card[] = [
  {
    id: 1,
    title: 'Angular',
    description: 'A platform for building mobile and desktop web applications with TypeScript.',
    icon: '🅰️',
    color: '#dd0031',
    content:
      '<h2>Angular</h2><p>Angular is a platform and framework for building single-page client applications using HTML and TypeScript.</p>',
  },
  {
    id: 2,
    title: 'Rsbuild',
    description: 'A high-performance build tool based on Rspack, written in Rust.',
    icon: '🚀',
    color: '#4776e6',
    content: '<h2>Rsbuild</h2><p>Rsbuild is a high-performance build tool powered by Rspack.</p>',
  },
  {
    id: 3,
    title: 'Bun',
    description: 'All-in-one JavaScript runtime, package manager, and build tool.',
    icon: '🟡',
    color: '#fbf0df',
    content: '<h2>Bun</h2><p>Bun is an all-in-one JavaScript runtime designed to be fast.</p>',
  },
  {
    id: 4,
    title: 'TypeScript',
    description: 'Typed superset of JavaScript that compiles to plain JavaScript.',
    icon: '🔷',
    color: '#3178c6',
    content: '<h2>TypeScript</h2><p>TypeScript is a strongly typed programming language.</p>',
  },
  {
    id: 5,
    title: 'WebUI',
    description: 'Build modern web-based desktop applications using web technologies.',
    icon: '🖥️',
    color: '#764ba2',
    content:
      '<h2>WebUI</h2><p>WebUI allows you to build desktop applications using web technologies.</p>',
  },
  {
    id: 6,
    title: 'esbuild',
    description: 'An extremely fast JavaScript bundler written in Go.',
    icon: '📦',
    color: '#ffcd00',
    content:
      '<h2>esbuild</h2><p>esbuild is an extremely fast JavaScript bundler written in Go.</p>',
  },
  {
    id: 7,
    title: 'Vite',
    description: 'Next generation frontend tooling with instant server start.',
    icon: '⚡',
    color: '#646cff',
    content:
      '<h2>Vite</h2><p>Vite is a build tool that aims to provide a faster development experience.</p>',
  },
  {
    id: 8,
    title: 'React',
    description: 'A JavaScript library for building user interfaces.',
    icon: '⚛️',
    color: '#61dafb',
    content: '<h2>React</h2><p>React is a JavaScript library for building user interfaces.</p>',
  },
  {
    id: 9,
    title: 'Vue',
    description: 'Progressive JavaScript framework for building UIs.',
    icon: '💚',
    color: '#42b883',
    content: '<h2>Vue</h2><p>Vue is a progressive JavaScript framework.</p>',
  },
  {
    id: 10,
    title: 'Svelte',
    description: 'Cybernetically enhanced web apps with compiler approach.',
    icon: '🔥',
    color: '#ff3e00',
    content:
      '<h2>Svelte</h2><p>Svelte represents a radical new approach to building user interfaces.</p>',
  },
  {
    id: 11,
    title: 'Rust',
    description: 'Fast, reliable, and memory-safe systems programming language.',
    icon: '🦀',
    color: '#dea584',
    content: '<h2>Rust</h2><p>Rust is a systems programming language focused on safety.</p>',
  },
  {
    id: 12,
    title: 'Tailwind CSS',
    description: 'A utility-first CSS framework for rapid UI development.',
    icon: '💨',
    color: '#06b6d4',
    content: '<h2>Tailwind CSS</h2><p>Tailwind CSS is a utility-first CSS framework.</p>',
  },
];
