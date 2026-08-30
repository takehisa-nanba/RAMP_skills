'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface CompanyExperienceViewProps {
  trainees: TraineeProfile[];
  requirements: CompanyWorkRequirement[];
  selectedRequirementId: string;
  onSelectRequirement: (id: string) => void;
  onDataChange: () => void;
  onReturnToStart?: () => void;
}

export const CompanyExperienceView: React.FC<CompanyExperienceViewProps> = ({
  trainees,
  requirements,
  selectedRequirementId,
  onSelectRequirement,
  onDataChange,
  onReturnToStart,
}) => {
  // ステップ管理 (0: 開始, 1: 業務選択, 2: 人財選択, 3: 中核比較, 4: 詳細確認・対話アクション)
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);

  // メインコピー用ステート (1行目0.6sフェード、2行目0.45s開始・全文2sタイプライター)
  const fullText1 = '人を仕事に合わせるのではなく、';
  const fullText2 = '人と仕事がつながる条件で探す。';
  const [line1Visible, setLine1Visible] = useState(false);
  const [typedChars2, setTypedChars2] = useState(0);
  const [isTypingDone, setIsTypingDone] = useState(false);

  useEffect(() => {
    if (step === 0) {
      setLine1Visible(false);
      setTypedChars2(0);
      setIsTypingDone(false);

      // 1. 1行目の0.6sフェードイン
      const frameId = requestAnimationFrame(() => {
        setLine1Visible(true);
      });

      // 2. 0.45秒後に2行目のタイピング開始（全17文字を2.0秒で表示、1文字約117.6ms）
      const charInterval = 2000 / fullText2.length;
      let currentChars = 0;
      let timerId: NodeJS.Timeout;

      const startTimer = setTimeout(() => {
        const typeNext = () => {
          currentChars += 1;
          setTypedChars2(currentChars);

          if (currentChars >= fullText2.length) {
            setIsTypingDone(true);
            return;
          }

          timerId = setTimeout(typeNext, charInterval);
        };

        typeNext();
      }, 450);

      return () => {
        cancelAnimationFrame(frameId);
        clearTimeout(startTimer);
        clearTimeout(timerId);
      };
    }
  }, [step, fullText2.length]);

  const handleSkipTyping = () => {
    setLine1Visible(true);
    setTypedChars2(fullText2.length);
    setIsTypingDone(true);
  };

  useEffect(() => {
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

  // モーダル管理
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showNewReqModal, setShowNewReqModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // フォーム状態
  const [offerType, setOfferType] = useState<'trial' | 'interview'>('trial');
  const [offerDesiredWork, setOfferDesiredWork] = useState(activeRequirement?.taskName || '');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerCompany, setOfferCompany] = useState(activeRequirement?.companyName || '');
  const [offerPerson, setOfferPerson] = useState('');
  const [offerEmail, setOfferEmail] = useState('');

  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqWorkUnit, setReqWorkUnit] = useState('10件');
  const [reqExpectedDuration, setReqExpectedDuration] = useState('60分');

  const [surveyScore, setSurveyScore] = useState(5);
  const [surveyRole, setSurveyRole] = useState('人事・採用担当');
  const [surveyImpressions, setSurveyImpressions] = useState('');
  const [surveyNeededInfo, setSurveyNeededInfo] = useState('');

  const [newReqTaskName, setNewReqTaskName] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  const [newReqExpectedMinutes, setNewReqExpectedMinutes] = useState(60);
  const [newReqUnit, setNewReqUnit] = useState('10件');

  const [toastInfo, setToastInfo] = useState<{ message: string; autoReturn?: boolean } | null>(null);
  const returnTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToastWithAutoReturn = (msg: string) => {
    if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    setToastInfo({ message: msg, autoReturn: true });

    // 3.5秒後に自動的に画面0へ戻り、次の企業様へ交代
    returnTimerRef.current = setTimeout(() => {
      setToastInfo(null);
      setStep(0);
      if (onReturnToStart) onReturnToStart();
    }, 3500);
  };

  const handleImmediateReturn = () => {
    if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    setToastInfo(null);
    setStep(0);
    if (onReturnToStart) onReturnToStart();
  };

  const connectionAnalysis: ConnectionAnalysis = analyzeConnection(
    activeRequirement,
    activeTrainee
  );

  const relevantWorkCycle =
    activeTrainee.workCycles.find((wc) =>
      activeRequirement.taskName.includes('入力') || activeRequirement.taskName.includes('データ')
        ? wc.taskName.includes('入力') || wc.taskName.includes('データ') || wc.taskName.includes('照合')
        : activeRequirement.taskName.includes('バナー') || activeRequirement.taskName.includes('Web')
        ? wc.taskName.includes('バナー') || wc.taskName.includes('Web') || wc.taskName.includes('画像')
        : wc.taskName.includes('マニュアル') || wc.taskName.includes('手順書') || wc.taskName.includes('メール')
    ) || activeTrainee.workCycles[0];

  // 業務合致判定
  const isMatchingTrainee = (t: TraineeProfile) => {
    const rName = activeRequirement.taskName;
    if (rName.includes('入力') || rName.includes('仕訳') || rName.includes('データ')) {
      return t.id === 'trainee-a';
    }
    if (rName.includes('バナー') || rName.includes('Web') || rName.includes('画像')) {
      return t.id === 'trainee-b';
    }
    if (rName.includes('マニュアル') || rName.includes('手順書') || rName.includes('IT')) {
      return t.id === 'trainee-c';
    }
    if (rName.includes('メール') || rName.includes('校正') || rName.includes('文書')) {
      return t.id === 'trainee-d';
    }
    return false;
  };

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
    showToastWithAutoReturn('🎉 オファーを送信しました！次の企業様へ交代するため、メイン画面へ戻ります');
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
    showToastWithAutoReturn('💡 業務リクエストを投稿しました！次の企業様へ交代するため、メイン画面へ戻ります');
  };

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
    showToastWithAutoReturn('📝 貴重なご感想をありがとうございました！次の企業様へ交代するため、メイン画面へ戻ります');
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
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-2 min-h-[calc(100vh-3rem)] flex flex-col justify-between">
      <div>
        {/* トースト（自動復帰案内付き） */}
        {toastInfo && (
          <div className="mb-3 bg-purple-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-base font-bold animate-fadeIn flex items-center justify-between border-2 border-purple-400">
            <span className="flex items-center gap-2">
              <span>{toastInfo.message}</span>
            </span>
            {toastInfo.autoReturn && (
              <button
                onClick={handleImmediateReturn}
                className="ml-4 px-4 py-1.5 bg-white text-purple-950 rounded-xl text-sm font-black hover:bg-purple-100 transition whitespace-nowrap shadow"
              >
                今すぐメイン画面へ戻る ➔
              </button>
            )}
          </div>
        )}

        {/* パンくず型ステップ進行バー (1行で綺麗に収める) */}
        {step > 0 && (
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1.5 mb-2 text-sm sm:text-base text-slate-600">
            <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden">
              <button
                onClick={() => setStep(1)}
                className={`font-bold transition whitespace-nowrap ${
                  step === 1 ? 'text-purple-700 underline underline-offset-4' : 'hover:text-slate-900'
                }`}
              >
                1. 仕事を選ぶ
              </button>
              <span className="text-slate-400">›</span>
              <button
                onClick={() => setStep(2)}
                className={`font-bold transition whitespace-nowrap ${
                  step === 2 ? 'text-purple-700 underline underline-offset-4' : 'hover:text-slate-900'
                }`}
              >
                2. 人を見る
              </button>
              <span className="text-slate-400">›</span>
              <button
                onClick={() => setStep(3)}
                className={`font-bold transition whitespace-nowrap ${
                  step === 3 ? 'text-purple-700 underline underline-offset-4' : 'hover:text-slate-900'
                }`}
              >
                3. 働き方を比べる
              </button>
              <span className="text-slate-400">›</span>
              <button
                onClick={() => setStep(4)}
                className={`font-bold transition whitespace-nowrap ${
                  step === 4 ? 'text-purple-700 underline underline-offset-4' : 'hover:text-slate-900'
                }`}
              >
                4. 詳しく確認・対話へ
              </button>
            </div>

            <div className="text-sm sm:text-base text-slate-500 font-semibold hidden md:block whitespace-nowrap">
              選択中: <strong className="text-slate-800">{activeRequirement.taskName}</strong> / <strong className="text-slate-800">{activeTrainee.codeName}</strong>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 画面0: デモ開始画面 (Start View) - max-w-5xl & タイプライター演出 */}
        {/* ========================================================================= */}
        {step === 0 && (
          <div
            onClick={handleSkipTyping}
            className="py-10 sm:py-20 text-center space-y-8 max-w-5xl mx-auto animate-fadeIn cursor-pointer select-none"
            title="クリックでアニメーションをスキップ"
          >
            <div className="inline-block px-4 py-1.5 bg-purple-50 text-purple-700 border-2 border-purple-200 rounded-full text-sm font-black tracking-widest uppercase">
              体験型デモ
            </div>

            {/* メインコピー（1行目0.6sフェード、2行目0.45sから1文字ずつタイピング 全文2s） */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-slate-900 leading-tight tracking-tight min-h-[140px] sm:min-h-[160px] flex flex-col justify-center">
              <span
                className={`transition-all duration-600 ease-out ${
                  line1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
              >
                {fullText1}
              </span>
              <span className="text-purple-700 min-h-[1.3em]">
                {fullText2.slice(0, typedChars2)}
                {!isTypingDone && typedChars2 > 0 && (
                  <span className="inline-block w-1.5 h-10 sm:h-12 bg-purple-700 animate-pulse ml-1 align-middle"></span>
                )}
              </span>
            </h1>

            {/* 説明文＆ボタン（2行目のタイピング完了後にフェードイン） */}
            <div
              className={`space-y-8 transition-opacity duration-700 ${
                isTypingDone ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <p className="text-xl sm:text-2xl text-slate-600 font-medium leading-relaxed max-w-3xl mx-auto">
                御社が任せたい仕事を選ぶと、研修生本人が安定して力を発揮できる
                <br className="hidden sm:inline" />
                「持続可能な作業と回復の周期」と並べて比較できます。
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setStep(1);
                  }}
                  className="w-full sm:w-auto px-10 py-5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xl rounded-2xl shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-3 group"
                >
                  <span>御社の仕事を選んで試す</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAboutModal(true);
                  }}
                  className="w-full sm:w-auto px-6 py-4 text-slate-700 hover:text-slate-900 font-bold text-lg transition"
                >
                  このシステムについて
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 画面1: 業務選択・確認画面 (Task Selection View) */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <span className="text-base font-black text-purple-700 tracking-wider">
                STEP 1
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
                御社では、どのような仕事を任せたいですか？
              </h2>
              <p className="text-lg text-slate-600 mt-1.5 font-medium">
                比較したい仕事をお選びください。選択後に条件を確認・調整できます。
              </p>
            </div>

            {/* 3つの大型プリセットカード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {requirements.slice(0, 3).map((req) => {
                const isSelected = selectedRequirementId === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => onSelectRequirement(req.id)}
                    className={`p-6 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'bg-purple-50/60 border-purple-600 shadow-lg ring-4 ring-purple-100'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl mb-4">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <h3 className="font-black text-xl sm:text-2xl text-slate-900 leading-snug">
                        {req.taskName}
                      </h3>
                      <p className="text-base sm:text-lg text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                        {req.taskDescription}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-lg font-black text-purple-900">
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
                className="text-base text-purple-700 hover:text-purple-900 font-bold inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>自社の別の仕事を新しく入力する</span>
              </button>
            </div>

            {/* 選択中要件の確認バー（戻るボタン ＆ 次へボタン配置） */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-sm font-black text-slate-500 uppercase tracking-wider">
                  選択中の業務要件:
                </span>
                <div className="font-black text-slate-900 text-2xl">{activeRequirement.taskName}</div>
                <div className="text-slate-700 text-base font-medium flex flex-wrap gap-4 pt-1">
                  <span>想定時間: <strong>{activeRequirement.expectedDurationMinutes}分</strong></span>
                  <span>許容範囲: <strong>{activeRequirement.acceptableDurationRange.min}〜{activeRequirement.acceptableDurationRange.max}分</strong></span>
                  <span>成果基準: <strong>{activeRequirement.expectedOutput}</strong></span>
                  <span>品質基準: <strong>{activeRequirement.requiredQuality}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="px-6 py-4 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-lg border-2 border-slate-300 transition flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>デモ開始へ戻る</span>
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-4 bg-purple-700 hover:bg-purple-800 text-white font-black text-lg rounded-xl shadow-lg hover:shadow-xl transition flex items-center gap-2"
                >
                  <span>この仕事で人財を見る</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 画面2: 研修生選択画面 (Trainee Selection View) - 業務合致ハイライト */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <span className="text-base font-black text-purple-700 tracking-wider">
                STEP 2
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
                その仕事と接続できそうな人を見てみますか？
              </h2>
              <p className="text-lg text-slate-600 mt-1.5 font-medium">
                異なる働き方や特性を持つ4名からお選びください。（架空のモデルケース・デモ用想定値）
              </p>
            </div>

            {/* 4名の大型カード（業務合致ハイライト付き） */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {trainees.map((t) => {
                const isMatch = isMatchingTrainee(t);
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
                    className={`bg-white border-2 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 relative ${
                      isMatch
                        ? 'border-purple-500 ring-4 ring-purple-100 bg-gradient-to-b from-purple-50/40 to-white'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    {/* 業務合致ハイライトバッジ */}
                    {isMatch && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-700 text-white rounded-full text-xs font-black self-start shadow-sm tracking-wide">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>選択中の業務（{activeRequirement.taskName}）の実績あり</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${t.avatarBg} text-white font-black flex items-center justify-center text-lg shadow-sm`}
                        >
                          {t.codeName.slice(0, 1)}
                        </div>
                        <div>
                          <h3 className="font-black text-2xl text-slate-900">{t.codeName}</h3>
                          <p className="text-base font-semibold text-slate-500">{t.targetJob}</p>
                        </div>
                      </div>

                      <div className="text-base text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
                        <strong>合意就労条件: </strong>
                        {t.desiredWorkCondition.daysPerWeek} ({t.desiredWorkCondition.hoursPerDay})
                      </div>

                      {wc && (
                        <div
                          className={`text-base p-3.5 rounded-xl space-y-1 ${
                            isMatch
                              ? 'bg-purple-100/70 border-2 border-purple-300 text-slate-900'
                              : 'bg-slate-50 border border-slate-200 text-slate-800'
                          }`}
                        >
                          <span className="text-sm font-black text-purple-700 uppercase tracking-wide block">
                            関連する作業・回復実績:
                          </span>
                          <div className="font-black text-lg text-slate-900">
                            {wc.taskName} ({wc.workUnit})
                          </div>
                          <div className="text-base font-bold text-purple-900">
                            作業{wc.workDurationMinutes}分 ＋ 回復{wc.recoveryDurationMinutes}分（{wc.qualityResult}）
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setActiveTrainee(t);
                        setStep(3);
                      }}
                      className={`w-full py-4 rounded-xl font-black text-lg transition flex items-center justify-center gap-2 shadow ${
                        isMatch
                          ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-purple-200'
                          : 'bg-slate-900 hover:bg-purple-700 text-white'
                      }`}
                    >
                      <span>この人の働き方を見る</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 画面下部の戻るボタン */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-base border-2 border-slate-300 transition flex items-center gap-2 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>仕事を選び直す</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 画面3: 中核比較画面【体験の主役】 */}
        {/* （1366×768でスクロールなし完全収容・戻る/次へ並列配置） */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-3 animate-fadeIn">
            {/* 1. 企業の期待と本人のワークサイクルのダイナミック比較（主役数値 48px〜54px） */}
            {relevantWorkCycle && (
              <WorkCycleChart
                requirement={activeRequirement}
                workCycle={relevantWorkCycle}
              />
            )}

            {/* 2. 3つの接続条件の短い要約 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 🟢 すでに重なる条件 */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3 space-y-0.5 shadow-sm">
                <span className="font-black text-emerald-900 flex items-center gap-1.5 text-base sm:text-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>すでに重なる条件</span>
                </span>
                <p className="text-emerald-950 text-sm sm:text-base font-medium leading-snug line-clamp-2">
                  {connectionAnalysis.matchingPoints[0] || 'スピードと品質基準をクリアしています。'}
                </p>
              </div>

              {/* 🟡 調整で接続できる条件 */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 space-y-0.5 shadow-sm">
                <span className="font-black text-amber-900 flex items-center gap-1.5 text-base sm:text-lg">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>調整で接続できる条件</span>
                </span>
                <p className="text-amber-950 text-sm sm:text-base font-medium leading-snug line-clamp-2">
                  {connectionAnalysis.adjustablePoints[0]?.title || '指示方法や余白時間の扱いの事前合意。'}
                </p>
              </div>

              {/* ⚪ まだ情報が不足している条件 */}
              <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-3 space-y-0.5 shadow-sm">
                <span className="font-black text-slate-800 flex items-center gap-1.5 text-base sm:text-lg">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span>まだ不足している情報</span>
                </span>
                <p className="text-slate-700 text-sm sm:text-base font-medium leading-snug line-clamp-2">
                  {connectionAnalysis.missingInfo[0] || '勤務時間全体での持続性（お試し実習で確認）。'}
                </p>
              </div>
            </div>

            {/* 3. 主要アクションエリア（戻るボタン ＆ 次へボタン並列配置） */}
            <div className="pt-2 pb-1 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-base sm:text-lg rounded-2xl border-2 border-slate-300 transition flex items-center gap-2 shadow"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>人財を選び直す</span>
              </button>

              <button
                onClick={() => setStep(4)}
                className="px-10 py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-lg sm:text-xl rounded-2xl shadow-xl hover:shadow-2xl transition flex items-center gap-3"
              >
                <span>この接続を詳しく見る（トリセツ・配慮・対話へ）</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 画面4: 接続条件の深掘りと対話アクション (Detail & Action View) */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="space-y-8 animate-fadeIn pb-6">
            {/* 上部ヘッダー部: 戻る */}
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200">
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 text-base text-slate-600 hover:text-slate-900 font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>働き方の比較に戻る</span>
              </button>
              <div className="text-lg font-bold text-slate-700">
                {activeTrainee.codeName} の詳細情報と対話アクション
              </div>
            </div>

            {/* 1. 私のトリセツ (自己対処と合理的配慮) */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-black text-2xl text-slate-900 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-rose-500" />
                  <span>私のトリセツ（本人の自己対処と企業へお願いしたい配慮）</span>
                </h3>
                <p className="text-base text-slate-600 mt-1 font-medium">
                  本人が実践しているセルフケアと、企業にお願いしたい合理的配慮の対比です。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTrainee.instructions.map((ins, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-2">
                    <div className="font-black text-slate-900 text-lg">
                      ⚠️ {ins.characteristic}
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl text-emerald-950 text-base font-semibold border border-emerald-200">
                      <strong>🌱 本人の自己対処:</strong> {ins.selfCoping}
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-950 text-base font-semibold border border-indigo-200">
                      <strong>🤝 企業へのお願い:</strong> {ins.requestedSupport}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. 6軸レーダーチャート ＆ 成果物 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkillRadarChart
                evaluations={activeTrainee.evaluations}
                companyName="御社の求める基準"
              />

              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Award className="w-6 h-6 text-indigo-600" />
                    <span>模擬業務での実際の成果物見本</span>
                  </h4>
                  <div className="space-y-3.5">
                    {activeTrainee.portfolio.map((port, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border-2 border-slate-200 text-base">
                        <span className="text-xs bg-indigo-100 text-indigo-900 font-black px-2 py-0.5 rounded uppercase mr-2 border border-indigo-200">
                          {port.type}
                        </span>
                        <strong className="text-slate-900 font-black">{port.title}</strong>
                        <p className="text-slate-600 text-base mt-1 font-medium">{port.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-200 text-base text-slate-500 font-semibold">
                  合意到達日: {activeTrainee.publicSummary.consentedAt}（本人同意済み）
                </div>
              </div>
            </div>

            {/* 3. 対話アクションセクション */}
            <div className="bg-gradient-to-br from-purple-50 via-indigo-50/40 to-slate-50 border-2 border-purple-300 rounded-3xl p-8 shadow-sm text-center space-y-5">
              <h3 className="text-3xl font-black text-slate-900">
                この条件で、もう少し話してみますか？
              </h3>
              <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed font-medium">
                本システムは採用の合否判定ではありません。
                <br />
                まずは1〜3日のお試し実習やすり合わせ面談で、実際の職場環境での持続性を確認できます。
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => {
                    setOfferType('trial');
                    setOfferDesiredWork(activeRequirement.taskName);
                    setShowOfferModal(true);
                  }}
                  className="px-8 py-4.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xl rounded-2xl shadow-lg hover:shadow-xl transition flex items-center gap-2.5"
                >
                  <Building2 className="w-5 h-5" />
                  <span>1〜3日のお試し実習を相談する</span>
                </button>
                <button
                  onClick={() => {
                    setOfferType('interview');
                    setOfferDesiredWork(activeRequirement.taskName);
                    setShowOfferModal(true);
                  }}
                  className="px-8 py-4.5 bg-white hover:bg-slate-50 text-slate-900 font-black text-xl rounded-2xl border-2 border-slate-300 shadow transition flex items-center gap-2.5"
                >
                  <Send className="w-5 h-5 text-purple-700" />
                  <span>すり合わせ面談を申し込む</span>
                </button>
              </div>

              <div className="pt-6 border-t border-purple-200 flex flex-wrap items-center justify-center gap-6 text-base text-slate-600 font-bold">
                <button
                  onClick={() => setStep(3)}
                  className="hover:text-purple-700 transition"
                >
                  ← 比較画面に戻る
                </button>
                <span>・</span>
                <button
                  onClick={() => setStep(2)}
                  className="hover:text-purple-700 transition"
                >
                  ← 別の人を見る
                </button>
                <span>・</span>
                <button
                  onClick={() => setStep(1)}
                  className="hover:text-purple-700 transition"
                >
                  ← 別の仕事で比較する
                </button>
                <span>・</span>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="text-purple-700 hover:underline flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>この体験について感想を送る</span>
                </button>
                <span>・</span>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="text-purple-700 hover:underline flex items-center gap-1.5"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>自社の求める業務をリクエストする</span>
                </button>
              </div>

              {/* 次の企業様へ交代するリセットボタン */}
              <div className="pt-6 mt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setStep(0);
                    if (onReturnToStart) onReturnToStart();
                  }}
                  className="px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-black text-base rounded-xl border-2 border-slate-300 transition inline-flex items-center gap-2 shadow-sm hover:shadow"
                >
                  <RotateCcw className="w-4 h-4 text-purple-700" />
                  <span>最初から試す（次の企業様へ交代）</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* モーダル群 */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-7 shadow-2xl border-2 border-slate-200 text-base">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-black text-xl text-slate-900">
                {activeTrainee.codeName} へのすり合わせ打診
              </h3>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">打診の種別</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOfferType('trial')}
                    className={`py-2 text-center rounded-xl border-2 font-bold text-base ${
                      offerType === 'trial'
                        ? 'bg-purple-50 border-purple-700 text-purple-800'
                        : 'border-slate-300 text-slate-700'
                    }`}
                  >
                    お試し実習（1〜3日）
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferType('interview')}
                    className={`py-2 text-center rounded-xl border-2 font-bold text-base ${
                      offerType === 'interview'
                        ? 'bg-purple-50 border-purple-700 text-purple-800'
                        : 'border-slate-300 text-slate-700'
                    }`}
                  >
                    すり合わせ面談
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">御社名</label>
                <input
                  type="text"
                  required
                  placeholder="例: 株式会社〇〇製作所"
                  value={offerCompany}
                  onChange={(e) => setOfferCompany(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">任せたい想定業務</label>
                <input
                  type="text"
                  value={offerDesiredWork}
                  onChange={(e) => setOfferDesiredWork(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">メッセージ</label>
                <textarea
                  rows={2}
                  placeholder="作業周期（集中20分＋回復10分）を拝見しました。弊社のデータ入力業務で一度3日間の実習をお願いできないでしょうか。"
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">担当者名</label>
                  <input
                    type="text"
                    placeholder="浜松 太郎"
                    value={offerPerson}
                    onChange={(e) => setOfferPerson(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-base"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">連絡先メール</label>
                  <input
                    type="email"
                    placeholder="taro@example.com"
                    value={offerEmail}
                    onChange={(e) => setOfferEmail(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-base"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-base font-bold"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl text-base shadow"
                >
                  送信する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-7 shadow-2xl border-2 border-slate-200 text-base">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-black text-xl text-slate-900">体験アンケート・ご感想</h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  このダッシュボードは採用・実習検討に役立ちそうでしょうか？
                </label>
                <div className="flex items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      type="button"
                      key={score}
                      onClick={() => setSurveyScore(score)}
                      className={`flex-1 py-2 text-center rounded-xl border-2 font-black text-lg ${
                        surveyScore === score
                          ? 'bg-purple-700 text-white border-purple-700'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      ★ {score}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">ご感想・フィードバック</label>
                <textarea
                  rows={3}
                  placeholder="「作業時間＋回復時間」という見せ方が具体的で、任せる仕事のイメージがつきやすい。"
                  value={surveyImpressions}
                  onChange={(e) => setSurveyImpressions(e.target.value)}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl text-base"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-base font-bold"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl text-base shadow"
                >
                  感想を送信
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-7 shadow-2xl border-2 border-slate-200 text-base">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-black text-xl text-slate-900">求めるスキル・業務リクエスト</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSkillRequest} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">業務タイトル</label>
                <input
                  type="text"
                  required
                  placeholder="例: 月次の領収書PDFスキャンとExcel入力"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">業務内容</label>
                <textarea
                  rows={3}
                  required
                  placeholder="毎月100件程度の領収書データを転記してほしい。"
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl text-base"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-base font-bold"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-base shadow"
                >
                  リクエストを投稿
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewReqModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-7 shadow-2xl border-2 border-slate-200 text-base">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-black text-xl text-slate-900">自社の業務要件を追加登録</h3>
              <button
                onClick={() => setShowNewReqModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewRequirement} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">業務名</label>
                <input
                  type="text"
                  required
                  placeholder="例: 在庫リストの照合・データ入力"
                  value={newReqTaskName}
                  onChange={(e) => setNewReqTaskName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">具体的な業務内容</label>
                <textarea
                  rows={2}
                  placeholder="入出荷伝票と基幹システムの在庫数を照合する作業。"
                  value={newReqDesc}
                  onChange={(e) => setNewReqDesc(e.target.value)}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">作業単位</label>
                  <input
                    type="text"
                    placeholder="例: 10件"
                    value={newReqUnit}
                    onChange={(e) => setNewReqUnit(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-base"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">想定作業時間 (分)</label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={newReqExpectedMinutes}
                    onChange={(e) => setNewReqExpectedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-base"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewReqModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-base font-bold"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl text-base shadow"
                >
                  登録して比較へ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAboutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl border-2 border-slate-200 text-base space-y-4">
            <h3 className="font-black text-2xl text-slate-900 border-b border-slate-200 pb-3">
              人を仕事に合わせるのではなく、人と仕事がつながる条件を探す
            </h3>
            <p className="text-slate-700 leading-relaxed font-medium">
              本システムは、研修生の弱点や能力の不足を一方的に測定するものではありません。
              本人が安定して力を発揮できる「持続可能な作業周期（集中＋回復）」と、企業の具体的な業務要件の双方を可視化し、接続できる条件を対話するための「働き方の設計図」です。
            </p>
            <div className="text-right pt-3">
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-base"
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
