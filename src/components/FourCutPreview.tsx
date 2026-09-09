import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { FrameTheme, FrameLayout, PhotoFilter, StickerItem, CapturedPhoto } from '../types';

export interface FourCutPreviewProps {
  photos: CapturedPhoto[];
  theme: FrameTheme;
  layout: FrameLayout;
  filter: PhotoFilter;
  classNameText: string;
  subTitleText: string;
  dateText: string;
  showDate: boolean;
  stickers: StickerItem[];
  onRemoveSticker?: (id: string) => void;
  scale?: number;
}

export interface FourCutPreviewHandle {
  exportToDataUrl: () => Promise<string>;
}

export const FourCutPreview = forwardRef<FourCutPreviewHandle, FourCutPreviewProps>(
  (
    {
      photos,
      theme,
      layout,
      filter,
      classNameText,
      subTitleText,
      dateText,
      showDate,
      stickers,
      onRemoveSticker,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // CSS filter mapping
    const getFilterStyle = (f: PhotoFilter): React.CSSProperties => {
      switch (f) {
        case 'bright':
          return { filter: 'brightness(1.12) contrast(1.05) saturate(1.15)' };
        case 'warm':
          return { filter: 'sepia(0.2) saturate(1.25) contrast(1.03) brightness(1.04)' };
        case 'mono':
          return { filter: 'grayscale(1) contrast(1.15) brightness(1.05)' };
        case 'vintage':
          return { filter: 'sepia(0.35) contrast(0.95) brightness(1.02) hue-rotate(-10deg)' };
        case 'normal':
        default:
          return {};
      }
    };

    // Canvas exporter for high resolution download
    useImperativeHandle(ref, () => ({
      exportToDataUrl: async () => {
        return new Promise<string>((resolve) => {
          const isStrip = layout === 'strip';
          // High resolution dimensions:
          // Strip: 640 x 1920 px (standard 1:3 vertical strip)
          // Grid: 1200 x 1400 px (standard 2x2 photo booth card)
          const targetWidth = isStrip ? 680 : 1200;
          const targetHeight = isStrip ? 1980 : 1380;

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve('');
            return;
          }

          // 1. Draw Background
          ctx.fillStyle = theme.bgColor;
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Subtle decorative border
          ctx.lineWidth = 12;
          ctx.strokeStyle = theme.borderColor;
          ctx.strokeRect(10, 10, targetWidth - 20, targetHeight - 20);

          // 2. Calculate photo rectangles
          const photoPromises = photos.slice(0, 4).map((p) => {
            return new Promise<HTMLImageElement>((imgResolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => imgResolve(img);
              img.onerror = () => imgResolve(img);
              img.src = p.dataUrl;
            });
          });

          Promise.all(photoPromises).then((loadedImages) => {
            // Apply filter on canvas context
            ctx.save();
            if (filter === 'bright') {
              ctx.filter = 'brightness(1.12) contrast(1.05) saturate(1.15)';
            } else if (filter === 'warm') {
              ctx.filter = 'sepia(0.2) saturate(1.25) contrast(1.03) brightness(1.04)';
            } else if (filter === 'mono') {
              ctx.filter = 'grayscale(1) contrast(1.15) brightness(1.05)';
            } else if (filter === 'vintage') {
              ctx.filter = 'sepia(0.35) contrast(0.95) brightness(1.02)';
            }

            if (isStrip) {
              // Vertical 1x4
              const paddingX = 36;
              const paddingTop = 70;
              const photoW = targetWidth - paddingX * 2;
              const photoH = 370;
              const gap = 24;

              loadedImages.forEach((img, idx) => {
                const py = paddingTop + idx * (photoH + gap);

                // Photo shadow/border box
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(paddingX - 4, py - 4, photoW + 8, photoH + 8);

                // Draw cropped image (object-fit: cover)
                drawCoverImage(ctx, img, paddingX, py, photoW, photoH);
              });
            } else {
              // 2x2 Grid
              const paddingX = 44;
              const paddingTop = 80;
              const gap = 24;
              const photoW = (targetWidth - paddingX * 2 - gap) / 2;
              const photoH = 460;

              const slots = [
                { x: paddingX, y: paddingTop },
                { x: paddingX + photoW + gap, y: paddingTop },
                { x: paddingX, y: paddingTop + photoH + gap },
                { x: paddingX + photoW + gap, y: paddingTop + photoH + gap },
              ];

              loadedImages.forEach((img, idx) => {
                if (slots[idx]) {
                  const { x, y } = slots[idx];
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillRect(x - 4, y - 4, photoW + 8, photoH + 8);
                  drawCoverImage(ctx, img, x, y, photoW, photoH);
                }
              });
            }

            ctx.restore(); // restore filter

            // 3. Draw Header and Footer Text & Deco
            ctx.fillStyle = theme.textColor;
            ctx.textAlign = 'center';

            if (isStrip) {
              // Header
              ctx.font = 'bold 36px "OwnglyphYuntaeng", "Jua", sans-serif';
              ctx.fillText(`${theme.headerIcon} ${classNameText}`, targetWidth / 2, 50);

              // Footer
              const footerY = targetHeight - 160;
              ctx.font = 'bold 42px "OwnglyphYuntaeng", "Jua", sans-serif';
              ctx.fillText(classNameText, targetWidth / 2, footerY + 30);

              ctx.font = '30px "OwnglyphYuntaeng", "Jua", sans-serif';
              ctx.fillText(subTitleText, targetWidth / 2, footerY + 70);

              if (showDate && dateText) {
                ctx.font = 'bold 26px "OwnglyphYuntaeng", "Jua", sans-serif';
                ctx.fillStyle = theme.accentColor;
                ctx.fillText(`★ ${dateText} ★`, targetWidth / 2, footerY + 110);
              }

              ctx.font = '26px "OwnglyphYuntaeng", "Jua", sans-serif';
              ctx.fillStyle = theme.textColor;
              ctx.fillText(theme.footerDeco, targetWidth / 2, targetHeight - 25);
            } else {
              // 2x2 Grid Header & Footer
              ctx.font = 'bold 46px "OwnglyphYuntaeng", "Jua", sans-serif';
              ctx.fillText(`${theme.headerIcon} ${classNameText}`, targetWidth / 2, 54);

              const footerY = targetHeight - 170;
              ctx.font = 'bold 50px "OwnglyphYuntaeng", "Jua", sans-serif';
              ctx.fillText(classNameText, targetWidth / 2, footerY + 40);

              ctx.font = '34px "OwnglyphYuntaeng", "Jua", sans-serif';
              ctx.fillText(subTitleText, targetWidth / 2, footerY + 86);

              if (showDate && dateText) {
                ctx.font = 'bold 28px "OwnglyphYuntaeng", "Jua", sans-serif';
                ctx.fillStyle = theme.accentColor;
                ctx.fillText(`★ ${dateText} ★`, targetWidth / 2, footerY + 128);
              }

              ctx.font = '28px "OwnglyphYuntaeng", "Jua", sans-serif';
              ctx.fillStyle = theme.textColor;
              ctx.fillText(theme.footerDeco, targetWidth / 2, targetHeight - 18);
            }

            // 4. Draw Stickers
            stickers.forEach((st) => {
              const sx = (st.x / 100) * targetWidth;
              const sy = (st.y / 100) * targetHeight;
              ctx.save();
              ctx.translate(sx, sy);
              ctx.rotate((st.rotation * Math.PI) / 180);
              ctx.font = `${Math.round(st.size * 2)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(st.emoji, 0, 0);
              ctx.restore();
            });

            resolve(canvas.toDataURL('image/png'));
          });
        });
      },
    }));

    // Helper: draw image with cover aspect ratio
    function drawCoverImage(
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement,
      x: number,
      y: number,
      w: number,
      h: number
    ) {
      if (!img || !img.width) return;
      const imgRatio = img.width / img.height;
      const targetRatio = w / h;
      let sx = 0,
        sy = 0,
        sWidth = img.width,
        sHeight = img.height;

      if (imgRatio > targetRatio) {
        sWidth = img.height * targetRatio;
        sx = (img.width - sWidth) / 2;
      } else {
        sHeight = img.width / targetRatio;
        sy = (img.height - sHeight) / 2;
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
    }

    const isStrip = layout === 'strip';

    return (
      <div
        ref={containerRef}
        id="four-cut-preview-card"
        style={{
          backgroundColor: theme.bgColor,
          borderColor: theme.borderColor,
          color: theme.textColor,
        }}
        className={`relative select-none border-8 shadow-2xl transition-all rounded-3xl overflow-hidden mx-auto ${
          isStrip ? 'w-[280px] sm:w-[320px] p-4 flex flex-col' : 'w-full max-w-[480px] p-5 flex flex-col'
        }`}
      >
        {/* Top Header */}
        <div className="text-center py-2 shrink-0">
          <p className="font-jua text-sm md:text-base font-bold tracking-wide">
            {theme.headerIcon} {classNameText}
          </p>
        </div>

        {/* Photos Layout */}
        <div
          className={`relative ${
            isStrip ? 'flex flex-col gap-2.5 my-1' : 'grid grid-cols-2 gap-2.5 my-2'
          }`}
        >
          {photos.slice(0, 4).map((photo, idx) => (
            <div
              key={photo.id || idx}
              className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white shadow-sm border-2 border-white/80"
            >
              <img
                src={photo.dataUrl}
                alt={`네컷 ${idx + 1}`}
                style={getFilterStyle(filter)}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-1 left-1.5 bg-black/40 text-white font-jua text-[10px] px-1.5 py-0.5 rounded backdrop-blur-xs">
                {idx + 1}
              </span>
            </div>
          ))}

          {/* Stickers overlay */}
          {stickers.map((st) => (
            <div
              key={st.id}
              style={{
                left: `${st.x}%`,
                top: `${st.y}%`,
                transform: `translate(-50%, -50%) rotate(${st.rotation}deg)`,
                fontSize: `${st.size}px`,
              }}
              className="absolute cursor-pointer hover:scale-125 transition-transform z-10 select-none group"
              onClick={() => onRemoveSticker && onRemoveSticker(st.id)}
              title="클릭하여 스티커 지우기"
            >
              {st.emoji}
              <span className="hidden group-hover:block absolute -top-4 -right-3 bg-red-500 text-white text-[9px] rounded-full px-1">
                ✕
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Footer Section */}
        <div className="text-center pt-3 pb-2 mt-auto flex flex-col items-center gap-1 shrink-0">
          <h4 className="font-jua text-base md:text-lg font-bold">
            {classNameText}
          </h4>
          <p className="font-gaegu text-sm opacity-90">{subTitleText}</p>
          {showDate && dateText && (
            <div
              style={{ backgroundColor: theme.badgeBg, color: theme.textColor }}
              className="font-jua text-xs px-3 py-0.5 rounded-full font-bold shadow-xs mt-0.5"
            >
              ★ {dateText} ★
            </div>
          )}
          <p className="font-jua text-[11px] opacity-75 mt-1">
            {theme.footerDeco}
          </p>
        </div>
      </div>
    );
  }
);

FourCutPreview.displayName = 'FourCutPreview';
