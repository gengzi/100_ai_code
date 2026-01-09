export interface Slide {
  id: string;
  title: string;
  content: string;
  layout?: 'title' | 'content' | 'two-column' | 'image' | 'code';
  background?: string;
}

export interface Presentation {
  title: string;
  slides: Slide[];
}
