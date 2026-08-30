import React, { useState } from 'react';
import {
  TraineeProfile,
  CompanyWorkRequirement,
  ConnectionAnalysis,
} from '../../types';
import { WorkCycleChart } from '../charts/WorkCycleChart';
import { SkillRadarChart } from '../charts/SkillRadarChart';
import { analyzeConnection } from '../../lib/comparison';
import { StorageService } from '../../lib/storage';
import {
  Building2,
  CheckCircle2,
  HelpCircle,
  Clock,
  Heart,
  Send,
  PlusCircle,
  MessageSquare,
  FileCheck,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

interface CompanyViewProps {
  trainees: TraineeProfile[];
  requirements: CompanyWorkRequirement[];
  selectedRequirementId: string;
  onSelectRequirement: (id: string) => void;
  onDataChange: () => void;
}

export const CompanyView: React.FC<CompanyViewProps> = ({
  trainees,
  requirements,
  selectedRequirementId,
  onSelectRequirement,
  onDataChange,
}) => {
  const activeRequirement =
    requirements.find((r) => r.id === selectedRequirementId) || requirements[0];

  const [activeTrainee, setActiveTrainee] = useState<TraineeProfile | null>(trainees[0]);

  // モーダル管理
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showNewReqModal, setShowNewReqModal] = useState(false);

  // オファーフォーム状態
  const [offerType, setOfferType] = useState<'trial' | 'interview'>('trial');
  const [offerDesiredWork, setOfferDesiredWork] = useState(activeRequirement?.taskName || '');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerCompany, setOfferCompany] = useState(activeRequirement?.companyName || '');
  const [offerPerson, setOfferPerson] = useState('');
  const [offerEmail, setOfferEmail] = useState('');

  // 業務リクエストフォーム状態
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqWorkUnit, setReqWorkUnit] = useState('10件');
  const [reqExpectedDuration, setReqExpectedDuration] = useState('60分');

  // アンケート状態
  const [surveyScore, setSurveyScore] = useState(5);
  const [surveyRole, setSurveyRole] = useState('人事・採用担当');
  const [surveyImpressions, setSurveyImpressions] = useState('');
  const [surveyNeededInfo, setSurveyNeededInfo] = useState('');

  // 新規業務要件フォーム状態
  const [newReqTaskName, setNewReqTaskName] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  const [newReqExpectedMinutes, setNewReqExpectedMinutes] = useState(60);
  const [newReqUnit, setNewReqUnit] = useState('10件');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const connectionAnalysis: ConnectionAnalysis | null =
    activeRequirement && activeTrainee
      ? analyzeConnection(activeRequirement, activeTrainee)
      : null;

  const handleSubmitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrainee) return;

    StorageService.addOffer({
      id: `offer-${Date.now()}`,
      companyName: offerCompany || '来場企業様',
      traineeId: activeTrainee.id,
      traineeName: activeTrainee.codeName,
      type: offerType,
      desiredWork: offerDesiredWork,
      message: offerMessage || '作業周期と成果実績を拝見し、ぜひ一度お話ししてみたいです。',
      contactPerson: offerPerson || '担当者様',
      contactEmail: offerEmail || 'contact@example.com',
      createdAt: new Date().toISOString(),
    });

    setShowOfferModal(false);
    onDataChange();
    showToast('🎉 オファーを送信しました！（支援員ポータルに通知・保存されました）');
  };

  const handleSubmitSkillRequest = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.addSkillRequest({
      id: `req-${Date.now()}`,
      companyName: offerCompany || '来場企業様',
      title: reqTitle || '自社業務のデータ化・集計',
      description: reqDesc || '毎月の請求書PDFをスプレッドシートに転記する作業',
      workUnit: reqWorkUnit,
      expectedDuration: reqExpectedDuration,
      createdAt: new Date().toISOString(),
    });

    setShowRequestModal(false);
    onDataChange();
    showToast('💡 業務リクエストを投稿しました！（支援現場でカリキュラム検討に活用されます）');
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.addFeedback({
      id: `fb-${Date.now()}`,
      companyName: offerCompany || '来場企業様',
      respondentRole: surveyRole,
      usefulnessScore: surveyScore,
      impressions: surveyImpressions || '作業時間と回復時間のワークサイクルが具体的で、配慮のイメージが湧きやすい。',
      neededInformation: surveyNeededInfo || '出勤初期のサポート期間についての詳細',
      createdAt: new Date().toISOString(),
    });

    setShowFeedbackModal(false);
    onDataChange();
    showToast('📝 貴重なご感想・フィードバックをありがとうございました！');
  };

  const handleAddNewRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: CompanyWorkRequirement = {
      id: `custom-req-${Date.now()}`,
      companyName: offerCompany || '御社（カスタム要件）',
      taskName: newReqTaskName || '自社業務（カスタム）',
      taskDescription: newReqDesc || '自社の具体的な業務要件',
      workUnit: newReqUnit,
      expectedDurationMinutes: newReqExpectedMinutes,
      acceptableDurationRange: {
        min: Math.round(newReqExpectedMinutes * 0.7),
        max: Math.round(newReqExpectedMinutes * 1.3),
      },
      expectedOutput: `${newReqUnit}の完了`,
      requiredQuality: 'マニュアル通りの正確性',
      acceptableVariation: '日ごとの完了数は±2件以内',
      evaluationPeriod: 'day',
      priority: 'quality',
      recoveryTimeAllowed: true,
      flexibleWorkSequence: true,
      flexibleTimeOfDay: true,
      availableSupports: ['マニュアルあり', 'チャット質問可'],
      createdAt: new Date().toISOString(),
      version: 1,
    };

    const allReqs = [newReq, ...requirements];
    StorageService.saveCompanyRequirements(allReqs);
    onSelectRequirement(newReq.id);
    setShowNewReqModal(false);
    onDataChange();
    showToast(`✅ 新しい業務要件「${newReq.taskName}」を登録し、比較対象にセットしました！`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* デモ注記バナー */}
      <div className="bg-purple-50 border border-purple-200 text-purple-900 px-4 py-2.5 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-purple-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
            企業視点
          </span>
          <span className="font-semibold">
            来場企業様向け「働き方の設計図」比較・接続ダッシュボード
          </span>
          <span className="bg-white border border-purple-300 text-purple-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
            架空のモデルケース・デモ用想定値
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold bg-white px-2.5 py-1 rounded-lg border border-purple-200 hover:border-purple-300 transition"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>自社の求める業務をリクエスト</span>
          </button>
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold bg-white px-2.5 py-1 rounded-lg border border-purple-200 hover:border-purple-300 transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>使ってみた感想・アンケート</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-indigo-600 text-white p-3.5 rounded-xl shadow-lg text-xs font-bold animate-fadeIn flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ステップ1: 企業業務要件の事前選択・設定エリア */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>ステップ1: 御社が任せたい「対象業務の要件」を選択・登録（事前開示）</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              本人だけに苦手や配慮の開示を求めず、企業側の業務要件・許容範囲も事前に開示して比較します。
            </p>
          </div>
          <button
            onClick={() => setShowNewReqModal(true)}
            className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl transition shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>自社の業務要件を追加登録</span>
          </button>
        </div>

        {/* 業務プリセットタブ */}
        <div className="flex flex-wrap gap-2 pt-1">
          {requirements.map((req) => (
            <button
              key={req.id}
              onClick={() => onSelectRequirement(req.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                selectedRequirementId === req.id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{req.taskName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                  selectedRequirementId === req.id ? 'bg-purple-700 text-purple-100' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {req.expectedDurationMinutes}分 / {req.workUnit}
              </span>
            </button>
          ))}
        </div>

        {/* 選択中要件の詳細サマリーバー */}
        {activeRequirement && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div>
                <strong>業務概要: </strong>
                {activeRequirement.taskDescription}
              </div>
              <div className="text-[11px] text-slate-500 flex flex-wrap gap-3 pt-1">
                <span>想定所要時間: <strong>{activeRequirement.expectedDurationMinutes}分</strong></span>
                <span>許容範囲: <strong>{activeRequirement.acceptableDurationRange.min}〜{activeRequirement.acceptableDurationRange.max}分</strong></span>
                <span>品質基準: <strong>{activeRequirement.requiredQuality}</strong></span>
                <span>時間配分裁量: <strong>{activeRequirement.recoveryTimeAllowed ? '可（成果基準）' : '定時休憩'}</strong></span>
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-400 font-mono">
              要件登録日時: {activeRequirement.createdAt.slice(0, 16).replace('T', ' ')} (v{activeRequirement.version})
              <br />
              ※ 企業基準の後付け変更は履歴として記録されます
            </div>
          </div>
        )}
      </div>

      {/* ステップ2: 研修生モデルケース一覧 ＆ 接続比較 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左カラム: タレント選択リスト（4名） */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>ステップ2: 研修生を選択して接続を比較</span>
            <span className="text-[10px] text-slate-400">4名のモデルケース</span>
          </h3>

          <div className="space-y-2.5">
            {trainees.map((t) => {
              const isSelected = activeTrainee?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setActiveTrainee(t)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-purple-500 shadow-md ring-2 ring-purple-200'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.avatarBg} text-white font-bold flex items-center justify-center text-xs shadow-sm`}
                      >
                        {t.codeName.slice(0, 1)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{t.codeName}</h4>
                        <p className="text-[10px] text-slate-500">{t.targetJob}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2">
                    <strong>合意就労条件: </strong>
                    {t.desiredWorkCondition.daysPerWeek} ({t.desiredWorkCondition.hoursPerDay})
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {t.badges.slice(0, 2).map((b, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium truncate max-w-[200px]"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右カラム: 詳細接続ダッシュボード（ピッチ展示の主役） */}
        {activeTrainee && (
          <div className="lg:col-span-2 space-y-5">
            {/* ヘッダー・基本情報 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  業務接続・働き方の設計図
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <span>{activeTrainee.codeName}</span>
                  <span className="text-xs font-normal text-slate-500">
                    合意就労条件: {activeTrainee.desiredWorkCondition.daysPerWeek}（{activeTrainee.desiredWorkCondition.hoursPerDay}）
                  </span>
                </h3>
              </div>
              <button
                onClick={() => {
                  setOfferDesiredWork(activeRequirement?.taskName || '');
                  setShowOfferModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition text-xs"
              >
                <Send className="w-4 h-4" />
                <span>すり合わせ面談・お試し実習（1〜3日）を打診する</span>
              </button>
            </div>

            {/* 1. 持続可能な作業周期のタイムライン比較 */}
            {activeRequirement && activeTrainee.workCycles[0] && (
              <WorkCycleChart
                requirement={activeRequirement}
                workCycle={activeTrainee.workCycles[0]}
              />
            )}

            {/* 2. 3層の接続対話表示（自動マッチ率を排除した透明な比較） */}
            {connectionAnalysis && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>業務接続の対話分析（3つの接続ステータス）</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ※ 自動適性判定ではありません。「どこが重なり、何を調整すれば接続できるか」を対話するための項目です。
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  {/* 🟢 すでに重なっている条件 */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1.5">
                    <h5 className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>すでに重なっている条件（即座に力を発揮できる領域）</span>
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-emerald-950 text-xs pl-1">
                      {connectionAnalysis.matchingPoints.map((p, i) => (
                        <li key={i} className="leading-relaxed">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 🟡 調整で接続できそうな条件 */}
                  {connectionAnalysis.adjustablePoints.length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
                      <h5 className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>調整で接続できそうな条件（対話・すり合わせの余地）</span>
                      </h5>
                      <div className="space-y-2">
                        {connectionAnalysis.adjustablePoints.map((adj, i) => (
                          <div
                            key={i}
                            className="bg-white p-2.5 rounded-lg border border-amber-200 text-xs space-y-1"
                          >
                            <span className="font-bold text-slate-800 block">
                              📌 {adj.title}
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                              <div className="bg-purple-50 p-2 rounded text-purple-900">
                                <strong>🏢 企業側の調整検討: </strong>
                                {adj.companySide}
                              </div>
                              <div className="bg-blue-50 p-2 rounded text-blue-900">
                                <strong>👤 研修生側の工夫・対処: </strong>
                                {adj.traineeSide}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ⚪ 不足している情報（実習での確認事項） */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <HelpCircle className="w-4 h-4 text-slate-500" />
                      <span>判断に必要な情報がまだ不足している部分（お試し実習での確認事項）</span>
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs pl-1">
                      {connectionAnalysis.missingInfo.map((info, i) => (
                        <li key={i} className="leading-relaxed">
                          {info}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 3. レーダーチャート ＆ 私のトリセツ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* スキルレーダーチャート */}
              <SkillRadarChart
                evaluations={activeTrainee.evaluations}
                companyName="御社の求める基準"
              />

              {/* 私のトリセツ（自己対処 ＆ 合理的配慮） */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>私のトリセツ（自己対処と希望する環境）</span>
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">
                    本人が実践しているセルフケアと、企業にお願いしたい合理的配慮の対比です。
                  </p>

                  <div className="space-y-2.5 text-xs">
                    {activeTrainee.instructions.map((ins, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          ⚠️ 特性・苦手: {ins.characteristic}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          <div className="bg-emerald-50 p-1.5 rounded text-emerald-900">
                            <strong>🌱 本人の自己対処:</strong> {ins.selfCoping}
                          </div>
                          <div className="bg-indigo-50 p-1.5 rounded text-indigo-900">
                            <strong>🤝 企業へのお願い:</strong> {ins.requestedSupport}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 企業向け公開サマリー */}
                <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-xl text-xs text-slate-700">
                  <strong className="text-slate-900 block text-[11px] mb-1">
                    支援員と整理した成長サマリー（本人同意済み）:
                  </strong>
                  <p className="leading-relaxed line-clamp-3 italic">
                    「{activeTrainee.publicSummary.strengths}」
                  </p>
                </div>
              </div>
            </div>

            {/* 4. 成果物ギャラリー */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span>📁 模擬業務での実際の成果物見本</span>
                <span className="text-[10px] text-slate-400 font-normal">（クリックで概要確認）</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTrainee.portfolio.map((port, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-purple-300 transition text-xs space-y-1"
                  >
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded uppercase">
                      {port.type}
                    </span>
                    <h5 className="font-bold text-slate-900 text-xs">{port.title}</h5>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{port.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* モーダル群 */}
      {/* 1. オファー送信モーダル */}
      {showOfferModal && activeTrainee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  支援事業所（RAMP）への打診
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {activeTrainee.codeName} へのすり合わせ打診
                </h3>
              </div>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">打診の種別</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOfferType('trial')}
                    className={`py-2 text-center rounded-lg border font-bold ${
                      offerType === 'trial'
                        ? 'bg-purple-50 border-purple-600 text-purple-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    お試し職場実習（1〜3日）
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferType('interview')}
                    className={`py-2 text-center rounded-lg border font-bold ${
                      offerType === 'interview'
                        ? 'bg-purple-50 border-purple-600 text-purple-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    すり合わせ・カジュアル面談
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">御社名</label>
                <input
                  type="text"
                  required
                  placeholder="例: 株式会社〇〇製作所"
                  value={offerCompany}
                  onChange={(e) => setOfferCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">任せたい想定業務</label>
                <input
                  type="text"
                  value={offerDesiredWork}
                  onChange={(e) => setOfferDesiredWork(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">メッセージ・質問</label>
                <textarea
                  rows={3}
                  placeholder="作業周期（集中20分＋回復10分）を拝見しました。弊社のデータ入力業務で一度3日間の実習をお願いできないでしょうか。"
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ご担当者名</label>
                  <input
                    type="text"
                    placeholder="浜松 太郎"
                    value={offerPerson}
                    onChange={(e) => setOfferPerson(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ご連絡先メールアドレス</label>
                  <input
                    type="email"
                    placeholder="taro@example.com"
                    value={offerEmail}
                    onChange={(e) => setOfferEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                ※ 本人への直接連絡ではなく、RAMP支援員が間に入り、条件の事前すり合わせと日程調整を行います。
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow transition"
                >
                  オファーを送信する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. 業務リクエスト投稿モーダル */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <span>求めるスキル・業務リクエスト投稿</span>
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSkillRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">業務タイトル</label>
                <input
                  type="text"
                  required
                  placeholder="例: 月次の領収書PDFスキャンとExcel入力"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">業務内容・求める条件</label>
                <textarea
                  rows={3}
                  required
                  placeholder="毎月100件程度の領収書データを所定フォーマットに転記してほしい。文字が鮮明でない場合の確認手順があれば助かります。"
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">作業単位</label>
                  <input
                    type="text"
                    placeholder="例: 10件 / 1ファイル"
                    value={reqWorkUnit}
                    onChange={(e) => setReqWorkUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">想定作業時間</label>
                  <input
                    type="text"
                    placeholder="例: 45〜60分"
                    value={reqExpectedDuration}
                    onChange={(e) => setReqExpectedDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition"
                >
                  リクエストを投稿
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. アンケート感想モーダル */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span>使ってみたご感想・アンケート</span>
              </h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  このダッシュボードは採用・実習検討に役立ちそうでしょうか？
                </label>
                <div className="flex items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      type="button"
                      key={score}
                      onClick={() => setSurveyScore(score)}
                      className={`flex-1 py-2 text-center rounded-lg border font-bold text-sm ${
                        surveyScore === score
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      ★ {score}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">役職・お立場</label>
                <select
                  value={surveyRole}
                  onChange={(e) => setSurveyRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="人事・採用担当">人事・採用担当</option>
                  <option value="経営者・役員">経営者・役員</option>
                  <option value="現場マネージャー・DX推進">現場マネージャー・DX推進</option>
                  <option value="自治体・支援関係者">自治体・支援関係者</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ご感想・フィードバック</label>
                <textarea
                  rows={2}
                  placeholder="「作業時間＋回復時間」という見せ方が具体的で、任せる仕事のイメージがつきやすい。"
                  value={surveyImpressions}
                  onChange={(e) => setSurveyImpressions(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  さらに知りたい情報・不足している情報
                </label>
                <input
                  type="text"
                  placeholder="例: 初期受け入れ時のサポート体制、助成金の活用方法など"
                  value={surveyNeededInfo}
                  onChange={(e) => setSurveyNeededInfo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow transition"
                >
                  感想を送信する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. 新規業務要件登録モーダル */}
      {showNewReqModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-purple-600" />
                <span>自社の業務要件を追加登録</span>
              </h3>
              <button
                onClick={() => setShowNewReqModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewRequirement} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">業務名</label>
                <input
                  type="text"
                  required
                  placeholder="例: 在庫リストの照合・データ入力"
                  value={newReqTaskName}
                  onChange={(e) => setNewReqTaskName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">具体的な業務内容</label>
                <textarea
                  rows={2}
                  placeholder="入出荷伝票と基幹システムの在庫数を照合し、差異があればメモを残す作業。"
                  value={newReqDesc}
                  onChange={(e) => setNewReqDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">作業単位</label>
                  <input
                    type="text"
                    placeholder="例: 1伝票 (10行)"
                    value={newReqUnit}
                    onChange={(e) => setNewReqUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">想定作業時間 (分)</label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={newReqExpectedMinutes}
                    onChange={(e) => setNewReqExpectedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                ※ この要件は登録日時付きで保存され、A〜Dさんとの接続分析（作業周期・重なる条件）に即時反映されます。
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewReqModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow transition"
                >
                  登録して比較する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
