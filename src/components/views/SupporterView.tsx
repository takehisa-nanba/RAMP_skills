import React, { useState } from 'react';
import { TraineeProfile, Offer, SkillRequest, FeedbackSurvey, TraineePracticeRecord } from '../../types';
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
  Sparkles,
  X,
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

  // 実践記録と見立て補足管理
  const [practiceRecords, setPracticeRecords] = useState<TraineePracticeRecord[]>(() =>
    StorageService.getPracticeRecords()
  );
  const [verifyingRecord, setVerifyingRecord] = useState<TraineePracticeRecord | null>(null);
  const [supporterNoteInput, setSupporterNoteInput] = useState(
    '手順書があればミスなく安定して完遂可能。集中作業＋回復のリズムで持続性あり。'
  );
  const [stabilizingConditionsInput, setStabilizingConditionsInput] = useState<string[]>([
    '手順書・チェックリスト完備',
    '静かな執務環境',
  ]);

  // 3列カルテ用ステート（自己評価・支援員見立て・合意到達点）
  const [editingMilestoneScores, setEditingMilestoneScores] = useState<Record<string, number>>({});
  const [editingSupporterScores, setEditingSupporterScores] = useState<Record<string, number>>({});
  const [editingSelfScores, setEditingSelfScores] = useState<Record<string, number>>({});
  const [editingSummary, setEditingSummary] = useState('');

  // モーダル管理
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmChecked, setClearConfirmChecked] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleOpenEdit = (trainee: TraineeProfile) => {
    setSelectedTrainee(trainee);
    const mScores: Record<string, number> = {};
    const sScores: Record<string, number> = {};
    const selfScores: Record<string, number> = {};

    RUBRIC_AXES.forEach((axis) => {
      // evaluatedAt の降順で最新評価を正確に取得
      const milestone = [...trainee.evaluations]
        .filter((e) => e.skillId === axis.id && e.type === 'monthly_milestone')
        .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime())[0];
      const supporter = [...trainee.evaluations]
        .filter((e) => e.skillId === axis.id && e.type === 'supporter')
        .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime())[0];
      const selfEval = [...trainee.evaluations]
        .filter((e) => e.skillId === axis.id && e.type === 'self')
        .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime())[0];

      mScores[axis.id] = milestone ? milestone.score : 3;
      sScores[axis.id] = supporter ? supporter.score : (milestone ? milestone.score : 3);
      selfScores[axis.id] = selfEval ? selfEval.score : 3;
    });

    setEditingMilestoneScores(mScores);
    setEditingSupporterScores(sScores);
    setEditingSelfScores(selfScores);
    setEditingSummary(trainee.publicSummary.strengths);
  };

  const handleOpenVerifyModal = (record: TraineePracticeRecord) => {
    setVerifyingRecord(record);
    setSupporterNoteInput(
      record.supporterNote ||
        '手順書があればミスなく安定して完遂可能。集中作業＋回復のリズムで持続性あり。'
    );
    setStabilizingConditionsInput(
      record.stabilizingConditions || ['手順書・チェックリスト完備', '静かな執務環境']
    );
  };

  const handleSaveVerifiedRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingRecord) return;

    StorageService.verifyPracticeRecordAndApplyToTrainee(
      verifyingRecord.id,
      supporterNoteInput,
      stabilizingConditionsInput
    );
    setPracticeRecords(StorageService.getPracticeRecords());
    setVerifyingRecord(null);
    onDataChange();
    showToast('✅ 支援員見立てをカルテに反映しました！（企業画面の比較タイムラインに連携されます）');
  };

  const handleSaveMilestone = () => {
    if (!selectedTrainee) return;

    const now = new Date().toISOString();
    // 6軸の合意到達点 ＆ 支援員見立てレコードを追記保存（履歴保持）
    RUBRIC_AXES.forEach((axis) => {
      // 1. 合意到達点
      StorageService.addEvaluation(selectedTrainee.id, {
        id: `milestone-${Date.now()}-${axis.id}`,
        traineeId: selectedTrainee.id,
        skillId: axis.id,
        type: 'monthly_milestone',
        score: editingMilestoneScores[axis.id] || 3,
        comment: `月1面談での到達点合意`,
        evaluatorName: '支援員: 佐藤 (本人合意)',
        evaluatedAt: now,
        targetPeriod: '2026-08',
      });

      // 2. 支援員見立て
      StorageService.addEvaluation(selectedTrainee.id, {
        id: `supporter-${Date.now()}-${axis.id}`,
        traineeId: selectedTrainee.id,
        skillId: axis.id,
        type: 'supporter',
        score: editingSupporterScores[axis.id] || 3,
        comment: `支援員の日々の見立て記録`,
        evaluatorName: '支援員: 佐藤',
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
    showToast('支援員見立て、月次合意到達点、および企業向けサマリーを更新・保存しました！');
  };

  const handleExportCsv = () => {
    StorageService.exportVerificationDataToCsv();
    onDataChange();
    showToast('需要検証データをCSV出力しました！（ダウンロードフォルダをご確認ください）');
  };

  const handleClearVerificationData = () => {
    const success = StorageService.clearVerificationData();
    if (!success) {
      alert('安全保護のため、先に【CSVエクスポート】を実行してから削除してください。');
      return;
    }
    setShowClearConfirm(false);
    setClearConfirmChecked(false);
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
          {offers.length > 0 && (
            <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
              📨 実習オファー {offers.length}件
            </span>
          )}
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
        <div className="space-y-6">
          {/* 📨 届いた実習オファー・面談打診 */}
          <div className="bg-gradient-to-br from-purple-50/90 via-indigo-50/50 to-white border-2 border-purple-300 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-700 text-white shadow-xs">
                  <Mail className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                    <span>📨 企業からの実習オファー・面談打診</span>
                    <span className="text-xs font-black text-purple-800 bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-full">
                      {offers.length}件届いています
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    企業画面から送信されたお試し実習や面談の打診です。本人の希望条件と照らし合わせて日程調整や面談を進められます。
                  </p>
                </div>
              </div>
            </div>

            {offers.length === 0 ? (
              <div className="text-center py-5 bg-white/70 rounded-xl border border-purple-200 text-xs text-slate-500 font-medium">
                現在届いているオファーはありません。企業画面の「お試し実習を相談する」から送信されるとここに即時届きます。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {offers.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 rounded-xl border-2 border-purple-200 bg-white hover:border-purple-400 hover:shadow-sm transition flex flex-col justify-between gap-2.5"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-sm text-slate-900 truncate">
                          🏢 {o.companyName}
                        </span>
                        <span
                          className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                            o.type === 'trial'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {o.type === 'trial' ? 'お試し実習（1〜3日）打診' : 'すり合わせ面談希望'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 bg-purple-50/50 p-2 rounded-lg border border-purple-100 space-y-0.5">
                        <div>
                          <strong>対象研修生:</strong> <span className="text-purple-900 font-bold">{o.traineeName}</span>
                        </div>
                        <div>
                          <strong>任せたい業務:</strong> {o.desiredWork}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed italic">
                        「{o.message}」
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500 font-medium">
                        連絡先: <strong>{o.contactPerson}</strong> ({o.contactEmail})
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(o.createdAt).toLocaleString('ja-JP', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* 📋 届いた実践記録と支援員見立て補足 */}
          <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <span>📋 利用者からの模擬実践記録（支援員見立ての補足・カルテ反映）</span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {practiceRecords.length}件
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  研修生が企業の募集業務を実際にやってみた記録です。支援員が客観的な見立て・安定再現条件を補足してカルテに反映すると、企業画面の比較タイムラインに連携されます。
                </p>
              </div>
            </div>

            {practiceRecords.length === 0 ? (
              <div className="text-center py-5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 font-medium">
                まだ実践記録はありません。研修生画面で「この仕事をやってみる」を実行するとここに届きます。
              </div>
            ) : (
              <div className="space-y-2.5">
                {practiceRecords.map((rec) => {
                  const traineeObj = trainees.find((t) => t.id === rec.traineeId);
                  const isVerified = rec.status === 'verified';

                  return (
                    <div
                      key={rec.id}
                      className={`p-3.5 rounded-xl border-2 transition ${
                        isVerified
                          ? 'bg-emerald-50/50 border-emerald-300'
                          : 'bg-indigo-50/40 border-indigo-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">
                            {traineeObj?.codeName || rec.traineeId}
                          </span>
                          <span className="text-xs text-slate-600 font-bold">
                            業務: <strong>{rec.taskName}</strong> ({rec.workUnit})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200">
                            作業: {rec.workDurationMinutes}分 ＋ 回復: {rec.recoveryDurationMinutes}分
                          </span>
                          {isVerified ? (
                            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              ✓ カルテ反映済み
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                              見立て補足待ち
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1 mb-2">
                        <div>
                          <strong>本人の振り返り:</strong> 「{rec.traineeComment}」
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          使った自己対処: {rec.traineeCoping?.join(', ') || 'なし'}
                        </div>
                      </div>

                      {isVerified ? (
                        <div className="text-xs text-emerald-950 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
                          <strong>🧑‍💼 支援員の補足見立て:</strong> {rec.supporterNote}
                          <div className="text-[11px] text-emerald-700 mt-0.5">
                            再現条件: {rec.stabilizingConditions?.join(', ')}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenVerifyModal(rec)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>支援員見立てを補足してカルテに反映</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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

                {/* 届いた実習オファーの通知バッジ */}
                {(() => {
                  const traineeOffers = offers.filter((o) => o.traineeId === trainee.id);
                  if (traineeOffers.length === 0) return null;
                  return (
                    <div className="mb-3 p-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl flex items-center justify-between text-xs shadow-2xs">
                      <span className="font-black text-purple-950 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-purple-700" />
                        <span>実習オファー {traineeOffers.length}件 受信中</span>
                      </span>
                      <span className="text-[10px] font-bold text-purple-700 bg-white border border-purple-200 px-2 py-0.5 rounded">
                        最新: {traineeOffers[0].companyName}
                      </span>
                    </div>
                  );
                })()}

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

      {/* 月次面談・到達点合意モーダル（3列並列カルテ） */}
      {selectedTrainee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border-2 border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  月次カルテ整理・到達点すり合わせ
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {selectedTrainee.codeName} の3列カルテ整理
                </h3>
              </div>
              <button
                onClick={() => setSelectedTrainee(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed">
              ※ 本人の自己評価を一方的に上書きせず、「本人自己評価」「支援員見立て」「面談合意到達点」の3者を並べて確認し、面談で合意した到達点と支援員見立てを履歴として追記保存します。
            </p>

            {/* 6軸の3列評価（①自己評価 ②支援員見立て ③合意到達点） */}
            <div className="space-y-4 text-xs mb-5">
              {RUBRIC_AXES.map((axis) => {
                const selfScore = editingSelfScores[axis.id] ?? 3;
                const supporterScore = editingSupporterScores[axis.id] ?? 3;
                const milestoneScore = editingMilestoneScores[axis.id] ?? 3;

                return (
                  <div key={axis.id} className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-900 text-sm">{axis.name}</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Lv.1〜5 (未達・指示下〜自律・工夫)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      {/* 列1: 本人自己評価 (self) */}
                      <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-sky-900 font-bold text-[11px]">① 本人自己評価</span>
                          <span className="bg-sky-600 text-white font-black px-2 py-0.5 rounded text-[11px]">
                            Lv.{selfScore}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-snug">
                          {axis.levels[(selfScore as 1|2|3|4|5)]?.label || '未入力'}
                        </p>
                      </div>

                      {/* 列2: 支援員の日々の見立て (supporter) */}
                      <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-purple-900 font-bold text-[11px]">② 支援員見立て</span>
                          <span className="bg-purple-700 text-white font-black px-2 py-0.5 rounded text-[11px]">
                            Lv.{supporterScore}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={supporterScore}
                          onChange={(e) =>
                            setEditingSupporterScores({
                              ...editingSupporterScores,
                              [axis.id]: Number(e.target.value),
                            })
                          }
                          className="w-full accent-purple-700 cursor-pointer"
                        />
                        <p className="text-[10px] text-slate-600 leading-snug">
                          {axis.levels[(supporterScore as 1|2|3|4|5)]?.label}
                        </p>
                      </div>

                      {/* 列3: 月1面談での合意到達点 (monthly_milestone) */}
                      <div className="bg-emerald-50/80 p-3 rounded-xl border-2 border-emerald-400 space-y-1.5 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-950 font-black text-[11px]">③ 合意到達点</span>
                          <span className="bg-emerald-700 text-white font-black px-2 py-0.5 rounded text-[11px]">
                            Lv.{milestoneScore}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={milestoneScore}
                          onChange={(e) =>
                            setEditingMilestoneScores({
                              ...editingMilestoneScores,
                              [axis.id]: Number(e.target.value),
                            })
                          }
                          className="w-full accent-emerald-700 cursor-pointer"
                        />
                        <p className="text-[10px] text-emerald-950 font-bold leading-snug">
                          {axis.levels[(milestoneScore as 1|2|3|4|5)]?.label}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 企業向け公開サマリー編集 */}
            <div className="mb-5 text-xs">
              <label className="block font-bold text-slate-800 mb-1.5">
                企業向け公開サマリー（本人の強み・所見）
              </label>
              <textarea
                value={editingSummary}
                onChange={(e) => setEditingSummary(e.target.value)}
                rows={3}
                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedTrainee(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveMilestone}
                className="px-6 py-2.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow transition"
              >
                見立てと合意到達点を確定・保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* データクリア確認モーダル（件数明示・2段階確認） */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-base">需要検証データのクリア確認</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              回収したオファー、業務リクエスト、アンケートデータを完全に削除します。
            </p>

            {/* 削除対象件数の明示 */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1 mb-4">
              <div className="font-bold text-slate-800">削除対象件数:</div>
              <div className="flex justify-between text-slate-600">
                <span>・届いたオファー:</span>
                <strong className="text-slate-900">{offers.length}件</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>・業務リクエスト:</span>
                <strong className="text-slate-900">{skillRequests.length}件</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>・アンケート回答:</span>
                <strong className="text-slate-900">{feedbacks.length}件</strong>
              </div>
              <div className="border-t border-slate-200 pt-1 flex justify-between font-black text-rose-700">
                <span>合計:</span>
                <span>{offers.length + skillRequests.length + feedbacks.length}件</span>
              </div>
            </div>

            {!StorageService.isCsvExported() ? (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs mb-4 font-bold">
                ⚠️ まだCSVエクスポートが実行されていません。データ消失を防ぐため、先にCSVダウンロードを実行してください。
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs mb-4 font-bold">
                ✅ 事前にCSVエクスポートが完了しています。安全にクリアできます。
              </div>
            )}

            {/* 2段階確認チェックボックス */}
            {StorageService.isCsvExported() && (
              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer mb-4 font-semibold">
                <input
                  type="checkbox"
                  checked={clearConfirmChecked}
                  onChange={(e) => setClearConfirmChecked(e.target.checked)}
                  className="mt-0.5"
                />
                <span>CSVへのバックアップが完了していることを確認し、データの完全削除を実行します</span>
              </label>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearConfirmChecked(false);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={handleClearVerificationData}
                disabled={!StorageService.isCsvExported() || !clearConfirmChecked}
                className="px-5 py-2 text-xs font-black bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-lg transition shadow"
              >
                完全に削除する
              </button>
            </div>
          </div>
        </div>
      )}



      {/* 支援員見立て補足・カルテ反映モーダル */}
      {verifyingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-slate-200 text-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  支援員の見立て・再現条件の補足
                </span>
                <h3 className="font-black text-lg text-slate-900 mt-0.5">
                  {verifyingRecord.taskName} のカルテ反映
                </h3>
              </div>
              <button
                onClick={() => setVerifyingRecord(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVerifiedRecord} className="space-y-4">
              {/* 利用者の実践実績サマリー */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">対象研修生:</span>
                  <span className="font-bold text-slate-800">
                    {trainees.find((t) => t.id === verifyingRecord.traineeId)?.codeName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">本人の作業・回復周期:</span>
                  <span className="font-bold text-purple-700">
                    集中{verifyingRecord.workDurationMinutes}分 ＋ 回復{verifyingRecord.recoveryDurationMinutes}分
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">本人の振り返り:</span>
                  <span className="font-medium text-slate-700 italic">
                    「{verifyingRecord.traineeComment}」
                  </span>
                </div>
              </div>

              {/* 1. 支援員の客観見立て */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 text-xs">
                  1. 支援員の見立て（現場での再現性・作業リズムの客観評価）
                </label>
                <div className="space-y-1 mb-2">
                  {[
                    '手順書があればミスなく安定して完遂可能。集中作業＋回復のリズムで持続性あり。',
                    'チェックシートの活用により入力精度99.5%以上を維持。終日安定して稼働可能。',
                    '事前の仕様説明と静かな環境があれば、自律的にサイクルを回すことができます。',
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setSupporterNoteInput(preset)}
                      className={`w-full text-left p-2 rounded-lg border text-xs font-medium transition ${
                        supporterNoteInput === preset
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={supporterNoteInput}
                  onChange={(e) => setSupporterNoteInput(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="支援員の見立てを直接編集"
                />
              </div>

              {/* 2. 安定再現条件 */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 text-xs">
                  2. 安定して再現するために必要な環境・条件（複数選択可）
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '手順書・チェックリスト完備',
                    '静かな執務環境',
                    '2画面モニター',
                    '手元タイマーでの自己管理',
                    '開始時の仕様すり合わせ',
                    'テキストでの指示',
                  ].map((cond) => {
                    const isSelected = stabilizingConditionsInput.includes(cond);
                    return (
                      <button
                        type="button"
                        key={cond}
                        onClick={() => {
                          if (isSelected) {
                            setStabilizingConditionsInput(
                              stabilizingConditionsInput.filter((c) => c !== cond)
                            );
                          } else {
                            setStabilizingConditionsInput([...stabilizingConditionsInput, cond]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setVerifyingRecord(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs sm:text-sm shadow flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>カルテに反映して企業画面と連携</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
