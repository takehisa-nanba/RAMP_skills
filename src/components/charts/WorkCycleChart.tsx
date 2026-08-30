import React from 'react';
import { CompanyWorkRequirement, WorkCycleEvidence } from '../../types';

interface WorkCycleChartProps {
  requirement: CompanyWorkRequirement;
  workCycle: WorkCycleEvidence;
}

export const WorkCycleChart: React.FC<WorkCycleChartProps> = ({ requirement, workCycle }) => {
  const companyExpected = requirement.expectedDurationMinutes;
  const companyMin = requirement.acceptableDurationRange.min;
  const companyMax = requirement.acceptableDurationRange.max;

  const traineeWorkRep = workCycle.workDurationMinutes;
  const traineeWorkMin = workCycle.observedRange.minDurationMinutes;
  const traineeWorkMax = workCycle.observedRange.maxDurationMinutes;
  const traineeRecovery = workCycle.recoveryDurationMinutes;

  const traineeCycleRep = traineeWorkRep + traineeRecovery;
  const traineeCycleMin = traineeWorkMin + traineeRecovery;
  const traineeCycleMax = traineeWorkMax + traineeRecovery;

  // 早く完了した場合に生まれる余白（分）
  const minMargin = Math.max(0, companyExpected - traineeCycleMax);
  const maxMargin = Math.max(0, companyExpected - traineeCycleMin);
  const repMargin = Math.max(0, companyExpected - traineeCycleRep);

  // スケール基準（最大値を100%基準に算出）
  const maxScale = Math.max(90, companyMax * 1.15, traineeCycleMax * 1.25);
  const toPercent = (val: number) => `${Math.min(100, Math.max(0, (val / maxScale) * 100))}%`;

  const periodLabel =
    requirement.evaluationPeriod === 'hour'
      ? '1時間単位'
      : requirement.evaluationPeriod === 'day'
      ? '1日単位'
      : requirement.evaluationPeriod === 'week'
      ? '1週間単位'
      : '納期・期限単位';

  const earlyHandlingLabel =
    requirement.earlyFinishHandling === 'recovery'
      ? '工程内回復・休息'
      : requirement.earlyFinishHandling === 'standby'
      ? '待機・指示待ち'
      : requirement.earlyFinishHandling === 'next_task'
      ? '次業務の準備'
      : '事前相談による合意';

  return (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2">
      {/* ヘッダー: タイトル & 観測注記 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">⏱️</span>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            持続可能な作業周期（ワークサイクル）と余白の比較
          </h3>
          <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
            同一成果単位（{requirement.workUnit}）での対比
          </span>
        </div>
        <div className="text-xs text-slate-600 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-lg">
          観測枠: 約{workCycle.observedRepeatRange.observedWindowMinutes}分（{workCycle.observedRepeatRange.minCycles}〜{workCycle.observedRepeatRange.maxCycles}サイクル再現確認）
        </div>
      </div>

      {/* タイムライン比較セクション（同一スケール） */}
      <div className="space-y-2 pt-0.5">
        {/* 1. 企業側の想定と許容条件 */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block"></span>
              <span className="text-sm sm:text-base font-bold text-slate-800">
                御社の期待基準（{requirement.taskName}）
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl lg:text-[36px] font-black text-slate-900 tracking-tight">
                {companyExpected}分
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-600 ml-1">で</span>
              <span className="text-2xl sm:text-3xl lg:text-[36px] font-black text-purple-700 tracking-tight ml-1">
                {requirement.workUnit}
              </span>
            </div>
          </div>

          {/* 企業要件の条件バッジ群 */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
              許容範囲: <strong className="text-slate-900">{companyMin}〜{companyMax}分</strong>
            </span>
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
              作業ムラ許容: <strong className="text-slate-900">{requirement.acceptableVariation}</strong>
            </span>
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
              評価期間: <strong className="text-slate-900">{periodLabel}</strong>
            </span>
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
              工程内回復: <strong className="text-slate-900">{requirement.recoveryTimeAllowed ? '許可' : '一斉休憩のみ'}</strong>
            </span>
            <span className="bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-purple-800">
              余白の扱い方針: <strong>{earlyHandlingLabel}</strong>
            </span>
          </div>

          {/* 企業タイムラインバー */}
          <div className="w-full bg-slate-100 h-9 sm:h-10 rounded-xl overflow-hidden relative border border-slate-300 shadow-inner flex items-center">
            {/* 許容時間帯エリア */}
            <div
              className="absolute top-0 bottom-0 bg-slate-200/80 border-r-2 border-dashed border-slate-400"
              style={{
                left: toPercent(companyMin),
                width: toPercent(companyMax - companyMin),
              }}
              title={`許容時間帯: ${companyMin}〜${companyMax}分`}
            />
            {/* 想定時間バー */}
            <div
              className="bg-slate-800 h-full flex items-center px-3 text-white text-xs sm:text-sm font-extrabold shadow z-10"
              style={{ width: toPercent(companyExpected) }}
            >
              想定目標: {companyExpected}分
            </div>
            <span className="absolute right-3 text-xs text-slate-500 font-bold">
              許容上限: {companyMax}分
            </span>
          </div>
        </div>

        {/* 2. 本人の持続可能なワークサイクル ＆ 生まれる余白 */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
              <span className="text-sm sm:text-base font-bold text-slate-800">
                本人のワークサイクル（1サイクル: {workCycle.completedOutput}）
              </span>
            </div>
            <div className="text-right flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl lg:text-[36px] font-black text-emerald-700 tracking-tight">
                作業{traineeWorkRep}分
              </span>
              <span className="text-lg sm:text-xl font-bold text-slate-400">＋</span>
              <span className="text-2xl sm:text-3xl lg:text-[36px] font-black text-sky-700 tracking-tight">
                回復{traineeRecovery}分
              </span>
              <span className="text-base sm:text-xl font-black text-slate-600 ml-1">
                ＝ 計{traineeCycleRep}分
              </span>
            </div>
          </div>

          {/* 本人側の観測条件バッジ群 */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-emerald-800">
              観測作業時間: <strong className="text-emerald-900">{traineeWorkMin}〜{traineeWorkMax}分</strong>（ムラ幅 {traineeWorkMax - traineeWorkMin}分）
            </span>
            <span className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-emerald-800">
              1サイクル全体: <strong className="text-emerald-900">{traineeCycleMin}〜{traineeCycleMax}分</strong>
            </span>
            <span className="bg-purple-100 border border-purple-300 px-2 py-0.5 rounded text-purple-900 font-bold">
              生まれる余白: 約{minMargin}〜{maxMargin}分（代表{repMargin}分）
            </span>
            <span className="bg-sky-50 border border-sky-200 px-2 py-0.5 rounded text-sky-800">
              観測品質: <strong className="text-sky-900">{workCycle.qualityResult}</strong>
            </span>
          </div>

          {/* 本人タイムラインバー（同一スケール） */}
          <div className="w-full bg-slate-100 h-10 sm:h-11 rounded-xl overflow-hidden flex relative border-2 border-emerald-300 shadow-inner p-0.5">
            {/* 集中作業 */}
            <div
              className="bg-emerald-600 h-full rounded-lg flex items-center justify-center text-white text-xs sm:text-sm font-black shadow whitespace-nowrap px-2"
              style={{ width: toPercent(traineeWorkRep) }}
              title={`集中作業: 代表${traineeWorkRep}分（観測範囲: ${traineeWorkMin}〜${traineeWorkMax}分）`}
            >
              集中作業 {traineeWorkRep}分
            </div>

            {/* 回復時間 */}
            <div
              className="bg-sky-100 border border-sky-400 h-full rounded-lg flex items-center justify-center text-sky-900 text-xs sm:text-sm font-black ml-1 whitespace-nowrap px-2"
              style={{ width: toPercent(traineeRecovery) }}
              title={`回復時間: ${traineeRecovery}分（不可欠な工程）`}
            >
              回復 {traineeRecovery}分
            </div>

            {/* 生まれる余白（企業の想定時間まで） */}
            {repMargin > 0 && (
              <div
                className="bg-purple-50 border border-dashed border-purple-400 h-full rounded-lg flex items-center justify-center text-purple-900 text-xs sm:text-sm font-black ml-1 whitespace-nowrap px-2"
                style={{ width: toPercent(repMargin) }}
                title={`生まれる余白: 約${minMargin}〜${maxMargin}分（追加ノルマとせず事前相談）`}
              >
                余白 約{repMargin}分
              </div>
            )}

            {/* 企業の許容上限までのバッファ */}
            <div className="flex-1 flex items-center justify-end px-3 text-slate-400 text-xs font-semibold italic">
              （上限{companyMax}分まで余裕あり）
            </div>
          </div>
        </div>
      </div>

      {/* 安定再現の条件 & 対話の指針 */}
      <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-slate-700">安定再現の条件:</span>
          {workCycle.stabilizingConditions.map((cond, idx) => (
            <span
              key={idx}
              className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-semibold"
            >
              ✓ {cond}
            </span>
          ))}
        </div>
        <div className="text-slate-500 font-semibold italic">
          ※ 早く終わった余白は追加ノルマとせず、回復・待機・次業務のどれに充てるか事前に合意します。
        </div>
      </div>
    </div>
  );
};

