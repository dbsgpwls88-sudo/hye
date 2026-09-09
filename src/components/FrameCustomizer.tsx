import React, { useState, useRef, useEffect } from 'react';
import { Download, Printer, Save, ArrowLeft, RotateCcw, Palette, Sparkles, Smile, Type, Check, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CapturedPhoto, FrameTheme, FrameLayout, PhotoFilter, StickerItem, SavedFourCut } from '../types';
import { FRAME_THEMES, STICKER_PALETTE } from '../data/frames';
import { FourCutPreview, FourCutPreviewHandle } from './FourCutPreview';
import { saveFourCutToStorage, saveClassInfo, getClassInfo } from '../utils/storage';
import { playCelebrationSound } from '../utils/sound';

interface FrameCustomizerProps {
  selectedPhotos: CapturedPhoto[];
  onBackToSelect: () => void;
  onRetakeAll: () => void;
  soundEnabled: boolean;
  onOpenGallery: () => void;
}

export const FrameCustomizer: React.FC<FrameCustomizerProps> = ({
  selectedPhotos,
  onBackToSelect,
  onRetakeAll,
  soundEnabled,
  onOpenGallery,
}) => {
  const previewRef = useRef<FourCutPreviewHandle>(null);

  // Load cached settings
  const cached = getClassInfo();

  const [selectedTheme, setSelectedTheme] = useState<FrameTheme>(() => {
    return FRAME_THEMES.find((t) => t.id === cached.selectedThemeId) || FRAME_THEMES[0];
  });
  const [layout, setLayout] = useState<FrameLayout>('strip'); // 'strip' or 'grid'
  const [filter, setFilter] = useState<PhotoFilter>('bright');
  const [classNameText, setClassNameText] = useState(cached.className || '햇살가득 샛별반');
  const [subTitleText, setSubTitleText] = useState(cached.subTitle || '우리들의 반짝이는 오늘 ✨');
  const [showDate, setShowDate] = useState(true);
  const [dateText, setDateText] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
  });

  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Persist class name and theme to browser cache/storage
  useEffect(() => {
    saveClassInfo({
      className: classNameText,
      subTitle: subTitleText,
      selectedThemeId: selectedTheme.id,
    });
  }, [classNameText, subTitleText, selectedTheme]);

  // Add a sticker
  const handleAddSticker = (emoji: string) => {
    // Random position avoiding extreme edges
    const rx = 15 + Math.random() * 70;
    const ry = 15 + Math.random() * 70;
    const rRot = (Math.random() - 0.5) * 40;

    const newSticker: StickerItem = {
      id: `sticker-${Date.now()}-${Math.random()}`,
      emoji,
      x: rx,
      y: ry,
      size: 28,
      rotation: rRot,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  const handleRemoveSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  // Download high-resolution PNG
  const handleDownload = async () => {
    if (!previewRef.current) return;
    setIsSaving(true);
    try {
      const dataUrl = await previewRef.current.exportToDataUrl();
      if (!dataUrl) return;

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${classNameText}_네컷사진_${dateText}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FACC15', '#38BDF8', '#F472B6', '#4ADE80', '#A855F7'],
      });
      if (soundEnabled) playCelebrationSound();

      // Also auto-save to album cache
      await handleSaveToAlbum(dataUrl, false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Direct Print
  const handlePrint = async () => {
    if (!previewRef.current) return;
    try {
      const dataUrl = await previewRef.current.exportToDataUrl();
      if (!dataUrl) return;

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${classNameText} 네컷 인쇄</title>
            <style>
              @page { size: auto; margin: 5mm; }
              body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: white;
              }
              img {
                max-width: 95vw;
                max-height: 95vh;
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print();window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error(err);
    }
  };

  // Save to browser cache (IndexedDB)
  const handleSaveToAlbum = async (providedDataUrl?: string, showFeedback = true) => {
    if (!previewRef.current) return;
    setIsSaving(true);
    try {
      const dataUrl = providedDataUrl || (await previewRef.current.exportToDataUrl());
      if (!dataUrl) return;

      const newStrip: SavedFourCut = {
        id: `fourcut-${Date.now()}`,
        title: classNameText,
        dateStr: dateText,
        imageDataUrl: dataUrl,
        layout: layout,
        themeId: selectedTheme.id,
        createdAt: Date.now(),
        photoCount: selectedPhotos.length,
      };

      await saveFourCutToStorage(newStrip);

      if (showFeedback) {
        setSaveSuccess(true);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
        if (soundEnabled) playCelebrationSound();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="frame-customizer-root" className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-amber-100/90 border-2 border-amber-300 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center text-2xl shadow-inner shrink-0">
            🎨
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-jua text-amber-950">
              우리반 네컷 프레임 선택 & 예쁘게 꾸미기
            </h2>
            <p className="text-sm md:text-base text-amber-800">
              원하는 테마와 스티커를 골라 귀여운 추억을 완성해보세요!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGallery}
            className="px-4 py-2.5 bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-300 rounded-2xl font-jua text-sm flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <span>📚 우리반 추억 앨범</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Customizer Controls + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customization Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* 1. Frame Themes Selection */}
          <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-jua text-slate-800 text-base md:text-lg">
                <Palette className="w-5 h-5 text-amber-500" />
                <span>1. 귀여운 프레임 테마 선택</span>
              </div>
              <span className="text-xs font-jua text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                {selectedTheme.emoji} {selectedTheme.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {FRAME_THEMES.map((theme) => {
                const isCurrent = theme.id === selectedTheme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    style={{
                      backgroundColor: theme.bgColor,
                      borderColor: isCurrent ? theme.textColor : theme.borderColor,
                    }}
                    className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-all transform active:scale-95 cursor-pointer shadow-xs ${
                      isCurrent
                        ? 'ring-3 ring-amber-400 ring-offset-2 scale-102 shadow-md'
                        : 'hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xl">{theme.emoji}</span>
                      {isCurrent && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span
                      style={{ color: theme.textColor }}
                      className="font-jua text-sm font-bold truncate block"
                    >
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Frame Layout (1x4 Strip vs 2x2 Grid) */}
          <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 font-jua text-slate-800 text-base md:text-lg">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>2. 사진 레이아웃 스타일</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLayout('strip')}
                className={`p-3.5 rounded-2xl border-2 font-jua flex items-center gap-3 transition active:scale-95 cursor-pointer ${
                  layout === 'strip'
                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="w-7 h-10 border-2 border-amber-600 rounded bg-white flex flex-col justify-around p-0.5">
                  <div className="w-full h-1.5 bg-amber-400 rounded-xs" />
                  <div className="w-full h-1.5 bg-amber-400 rounded-xs" />
                  <div className="w-full h-1.5 bg-amber-400 rounded-xs" />
                  <div className="w-full h-1.5 bg-amber-400 rounded-xs" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm md:text-base">1x4 세로 스트립형</div>
                  <div className="text-xs text-slate-500 font-gaegu">인생네컷 시그니처 롱스트립</div>
                </div>
              </button>

              <button
                onClick={() => setLayout('grid')}
                className={`p-3.5 rounded-2xl border-2 font-jua flex items-center gap-3 transition active:scale-95 cursor-pointer ${
                  layout === 'grid'
                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 border-2 border-amber-600 rounded bg-white grid grid-cols-2 gap-0.5 p-0.5">
                  <div className="bg-amber-400 rounded-xs" />
                  <div className="bg-amber-400 rounded-xs" />
                  <div className="bg-amber-400 rounded-xs" />
                  <div className="bg-amber-400 rounded-xs" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm md:text-base">2x2 네모 그리드형</div>
                  <div className="text-xs text-slate-500 font-gaegu">엽서 & 카드 스타일</div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Class Name & Subtitle & Date inputs */}
          <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 font-jua text-slate-800 text-base md:text-lg">
              <Type className="w-5 h-5 text-amber-500" />
              <span>3. 우리반 이름 및 문구 입력</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-jua text-slate-600 mb-1">
                  유치원 / 반 이름
                </label>
                <input
                  type="text"
                  value={classNameText}
                  maxLength={20}
                  onChange={(e) => setClassNameText(e.target.value)}
                  placeholder="예: 햇살가득 샛별반"
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 font-jua text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-jua text-slate-600 mb-1">
                  기념 문구 / 부제
                </label>
                <input
                  type="text"
                  value={subTitleText}
                  maxLength={25}
                  onChange={(e) => setSubTitleText(e.target.value)}
                  placeholder="예: 우리들의 반짝이는 오늘 ✨"
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 font-jua text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="toggle-date"
                  checked={showDate}
                  onChange={(e) => setShowDate(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                />
                <label htmlFor="toggle-date" className="text-xs font-jua text-slate-700 cursor-pointer">
                  날짜 표시하기
                </label>
              </div>

              {showDate && (
                <input
                  type="text"
                  value={dateText}
                  onChange={(e) => setDateText(e.target.value)}
                  className="w-32 px-2.5 py-1 text-xs rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 font-jua text-center"
                />
              )}
            </div>
          </div>

          {/* 4. Photo Filters */}
          <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 font-jua text-slate-800 text-base md:text-lg">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>4. 사진 필터 효과</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'normal', name: '원본', emoji: '✨' },
                { id: 'bright', name: '뽀샤시', emoji: '🌸' },
                { id: 'warm', name: '따뜻한', emoji: '☀️' },
                { id: 'mono', name: '흑백', emoji: '🎞️' },
                { id: 'vintage', name: '빈티지', emoji: '🍂' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as PhotoFilter)}
                  className={`py-2 px-1 rounded-xl border font-jua text-xs flex flex-col items-center gap-1 transition active:scale-95 cursor-pointer ${
                    filter === f.id
                      ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-sm font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">{f.emoji}</span>
                  <span>{f.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Cute Stickers Palette */}
          <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-jua text-slate-800 text-base md:text-lg">
                <Smile className="w-5 h-5 text-amber-500" />
                <span>5. 귀여운 스티커 콕콕 찍기</span>
              </div>
              {stickers.length > 0 && (
                <button
                  onClick={() => setStickers([])}
                  className="text-xs font-jua text-red-500 hover:text-red-700 underline"
                >
                  스티커 모두 지우기 ({stickers.length}개)
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 font-gaegu">
              스티커를 누르면 프레임에 쏙 붙어요! 미리보기에서 스티커를 누르면 지워집니다.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {STICKER_PALETTE.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddSticker(emoji)}
                  className="w-10 h-10 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center justify-center text-xl shadow-xs transition transform hover:scale-115 active:scale-90 cursor-pointer"
                  title="스티커 붙이기"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview + Final Export Actions (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center gap-4 sticky top-6">
          {/* Live Preview Card */}
          <div className="w-full flex justify-center">
            <FourCutPreview
              ref={previewRef}
              photos={selectedPhotos}
              theme={selectedTheme}
              layout={layout}
              filter={filter}
              classNameText={classNameText}
              subTitleText={subTitleText}
              dateText={dateText}
              showDate={showDate}
              stickers={stickers}
              onRemoveSticker={handleRemoveSticker}
            />
          </div>

          {/* Action Buttons Box */}
          <div className="w-full max-w-[340px] flex flex-col gap-2.5">
            {/* Download Button */}
            <button
              id="btn-download-fourcut"
              disabled={isSaving}
              onClick={handleDownload}
              className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-2xl font-jua text-lg font-bold shadow-lg hover:shadow-amber-300/40 flex items-center justify-center gap-2 border-2 border-amber-300 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>네컷 사진 다운로드 (고화질)</span>
            </button>

            {/* Print & Save Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-print-fourcut"
                onClick={handlePrint}
                className="py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-jua text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>바로 인쇄하기</span>
              </button>

              <button
                id="btn-save-to-album"
                onClick={() => handleSaveToAlbum()}
                className={`py-3 rounded-2xl font-jua text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer ${
                  saveSuccess
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{saveSuccess ? '앨범 저장 완료!' : '우리반 앨범 저장'}</span>
              </button>
            </div>

            {/* Secondary step buttons */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                onClick={onBackToSelect}
                className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-jua text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>4장 다시 고르기</span>
              </button>

              <button
                onClick={onRetakeAll}
                className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-jua text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>새로 촬영하기</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
