'use client';

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
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Award,
} from 'lucide-react';

interface CompanyExperienceViewProps {
  trainees: TraineeProfile[];
  requirements: CompanyWorkRequirement[];
  selectedRequirementId: string;
  onSelectRequirement: (id: string) => void;
  onDataChange: () => void;
}

export const CompanyExperienceView: React.FC<CompanyExperienceViewProps> = ({
  trainees,
  requirements,
  selectedRequirementId,
  onSelectRequirement,
  onDataChange,
}) => {
  // ステップ管理 (0: 開始, 1: 業務選択, 2: 人財選択, 3: 中核比較, 4: 詳細確認・対話アクション)
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('step');
      if (s !== null && ['0', '1', '2', '3', '4'].includes(s)) {
        setStep(Number(s) as 0 | 1 | 2 | 3 | 4);
      }
    }
  }, []);

  // 選択中の業務要件
  const activeRequirement =
    requirements.find((r) => r.id === selectedRequirementId) || requirements[0];

  // 選択中の研修生
  const [activeTrainee, setActiveTrainee] = useState<TraineeProfile>(trainees[0]);

  // モーダル管理 (オファー、リクエスト、アンケート、新規要件、システムについて)
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showNewReqModal, setShowNewReqModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

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

  // 接続分析の計算 (透明なルールに基づく3分類)
  const connectionAnalysis: ConnectionAnalysis = analyzeConnection(
    activeRequirement,
    activeTrainee
  );

  // 研修生に対応する模擬業務実績
  const relevantWorkCycle =
    activeTrainee.workCycles.find((wc) =>
      activeRequirement.taskName.includes('入力') || activeRequirement.taskName.includes('データ')
        ? wc.taskName.includes('入力') || wc.taskName.includes('データ') || wc.taskName.includes('照合')
        : activeRequirement.taskName.includes('バナー') || activeRequirement.taskName.includes('Web')
        ? wc.taskName.includes('バナー') || wc.taskName.includes('Web') || wc.taskName.includes('画像')
        : wc.taskName.includes('マニュアル') || wc.taskName.includes('手順書') || wc.taskName.includes('メール')
    ) || activeTrainee.workCycles[0];

  // オファー送信
  const handleSubmitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.addOffer({
      id: `offer-${Date.now()}`,
      companyName: offerCompany || '来場企業様',
      traineeId: activeTrainee.id,
      traineeName: activeTrainee.codeName,
      type: offerType,
      desiredWork: offerDesiredWork,
      message: offerMessage || '持続可能な作業周期を拝見し、ぜひ一度お話ししてみたいです。',
      contactPerson: offerPerson || '担当者様',
      contactEmail: offerEmail || 'contact@example.com',
      createdAt: new Date().toISOString(),
    });

    setShowOfferModal(false);
    onDataChange();
    showToast('🎉 オファーを送信しました！（支援員ポータルに通知・保存されました）');
  };

  // 業務リクエスト送信
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
    showToast('💡 業務リクエストを投稿しました！（支援現場のカリキュラム検討に活用されます）');
  };

  // アンケート送信
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.addFeedback({
      id: `fb-${Date.now()}`,
      companyName: offerCompany || '来場企業様',
      respondentRole: surveyRole,
      usefulnessScore: surveyScore,
      impressions: surveyImpressions || '作業時間と回復時間のワークサイクルが具体的で、配慮のイメージが湧きやすい。',
      neededInformation: surveyNeededInfo || '初期サポート期間の詳細',
      createdAt: new Date().toISOString(),
    });

    setShowFeedbackModal(false);
    onDataChange();
    showToast('📝 貴重なご感想をありがとうございました！');
  };

  // 新規業務要件登録
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
    showToast(`✅ 新しい業務「${newReq.taskName}」を登録しました！`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 min-h-[calc(100vh-3rem)] flex flex-col justify-between">
      <div>
        {/* トースト表示 */}
        {toastMessage && (
          <div className="mb-4 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold animate-fadeIn flex items-center justify-between">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* パンくず型ステップ進行バー (ステップ1以上で表示) */}
        {step > 0 && (
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setStep(1)}
                className={`font-semibold transition ${
                  step === 1 ? 'text-purple-700 font-bold' : 'hover:text-slate-800'
                }`}
              >
                1. 仕事を選ぶ
              </button>
              <span>›</span>
              <button
                onClick={() => setStep(2)}
                className={`font-semibold transition ${
                  step === 2 ? 'text-purple-700 font-bold' : 'hover:text-slate-800'
                }`}
              >
                2. 人を見る
              </button>
              <span>›</span>
              <button
                onClick={() => setStep(3)}
                className={`font-semibold transition ${
                  step === 3 ? 'text-purple-700 font-bold' : 'hover:text-slate-800'
                }`}
              >
                3. 働き方を比べる
              </button>
              <span>›</span>
              <button
                onClick={() => setStep(4)}
                className={`font-semibold transition ${
                  step === 4 ? 'text-purple-700 font-bold' : 'hover:text-slate-800'
                }`}
              >
                4. 詳しく確認・対話へ
              </button>
            </div>

            <div className="text-[11px] text-slate-400">
              選択中: {activeRequirement.taskName} / {activeTrainee.codeName}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 画面0: デモ開始画面 (Start View) */}
        {/* ========================================================================= */}
        {step === 0 && (
          <div className="py-12 sm:py-20 text-center space-y-6 max-w-2xl mx-auto animate-fadeIn">
            <div className="inline-block px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-bold tracking-wider mb-2">
              体験型デモ
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
              人を仕事に合わせるのではなく、
              <br />
              <span className="text-purple-700">人と仕事がつながる条件</span>を探す。
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              御社が任せたい仕事を選ぶと、研修生本人が安定して力を発揮できる
              <br className="hidden sm:inline" />
              「持続可能な作業と回復の周期」と並べて比較できます。
            </p>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 group"
              >
                <span>御社の仕事を選んで試す</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => setShowAboutModal(true)}
                className="w-full sm:w-auto px-5 py-3 text-slate-600 hover:text-slate-900 font-semibold text-xs transition"
              >
                このシステムについて
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 画面1: 業務選択・確認画面 (Task Selection View) */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                Step 1
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                御社では、どのような仕事を任せたいですか？
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                比較したい仕事をお選びください。選択後に条件を確認・調整できます。
              </p>
            </div>

            {/* 3つの大型プリセットカード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {requirements.slice(0, 3).map((req) => {
                const isSelected = selectedRequirementId === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => onSelectRequirement(req.id)}
                    className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-50/50 border-purple-600 shadow-md ring-2 ring-purple-100'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg mb-3">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {req.taskName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {req.taskDescription}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span>想定: {req.expectedDurationMinutes}分</span>
                      <span>単位: {req.workUnit}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 自社業務の追加ボタン */}
            <div className="text-right">
              <button
                onClick={() => setShowNewReqModal(true)}
                className="text-xs text-purple-700 hover:text-purple-900 font-bold inline-flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>自社の別の仕事を新しく入力する</span>
              </button>
            </div>

            {/* 選択中要件の簡潔な確認 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-500">選択中の業務要件:</span>
                <div className="font-bold text-slate-800 text-sm">{activeRequirement.taskName}</div>
                <div className="text-slate-500 text-[11px] flex gap-3 pt-0.5">
                  <span>想定時間: <strong>{activeRequirement.expectedDurationMinutes}分</strong></span>
                  <span>許容範囲: <strong>{activeRequirement.acceptableDurationRange.min}〜{activeRequirement.acceptableDurationRange.max}分</strong></span>
                  <span>成果基準: <strong>{activeRequirement.expectedOutput}</strong></span>
                  <span>品質基準: <strong>{activeRequirement.requiredQuality}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep(0)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl font-semibold text-xs transition"
                >
                  戻る
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <span>この仕事で人財を見る</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 画面2: 研修生選択画面 (Trainee Selection View) */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                Step 2
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                その仕事と接続できそうな人を見てみますか？
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                異なる働き方や特性を持つ4名からお選びください。（架空のモデルケース・デモ用想定値）
              </p>
            </div>

            {/* 4名の簡潔カード */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trainees.map((t) => {
                const wc =
                  t.workCycles.find((c) =>
                    activeRequirement.taskName.includes('入力') || activeRequirement.taskName.includes('データ')
                      ? c.taskName.includes('入力') || c.taskName.includes('データ') || c.taskName.includes('照合')
                      : activeRequirement.taskName.includes('バナー') || activeRequirement.taskName.includes('Web')
                      ? c.taskName.includes('バナー') || c.taskName.includes('Web') || c.taskName.includes('画像')
                      : c.taskName.includes('マニュアル') || c.taskName.includes('手順書') || c.taskName.includes('メール')
                  ) || t.workCycles[0];

                return (
                  <div
                    key={t.id}
                    className="bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${t.avatarBg} text-white font-bold flex items-center justify-center text-sm shadow-sm`}
                          >
                            {t.codeName.slice(0, 1)}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900">{t.codeName}</h3>
                            <p className="text-[11px] text-slate-500">{t.targetJob}</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2">
                        <strong>合意就労条件: </strong>
                        {t.desiredWorkCondition.daysPerWeek} ({t.desiredWorkCondition.hoursPerDay})
                      </div>

                      {/* 関連模擬業務実績（1行） */}
                      {wc && (
                        <div className="text-xs text-slate-700 bg-purple-50/50 border border-purple-100 p-2.5 rounded-xl">
                          <span className="text-[10px] font-bold text-purple-700 block">
                            関連する作業・回復実績:
                          </span>
                          <span className="font-bold text-slate-800">
                            {wc.taskName} ({wc.workUnit})
                          </span>
                          : 作業{wc.workDurationMinutes}分 ＋ 回復{wc.recoveryDurationMinutes}分（{wc.qualityResult}）
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setActiveTrainee(t);
                        setStep(3);
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-purple-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>この人の働き方を見る</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>仕事を選び直す</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 画面3: 中核比較画面【体験の主役】 */}
        {/* （1366×768でスクロール不要・厳選されたファーストビュー） */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            {/* 上部ヘッダー部: 戻る & 対象情報 */}
            <div className="flex items-center justify-between pb-1">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>人財を選び直す</span>
              </button>
              <div className="text-xs text-slate-600">
                <span>仕事: <strong>{activeRequirement.taskName}</strong></span>
                <span className="mx-2 text-slate-300">|</span>
                <span>人財: <strong>{activeTrainee.codeName}</strong></span>
              </div>
            </div>

            {/* 1. 企業の期待と本人のワークサイクルのダイナミック比較 */}
            {relevantWorkCycle && (
              <WorkCycleChart
                requirement={activeRequirement}
                workCycle={relevantWorkCycle}
              />
            )}

            {/* 2. 3つの接続条件の短い要約 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* 🟢 すでに重なる条件 */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1">
                <span className="font-bold text-emerald-900 flex items-center gap-1 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>すでに重なる条件</span>
                </span>
                <p className="text-emerald-950 text-[11px] leading-relaxed line-clamp-2">
                  {connectionAnalysis.matchingPoints[0] || 'スピードと品質基準をクリアしています。'}
                </p>
              </div>

              {/* 🟡 調整で接続できる条件 */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-1">
                <span className="font-bold text-amber-900 flex items-center gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>調整で接続できる条件</span>
                </span>
                <p className="text-amber-950 text-[11px] leading-relaxed line-clamp-2">
                  {connectionAnalysis.adjustablePoints[0]?.title || '指示方法や余白時間の扱いの事前合意。'}
                </p>
              </div>

              {/* ⚪ まだ情報が不足している条件 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>まだ不足している情報</span>
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                  {connectionAnalysis.missingInfo[0] || '勤務時間全体での持続性（お試し実習で確認）。'}
                </p>
              </div>
            </div>

            {/* 3. 次へ進むアクションボタン（主役） */}
            <div className="pt-3 flex justify-center">
              <button
                onClick={() => setStep(4)}
                className="px-8 py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                <span>この接続を詳しく見る（トリセツ・配慮・対話へ）</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 画面4: 接続条件の深掘りと対話アクション (Detail & Action View) */}
        {/* （独立した専用画面） */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            {/* 上部ヘッダー部: 戻る */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>比較画面に戻る</span>
              </button>
              <div className="text-xs text-slate-600">
                <span>{activeTrainee.codeName} の詳細情報と対話アクション</span>
              </div>
            </div>

            {/* 1. 私のトリセツ (自己対処と合理的配慮) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>私のトリセツ（本人の自己対処と企業へお願いしたい配慮）</span>
              </h3>
              <p className="text-xs text-slate-500">
                本人が実践しているセルフケアと、企業にお願いしたい合理的配慮の対比です。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {activeTrainee.instructions.map((ins, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-semibold text-slate-800 text-[11px]">
                      ⚠️ {ins.characteristic}
                    </div>
                    <div className="bg-emerald-50 p-2 rounded text-emerald-900 text-[11px]">
                      <strong>🌱 本人の自己対処:</strong> {ins.selfCoping}
                    </div>
                    <div className="bg-indigo-50 p-2 rounded text-indigo-900 text-[11px]">
                      <strong>🤝 企業へのお願い:</strong> {ins.requestedSupport}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. 6軸レーダーチャート ＆ 成果物 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SkillRadarChart
                evaluations={activeTrainee.evaluations}
                companyName="御社の求める基準"
              />

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>模擬業務での実際の成果物見本</span>
                  </h4>
                  <div className="space-y-2.5">
                    {activeTrainee.portfolio.map((port, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded uppercase mr-2">
                          {port.type}
                        </span>
                        <strong className="text-slate-900">{port.title}</strong>
                        <p className="text-slate-600 text-[11px] mt-1">{port.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  合意到達日: {activeTrainee.publicSummary.consentedAt}（本人同意済み）
                </div>
              </div>
            </div>

            {/* 3. 対話アクションセクション */}
            <div className="bg-gradient-to-br from-purple-50 via-indigo-50/40 to-slate-50 border-2 border-purple-200 rounded-2xl p-6 shadow-sm text-center space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">
                この条件で、もう少し話してみますか？
              </h3>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                本システムは採用の合否判定ではありません。
                <br />
                まずは1〜3日のお試し実習やすり合わせ面談で、実際の職場環境での持続性を確認できます。
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setOfferType('trial');
                    setOfferDesiredWork(activeRequirement.taskName);
                    setShowOfferModal(true);
                  }}
                  className="px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-1.5"
                >
                  <Building2 className="w-4 h-4" />
                  <span>1〜3日のお試し実習を相談する</span>
                </button>
                <button
                  onClick={() => {
                    setOfferType('interview');
                    setOfferDesiredWork(activeRequirement.taskName);
                    setShowOfferModal(true);
                  }}
                  className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-sm transition flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4 text-purple-700" />
                  <span>すり合わせ面談を申し込む</span>
                </button>
              </div>

              <div className="pt-4 border-t border-purple-200/60 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
                <button
                  onClick={() => setStep(2)}
                  className="hover:text-purple-700 font-semibold"
                >
                  ← 別の人を見る
                </button>
                <span>・</span>
                <button
                  onClick={() => setStep(1)}
                  className="hover:text-purple-700 font-semibold"
                >
                  ← 別の仕事で比較する
                </button>
                <span>・</span>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="text-purple-700 hover:underline font-semibold flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>この体験について感想を送る</span>
                </button>
                <span>・</span>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="text-purple-700 hover:underline font-semibold flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>自社の求める業務をリクエストする</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* モーダル群 (オファー、リクエスト、アンケート、新規要件、システムについて) */}
      {/* ========================================================================= */}
      {/* 1. オファー送信モーダル */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 mb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {activeTrainee.codeName} へのすり合わせ打診
              </h3>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">打診の種別</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOfferType('trial')}
                    className={`py-1.5 text-center rounded-lg border font-bold text-xs ${
                      offerType === 'trial'
                        ? 'bg-purple-50 border-purple-600 text-purple-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    お試し実習（1〜3日）
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferType('interview')}
                    className={`py-1.5 text-center rounded-lg border font-bold text-xs ${
                      offerType === 'interview'
                        ? 'bg-purple-50 border-purple-600 text-purple-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    すり合わせ面談
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
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">任せたい想定業務</label>
                <input
                  type="text"
                  value={offerDesiredWork}
                  onChange={(e) => setOfferDesiredWork(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">メッセージ</label>
                <textarea
                  rows={2}
                  placeholder="作業周期（集中20分＋回復10分）を拝見しました。弊社のデータ入力業務で一度3日間の実習をお願いできないでしょうか。"
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">担当者名</label>
                  <input
                    type="text"
                    placeholder="浜松 太郎"
                    value={offerPerson}
                    onChange={(e) => setOfferPerson(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">連絡先メール</label>
                  <input
                    type="email"
                    placeholder="taro@example.com"
                    value={offerEmail}
                    onChange={(e) => setOfferEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs shadow"
                >
                  送信する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. 業務リクエスト投稿モーダル */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 mb-3">
              <h3 className="font-bold text-sm text-slate-900">求めるスキル・業務リクエスト</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSkillRequest} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">業務タイトル</label>
                <input
                  type="text"
                  required
                  placeholder="例: 月次の領収書PDFスキャンとExcel入力"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">業務内容</label>
                <textarea
                  rows={3}
                  required
                  placeholder="毎月100件程度の領収書データを転記してほしい。"
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 mb-3">
              <h3 className="font-bold text-sm text-slate-900">体験アンケート・ご感想</h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  このダッシュボードは採用・実習検討に役立ちそうでしょうか？
                </label>
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      type="button"
                      key={score}
                      onClick={() => setSurveyScore(score)}
                      className={`flex-1 py-1.5 text-center rounded-lg border font-bold text-xs ${
                        surveyScore === score
                          ? 'bg-purple-700 text-white border-purple-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      ★ {score}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ご感想・フィードバック</label>
                <textarea
                  rows={2}
                  placeholder="「作業時間＋回復時間」という見せ方が具体的で、任せる仕事のイメージがつきやすい。"
                  value={surveyImpressions}
                  onChange={(e) => setSurveyImpressions(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs shadow"
                >
                  感想を送信
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. 新規業務要件登録モーダル */}
      {showNewReqModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 mb-3">
              <h3 className="font-bold text-sm text-slate-900">自社の業務要件を追加登録</h3>
              <button
                onClick={() => setShowNewReqModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewRequirement} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">業務名</label>
                <input
                  type="text"
                  required
                  placeholder="例: 在庫リストの照合・データ入力"
                  value={newReqTaskName}
                  onChange={(e) => setNewReqTaskName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">具体的な業務内容</label>
                <textarea
                  rows={2}
                  placeholder="入出荷伝票と基幹システムの在庫数を照合する作業。"
                  value={newReqDesc}
                  onChange={(e) => setNewReqDesc(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">作業単位</label>
                  <input
                    type="text"
                    placeholder="例: 10件"
                    value={newReqUnit}
                    onChange={(e) => setNewReqUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">想定作業時間 (分)</label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={newReqExpectedMinutes}
                    onChange={(e) => setNewReqExpectedMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewReqModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs shadow"
                >
                  登録して比較へ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. このシステムについてモーダル */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-3">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-200 pb-2">
              人を仕事に合わせるのではなく、人と仕事がつながる条件を探す
            </h3>
            <p className="text-slate-600 leading-relaxed">
              本システムは、研修生の弱点や能力の不足を一方的に測定するものではありません。
              本人が安定して力を発揮できる「持続可能な作業周期（集中＋回復）」と、企業の具体的な業務要件の双方を可視化し、接続できる条件を対話するための「働き方の設計図」です。
            </p>
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
    </div>
  );
};
