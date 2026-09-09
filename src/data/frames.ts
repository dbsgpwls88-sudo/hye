import { FrameTheme } from '../types';

export const FRAME_THEMES: FrameTheme[] = [
  {
    id: 'chick-yellow',
    name: '삐약이 노랑반',
    emoji: '🐥',
    bgColor: '#FEF9C3', // yellow-100
    borderColor: '#FACC15', // yellow-400
    textColor: '#854D0E', // yellow-800
    accentColor: '#EAB308',
    badgeBg: '#FEF08A',
    description: '노릇노릇 귀여운 아기 병아리와 따스한 햇살 테마',
    headerIcon: '🐥 ⭐ 🐣',
    footerDeco: '🐥 우리들의 햇살 가득한 하루 🌻',
  },
  {
    id: 'rainbow-sprout',
    name: '무지개 새싹반',
    emoji: '🌈',
    bgColor: '#E0F2FE', // sky-100
    borderColor: '#38BDF8', // sky-400
    textColor: '#0369A1', // sky-700
    accentColor: '#0EA5E9',
    badgeBg: '#BAE6FD',
    description: '몽실몽실 솜사탕 구름과 예쁜 무지개 테마',
    headerIcon: '🌈 ☁️ 🌱',
    footerDeco: '🌈 무지개처럼 반짝반짝 피어나라 🌱',
  },
  {
    id: 'forest-bear',
    name: '숲속 곰돌이반',
    emoji: '🐻',
    bgColor: '#F5EBE0', // warm biscuit
    borderColor: '#D4A373', // soft camel
    textColor: '#6B4E3D', // warm brown
    accentColor: '#BC6C25',
    badgeBg: '#E6CCB2',
    description: '도토리와 나뭇잎, 포근하고 따뜻한 곰돌이 테마',
    headerIcon: '🐻 🌰 🍃',
    footerDeco: '🐻 숲속 동물 친구들과 찰칵 🌰',
  },
  {
    id: 'sparkle-star',
    name: '반짝반짝 별님반',
    emoji: '✨',
    bgColor: '#F3E8FF', // purple-100
    borderColor: '#C084FC', // purple-400
    textColor: '#6B21A8', // purple-800
    accentColor: '#A855F7',
    badgeBg: '#E9D5FF',
    description: '밤하늘 달님과 총총 빛나는 별 테마',
    headerIcon: '✨ 🌙 🌟',
    footerDeco: '✨ 밤하늘 별처럼 빛나는 우리 🌙',
  },
  {
    id: 'sweet-strawberry',
    name: '새콤달콤 딸기반',
    emoji: '🍓',
    bgColor: '#FCE7F3', // pink-100
    borderColor: '#F472B6', // pink-400
    textColor: '#9D174D', // pink-800
    accentColor: '#EC4899',
    badgeBg: '#FBCFE8',
    description: '달콤한 딸기와 향기로운 핑크빛 플라워 테마',
    headerIcon: '🍓 🌸 💖',
    footerDeco: '🍓 매일매일 달콤하고 사랑스러워 🌸',
  },
  {
    id: 'crayon-doodle',
    name: '알록달록 크레파스반',
    emoji: '🖍️',
    bgColor: '#FFFBEB', // amber-50
    borderColor: '#FB923C', // orange-400
    textColor: '#C2410C', // orange-700
    accentColor: '#F97316',
    badgeBg: '#FED7AA',
    description: '어린이의 스케치북처럼 신나고 자유로운 테마',
    headerIcon: '🖍️ 🎨 🎈',
    footerDeco: '🎨 내가 그린 무지개 세상 속으로 🖍️',
  },
  {
    id: 'classic-white',
    name: '심플 화이트 폴라로이드',
    emoji: '🤍',
    bgColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    textColor: '#334155',
    accentColor: '#64748B',
    badgeBg: '#F1F5F9',
    description: '깔끔하고 사진이 가장 돋보이는 모던 감성 테마',
    headerIcon: '📸 ✨ 🤍',
    footerDeco: '📸 오늘의 예쁜 추억을 간직해요',
  },
  {
    id: 'midnight-black',
    name: '인생네컷 시크블랙',
    emoji: '🖤',
    bgColor: '#1E293B', // slate-800
    borderColor: '#475569',
    textColor: '#F8FAFC',
    accentColor: '#38BDF8',
    badgeBg: '#334155',
    description: '네컷 사진관의 정석! 또렷하고 감성적인 블랙 테마',
    headerIcon: '🖤 🎬 ⭐',
    footerDeco: '🎬 MEMORIES OF TODAY ★',
  },
];

export const POSE_RECOMMENDATIONS = [
  { step: 1, title: '꽃받침 포즈 🌸', desc: '두 볼에 손을 대고 환하게 웃어봐요!', emoji: '🥰' },
  { step: 2, title: '하트 뿅뿅 💕', desc: '머리 위로 하트 또는 볼 하트를 콕!', emoji: '🫶' },
  { step: 3, title: '멋진 브이 ✌️', desc: '눈가에 손가락 브이를 올리고 윙크!', emoji: '✌️' },
  { step: 4, title: '귀여운 볼 콕 🐱', desc: '고양이 수염을 만들거나 볼을 콕 찔러봐요!', emoji: '😻' },
  { step: 5, title: '우리반 최고! 👍', desc: '엄지 척 또는 신나게 두 손 들고 만세!', emoji: '🥳' },
];

export const STICKER_PALETTE = [
  '⭐', '🐥', '🐻', '🐰', '🌸', '💖', '👑', '🌈', 
  '🍓', '🍎', '🎈', '☀️', '🎉', '🍀', '✨', '🐾',
  '🍭', '🍰', '🕶️', '🎵', '🌻', '🚀', '💌', '✌️'
];
