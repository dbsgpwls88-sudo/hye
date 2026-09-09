export type FrameLayout = 'strip' | 'grid'; // strip: 1x4 vertical, grid: 2x2

export interface FrameTheme {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  pattern?: string;
  badgeBg: string;
  description: string;
  headerIcon: string;
  footerDeco: string;
}

export type PhotoFilter = 'normal' | 'warm' | 'bright' | 'mono' | 'vintage';

export interface StickerItem {
  id: string;
  emoji: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number; // size in px
  rotation: number; // in degrees
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  index: number; // 0 to 4 (1st to 5th shot)
  timestamp: number;
}

export interface SavedFourCut {
  id: string;
  title: string;
  dateStr: string;
  imageDataUrl: string;
  thumbnailDataUrl?: string;
  layout: FrameLayout;
  themeId: string;
  createdAt: number;
  photoCount: number;
}

export type AppStep = 'camera' | 'select' | 'customize' | 'result';
