
export interface TextField {
  id: number;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: string;
  fontFamily: string;
  opacity: number;
  rotation: number;
  scale: number;
  type: 'text' | 'header' | 'footer';
}

export interface ImageField {
  id: number;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  scale: number;
}
