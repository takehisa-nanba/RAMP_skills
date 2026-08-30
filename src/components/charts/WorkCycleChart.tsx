import React from 'react';
import { CompanyWorkRequirement, WorkCycleEvidence } from '../../types';

interface WorkCycleChartProps {
  requirement: CompanyWorkRequirement;
  workCycle: WorkCycleEvidence;
}

export const WorkCycleChart: React.FC<WorkCycleChartProps> = ({ requirement, workCycle }) => {
  const companyDuration = requirement.expectedDurationMinutes;
  const workDuration = workCycle.workDurationMinutes;
  const recoveryDuration = workCycle.recoveryDurationMinutes;
  const cycleTotal = workDuration + recoveryDuration;

  // スケール基準
  const maxScale = Math.max(90, companyDuration * 1.25, cycleTotal * 2.4);
  const toPercent = (val: number) => `${(val / maxScale) * 100}%`;

  return (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2.5">
      {/* ヘッダー: タイトル & 観測注記 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">⏱️</span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            持続可能な作業周期（ワークサイクル）の比較
          </h3>
          <span className="bg-amber-100 text-amber-900 text-sm font-extrabold px-3 py-1 rounded-full border border-amber-300">
            デモ用想定値
          </span>
        </div>
        <div className="text-base text-slate-600 font-semibold bg-slate-100 px-3 py-1 rounded-lg">
          観測枠: 約{workCycle.observedRepeatRange.observedWindowMinutes}分（{workCycle.observedRepeatRange.minCycles}〜{workCycle.observedRepeatRange.maxCycles}サイクル確認）
        </div>
      </div>

      {/* タイムライン比較セクション */}
      <div className="space-y-3 pt-0.5">
        {/* 1. 企業の想定目標（主役数値: 48px） */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-700 inline-block"></span>
              <span className="text-lg font-bold text-slate-800">
                御社の期待基準（{requirement.taskName}）
              </span>
            </div>
            <div className="text-right">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {companyDuration}分
              </span>
              <span className="text-lg font-bold text-slate-600 ml-1">で</span>
              <span className="text-3xl sm:text-4xl font-black text-purple-700 tracking-tight ml-2">
                {requirement.workUnit}
              </span>
              <span className="text-base text-slate-500 font-semibold ml-2">
                （{requirement.requiredQuality}）
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-12 sm:h-14 rounded-xl overflow-hidden relative border border-slate-300 shadow-inner flex items-center">
            {/* 許容上限エリア */}
            <div
              className="absolute top-0 bottom-0 bg-slate-200/80 border-r-2 border-dashed border-slate-400"
              style={{
                left: toPercent(requirement.acceptableDurationRange.min),
                width: toPercent(
                  requirement.acceptableDurationRange.max -
                    requirement.acceptableDurationRange.min
                ),
              }}
              title="許容時間帯"
            />
            {/* 想定時間バー */}
            <div
              className="bg-slate-800 h-full flex items-center px-4 text-white text-base sm:text-lg font-extrabold shadow"
              style={{ width: toPercent(companyDuration) }}
            >
              想定目標: {companyDuration}分
            </div>
          </div>
        </div>

        {/* 2. 本人の持続可能な作業＋回復リズム（主役数値: 54px） */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 inline-block"></span>
              <span className="text-lg font-bold text-slate-800">
                本人の持続可能なワークサイクル
              </span>
            </div>
            <div className="text-right">
              <span className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight">
                作業{workDuration}分
              </span>
              <span className="text-2xl font-bold text-slate-400 mx-1">＋</span>
              <span className="text-3xl sm:text-4xl font-black text-sky-700 tracking-tight">
                回復{recoveryDuration}分
              </span>
              <span className="text-base font-bold text-emerald-800 ml-2 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                成果: {workCycle.completedOutput}（{workCycle.qualityResult}）
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-14 sm:h-16 rounded-xl overflow-hidden flex relative border-2 border-emerald-300 shadow-inner p-1">
            {/* サイクル 1: 作業 */}
            <div
              className="bg-emerald-600 h-full rounded-lg flex items-center justify-center text-white text-base sm:text-lg font-black shadow"
              style={{ width: toPercent(workDuration) }}
            >
              集中作業 {workDuration}分
            </div>

            {/* サイクル 1: 回復 */}
            <div
              className="bg-sky-100 border-2 border-sky-400 h-full rounded-lg flex items-center justify-center text-sky-900 text-base sm:text-lg font-black ml-1"
              style={{ width: toPercent(recoveryDuration) }}
            >
              回復 {recoveryDuration}分
            </div>

            {/* サイクル 2: 作業 */}
            <div
              className="bg-emerald-600 h-full rounded-lg flex items-center justify-center text-white text-base sm:text-lg font-black ml-1 shadow"
              style={{ width: toPercent(workDuration) }}
            >
              集中作業 {workDuration}分
            </div>

            {/* サイクル 2: 回復 */}
            <div
              className="bg-sky-100 border-2 border-sky-400 h-full rounded-lg flex items-center justify-center text-sky-900 text-base sm:text-lg font-black ml-1"
              style={{ width: toPercent(recoveryDuration) }}
            >
              回復 {recoveryDuration}分
            </div>

            {/* 余白バッファ */}
            <div className="flex-1 flex items-center justify-end px-3 text-slate-500 text-sm sm:text-base font-semibold italic">
              余白・バッファ
            </div>
          </div>
        </div>
      </div>

      {/* 凡例 & 補足注記（最低16px） */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-base text-slate-600 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="w-4 h-4 bg-emerald-600 rounded"></span> 集中作業
          </span>
          <span className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="w-4 h-4 bg-sky-200 border-2 border-sky-400 rounded"></span> 回復時間（不可欠な工程）
          </span>
          <span className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="w-4 h-4 bg-slate-800 rounded"></span> 御社の想定目標
          </span>
        </div>
        <div className="text-slate-500 font-semibold italic">
          ※ 観測枠を超えた勤務時間全体での持続性は、お試し実習（1〜3日）にて確認します。
        </div>
      </div>
    </div>
  );
};
