import React, { useState } from 'react';
import { DemoRole } from '../../types';
import { Building2, Users, Shield, RotateCcw, Info, ChevronDown } from 'lucide-react';

interface SlimHeaderProps {
  currentRole: DemoRole;
  onSelectRole: (role: DemoRole) => void;
  onResetDisplay: () => void;
}

export const SlimHeader: React.FC<SlimHeaderProps> = ({
  currentRole,
  onSelectRole,
  onResetDisplay,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const roleLabels: Record<DemoRole, { label: string; icon: any; color: string }> = {
    company: { label: '企業視点', icon: Building2, color: 'text-purple-400 bg-purple-950/60 border-purple-800' },
    trainee: { label: '研修生視点 (Aさん)', icon: Users, color: 'text-blue-400 bg-blue-950/60 border-blue-800' },
    supporter: { label: '支援員視点 (佐藤)', icon: Shield, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' },
  };

  const CurrentRoleIcon = roleLabels[currentRole].icon;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white h-12 flex items-center px-4 shadow-sm select-none">
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        {/* 左: ロゴ & タイトル (クリックでメイン画面に戻る) */}
        <div
          onClick={onResetDisplay}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition"
          title="クリックでメイン画面（初期表示）に戻る"
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

        {/* 右: 視点切替 & デモメニュー */}
        <div className="flex items-center gap-2">
          {/* 視点切替コンパクトドロップダウン */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowMenu(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${roleLabels[currentRole].color}`}
            >
              <CurrentRoleIcon className="w-3.5 h-3.5" />
              <span>{roleLabels[currentRole].label}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-1.5 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50 animate-fadeIn text-xs">
                {(['company', 'trainee', 'supporter'] as const).map((r) => {
                  const Icon = roleLabels[r].icon;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        onSelectRole(r);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 transition ${
                        currentRole === r
                          ? 'bg-slate-700 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{roleLabels[r].label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* デモメニュー */}
          <div className="relative">
            <button
              onClick={() => {
                setShowMenu(!showMenu);
                setShowRoleMenu(false);
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

      {/* このシステムについてモーダル */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-3">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-200 pb-2">
              人を仕事に合わせるのではなく、人と仕事がつながる条件を探す
            </h3>
            <p className="text-slate-600 leading-relaxed">
              本システムは、研修生の弱点や能力の不足を一方的に測定するものではありません。
              本人が安定して力を発揮できる「持続可能な作業周期（集中＋回復）」と、企業の具体的な業務要件の双方を可視化し、接続できる条件を対話するための「働き方の設計図」です。
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div>・浜松市デジタル・スマートシティ ソリューションピッチ登壇プロトタイプ</div>
              <div>・実在人物の情報は含まず、架空のモデルケースによるデモ用データです</div>
              <div>・外部通信を行わない完全オフライン設計です</div>
            </div>
            <div className="text-right pt-2">
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* リセット確認モーダル */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">表示状態の初期化</h3>
            <p className="text-slate-600 leading-relaxed">
              業務の選択や表示状態を初期状態に戻します。
              <br />
              ※ 来場者が入力したオファーやアンケートデータは保護され、削除されません。
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  onResetDisplay();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg"
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
