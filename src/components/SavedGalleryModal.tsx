import React, { useState, useEffect } from 'react';
import { X, Download, Trash2, Printer, Calendar, Heart, Image as ImageIcon } from 'lucide-react';
import { SavedFourCut } from '../types';
import { getSavedFourCuts, deleteSavedFourCut } from '../utils/storage';

interface SavedGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavedGalleryModal: React.FC<SavedGalleryModalProps> = ({ isOpen, onClose }) => {
  const [savedItems, setSavedItems] = useState<SavedFourCut[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<SavedFourCut | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const items = await getSavedFourCuts();
      setSavedItems(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 네컷 사진을 앨범에서 삭제할까요?')) {
      await deleteSavedFourCut(id);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      loadData();
    }
  };

  const handleDownload = (item: SavedFourCut, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = document.createElement('a');
    link.href = item.imageDataUrl;
    link.download = `${item.title.replace(/\s+/g, '_')}_네컷사진.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = (item: SavedFourCut, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${item.title}</title>
          <style>
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background-color: white;
            }
            img {
              max-height: 95vh;
              max-width: 95vw;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${item.imageDataUrl}" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-amber-50 border-4 border-amber-300 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-pop-bounce">
        {/* Modal Header */}
        <div className="bg-amber-300 px-6 py-4 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <h3 className="text-xl md:text-2xl font-bold font-jua text-amber-950">
              우리반 네컷 추억 앨범 ({savedItems.length}장)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-white/80 hover:bg-white text-amber-950 rounded-full flex items-center justify-center font-bold text-lg transition active:scale-95 shadow-xs cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-16 font-jua text-amber-800">
              추억 앨범을 불러오는 중입니다...
            </div>
          ) : savedItems.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center text-3xl">
                📷
              </div>
              <p className="font-jua text-xl text-amber-900">
                아직 저장된 네컷 사진이 없어요!
              </p>
              <p className="text-sm text-amber-700">
                사진을 찍고 프레임을 완성한 뒤 &apos;우리반 앨범에 저장&apos;을 눌러보세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {savedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group bg-white border-2 border-amber-200 hover:border-amber-400 rounded-2xl p-2.5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col"
                >
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 mb-2 relative">
                    <img
                      src={item.imageDataUrl}
                      alt={item.title}
                      className="w-full h-full object-contain bg-slate-50"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="bg-white/90 text-slate-800 text-xs font-jua px-3 py-1.5 rounded-full shadow">
                        크게 보기 🔍
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-jua text-amber-950">
                    <span className="truncate font-bold">{item.title}</span>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="사진 삭제"
                      className="text-slate-400 hover:text-red-500 p-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 font-gaegu flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-amber-500" />
                    <span>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Item Full Preview Modal layer */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-3xl p-4 md:p-6 max-w-lg w-full max-h-[92vh] flex flex-col items-center gap-4 relative animate-pop-bounce">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full flex items-center justify-center text-lg"
              >
                ✕
              </button>

              <h4 className="font-jua text-xl text-slate-800">
                {selectedItem.title}
              </h4>

              <div className="max-h-[60vh] overflow-auto rounded-2xl border border-slate-200 p-1 bg-slate-50">
                <img
                  src={selectedItem.imageDataUrl}
                  alt={selectedItem.title}
                  className="max-h-[56vh] object-contain rounded-xl"
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                <button
                  onClick={() => handleDownload(selectedItem)}
                  className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-jua rounded-2xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>다운로드</span>
                </button>
                <button
                  onClick={() => handlePrint(selectedItem)}
                  className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 text-white font-jua rounded-2xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>인쇄하기</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
