import React from 'react';
import { Check, ArrowLeft, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { CapturedPhoto } from '../types';

interface PhotoSelectorProps {
  photos: CapturedPhoto[];
  selectedPhotoIds: string[];
  onToggleSelect: (photo: CapturedPhoto) => void;
  onClearAndSelectFirstFour: () => void;
  onProceed: () => void;
  onBackToCamera: () => void;
}

export const PhotoSelector: React.FC<PhotoSelectorProps> = ({
  photos,
  selectedPhotoIds,
  onToggleSelect,
  onClearAndSelectFirstFour,
  onProceed,
  onBackToCamera,
}) => {
  const selectedCount = selectedPhotoIds.length;
  const isComplete = selectedCount === 4;

  return (
    <div id="photo-selector-root" className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Title & Guidance */}
      <div className="bg-amber-100/90 border-2 border-amber-300 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center text-2xl shadow-inner shrink-0">
            ✨
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-jua text-amber-950">
              찍은 5장 중에서 마음에 드는 4장을 골라주세요!
            </h2>
            <p className="text-sm md:text-base text-amber-800">
              클릭한 순서대로 1번, 2번, 3번, 4번 프레임 칸에 예쁘게 쏙 들어가요.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`px-4 py-2 rounded-2xl font-jua text-sm md:text-base border-2 flex items-center gap-2 shadow-sm ${
              isComplete
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-white text-amber-900 border-amber-300'
            }`}
          >
            <span>선택 완료:</span>
            <span className="text-lg font-bold">
              {selectedCount} / 4장
            </span>
          </div>
        </div>
      </div>

      {/* 5 Photos Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
        {photos.map((photo, index) => {
          const selectionOrder = selectedPhotoIds.indexOf(photo.id);
          const isSelected = selectionOrder !== -1;

          return (
            <div
              key={photo.id}
              onClick={() => onToggleSelect(photo)}
              className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all transform active:scale-95 border-4 ${
                isSelected
                  ? 'border-amber-500 ring-4 ring-amber-300/60 shadow-lg scale-102'
                  : 'border-white hover:border-amber-200 opacity-80 hover:opacity-100 shadow'
              }`}
            >
              <img
                src={photo.dataUrl}
                alt={`촬영컷 ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Original Shot Label */}
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-md font-jua backdrop-blur-xs">
                촬영 #{index + 1}
              </div>

              {/* Selection Badge with Order Number */}
              {isSelected ? (
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-jua text-lg font-bold shadow-md border-2 border-white animate-pop-bounce">
                  {selectionOrder + 1}
                </div>
              ) : (
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/70 hover:bg-white text-slate-400 flex items-center justify-center font-jua text-sm border-2 border-slate-300">
                  +
                </div>
              )}

              {/* Bottom selection indicator */}
              <div
                className={`absolute inset-x-0 bottom-0 py-1.5 text-center text-xs font-jua transition-colors ${
                  isSelected
                    ? 'bg-amber-500 text-white'
                    : 'bg-black/50 text-white/90'
                }`}
              >
                {isSelected ? `네컷 ${selectionOrder + 1}번째 사진` : '터치하여 선택'}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4 Selected Slots Preview */}
      <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖼️</span>
            <h3 className="font-jua text-lg text-slate-800">
              네컷 프레임에 들어갈 4장 순서 미리보기
            </h3>
          </div>
          <button
            onClick={onClearAndSelectFirstFour}
            className="text-xs font-jua text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>앞에서부터 4장 자동선택</span>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((slotIdx) => {
            const photoId = selectedPhotoIds[slotIdx];
            const photo = photos.find((p) => p.id === photoId);

            return (
              <div
                key={slotIdx}
                className={`aspect-[3/4] rounded-2xl border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                  photo
                    ? 'border-amber-400 bg-amber-50 shadow-sm'
                    : 'border-dashed border-slate-300 bg-slate-50'
                }`}
              >
                {photo ? (
                  <>
                    <img
                      src={photo.dataUrl}
                      alt={`슬롯 ${slotIdx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-xs font-bold font-jua w-6 h-6 rounded-full flex items-center justify-center border border-white shadow">
                      {slotIdx + 1}
                    </span>
                    <button
                      onClick={() => onToggleSelect(photo)}
                      title="선택 해제"
                      className="absolute bottom-1.5 right-1.5 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full text-xs shadow"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <span className="block font-jua text-base text-slate-400 font-bold mb-1">
                      {slotIdx + 1}번 칸
                    </span>
                    <span className="text-xs text-slate-400 font-gaegu">
                      위에서 사진을 터치하세요
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          id="btn-back-to-camera"
          onClick={onBackToCamera}
          className="px-6 py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-2xl font-jua text-base flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>다시 촬영하기</span>
        </button>

        <button
          id="btn-proceed-to-frame"
          disabled={!isComplete}
          onClick={onProceed}
          className={`px-8 py-3.5 rounded-2xl font-jua text-base md:text-lg flex items-center gap-2 shadow-md transition cursor-pointer ${
            isComplete
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-amber-300/40 active:scale-95 border-2 border-amber-300 animate-bounce'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-300'
          }`}
        >
          <Check className="w-5 h-5" />
          <span>프레임 선택 및 꾸미기 🎨</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
