
export interface LayerData {
  index: number;
  name: string;
  filename: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

export interface Layer extends LayerData {
  url: string;
}

export interface ImageUrls {
  [key: string]: string;
}
