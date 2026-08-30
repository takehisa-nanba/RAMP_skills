import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Download, Trash2, ArrowRight, RotateCcw, Lock } from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { CollectionPhase } from '../../types';

interface PhaseManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhaseChange?: () => void;
}

export const PhaseManagementModal: React.FC<PhaseManagementModalProps> = ({
  isOpen,
  onClose,
  onPhaseChange,
}) => {
  const [currentPhase, setCurrentPhase] = useState<CollectionPhase>({
    id: '',
    mode: 'verification',
    startedAt: '',
  });
  const [verificationCounts, setVerificationCounts] = useState({
    offers: 0,
    skillRequests: 0,
    feedbacks: 0,
    responses: 0,
    customReqs: 0,
    practices: 0,
    total: 0,
  });
  const [eventCounts, setEventCounts] = useState({
    offers: 0,
    skillRequests: 0,
    feedbacks: 0,
    responses: 0,
    customReqs: 0,
    practices: 0,
    total: 0,
  });
  const [purgeConfirmChecked, setPurgeConfirmChecked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const refreshData = () => {
    if (typeof window === 'undefined') return;
    const phase = StorageService.getCurrentCollectionPhase();
    setCurrentPhase(phase);
    setVerificationCounts(StorageService.getVerificationDataCounts());
    setEventCounts(StorageService.getEventDataCounts());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setPurgeConfirmChecked(false);
      setPasswordInput('');
      setPasswordError(false);
    }
  }, [isOpen]);

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // パスワード認証チェック（設定パスワード: password123ramp）
  const verifyPassword = (): boolean => {
    const input = passwordInput.trim();
    if (input === 'password123ramp') {
      setPasswordError(false);
      return true;
    }
    setPasswordError(true);
    return false;
  };

  // 1. 検証データを消去して本番開始
  const handlePurgeAndStartEvent = () => {
    if (!verifyPassword()) return;
    const res = StorageService.purgeVerificationDataAndStartEvent();
    if (res.success) {
      refreshData();
      showToast('✅ パスワード認証成功：検証データを消去し、本番モードを開始しました！');
      onPhaseChange?.();
      setTimeout(() => onClose(), 1200);
    } else {
      alert(`エラー: ${res.error}`);
    }
  };

  // 2. 検証データを残したまま本番開始
  const handleStartEventDirectly = () => {
    if (!verifyPassword()) return;
    StorageService.startEventCollectionPhaseDirectly();
    refreshData();
    showToast('✅ パスワード認証成功：イベント本番モードを開始しました');
    onPhaseChange?.();
    setTimeout(() => onClose(), 1200);
  };

  // 3. リハーサル検証モードに戻す
  const handleReturnToVerification = () => {
    if (!verifyPassword()) return;
    StorageService.startVerificationCollectionPhase();
    refreshData();
    showToast('🧪 パスワード認証成功：リハーサル検証モードへ切り替えました');
    onPhaseChange?.();
    setTimeout(() => onClose(), 1200);
  };

  // 4. CSVエクスポート（要管理者パスワード）
  const handleExportCsv = () => {
    if (!verifyPassword()) return;
    StorageService.exportVerificationDataToCsv(true);
    showToast('📥 パスワード認証成功：イベント本番データをCSV出力しました');
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-slate-200 text-slate-900 space-y-5 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 右上閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition font-bold text-sm"
          title="閉じる"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ヘッダー領域 */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full inline-block">
              運用フェーズ切り替え
            </span>
            <span className="text-xs text-slate-500 font-medium">（リハーサル ⇔ 本番）</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            リハーサルと本番の切り替え
          </h2>
          <p className="text-xs text-slate-600 font-normal">
            当日のイベント本番と、事前の動作確認・リハーサルを安全に切り替えます。
          </p>
        </div>

        {toastMsg && (
          <div className="bg-teal-700 text-white p-3 rounded-xl shadow-lg text-xs font-bold animate-fadeIn">
            {toastMsg}
          </div>
        )}

        {/* 現在のモードステータスカード */}
        <div
          className={`p-4 rounded-2xl border-2 transition ${
            currentPhase.mode === 'event'
              ? 'bg-teal-50/80 border-teal-500 text-teal-950'
              : 'bg-amber-50/80 border-amber-400 text-amber-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  currentPhase.mode === 'event'
                    ? 'bg-teal-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              ></span>
              <span className="text-xs font-bold text-slate-600">現在の稼働モード:</span>
              <strong className="text-sm sm:text-base font-bold">
                {currentPhase.mode === 'event'
                  ? '🟢 イベント本番収集モード'
                  : '🧪 リハーサル・事前検証モード'}
              </strong>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/80 border border-slate-300">
              {currentPhase.mode === 'event' ? '本番稼働中' : '検証中'}
            </span>
          </div>

          <p className="text-xs text-slate-600 mt-2 font-normal leading-relaxed">
            {currentPhase.mode === 'event'
              ? '現在、来場企業によるオファーやアンケートの回答を「本番データ」として保護・蓄積しています。'
              : '現在、動作確認やプレゼンリハーサルの入力を行えます。ここで登録した検証データは本番開始時に一括削除できます。'}
          </p>
        </div>

        {/* データ件数の状況サマリー */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-800 pb-1.5 border-b border-slate-200">
            <span>現在のデータ蓄積状況</span>
            <span className="text-[11px] text-slate-500 font-normal">
              （架空のモデルケース・デモシードは常に保護）
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-500 font-medium">🧪 リハーサル検証データ</div>
              <div className="text-lg font-bold text-slate-900">
                {verificationCounts.total} <span className="text-xs font-normal text-slate-500">件</span>
              </div>
              <div className="text-[10px] text-slate-500">
                オファー:{verificationCounts.offers} / アンケート:{verificationCounts.feedbacks}
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-500 font-medium">🟢 イベント本番データ</div>
              <div className="text-lg font-bold text-teal-700">
                {eventCounts.total} <span className="text-xs font-normal text-slate-500">件</span>
              </div>
              <div className="text-[10px] text-slate-500">
                オファー:{eventCounts.offers} / アンケート:{eventCounts.feedbacks}
              </div>
            </div>
          </div>
        </div>

        {/* 管理者パスワードロック入力フィールド */}
        <div className="bg-slate-50 border border-slate-300/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-600" />
              <span>管理者パスワード（来場者・誤操作防止ロック）</span>
            </label>
            <span className="text-[10px] text-slate-500 font-medium">※運営管理者専用</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError(false);
              }}
              placeholder="管理者パスワードを入力してください"
              className={`flex-1 px-3 py-2 border rounded-xl text-xs bg-white ${
                passwordError
                  ? 'border-rose-500 bg-rose-50/50 text-rose-900 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-teal-500 focus:ring-teal-200'
              }`}
            />
          </div>
          {passwordError && (
            <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>パスワードが正しくありません。管理者用パスワードを入力してください。</span>
            </p>
          )}
        </div>

        {/* ============================================================ */}
        {/* モード別のアクション切り替えエリア */}
        {/* ============================================================ */}
        {currentPhase.mode === 'verification' ? (
          <div className="space-y-3.5 pt-1">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-teal-600" />
              <span>本番イベントを開始する:</span>
            </div>

            {/* プランA（推奨）: 検証データを削除して本番開始 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div>
                <strong className="text-xs font-bold text-slate-900 block">
                  【推奨】リハーサル検証データを消去して本番を開始
                </strong>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  事前に入力した検証データ（{verificationCounts.total}件）を一括クリアし、クリーンな状態でイベント本番を開始します。
                </p>
              </div>

              <label className="flex items-start gap-2 text-xs text-slate-800 cursor-pointer font-medium bg-white p-2.5 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={purgeConfirmChecked}
                  onChange={(e) => setPurgeConfirmChecked(e.target.checked)}
                  className="mt-0.5"
                />
                <span>リハーサル検証データを消去し、本番収集を開始することに同意する</span>
              </label>

              <button
                type="button"
                onClick={handlePurgeAndStartEvent}
                disabled={!purgeConfirmChecked || !passwordInput.trim()}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>パスコード認証してイベント本番を開始</span>
              </button>
            </div>

            {/* プランB: そのまま本番開始 */}
            <div className="flex justify-between items-center px-1">
              <span className="text-[11px] text-slate-500">
                ※検証データを残したまま本番を開始したい場合:
              </span>
              <button
                type="button"
                onClick={handleStartEventDirectly}
                disabled={!passwordInput.trim()}
                className="text-xs text-teal-700 hover:text-teal-900 font-bold hover:underline disabled:text-slate-300 disabled:no-underline"
              >
                データを残して本番モードへ切替 →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-teal-600" />
              <span>本番中の操作・リハーサルへの復帰:</span>
            </div>

            {/* 本番データCSVエクスポート */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div>
                <strong className="text-xs font-bold text-slate-900 block">
                  来場企業データのCSVエクスポート（要パスワード）
                </strong>
                <span className="text-[11px] text-slate-500">
                  本番中に回収されたデータ（{eventCounts.total}件）をCSVダウンロード
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!passwordInput.trim()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV出力</span>
              </button>
            </div>

            {/* リハーサル検証モードに戻すボタン */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div>
                <strong className="text-xs font-bold text-amber-950 block">
                  リハーサル検証モードに戻す（要パスコード）
                </strong>
                <span className="text-[11px] text-amber-800">
                  再度プレゼン練習や動作確認を行いたい場合にいつでも戻せます
                </span>
              </div>
              <button
                type="button"
                onClick={handleReturnToVerification}
                disabled={!passwordInput.trim()}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>リハーサルへ戻す</span>
              </button>
            </div>
          </div>
        )}

        {/* フッター */}
        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
