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

  // 1回の観測時間枠 (例: 90分) または 企業想定時間の1.2倍をスケール基準に設定
  const maxScale = Math.max(90, companyDuration * 1.3, cycleTotal * 2.5);

  const toPercent = (val: number) => `${(val / maxScale) * 100}%`;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>⏱️ 持続可能な作業周期（ワークサイクル）の比較</span>
            <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full border border-amber-300">
              デモ用想定値
            </span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            単なる連続作業時間ではなく、「集中作業＋回復時間」を仕事の不可欠な工程として可視化しています。
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-600 font-medium">観測時間枠: </span>
          <span className="text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-300">
            約{workCycle.observedRepeatRange.observedWindowMinutes}分枠（{workCycle.observedRepeatRange.minCycles}〜{workCycle.observedRepeatRange.maxCycles}サイクル確認）
          </span>
        </div>
      </div>

      {/* タイムラインバー */}
      <div className="space-y-4 pt-2">
        {/* 1. 企業の想定作業時間 */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-600 inline-block"></span>
              御社の想定業務時間（{requirement.taskName}）
            </span>
            <span>
              想定: {companyDuration}分（許容範囲: {requirement.acceptableDurationRange.min}〜{requirement.acceptableDurationRange.max}分）/ 期待成果: {requirement.expectedOutput}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-9 rounded-lg overflow-hidden relative shadow-inner">
            {/* 許容上限エリア */}
            <div
              className="absolute top-0 bottom-0 bg-slate-300 opacity-60 border-r-2 border-dashed border-slate-500"
              style={{
                left: toPercent(requirement.acceptableDurationRange.min),
                width: toPercent(
                  requirement.acceptableDurationRange.max -
                    requirement.acceptableDurationRange.min
                ),
              }}
              title="許容作業時間帯"
            />
            {/* 想定時間バー */}
            <div
              className="bg-slate-700 h-full flex items-center px-3 text-white text-xs font-bold transition-all shadow"
              style={{ width: toPercent(companyDuration) }}
            >
              想定完了目標: {companyDuration}分
            </div>
          </div>
        </div>

        {/* 2. 研修生の作業＋回復サイクル */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              本人の作業・回復リズム（{workCycle.taskName}）
            </span>
            <span className="text-emerald-700 font-bold">
              1サイクル成果: {workCycle.completedOutput}（{workCycle.qualityResult}）
            </span>
          </div>

          <div className="w-full bg-slate-200 h-10 rounded-lg overflow-hidden flex relative shadow-inner p-0.5">
            {/* サイクル 1 */}
            <div
              className="bg-emerald-600 h-full rounded-l flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ width: toPercent(workDuration) }}
              title={`作業: ${workDuration}分`}
            >
              作業 {workDuration}分
            </div>
            <div
              className="bg-sky-200 border border-sky-400 h-full flex items-center justify-center text-sky-900 text-xs font-bold pattern-diagonal-lines"
              style={{ width: toPercent(recoveryDuration) }}
              title={`回復時間: ${recoveryDuration}分`}
            >
              回復 {recoveryDuration}分
            </div>

            {/* サイクル 2 */}
            <div
              className="bg-emerald-600 h-full flex items-center justify-center text-white text-xs font-bold border-l border-white shadow-sm"
              style={{ width: toPercent(workDuration) }}
              title={`作業: ${workDuration}分`}
            >
              作業 {workDuration}分
            </div>
            <div
              className="bg-sky-200 border border-sky-400 h-full flex items-center justify-center text-sky-900 text-xs font-bold"
              style={{ width: toPercent(recoveryDuration) }}
              title={`回復時間: ${recoveryDuration}分`}
            >
              回復 {recoveryDuration}分
            </div>

            {/* 余白 / バッファ */}
            <div className="flex-1 flex items-center justify-end px-3 text-slate-500 text-xs italic">
              余裕バッファ・余白
            </div>
          </div>
        </div>
      </div>

      {/* 凡例と重要な注記 */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-700">
            <span className="w-3 h-3 bg-emerald-600 rounded"></span> 集中作業時間
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <span className="w-3 h-3 bg-sky-200 border border-sky-400 rounded"></span> 回復時間（不可欠な工程）
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <span className="w-3 h-3 bg-slate-700 rounded"></span> 御社の想定目標
          </span>
        </div>
        <div className="text-slate-500 italic">
          ※ 観測枠を超えた1日全体での持続性は、お試し実習（1〜3日）にて確認します。
        </div>
      </div>
    </div>
  );
};
