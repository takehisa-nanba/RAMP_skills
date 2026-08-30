import React, { useState } from 'react';
import { DemoRole } from '../../types';
import { Building2, Users, Shield, RotateCcw, Info } from 'lucide-react';
import { AboutSystemModal } from '../modals/AboutSystemModal';

interface SlimHeaderProps {
  currentRole: DemoRole;
  onSelectRole: (role: DemoRole) => void;
  onResetDisplay: () => void;
  onReturnToStart?: () => void;
}

export const SlimHeader: React.FC<SlimHeaderProps> = ({
  currentRole,
  onSelectRole,
  onResetDisplay,
  onReturnToStart,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const roleLabels: Record<DemoRole, { label: string; icon: any; color: string }> = {
    company: { label: '企業視点', icon: Building2, color: 'text-purple-400 bg-purple-950/60 border-purple-800' },
    trainee: { label: '研修生視点 (Aさん)', icon: Users, color: 'text-blue-400 bg-blue-950/60 border-blue-800' },
    supporter: { label: '支援員視点 (佐藤)', icon: Shield, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' },
  };

  const handleLogoClick = () => {
    if (onReturnToStart) {
      onReturnToStart();
    } else {
      onResetDisplay();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white h-12 flex items-center px-4 shadow-sm select-none">
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        {/* 左: ロゴ & タイトル (クリックでデモ開始画面に戻るだけ・保存データ不変) */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition"
          title="クリックでデモ開始画面（STEP 0）に戻る（保存データは保持されます）"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm shadow">
            R
          </div>
          <span className="font-bold text-sm text-slate-100 tracking-tight">
            RAMP デジタルスキルダッシュボード
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 rounded border border-slate-700">
            DEMO
          </span>
        </div>

        {/* 右: 視点切替（3つ横並び） & デモメニュー */}
        <div className="flex items-center gap-2.5">
          {/* 視点切替 3つ横並びボタングループ */}
          <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80">
            {(['company', 'trainee', 'supporter'] as const).map((r) => {
              const Icon = roleLabels[r].icon;
              const isActive = currentRole === r;
              return (
                <button
                  key={r}
                  onClick={() => onSelectRole(r)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    isActive
                      ? r === 'company'
                        ? 'bg-purple-700 text-white shadow-sm'
                        : r === 'trainee'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{roleLabels[r].label}</span>
                </button>
              );
            })}
          </div>

          {/* デモメニュー */}
          <div className="relative">
            <button
              onClick={() => {
                setShowMenu(!showMenu);
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition text-xs"
              title="メニュー"
            >
              <span className="text-xs px-1">⚙️ メニュー</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1.5 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn text-xs">
                <button
                  onClick={() => {
                    setShowAboutModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>このシステムについて</span>
                </button>
                <button
                  onClick={() => {
                    setShowResetConfirm(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>表示を初期状態に戻す</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* このシステムについてモーダル（共通コンポーネント） */}
      <AboutSystemModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      {/* リセット確認モーダル */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-slate-900 animate-fadeIn"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-200 text-xs space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                システム全リセット
              </span>
              <h3 className="font-bold text-base text-slate-900">初期シード状態へ完全リセット</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              登録した自社業務、研修生の実践記録、カルテの更新履歴、届いたオファー等の全データを初期シードデータへ完全復元します。
            </p>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  onResetDisplay();
                  setShowResetConfirm(false);
                }}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl shadow transition"
              >
                初期状態に戻す
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
