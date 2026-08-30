import React, { useEffect } from 'react';
import { X, ShieldCheck, Cpu, Building } from 'lucide-react';

interface AboutSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutSystemModal: React.FC<AboutSystemModalProps> = ({ isOpen, onClose }) => {
  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-2 border-slate-200 text-slate-900 space-y-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 右上閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition font-bold text-sm"
          title="閉じる (ESC)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* タイトル領域 */}
        <div className="space-y-1 pr-8">
          <span className="text-xs font-black text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full inline-block">
            システムコンセプト
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            人を仕事に合わせるのではなく、
            <br />
            人と仕事がつながる条件で探す
          </h2>
        </div>

        {/* 本文説明 */}
        <div className="text-sm sm:text-base text-slate-600 leading-relaxed space-y-2.5 font-medium">
          <p>
            本システムは、採用の合否判定や自動マッチングを行うものではありません。
          </p>
          <p>
            就労移行支援の現場で観測された、本人が安定して力を発揮できる<strong>「持続可能な作業周期（集中作業＋回復）」</strong>と、企業の具体的な業務要件の双方を同一スケールで可視化し、安定して就労できる条件を事前に合意するための<strong>「働き方の設計図」</strong>です。
          </p>
        </div>

        {/* 3つの安心・信頼注記カード */}
        <div className="grid grid-cols-1 gap-2.5 pt-1">
          <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl flex items-start gap-2.5 text-xs text-purple-950">
            <Building className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-purple-900">浜松市デジタル・スマートシティ ソリューションピッチ登壇プロトタイプ</strong>
              <span>行政・地域企業との実証実験に向けて設計されたデモ展示用システムです。</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-950">
            <ShieldCheck className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-blue-900">実在人物の情報は含みません</strong>
              <span>掲載されているデータは、就労移行支援の実際の現場知見に基づき構築された架空のモデルケースです。</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
            <Cpu className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-emerald-900">完全オフライン・安全設計</strong>
              <span>外部サーバーへの通信を行わず、ブラウザ内（ローカルストレージ）でのみ安全に動作します。</span>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
