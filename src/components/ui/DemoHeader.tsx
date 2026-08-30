import React, { useState } from 'react';
import { DemoRole } from '../../types';
import { Users, Shield, Building2, RotateCcw, AlertTriangle } from 'lucide-react';

interface DemoHeaderProps {
  currentRole: DemoRole;
  onSelectRole: (role: DemoRole) => void;
  onResetDisplay: () => void;
}

export const DemoHeader: React.FC<DemoHeaderProps> = ({
  currentRole,
  onSelectRole,
  onResetDisplay,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleConfirmReset = () => {
    onResetDisplay();
    setShowConfirmReset(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-md border-b border-slate-800">
      {/* 上部イベント案内バー */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 px-4 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.5 rounded text-[10px]">
            DEMO MODE
          </span>
          <span className="font-medium text-slate-200">
            浜松市デジタル・スマートシティ ソリューションピッチ登壇ソリューション:
          </span>
          <span className="font-bold text-white tracking-wide">
            「RAMP デジタルスキルダッシュボード」
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-slate-300 text-[11px]">
          <span>※ 本システムは架空のモデルケースによる需要検証用プロトタイプです（認証不要）</span>
        </div>
      </div>

      {/* メイン操作バー */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* ロゴとコンセプト */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-lg tracking-tight shadow">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                RAMP デジタルスキルダッシュボード
              </h1>
              <span className="text-[10px] text-slate-400 font-mono border border-slate-700 px-1.5 py-0.2 rounded">
                v1.0-PoC
              </span>
            </div>
            <p className="text-[11px] text-indigo-300">
              就労移行支援における「持続可能な作業周期」と企業要件の双方向接続
            </p>
          </div>
        </div>

        {/* 視点切替スイッチ (3ロール) */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
            視点切替:
          </span>
          <button
            onClick={() => onSelectRole('trainee')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentRole === 'trainee'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>研修生 (Aさん)</span>
          </button>

          <button
            onClick={() => onSelectRole('supporter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentRole === 'supporter'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>支援員 (佐藤)</span>
          </button>

          <button
            onClick={() => onSelectRole('company')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentRole === 'company'
                ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>企業 (来場者様)</span>
          </button>
        </div>

        {/* リセット操作 */}
        <div>
          <button
            onClick={() => setShowConfirmReset(true)}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition"
            title="モデルケースの表示を初期状態に戻します（回収したアンケート等は消えません）"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>表示を初期状態に戻す</span>
          </button>
        </div>
      </div>

      {/* リセット確認モーダル */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-base">デモ表示の初期化確認</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              モデルケースの表示状態と企業要件の選択を初期状態にリセットします。
            </p>
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs mb-5">
              <strong>安心設計:</strong> イベント中に回収した「企業オファー」「業務リクエスト」「アンケート感想」は<strong>削除されず保持</strong>されます。
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition shadow"
              >
                表示を初期化する
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
