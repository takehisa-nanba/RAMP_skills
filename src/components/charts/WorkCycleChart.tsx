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

  const traineeWorkRep = workCycle.medianWorkDurationMinutes ?? workCycle.workDurationMinutes;
  const traineeWorkMin = workCycle.observedRange?.minDurationMinutes ?? traineeWorkRep;
  const traineeWorkMax = workCycle.observedRange?.maxDurationMinutes ?? traineeWorkRep;
  const traineeRecovery = workCycle.medianRecoveryDurationMinutes ?? workCycle.recoveryDurationMinutes;

  const isRangeCalc = workCycle.observedRange?.isRangeCalculated ?? false;

  const traineeCycleRep = traineeWorkRep + traineeRecovery;
  const traineeCycleMin = traineeWorkMin + traineeRecovery;
  const traineeCycleMax = traineeWorkMax + traineeRecovery;

  // 早く完了した場合に生まれる余白（分）（想定時間が数値指定の場合のみ算出）
  const minMargin = companyExpected !== null ? Math.max(0, companyExpected - traineeCycleMax) : null;
  const maxMargin = companyExpected !== null ? Math.max(0, companyExpected - traineeCycleMin) : null;
  const repMargin = companyExpected !== null ? Math.max(0, companyExpected - traineeCycleRep) : null;

  // スケール基準（最大値を100%基準に算出）
  const validCompanyMax = companyMax ?? companyExpected ?? 90;
  const maxScale = Math.max(90, validCompanyMax * 1.15, traineeCycleMax * 1.25);
  const toPercent = (val: number) => `${Math.min(100, Math.max(0, (val / maxScale) * 100))}%`;

  const periodLabel =
    requirement.evaluationPeriod === 'hour'
      ? '1時間単位'
      : requirement.evaluationPeriod === 'day'
      ? '1日単位'
      : requirement.evaluationPeriod === 'week'
      ? '1週間単位'
      : requirement.evaluationPeriod === 'deadline'
      ? '納期・期限単位'
      : '未定';

  const earlyHandlingLabel =
    requirement.earlyFinishState === 'recovery' || requirement.earlyFinishHandling === 'recovery'
      ? '工程内回復・休息'
      : requirement.earlyFinishState === 'standby' || requirement.earlyFinishHandling === 'standby'
      ? '待機・指示待ち'
      : requirement.earlyFinishState === 'prepare_next' || requirement.earlyFinishHandling === 'next_task'
      ? '次業務の準備'
      : '事前相談による合意';

  return (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
      {/* 架空デモシード注記バナー（常に可視化） */}
      {workCycle.dataOrigin === 'demo_seed' && (
        <div className="bg-teal-50/80 border border-teal-200 rounded-lg px-3 py-1 text-[11px] text-teal-900 font-semibold flex items-center justify-between">
          <span>※架空のモデルケースに設定した模擬観測データです。実在する研修生の実績ではありません。</span>
          <span className="bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.2 rounded font-bold">デモ用想定値</span>
        </div>
      )}

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
        <div className="text-xs text-slate-600 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-lg flex items-center gap-2">
          <span>
            {isRangeCalc
              ? `観測枠: 約${workCycle.observedRepeatRange?.observedWindowMinutes ?? 90}分（反復観測確認済み）`
              : '観測1回・幅未算出（複数回の観測が必要）'}
          </span>
        </div>
      </div>

      {/* タイムライン比較セクション（同一スケール） */}
      <div className="space-y-2.5 pt-0.5">
        {/* 1. 企業側の想定と許容条件 */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-800 inline-block"></span>
              <span className="text-sm sm:text-base font-bold text-slate-800">
                御社の期待基準（{requirement.taskName}）
              </span>
            </div>
            <div className="text-right">
              {companyExpected !== null ? (
                <>
                  <span className="text-3xl sm:text-4xl lg:text-[48px] font-black text-slate-900 tracking-tight leading-none">
                    {companyExpected}分
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-600 ml-1">で</span>
                  <span className="text-3xl sm:text-4xl lg:text-[48px] font-black text-teal-600 tracking-tight ml-1 leading-none">
                    {requirement.workUnit}
                  </span>
                </>
              ) : (
                <span className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
                  想定時間：未定（事前相談）
                </span>
              )}
            </div>
          </div>

          {/* 企業要件の条件バッジ群 */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
              許容範囲:{' '}
              <strong className="text-slate-900">
                {companyMin !== null && companyMax !== null ? `${companyMin}〜${companyMax}分` : '未定'}
              </strong>
            </span>
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
              作業ムラ許容: <strong className="text-slate-900">{requirement.acceptableVariation}</strong>
            </span>
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
              評価期間: <strong className="text-slate-900">{periodLabel}</strong>
            </span>
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
              作業・回復の時間配分:{' '}
              <strong className="text-slate-900">
                {requirement.timeAllocationState === 'delegated' || requirement.timeAllocationState === 'negotiable'
                  ? '時間配分を本人に任せられる'
                  : requirement.timeAllocationState === 'unknown'
                  ? '未確認（事前相談）'
                  : '固定休憩で調整'}
              </strong>
            </span>
            <span className="bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-teal-900">
              余白の扱い方針: <strong>{earlyHandlingLabel}</strong>
            </span>
          </div>

          {/* 企業タイムラインバー */}
          {companyExpected !== null ? (
            <div className="w-full bg-slate-100 h-9 sm:h-10 rounded-xl overflow-hidden relative border border-slate-300 shadow-inner flex items-center">
              {companyMin !== null && companyMax !== null && (
                <div
                  className="absolute top-0 bottom-0 bg-slate-200/80 border-r-2 border-dashed border-slate-400"
                  style={{
                    left: toPercent(companyMin),
                    width: toPercent(companyMax - companyMin),
                  }}
                  title={`許容時間帯: ${companyMin}〜${companyMax}分`}
                />
              )}
              <div
                className="bg-slate-800 h-full flex items-center px-3 text-white text-xs sm:text-sm font-extrabold shadow z-10"
                style={{ width: toPercent(companyExpected) }}
              >
                想定目標: {companyExpected}分
              </div>
              {companyMax !== null && (
                <span className="absolute right-3 text-xs text-slate-500 font-bold">
                  許容上限: {companyMax}分
                </span>
              )}
            </div>
          ) : (
            <div className="w-full bg-amber-50 h-9 rounded-xl border border-dashed border-amber-300 flex items-center px-4 text-xs font-bold text-amber-800">
              ※御社の想定作業時間が未定のため、タイムライン比較バーは保留されています。
            </div>
          )}
        </div>

        {/* 2. 本人の持続可能なワークサイクル ＆ 生まれる余白 */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
              <span className="text-sm sm:text-base font-bold text-slate-800">
                本人のワークサイクル（1サイクル: {workCycle.completedOutput}）
              </span>
            </div>
            <div className="text-right flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl lg:text-[48px] font-black text-emerald-700 tracking-tight leading-none">
                作業{traineeWorkRep}分
              </span>
              <span className="text-xl font-bold text-slate-400">＋</span>
              <span className="text-3xl sm:text-4xl lg:text-[48px] font-black text-sky-700 tracking-tight leading-none">
                回復{traineeRecovery}分
              </span>
              <span className="text-base sm:text-xl font-black text-slate-600 ml-1">
                ＝ 計{traineeCycleRep}分
              </span>
            </div>
          </div>

          {/* 出所別観測ブレイクダウン */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-medium">
            {workCycle.sourceBreakdown && workCycle.sourceBreakdown.length > 0 ? (
              workCycle.sourceBreakdown.map((item) => (
                <span
                  key={item.source}
                  className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-emerald-900"
                >
                  {item.source === 'trainee_self_report' ? '本人申告' : '支援員現場観測'}:{' '}
                  <strong>
                    {item.count}回（
                    {item.isRangeCalculated
                      ? `${item.minDurationMinutes}〜${item.maxDurationMinutes}分`
                      : `${item.minDurationMinutes}分・幅未算出`}
                    ）
                  </strong>
                  {item.confirmedCount > 0 && ` [支援員確認${item.confirmedCount}回]`}
                </span>
              ))
            ) : (
              <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                観測幅:{' '}
                <strong className="text-slate-900">
                  {isRangeCalc
                    ? `${traineeWorkMin}〜${traineeWorkMax}分 (変動幅±${Math.round((traineeWorkMax - traineeWorkMin) / 2)}分)`
                    : `${traineeWorkRep}分（観測1回・幅未算出）`}
                </strong>
              </span>
            )}
            <span className="bg-sky-50 border border-sky-200 px-2 py-0.5 rounded text-sky-800">
              回復周期: <strong>{traineeRecovery}分（深呼吸・手元タイマー）</strong>
            </span>
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
              実績品質: <strong>{workCycle.qualityResult || '未測定'}</strong>
            </span>
          </div>

          {/* 本人のタイムラインバー（同一スケール） */}
          <div className="w-full bg-slate-100 h-9 sm:h-10 rounded-xl overflow-hidden relative border border-slate-300 shadow-inner flex items-center">
            {/* 1. 集中作業時間バー */}
            <div
              className="bg-emerald-600 h-full flex items-center px-3 text-white text-xs sm:text-sm font-extrabold shadow z-10"
              style={{ width: toPercent(traineeWorkRep) }}
            >
              作業: {traineeWorkRep}分
            </div>

            {/* 2. 回復時間バー */}
            <div
              className="bg-sky-500 h-full flex items-center px-2 text-white text-xs font-bold shadow z-10 border-l border-sky-600"
              style={{ width: toPercent(traineeRecovery) }}
            >
              回復: {traineeRecovery}分
            </div>

            {/* 3. 早く終わった場合に生まれる余白枠（事前合意すべき余白） */}
            {companyExpected !== null && repMargin !== null && repMargin > 0 && (
              <div
                className="h-full border-2 border-dashed border-cyan-500 bg-cyan-50/80 flex items-center px-2 text-cyan-900 text-xs font-extrabold z-10 animate-pulse"
                style={{ width: toPercent(repMargin) }}
                title={`事前合意すべき余白: 約${repMargin}分`}
              >
                余白: 約{repMargin}分
              </div>
            )}
          </div>
        </div>
      </div>

      {/* フッター解説: 余白の扱いと事前合意 */}
      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
          <span className="font-bold text-slate-900">💡 働き方の事前合意:</span>
          <span>
            {companyExpected !== null && repMargin !== null && repMargin > 0
              ? `本人のサイクル（計${traineeCycleRep}分）で作業した場合、約${repMargin}分の余白が生まれます。追加ノルマとせず「${earlyHandlingLabel}」として事前に合意しておくことで、安定した集中リズムが持続します。`
              : `集中作業時間（${traineeWorkRep}分）に回復時間（${traineeRecovery}分）を挟むことで、持続的な業務パフォーマンスを維持できます。`}
          </span>
        </div>
      </div>
    </div>
  );
};
