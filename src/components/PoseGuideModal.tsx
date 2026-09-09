import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { POSE_RECOMMENDATIONS } from '../data/frames';

interface PoseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PoseGuideModal: React.FC<PoseGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-amber-50 border-4 border-amber-300 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-pop-bounce flex flex-col">
        <div className="bg-amber-300 px-6 py-4 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📸</span>
            <h3 className="text-xl font-bold font-jua text-amber-950">
              우리반 귀여운 포즈 추천 가이드
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/80 hover:bg-white text-amber-950 rounded-full flex items-center justify-center font-bold text-base transition active:scale-95 shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          <p className="text-sm font-gaegu text-amber-900 text-center">
            사진 찍을 때 어떤 포즈를 지을지 고민될 때 친구들과 함께 따라해 보세요! ✨
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {POSE_RECOMMENDATIONS.map((pose) => (
              <div
                key={pose.step}
                className="bg-white border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shadow-inner shrink-0">
                  {pose.emoji}
                </div>
                <div>
                  <span className="text-xs font-jua text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {pose.step}번째 컷 추천
                  </span>
                  <h4 className="font-jua text-base text-slate-800 font-bold mt-1">
                    {pose.title}
                  </h4>
                  <p className="text-xs text-slate-600 font-gaegu mt-0.5">
                    {pose.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-100/70 rounded-2xl p-4 border border-amber-200 text-center">
            <p className="font-jua text-sm text-amber-950">
              💡 팁: 선생님과 친구들이 다 함께 모여 얼굴을 맞대고 찍으면 더욱 귀엽게 나와요!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
