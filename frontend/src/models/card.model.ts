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
