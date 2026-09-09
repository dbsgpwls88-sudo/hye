import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, Sparkles, BookOpen, Volume2, VolumeX, Lightbulb, Heart, ExternalLink } from 'lucide-react';
import { AppStep, CapturedPhoto } from './types';
import { CameraCapture } from './components/CameraCapture';
import { PhotoSelector } from './components/PhotoSelector';
import { FrameCustomizer } from './components/FrameCustomizer';
import { SavedGalleryModal } from './components/SavedGalleryModal';
import { PoseGuideModal } from './components/PoseGuideModal';
import { getClassInfo, saveClassInfo } from './utils/storage';

export default function App() {
  const [step, setStep] = useState<AppStep>('camera');
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return getClassInfo().soundEnabled;
  });

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isPoseGuideOpen, setIsPoseGuideOpen] = useState(false);

  // Sound toggle with cache persistence
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    saveClassInfo({ soundEnabled: next });
  };

  // When 5 photos are taken in Camera step
  const handlePhotosComplete = (photos: CapturedPhoto[]) => {
    setCapturedPhotos(photos);
    // By default, auto-select first 4 photos for quick flow, but let user pick freely
    setSelectedPhotoIds(photos.slice(0, 4).map((p) => p.id));
    setStep('select');
  };

  // Toggle photo selection in PhotoSelector
  const handleToggleSelect = (photo: CapturedPhoto) => {
    setSelectedPhotoIds((prev) => {
      if (prev.includes(photo.id)) {
        // Deselect
        return prev.filter((id) => id !== photo.id);
      } else {
        // Select if under 4
        if (prev.length < 4) {
          return [...prev, photo.id];
        } else {
          // Replace last one or alert user
          return [...prev.slice(0, 3), photo.id];
        }
      }
    });
  };

  // Select first 4 photos helper
  const handleSelectFirstFour = () => {
    setSelectedPhotoIds(capturedPhotos.slice(0, 4).map((p) => p.id));
  };

  // Filter selected photos objects in selected order
  const selectedPhotos = selectedPhotoIds
    .map((id) => capturedPhotos.find((p) => p.id === id))
    .filter((p): p is CapturedPhoto => Boolean(p));

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/40 to-yellow-50 text-slate-800 flex flex-col font-yuntaeng">
      {/* Top Kindergarten App Header */}
      <header className="bg-white/85 backdrop-blur-md border-b-2 border-amber-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div
            onClick={() => setStep('camera')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-400 group-hover:bg-amber-300 flex items-center justify-center text-2xl shadow-sm transition transform group-hover:scale-105">
              🐥
            </div>
            <div>
              <h1 className="font-jua text-xl md:text-2xl text-amber-950 font-bold tracking-tight">
                우리반 네컷
              </h1>
              <span className="text-[11px] text-amber-700/80 font-gaegu block -mt-1">
                유치원 친구들을 위한 귀여운 4컷 사진관 📸
              </span>
            </div>
          </div>

          {/* Quick Nav Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPoseGuideOpen(true)}
              className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-2xl font-jua text-xs md:text-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="포즈 아이디어 보기"
            >
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">포즈 추천</span>
            </button>

            <button
              onClick={() => setIsGalleryOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-950 border border-amber-300 rounded-2xl font-jua text-xs md:text-sm flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>추억 앨범</span>
            </button>

            <button
              onClick={() => window.open(window.location.href, '_blank')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-2xl font-jua text-xs md:text-sm transition active:scale-95 shadow-xs cursor-pointer"
              title="새 창에서 열기 (카메라 권한 팝업이 바로 뜹니다)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
              <span>새 창에서 카메라 열기</span>
            </button>

            <button
              onClick={handleToggleSound}
              className="p-2 bg-white hover:bg-slate-50 border border-amber-200 rounded-2xl text-slate-600 transition active:scale-95 shadow-xs"
              title="소리 설정"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Step Progression Tabs */}
        <div className="max-w-xl mx-auto px-4 pb-2.5">
          <div className="grid grid-cols-3 gap-1 bg-amber-100/70 p-1 rounded-2xl border border-amber-200 text-center font-jua text-xs md:text-sm">
            <button
              onClick={() => setStep('camera')}
              className={`py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                step === 'camera'
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                  : 'text-amber-800 hover:bg-amber-200/50'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>1. 5장 촬영 (3,2,1)</span>
            </button>

            <button
              disabled={capturedPhotos.length === 0}
              onClick={() => setStep('select')}
              className={`py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${
                step === 'select'
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-bold cursor-pointer'
                  : capturedPhotos.length > 0
                  ? 'text-amber-800 hover:bg-amber-200/50 cursor-pointer'
                  : 'text-amber-400/50 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>2. 4장 선택</span>
            </button>

            <button
              disabled={selectedPhotoIds.length !== 4}
              onClick={() => setStep('customize')}
              className={`py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${
                step === 'customize'
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-bold cursor-pointer'
                  : selectedPhotoIds.length === 4
                  ? 'text-amber-800 hover:bg-amber-200/50 cursor-pointer'
                  : 'text-amber-400/50 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3. 프레임 꾸미기</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8">
        {step === 'camera' && (
          <CameraCapture
            onPhotosComplete={handlePhotosComplete}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />
        )}

        {step === 'select' && (
          <PhotoSelector
            photos={capturedPhotos}
            selectedPhotoIds={selectedPhotoIds}
            onToggleSelect={handleToggleSelect}
            onClearAndSelectFirstFour={handleSelectFirstFour}
            onProceed={() => setStep('customize')}
            onBackToCamera={() => setStep('camera')}
          />
        )}

        {step === 'customize' && (
          <FrameCustomizer
            selectedPhotos={selectedPhotos}
            onBackToSelect={() => setStep('select')}
            onRetakeAll={() => {
              setCapturedPhotos([]);
              setSelectedPhotoIds([]);
              setStep('camera');
            }}
            soundEnabled={soundEnabled}
            onOpenGallery={() => setIsGalleryOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/60 border-t border-amber-200 py-4 px-4 text-center text-xs font-gaegu text-amber-800">
        <div className="flex items-center justify-center gap-1.5">
          <span>🐥 유치원 어린이들과 함께하는 행복한 네컷 사진관</span>
          <span>•</span>
          <span className="flex items-center gap-0.5">
            사랑으로 만든 추억 <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
          </span>
        </div>
      </footer>

      {/* Modals */}
      <SavedGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />

      <PoseGuideModal
        isOpen={isPoseGuideOpen}
        onClose={() => setIsPoseGuideOpen(false)}
      />
    </div>
  );
}
