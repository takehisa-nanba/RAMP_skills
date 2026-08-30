import React, { useState } from 'react';
import { TraineeProfile, Offer, SkillRequest, FeedbackSurvey } from '../../types';
import { StorageService } from '../../lib/storage';
import { RUBRIC_AXES } from '../../data/seed';
import {
  Users,
  Download,
  Trash2,
  Edit,
  Mail,
  HelpCircle,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface SupporterViewProps {
  trainees: TraineeProfile[];
  offers: Offer[];
  skillRequests: SkillRequest[];
  feedbacks: FeedbackSurvey[];
  onDataChange: () => void;
}

export const SupporterView: React.FC<SupporterViewProps> = ({
  trainees,
  offers,
  skillRequests,
  feedbacks,
  onDataChange,
}) => {
  const [activeTab, setActiveTab] = useState<'trainees' | 'verification'>('trainees');
  const [selectedTrainee, setSelectedTrainee] = useState<TraineeProfile | null>(null);
  const [editingScores, setEditingScores] = useState<Record<string, number>>({});
  const [editingSummary, setEditingSummary] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleOpenEdit = (trainee: TraineeProfile) => {
    setSelectedTrainee(trainee);
    const scoreMap: Record<string, number> = {};
    RUBRIC_AXES.forEach((axis) => {
      const milestone = trainee.evaluations.find(
        (e) => e.skillId === axis.id && e.type === 'monthly_milestone'
      );
      scoreMap[axis.id] = milestone ? milestone.score : 3;
    });
    setEditingScores(scoreMap);
    setEditingSummary(trainee.publicSummary.strengths);
  };

  const handleSaveMilestone = () => {
    if (!selectedTrainee) return;

    const now = new Date().toISOString();
    // 6軸の合意到達点レコードを追記保存（履歴保持）
    RUBRIC_AXES.forEach((axis) => {
      StorageService.addEvaluation(selectedTrainee.id, {
        id: `milestone-${Date.now()}-${axis.id}`,
        traineeId: selectedTrainee.id,
        skillId: axis.id,
        type: 'monthly_milestone',
        score: editingScores[axis.id] || 3,
        comment: `月1面談での到達点合意`,
        evaluatorName: '支援員: 佐藤 (本人合意)',
        evaluatedAt: now,
        targetPeriod: '2026-08',
      });
    });

    // 研修生プロファイルの更新
    const all = StorageService.getTrainees();
    const updated = all.map((t) => {
      if (t.id === selectedTrainee.id) {
        return {
          ...t,
          publicSummary: {
            ...t.publicSummary,
            strengths: editingSummary,
            consentedAt: now.slice(0, 10),
          },
        };
      }
      return t;
    });
    StorageService.saveTrainees(updated);

    setSelectedTrainee(null);
    onDataChange();
    showToast('月1面談の合意到達点と企業向けサマリーを更新・保存しました！');
  };

  const handleExportCsv = () => {
    StorageService.exportVerificationDataToCsv();
    onDataChange();
    showToast('需要検証データをCSV出力しました！（ダウンロードフォルダをご確認ください）');
  };

  const handleClearVerificationData = () => {
    if (!StorageService.isCsvExported()) {
      alert('安全保護のため、先に【CSVエクスポート】を実行してから削除してください。');
      return;
    }
    StorageService.clearVerificationData();
    setShowClearConfirm(false);
    onDataChange();
    showToast('需要検証データを安全にクリアしました。');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* デモ注記バナー */}
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
            支援員視点
          </span>
          <span className="font-semibold">
            担当支援員: 佐藤（RAMP就労移行支援事業所）
          </span>
        </div>
        <div className="text-slate-500">
          研修生の作業周期の把握、月次面談到達点の合意、および企業の需要検証データ管理を行います。
        </div>
      </div>

      {toastMsg && (
        <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg text-xs font-semibold animate-fadeIn">
          {toastMsg}
        </div>
      )}

      {/* タブナビゲーション */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('trainees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'trainees'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>担当研修生カルテ・到達点整理 ({trainees.length}名)</span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'verification'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>需要検証データ管理・CSV出力 ({offers.length + skillRequests.length + feedbacks.length}件)</span>
        </button>
      </div>

      {/* タブ1: 研修生一覧カルテ */}
      {activeTab === 'trainees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {trainees.map((trainee) => (
            <div
              key={trainee.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${trainee.avatarBg} text-white font-bold flex items-center justify-center text-sm shadow`}
                    >
                      {trainee.codeName.slice(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{trainee.codeName}</h3>
                      <p className="text-[11px] text-slate-500">{trainee.targetJob}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(trainee)}
                    className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>月次到達点の整理</span>
                  </button>
                </div>

                {/* 就労希望条件 */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-3 text-xs flex justify-between text-slate-700">
                  <span>
                    <strong>就労条件: </strong>
                    {trainee.desiredWorkCondition.daysPerWeek} ({trainee.desiredWorkCondition.hoursPerDay})
                  </span>
                  <span className="text-slate-500">{trainee.desiredWorkCondition.workStyle}</span>
                </div>

                {/* 持続可能な作業周期 */}
                {trainee.workCycles[0] && (
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl mb-3 text-xs">
                    <span className="font-bold text-emerald-900 block text-[11px] mb-1">
                      ⏱️ 観測された作業周期（デモ用想定値）:
                    </span>
                    <div className="flex items-center gap-2 text-slate-800">
                      <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold">
                        作業 {trainee.workCycles[0].workDurationMinutes}分
                      </span>
                      <span>+</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-sky-300 font-bold text-sky-800">
                        回復 {trainee.workCycles[0].recoveryDurationMinutes}分
                      </span>
                      <span>➔</span>
                      <span className="font-semibold text-slate-700">
                        {trainee.workCycles[0].completedOutput}
                      </span>
                    </div>
                  </div>
                )}

                {/* 企業向け公開サマリー */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  <strong>強み・所見: </strong>
                  {trainee.publicSummary.strengths}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>合意日: {trainee.publicSummary.consentedAt}</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> 企業公開中
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* タブ2: 需要検証データ管理（CSVエクスポート・安全クリア） */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          {/* アクションバー */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-600" />
                <span>来場企業からの需要検証データ</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                イベント中に来場企業が送信した「オファー」「業務リクエスト」「アンケート感想」を蓄積しています。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition text-xs"
              >
                <Download className="w-4 h-4" />
                <span>需要検証データをCSVエクスポート</span>
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs transition"
                title="CSVエクスポート完了後のみクリア可能"
              >
                <Trash2 className="w-4 h-4" />
                <span>データクリア</span>
              </button>
            </div>
          </div>

          {/* 3つのデータカード */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. 届いたオファー */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600" />
                <span>届いたオファー ({offers.length}件)</span>
              </h4>
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {offers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">まだオファーはありません</p>
                ) : (
                  offers.map((o) => (
                    <div key={o.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{o.companyName}</span>
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                          {o.type === 'trial' ? 'お試し実習打診' : '面談希望'}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        <strong>対象:</strong> {o.traineeName}
                      </div>
                      <div className="text-slate-600">
                        <strong>任せたい業務:</strong> {o.desiredWork}
                      </div>
                      <p className="text-slate-500 text-[11px] bg-white p-2 rounded border border-slate-200">
                        「{o.message}」
                      </p>
                      <div className="text-[10px] text-slate-400 text-right">
                        {o.contactPerson} ({o.contactEmail})
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. 企業の業務リクエスト */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>企業の業務リクエスト ({skillRequests.length}件)</span>
              </h4>
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {skillRequests.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">まだリクエストはありません</p>
                ) : (
                  skillRequests.map((r) => (
                    <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="font-bold text-slate-900">{r.title}</div>
                      <div className="text-[11px] text-slate-500">{r.companyName}</div>
                      <p className="text-slate-600 text-xs leading-relaxed">{r.description}</p>
                      <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                        <span>作業単位: {r.workUnit}</span>
                        <span>目安時間: {r.expectedDuration}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. 来場者アンケート・感想 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>アンケート感想 ({feedbacks.length}件)</span>
              </h4>
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {feedbacks.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">まだ感想はありません</p>
                ) : (
                  feedbacks.map((f) => (
                    <div key={f.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{f.companyName}</span>
                        <span className="text-[11px] text-amber-600 font-extrabold">
                          ★ {f.usefulnessScore} / 5
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{f.respondentRole}</div>
                      <p className="text-slate-700 bg-white p-2 rounded border border-slate-200">
                        「{f.impressions}」
                      </p>
                      {f.neededInformation && (
                        <div className="text-[11px] text-slate-500">
                          <strong>要望情報:</strong> {f.neededInformation}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 月次面談・到達点合意モーダル */}
      {selectedTrainee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  月1面談での到達点すり合わせ
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedTrainee.codeName} の到達点整理
                </h3>
              </div>
              <button
                onClick={() => setSelectedTrainee(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              ※ 本人の自己評価を上書きせず、「本人と支援員が面談で合意した確定到達点」を履歴として追記保存します。
            </p>

            {/* 6軸の到達点スライダー */}
            <div className="space-y-4 text-xs mb-5">
              {RUBRIC_AXES.map((axis) => {
                const selfEval = selectedTrainee.evaluations.find(
                  (e) => e.skillId === axis.id && e.type === 'self'
                );
                return (
                  <div key={axis.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">{axis.name}</span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-blue-600">
                          本人自己評価: {selfEval ? `${selfEval.score}` : '未入力'}
                        </span>
                        <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                          合意到達点: {editingScores[axis.id] || 3}
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={editingScores[axis.id] || 3}
                      onChange={(e) =>
                        setEditingScores({ ...editingScores, [axis.id]: Number(e.target.value) })
                      }
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-500">
                      レベル {editingScores[axis.id] || 3}: {axis.levels[((editingScores[axis.id] || 3) as 1 | 2 | 3 | 4 | 5)]?.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 企業向け公開サマリー編集 */}
            <div className="mb-5 text-xs">
              <label className="block font-bold text-slate-700 mb-1.5">
                企業向け公開サマリー（本人の強み・所見）
              </label>
              <textarea
                value={editingSummary}
                onChange={(e) => setEditingSummary(e.target.value)}
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedTrainee(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveMilestone}
                className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition"
              >
                面談到達点を合意・保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* データクリア確認モーダル */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-base">需要検証データのクリア確認</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              回収したオファー、業務リクエスト、アンケートデータを完全に削除します。
            </p>
            {!StorageService.isCsvExported() ? (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs mb-5 font-semibold">
                ⚠️ まだCSVエクスポートが実行されていません。データ消失を防ぐため、先にCSVダウンロードを行ってください。
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs mb-5">
                ✅ 事前にCSVエクスポートが完了しています。安全にクリアできます。
              </div>
            )}
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={handleClearVerificationData}
                disabled={!StorageService.isCsvExported()}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-lg transition"
              >
                完全に削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
