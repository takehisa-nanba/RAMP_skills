'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  TraineeProfile,
  CompanyWorkRequirement,
  ConnectionAnalysis,
  TaskCategory,
  EarlyFinishHandling,
  WorkCycleEvidence,
} from '../../types';
import { WorkCycleChart } from '../charts/WorkCycleChart';
import { SkillRadarChart } from '../charts/SkillRadarChart';
import { AboutSystemModal } from '../modals/AboutSystemModal';
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
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// 業務カテゴリごとの選択肢プリセット（3〜5回の選択で完了可能・自由記述ゼロ対応）
const CATEGORY_PRESETS: Record<
  TaskCategory,
  {
    label: string;
    tasks: string[];
    defaultUnit: string;
    unitOptions: string[];
    qualityOptions: string[];
  }
> = {
  data_entry: {
    label: 'データ入力・照合',
    tasks: [
      '領収書・請求書のデータ入力と照合',
      '名刺・アンケートのデータ化・表記正規化',
      '商品台帳・IT資産シリアル照合入力',
    ],
    defaultUnit: '10件',
    unitOptions: ['5件', '10件', '20件', '数量は相談したい'],
    qualityOptions: [
      '入力ミス0件',
      'セルフチェック完了',
      'ダブルチェック前提',
      '軽微な修正は許容',
      'お試し実習で確認したい',
    ],
  },
  web_banner: {
    label: 'Webバナー・画像編集',
    tasks: [
      '自社メディア用バナーのリサイズ・文言入替',
      'EC商品画像のトリミング・背景白抜き',
      'SNS告知用サムネイルのテンプレート制作',
    ],
    defaultUnit: '3サイズ 1セット',
    unitOptions: ['1点', '3サイズ', '5点', '数量は相談したい'],
    qualityOptions: [
      '指定サイズを満たす',
      '見本・テンプレートに沿う',
      'ブランドカラーを守る',
      '修正1〜2回を想定',
      'お試し実習で確認したい',
    ],
  },
  manual_creation: {
    label: 'マニュアル・手順書作成',
    tasks: [
      '社内ツールの操作マニュアル作成',
      'PCキッティング・周辺機器セットアップ手順書',
      '備品管理・棚卸しマニュアル作成',
    ],
    defaultUnit: 'マニュアル 3ページ',
    unitOptions: ['1ページ', '3ページ', '5ページ', 'ページ数より完成度を重視', '数量は相談したい'],
    qualityOptions: [
      '指定ページ数を満たす',
      '画像・スクリーンショットを含む',
      '初見の人でも操作できる',
      '支援者・担当者の確認後に完成',
      'お試し実習で確認したい',
    ],
  },
  document_editing: {
    label: '文書校正・メール対応',
    tasks: [
      '社内報・広報記事の校正・表記揺れチェック',
      '定型ビジネスメール・問い合わせ返信文作成',
      '契約書・規程集のフォーマット整合性チェック',
    ],
    defaultUnit: '記事2本 (A4 4枚)',
    unitOptions: ['5件', '10件', '20件', '数量は相談したい'],
    qualityOptions: [
      '誤字脱字0件',
      '社内用語ガイドライン準拠',
      '敬語・マナー基準を満たす',
      '支援者・担当者チェック前提',
      'お試し実習で確認したい',
    ],
  },
  general: {
    label: '一般事務・その他',
    tasks: ['社内ファイリング・書類整理', '備品在庫チェック・発注準備', 'その他定常業務'],
    defaultUnit: '1回 (1式)',
    unitOptions: ['1業務', '1回 (1式)', '数量は相談したい'],
    qualityOptions: ['手順書どおりの遂行', 'チェックリスト完了', 'お試し実習で確認したい'],
  },
};

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

  // アニメーション定数（1行目1.0sフェード、2行目0.45s開始・全文2.5sタイプライター）
  const FADE_DURATION_MS = 1000;
  const TYPE_TOTAL_MS = 2500;
  const START_DELAY_MS = 450;

  const fullText1 = '人を仕事に合わせるのではなく、';
  const fullText2 = '人と仕事がつながる条件で探す。';
  const [line1Visible, setLine1Visible] = useState(false);
  const [typedChars2, setTypedChars2] = useState(0);
  const [isTypingDone, setIsTypingDone] = useState(false);

  useEffect(() => {
    if (step === 0) {
      // 動きを抑える設定（prefers-reduced-motion）の場合は即時完了
      if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        setLine1Visible(true);
        setTypedChars2(fullText2.length);
        setIsTypingDone(true);
        return;
      }

      setLine1Visible(false);
      setTypedChars2(0);
      setIsTypingDone(false);

      // 1. 1行目のフェードイン（約1.0s）
      const frameId = requestAnimationFrame(() => {
        setLine1Visible(true);
      });

      // 2. 0.45秒後に2行目のタイピング開始（全文字を約2.5秒で表示）
      const charInterval = TYPE_TOTAL_MS / fullText2.length;
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
      }, START_DELAY_MS);

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
      const p = params.get('reqPage');
      if (p !== null && !isNaN(Number(p))) {
        setReqPage(Number(p));
      }
      const tId = params.get('trainee');
      if (tId) {
        const found = trainees.find((t) => t.id === tId);
        if (found) setActiveTrainee(found);
      }
    }
  }, [trainees]);

  // 選択中の業務要件
  const activeRequirement =
    requirements.find((r) => r.id === selectedRequirementId) || requirements[0];

  // 業務一覧のページネーション（1画面5件表示・左右切り替え）
  const ITEMS_PER_PAGE = 5;
  const [reqPage, setReqPage] = useState(0);
  const totalReqPages = Math.max(1, Math.ceil(requirements.length / ITEMS_PER_PAGE));
  const displayedRequirements = requirements.slice(
    reqPage * ITEMS_PER_PAGE,
    (reqPage + 1) * ITEMS_PER_PAGE
  );

  const handleDeleteRequirement = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('この自社業務要件を一覧から削除しますか？')) {
      const success = StorageService.deleteCompanyRequirement(id);
      if (success) {
        onDataChange();
        if (selectedRequirementId === id) {
          const fallback = requirements.find((r) => r.id !== id);
          if (fallback) {
            onSelectRequirement(fallback.id);
          }
        }
      }
    }
  };

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

  // 自社業務登録フォーム状態（選択式UI・2段階入力・自動デフォルト廃止）
  const [newReqCategory, setNewReqCategory] = useState<TaskCategory>('data_entry');
  const [newReqPresetTask, setNewReqPresetTask] = useState('領収書・請求書のデータ入力と照合');
  const [newReqCustomTaskName, setNewReqCustomTaskName] = useState('');
  const [newReqDurationPreset, setNewReqDurationPreset] = useState('60分以内');
  const [newReqExpectedMinutes, setNewReqExpectedMinutes] = useState(60);
  const [newReqMaxMinutes, setNewReqMaxMinutes] = useState(80);
  const [newReqUnitChoice, setNewReqUnitChoice] = useState('10件');
  const [newReqPriorities, setNewReqPriorities] = useState<string[]>(['正確性']);
  const [newReqQualityChoice, setNewReqQualityChoice] = useState('入力ミス0件');

  // STEP B: 働き方・許容条件（開いた場合のみ設定）
  const [showDetailAccordion, setShowDetailAccordion] = useState(false);
  const [newReqTimeFlexibility, setNewReqTimeFlexibility] = useState('想定時間の±10分程度');
  const [newReqOutputFlexibility, setNewReqOutputFlexibility] = useState('日ごとに±1件程度');
  const [newReqTimeAllocation, setNewReqTimeAllocation] = useState('時間配分を本人に任せられる');
  const [newReqEarlyHandlingChoice, setNewReqEarlyHandlingChoice] = useState('回復時間に使える');
  const [newReqSupportsList, setNewReqSupportsList] = useState<string[]>([
    '手順書・チェックリスト',
    'テキスト・チャットによる指示',
  ]);
  const [newReqCustomNotes, setNewReqCustomNotes] = useState('');

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

  // 業務カテゴリ（taskCategory）に基づく型安全な実績取得関数（フォールバックは絶対に行わない）
  const getRelevantWorkCycle = (
    t: TraineeProfile,
    req: CompanyWorkRequirement
  ): WorkCycleEvidence | undefined => {
    if (!req.taskCategory) return undefined;
    const matches = t.workCycles.filter((wc) => wc.taskCategory === req.taskCategory);
    if (matches.length === 0) return undefined;
    const directMatch = matches.find(
      (wc) =>
        req.taskName.includes(wc.taskName.slice(0, 4)) ||
        wc.taskName.includes(req.taskName.slice(0, 4)) ||
        req.workUnit === wc.workUnit
    );
    return directMatch || matches[0];
  };

  const relevantWorkCycle = getRelevantWorkCycle(activeTrainee, activeRequirement);

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
    const finalTaskName =
      newReqCategory === 'general' && newReqCustomTaskName.trim()
        ? newReqCustomTaskName.trim()
        : newReqPresetTask;

    const newReq: CompanyWorkRequirement = {
      id: `custom-req-${Date.now()}`,
      companyName: offerCompany || '御社（登録業務）',
      taskName: finalTaskName,
      taskCategory: newReqCategory,
      taskDescription: `御社登録の業務要件: ${finalTaskName}`,
      workUnit: newReqUnitChoice,
      expectedDurationMinutes: newReqExpectedMinutes,
      acceptableDurationRange: {
        min: Math.max(10, Math.round(newReqExpectedMinutes * 0.7)),
        max: newReqMaxMinutes,
      },
      expectedOutput: `${newReqUnitChoice}の完了`,
      requiredQuality: newReqQualityChoice,
      acceptableVariation: showDetailAccordion ? newReqOutputFlexibility : '未確認（事前相談事項）',
      evaluationPeriod: 'day',
      priority: 'quality',
      recoveryTimeAllowed: showDetailAccordion ? newReqTimeAllocation.includes('任せられる') || newReqTimeAllocation.includes('調整可能') : true,
      flexibleWorkSequence: true,
      flexibleTimeOfDay: true,
      earlyFinishHandling: newReqEarlyHandlingChoice.includes('回復')
        ? 'recovery'
        : newReqEarlyHandlingChoice.includes('次')
        ? 'next_task'
        : newReqEarlyHandlingChoice.includes('待機')
        ? 'standby'
        : 'consult',
      priorityConditions: newReqPriorities,
      timeFlexibility: showDetailAccordion ? newReqTimeFlexibility : '未確認（事前相談事項）',
      outputFlexibility: showDetailAccordion ? newReqOutputFlexibility : '未確認（事前相談事項）',
      timeAllocation: showDetailAccordion ? newReqTimeAllocation : '未確認（事前相談事項）',
      earlyFinishPolicy: showDetailAccordion ? newReqEarlyHandlingChoice : '未確認（事前相談事項）',
      configuredDetails: showDetailAccordion,
      availableSupports: showDetailAccordion ? newReqSupportsList : ['未確認（事前相談事項）'],
      radarPresets: {
        schedule_stability: 3,
        communication_certainty: 3,
        procedure_execution: 4,
        selfcare_utilization: 3,
        pc_office_skills: 3,
        digital_production: 3,
      },
      createdAt: new Date().toISOString(),
      version: 1,
      history: [],
    };

    const allReqs = [newReq, ...requirements];
    StorageService.saveCompanyRequirements(allReqs);
    onSelectRequirement(newReq.id);
    setReqPage(0);
    setShowNewReqModal(false);
    onDataChange();
    showToastWithAutoReturn('🏢 自社の業務要件を登録しました！人財との持続可能な接続を比較します');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-1 min-h-[calc(100vh-3rem)] flex flex-col justify-between">
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

            {/* メインコピー（1行目1.0sフェード、2行目0.45sから1文字ずつタイピング 全文2.5s） */}
            <h1 className="hero-title text-4xl sm:text-5xl lg:text-[54px] font-black text-slate-900 leading-tight tracking-tight min-h-[140px] sm:min-h-[160px] flex flex-col justify-center">
              <span
                className={`transition-all duration-1000 ease-out ${
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
          <div className="space-y-3 animate-fadeIn">
            <div>
              <span className="text-sm font-black text-purple-700 tracking-wider">
                STEP 1
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                御社では、どのような仕事を任せたいですか？
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-0.5 font-medium">
                比較したい仕事をお選びください。選択後に条件を確認・調整できます。
              </p>
            </div>

            {/* リスト操作ヘッダー（左右切替 ＆ 新規追加ボタン） */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white py-1.5 px-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-700">
                  全{requirements.length}件中 {reqPage * ITEMS_PER_PAGE + 1}〜{Math.min((reqPage + 1) * ITEMS_PER_PAGE, requirements.length)}件を表示
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  ページ {reqPage + 1} / {totalReqPages}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* 自社業務の新規追加ボタン */}
                <button
                  onClick={() => setShowNewReqModal(true)}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>＋ 自社の仕事を新しく入力する</span>
                </button>

                {/* 左右切り替えボタン（全仕事の入れ替え） */}
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
                  <button
                    onClick={() => setReqPage((p) => Math.max(0, p - 1))}
                    disabled={reqPage === 0}
                    className={`px-2.5 py-1 text-xs font-bold flex items-center gap-1 transition ${
                      reqPage === 0
                        ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                        : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                    }`}
                    title="前の5件を表示"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>前へ</span>
                  </button>
                  <div className="w-px h-4 bg-slate-200"></div>
                  <button
                    onClick={() => setReqPage((p) => Math.min(totalReqPages - 1, p + 1))}
                    disabled={reqPage >= totalReqPages - 1}
                    className={`px-2.5 py-1 text-xs font-bold flex items-center gap-1 transition ${
                      reqPage >= totalReqPages - 1
                        ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                        : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                    }`}
                    title="次の5件を表示"
                  >
                    <span>次へ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 横長ワイドカードの縦並びリスト（5件表示） */}
            <div className="space-y-1.5">
              {displayedRequirements.map((req) => {
                const isSelected = selectedRequirementId === req.id;
                const isCustom = req.id.startsWith('custom-req-');

                return (
                  <div
                    key={req.id}
                    onClick={() => onSelectRequirement(req.id)}
                    className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl border transition cursor-pointer flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-purple-50/70 border-purple-600 shadow-sm ring-2 ring-purple-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {/* 左側: ラジオインジケータ ＆ 業務情報 */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* ラジオインジケータ */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                          isSelected
                            ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {req.taskCategory === 'data_entry'
                              ? 'データ入力'
                              : req.taskCategory === 'web_banner'
                              ? 'デザイン'
                              : req.taskCategory === 'manual_creation'
                              ? '手順書作成'
                              : req.taskCategory === 'document_editing'
                              ? '文書校正'
                              : '一般定常'}
                          </span>
                          {isCustom && (
                            <span className="text-[11px] font-black px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                              自社登録
                            </span>
                          )}
                          <h3 className="font-black text-base text-slate-900 truncate">
                            {req.taskName}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {req.taskDescription}
                        </p>
                      </div>
                    </div>

                    {/* 右側: 想定時間・成果単位・削除ボタン */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span className="inline-block bg-slate-100 border border-slate-200 text-slate-800 text-xs font-black px-2 py-0.5 rounded-md">
                          想定 {req.expectedDurationMinutes}分
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-purple-100 border border-purple-200 text-purple-900 text-xs font-black px-2 py-0.5 rounded-md">
                          単位: {req.workUnit}
                        </span>
                      </div>
                      <div className="hidden md:block text-xs text-slate-500 font-medium">
                        許容: {req.acceptableDurationRange.min}〜{req.acceptableDurationRange.max}分
                      </div>

                      {/* 自社登録業務の場合のみ削除ボタンを表示 */}
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteRequirement(req.id, e)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="この自社業務を一覧から削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 選択中要件の確認バー（戻るボタン ＆ 次へボタン配置） */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  選択中の業務要件:
                </span>
                <div className="font-black text-slate-900 text-lg sm:text-xl">{activeRequirement.taskName}</div>
                <div className="text-slate-700 text-xs sm:text-sm font-medium flex flex-wrap gap-3 pt-0.5">
                  <span>想定時間: <strong>{activeRequirement.expectedDurationMinutes}分</strong></span>
                  <span>許容範囲: <strong>{activeRequirement.acceptableDurationRange.min}〜{activeRequirement.acceptableDurationRange.max}分</strong></span>
                  <span>成果基準: <strong>{activeRequirement.expectedOutput}</strong></span>
                  <span>品質基準: <strong>{activeRequirement.requiredQuality}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setStep(0)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-sm sm:text-base border-2 border-slate-300 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>デモ開始へ戻る</span>
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
                >
                  <span>この仕事で人財を見る</span>
                  <ArrowRight className="w-4 h-4" />
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
                異なる働き方や特性を持つ研修生からお選びください。（架空のモデルケース・デモ用想定値）
              </p>
            </div>

            {/* 研修生カード一覧（客観的な模擬実績の有無を表示） */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {trainees.map((t) => {
                const wc = getRelevantWorkCycle(t, activeRequirement);
                const hasEvidence = !!wc;

                return (
                  <div
                    key={t.id}
                    className="bg-white border-2 border-slate-200 hover:border-purple-400 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 relative"
                  >
                    {/* 客観的な実績有無バッジ（推薦・おすすめ・合否判定を完全排除） */}
                    {hasEvidence ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-white rounded-full text-xs font-bold self-start shadow-sm tracking-wide">
                        <span>✓ この業務と比較できる模擬業務実績あり</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold self-start border border-slate-200">
                        <span>※ 直接比較できる模擬実績は未観測</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-12 h-12 rounded-2xl bg-purple-700 text-white font-black flex items-center justify-center text-xl shadow-sm"
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

                      {wc ? (
                        <div className="text-base p-3.5 rounded-xl space-y-1 bg-purple-50/70 border-2 border-purple-200 text-slate-900">
                          <span className="text-sm font-black text-purple-700 uppercase tracking-wide block">
                            観測された作業・回復実績:
                          </span>
                          <div className="font-black text-lg text-slate-900">
                            {wc.taskName} ({wc.workUnit})
                          </div>
                          <div className="text-base font-bold text-purple-900">
                            集中{wc.workDurationMinutes}分 ＋ 回復{wc.recoveryDurationMinutes}分（{wc.qualityResult}）
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm p-3.5 rounded-xl space-y-1 bg-slate-50 border border-slate-200 text-slate-600">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                            模擬実績の状況:
                          </span>
                          <p className="font-medium">
                            選択中の業務（カテゴリ: {activeRequirement.taskCategory || '未分類'}）と同一成果単位での実績は未記録です。お試し実習での確認を推奨します。
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setActiveTrainee(t);
                        setOfferDesiredWork(activeRequirement.taskName);
                        setStep(3);
                      }}
                      className="w-full py-4 bg-purple-700 hover:bg-purple-800 text-white font-black text-lg rounded-xl shadow transition flex items-center justify-center gap-2 group"
                    >
                      <span>{t.codeName} との働き方を比較する</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
          <div className="space-y-2.5 animate-fadeIn">
            {/* 💡 デモ体験: 三者循環シミュレーション（企業 ➔ 利用者実践 ➔ 支援員補足 ➔ カルテ反映） */}
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200 rounded-xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-lg bg-purple-700 text-white font-black flex items-center justify-center text-sm flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-purple-900">
                      三者循環デモ: この業務を{activeTrainee.codeName}がやってみたら？
                    </span>
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                      実践 ➔ 支援員見立て ➔ カルテ反映
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">
                    {relevantWorkCycle
                      ? `観測実績（作業${relevantWorkCycle.workDurationMinutes}分＋回復${relevantWorkCycle.recoveryDurationMinutes}分）と支援員見立てがカルテに反映・接続されています。`
                      : `未観測です。ボタンを押すと、本人の実践記録と支援員見立てをカルテに反映し一致度を確かめられます。`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    StorageService.quickSimulatePracticeAndApply(
                      activeTrainee.id,
                      activeRequirement,
                      activeTrainee.id === 'trainee-e' ? 50 : 20,
                      activeTrainee.id === 'trainee-e' ? 3 : 10
                    );
                    onDataChange();
                    showToastWithAutoReturn(
                      `✅ ${activeTrainee.codeName}の実践記録と支援員見立てをカルテに反映しました！タイムラインが更新されました`
                    );
                  }}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black rounded-lg shadow-sm hover:shadow transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>実践と見立てをカルテに反映</span>
                </button>
              </div>
            </div>

            {/* 1. 企業の期待と本人のワークサイクルのダイナミック比較（同一成果単位） */}
            {relevantWorkCycle ? (
              <WorkCycleChart
                requirement={activeRequirement}
                workCycle={relevantWorkCycle}
              />
            ) : (
              <div className="bg-white border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center space-y-2.5 shadow-sm">
                <span className="text-3xl">📋</span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  この業務と直接比較できる模擬業務実績は、まだ観測されていません
                </h3>
                <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
                  選択中の業務（<strong>{activeRequirement.taskName}</strong> / カテゴリ: <strong>{activeRequirement.taskCategory || '未分類'}</strong>）と同一成果単位（{activeRequirement.workUnit}）で比較可能な模擬実績は、{activeTrainee.codeName}の訓練カルテには未記録です。
                  <br />
                  お試し実習（1〜3日）等を通じて、実際の業務環境・成果単位での作業時間と回復周期を観測することを推奨します。
                </p>
              </div>
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
            <div className="pt-1 pb-0 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-base rounded-xl border-2 border-slate-300 transition flex items-center gap-2 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>人財を選び直す</span>
              </button>

              <button
                onClick={() => setStep(4)}
                className="px-8 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition flex items-center gap-2.5"
              >
                <span>この接続を詳しく見る（トリセツ・配慮・対話へ）</span>
                <ArrowRight className="w-5 h-5" />
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

            {/* 2. 6軸レーダーチャート ＆ 成果物概要 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkillRadarChart
                evaluations={activeTrainee.evaluations}
                companyTargetScores={activeRequirement.radarPresets}
                companyName={`${activeRequirement.taskName}の期待基準`}
              />

              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Award className="w-6 h-6 text-indigo-600" />
                    <span>成果物概要（模擬業務での制作・演習実績）</span>
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

            {/* 3. 企業向け公開サマリー（強み・成長過程・今後の目標） */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <span>企業向け公開サマリー（本人同意済み）</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200 space-y-1.5">
                  <span className="text-xs font-black text-purple-800 uppercase tracking-wide block">
                    🌟 本人の強み（得意なこと）
                  </span>
                  <p className="text-slate-800 text-base font-medium leading-relaxed">
                    {activeTrainee.publicSummary.strengths}
                  </p>
                </div>
                <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 space-y-1.5">
                  <span className="text-xs font-black text-indigo-800 uppercase tracking-wide block">
                    📈 これまでの成長過程（訓練の成果）
                  </span>
                  <p className="text-slate-800 text-base font-medium leading-relaxed">
                    {activeTrainee.publicSummary.growthHistory}
                  </p>
                </div>
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-1.5">
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-wide block">
                    🎯 今後の目標（目指す働き方）
                  </span>
                  <p className="text-slate-800 text-base font-medium leading-relaxed">
                    {activeTrainee.publicSummary.futureGoals}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. 対話アクションセクション */}
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
                  className="px-8 py-[18px] bg-purple-700 hover:bg-purple-800 text-white font-black text-xl rounded-2xl shadow-lg hover:shadow-xl transition flex items-center gap-2.5"
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
                  className="px-8 py-[18px] bg-white hover:bg-slate-50 text-slate-900 font-black text-xl rounded-2xl border-2 border-slate-300 shadow transition flex items-center gap-2.5"
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border-2 border-slate-200 text-base max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-black text-xl text-slate-900">自社の業務要件を追加登録</h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  チップやステッパーを選んで、3〜5回の選択ですぐに人財と比較できます
                </p>
              </div>
              <button
                onClick={() => setShowNewReqModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewRequirement} className="space-y-5">
              {/* ============================================================ */}
              {/* STEP A: まず試すための基本条件（選択式） */}
              {/* ============================================================ */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-purple-200">
                  <span className="bg-purple-700 text-white font-black px-2 py-0.5 rounded text-xs">
                    STEP A
                  </span>
                  <span className="font-black text-slate-800 text-sm">
                    基本条件（これだけで比較画面へ進めます）
                  </span>
                </div>

                {/* 1. 業務カテゴリの選択（大型チップ） */}
                <div>
                  <label className="block font-bold text-slate-800 mb-2 text-sm">
                    1. 業務カテゴリを選ぶ
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(CATEGORY_PRESETS) as TaskCategory[]).map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
                          setNewReqCategory(cat);
                          setNewReqPresetTask(CATEGORY_PRESETS[cat].tasks[0]);
                          setNewReqUnitChoice(CATEGORY_PRESETS[cat].defaultUnit);
                          setNewReqQualityChoice(CATEGORY_PRESETS[cat].qualityOptions[0]);
                        }}
                        className={`py-2 px-3 rounded-xl border-2 font-bold text-xs sm:text-sm transition text-left ${
                          newReqCategory === cat
                            ? 'bg-purple-50 border-purple-700 text-purple-900 shadow-xs ring-1 ring-purple-300'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {CATEGORY_PRESETS[cat].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. 具体的な業務を選ぶ */}
                <div>
                  <label className="block font-bold text-slate-800 mb-2 text-sm">
                    2. 任せたい具体的な仕事を選ぶ
                  </label>
                  <div className="space-y-1.5">
                    {CATEGORY_PRESETS[newReqCategory].tasks.map((task) => (
                      <button
                        type="button"
                        key={task}
                        onClick={() => setNewReqPresetTask(task)}
                        className={`w-full py-2 px-3.5 rounded-xl border-2 font-bold text-xs sm:text-sm transition text-left flex items-center justify-between ${
                          newReqPresetTask === task
                            ? 'bg-purple-50 border-purple-700 text-purple-900 shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{task}</span>
                        {newReqPresetTask === task && (
                          <CheckCircle2 className="w-4 h-4 text-purple-700 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  {newReqCategory === 'general' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="任意: 具体的な自社業務名があれば追記"
                        value={newReqCustomTaskName}
                        onChange={(e) => setNewReqCustomTaskName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* 3. 想定作業時間（チップ ＋ ステッパー） */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800 text-sm">
                      3. 想定作業時間（1回または1成果あたり）
                    </label>
                    <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      現在: {newReqExpectedMinutes}分
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      { label: '30分以内', min: 30 },
                      { label: '60分以内', min: 60 },
                      { label: '90分以内', min: 90 },
                      { label: '半日以内', min: 180 },
                      { label: '1日以内', min: 360 },
                      { label: '期限まで任せる', min: 60 },
                      { label: 'まだ決まっていない', min: 60 },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.label}
                        onClick={() => {
                          setNewReqDurationPreset(item.label);
                          setNewReqExpectedMinutes(item.min);
                          setNewReqMaxMinutes(Math.round(item.min * 1.3));
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                          newReqDurationPreset === item.label
                            ? 'bg-purple-700 text-white border-purple-700'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* ステッパーによる微調整 */}
                  <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-600">時間の微調整:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.max(10, newReqExpectedMinutes - 10);
                        setNewReqExpectedMinutes(val);
                        setNewReqMaxMinutes(Math.round(val * 1.3));
                      }}
                      className="w-7 h-7 bg-white border border-slate-300 rounded-lg font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center text-base"
                    >
                      −
                    </button>
                    <span className="font-black text-slate-900 text-sm w-12 text-center">
                      {newReqExpectedMinutes}分
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const val = newReqExpectedMinutes + 10;
                        setNewReqExpectedMinutes(val);
                        setNewReqMaxMinutes(Math.round(val * 1.3));
                      }}
                      className="w-7 h-7 bg-white border border-slate-300 rounded-lg font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center text-base"
                    >
                      ＋
                    </button>
                    <span className="text-xs text-slate-500">（許容上限: 約{newReqMaxMinutes}分）</span>
                  </div>
                </div>

                {/* 4. 期待成果量（カテゴリ連動チップ） */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800 text-sm">
                      4. 期待成果量（単位）
                    </label>
                    <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      選択: {newReqUnitChoice}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {CATEGORY_PRESETS[newReqCategory].unitOptions.map((unit) => (
                      <button
                        type="button"
                        key={unit}
                        onClick={() => setNewReqUnitChoice(unit)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                          newReqUnitChoice === unit
                            ? 'bg-purple-700 text-white border-purple-700'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. 重視する条件（複数選択チップ） ＆ 品質詳細 */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 text-sm">
                    5. 重視する条件（複数選択可）
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      '正確性',
                      '完了件数',
                      '納期',
                      '見た目・仕上がり',
                      '手順の分かりやすさ',
                      '継続して安定できること',
                      '報告・確認の確実性',
                      'まだ決まっていない',
                    ].map((cond) => {
                      const isSelected = newReqPriorities.includes(cond);
                      return (
                        <button
                          type="button"
                          key={cond}
                          onClick={() => {
                            if (cond === 'まだ決まっていない') {
                              setNewReqPriorities(['まだ決まっていない']);
                            } else {
                              const filtered = newReqPriorities.filter(
                                (c) => c !== 'まだ決まっていない'
                              );
                              if (isSelected) {
                                setNewReqPriorities(filtered.filter((c) => c !== cond));
                              } else {
                                setNewReqPriorities([...filtered, cond]);
                              }
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected && '✓ '}
                          {cond}
                        </button>
                      );
                    })}
                  </div>

                  {/* 品質基準詳細（カテゴリ連動） */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block mb-1">
                      求める品質基準の目安:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORY_PRESETS[newReqCategory].qualityOptions.map((q) => (
                        <button
                          type="button"
                          key={q}
                          onClick={() => setNewReqQualityChoice(q)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                            newReqQualityChoice === q
                              ? 'bg-purple-100 border-purple-600 text-purple-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* STEP B: 働き方・許容条件を詳しく設定する（開閉式アコーディオン・任意） */}
              {/* ============================================================ */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowDetailAccordion(!showDetailAccordion)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/70 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-200 text-slate-700 font-black px-2 py-0.5 rounded text-xs">
                      STEP B
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      働き方・許容条件を詳しく設定する（任意・開いた場合のみ反映）
                    </span>
                  </div>
                  <span className="text-xs font-bold text-purple-700">
                    {showDetailAccordion ? '▲ 閉じる' : '▼ 詳しく設定する'}
                  </span>
                </button>

                {showDetailAccordion && (
                  <div className="p-4 space-y-4 border-t border-slate-200 bg-white animate-fadeIn">
                    <p className="text-xs text-slate-500 font-medium">
                      ※ 詳細条件を設定しない場合、システムが勝手な既定値を当てはめず「企業条件として未確認（事前相談事項）」として客観的に扱います。
                    </p>

                    {/* 1. 完了時間のムラ */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                        完了時間のムラに対する許容
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '毎回ほぼ同じ時間を希望',
                          '想定時間の±10分程度',
                          '想定時間の±30分程度',
                          '最長時間以内なら問題ない',
                          '日による変動も事前相談により可能',
                          'まだ分からない',
                          '本人・支援者と相談したい',
                        ].map((choice) => (
                          <button
                            type="button"
                            key={choice}
                            onClick={() => setNewReqTimeFlexibility(choice)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
                              newReqTimeFlexibility === choice
                                ? 'bg-purple-700 text-white border-purple-700'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. 成果量のムラ */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                        成果量のムラに対する許容
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '毎回同じ成果量を希望',
                          '日ごとに±1件程度',
                          '日ごとに±2件程度',
                          '週単位で必要量を満たせばよい',
                          '期限までに必要量を満たせばよい',
                          'まだ分からない',
                          '本人・支援者と相談したい',
                        ].map((choice) => (
                          <button
                            type="button"
                            key={choice}
                            onClick={() => setNewReqOutputFlexibility(choice)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
                              newReqOutputFlexibility === choice
                                ? 'bg-purple-700 text-white border-purple-700'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. 作業と回復の時間配分 */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1 text-xs">
                        成果物の期限と品質を守る範囲で、作業と回復の時間配分を本人に任せられますか？
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '時間配分を本人に任せられる',
                          '事前に決めれば調整可能',
                          '固定された休憩時間内で調整可能',
                          '現時点では分からない',
                          '本人・支援者と相談したい',
                        ].map((choice) => (
                          <button
                            type="button"
                            key={choice}
                            onClick={() => setNewReqTimeAllocation(choice)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
                              newReqTimeAllocation === choice
                                ? 'bg-purple-700 text-white border-purple-700'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. 早く終わった場合の余白 */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1 text-xs">
                        予定より早く終わった場合の余白の扱い方針
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '回復時間に使える',
                          '次の業務の準備に使える',
                          '待機時間にできる',
                          '本人と事前に相談したい',
                          '次の業務へ進んでほしい',
                          '現時点では分からない',
                        ].map((choice) => (
                          <button
                            type="button"
                            key={choice}
                            onClick={() => setNewReqEarlyHandlingChoice(choice)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
                              newReqEarlyHandlingChoice === choice
                                ? 'bg-purple-700 text-white border-purple-700'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 5. 用意できる環境・サポート */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1 text-xs">
                        御社で用意できる環境・サポート（複数選択可）
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'テキスト・チャットによる指示',
                          '手順書・チェックリスト',
                          '完成見本・テンプレート',
                          '静かな席',
                          'イヤホンの使用',
                          '作業を一つずつ提示',
                          '定期的な進捗確認',
                          '優先順位の整理',
                          '短い休憩を含む時間配分',
                          '特に決まっていない',
                          '本人・支援者と相談したい',
                        ].map((support) => {
                          const isSelected = newReqSupportsList.includes(support);
                          return (
                            <button
                              type="button"
                              key={support}
                              onClick={() => {
                                if (support === '特に決まっていない') {
                                  setNewReqSupportsList(['特に決まっていない']);
                                } else {
                                  const filtered = newReqSupportsList.filter(
                                    (s) => s !== '特に決まっていない'
                                  );
                                  if (isSelected) {
                                    setNewReqSupportsList(filtered.filter((s) => s !== support));
                                  } else {
                                    setNewReqSupportsList([...filtered, support]);
                                  }
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {isSelected && '✓ '}
                              {support}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 6. 任意の補足 */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1 text-xs">
                        任意の補足・社内ルール
                      </label>
                      <textarea
                        rows={2}
                        placeholder="例: 社内独自のショートカット集あり、お試し実習時に共有予定。"
                        value={newReqCustomNotes}
                        onChange={(e) => setNewReqCustomNotes(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 送信ボタン（基本条件だけでもすぐに進める） */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewReqModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-sm sm:text-base rounded-xl shadow hover:shadow-md transition flex items-center gap-2"
                >
                  <span>この条件で登録して比較する</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* このシステムについてモーダル（共通コンポーネント） */}
      <AboutSystemModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
    </div>
  );
};
