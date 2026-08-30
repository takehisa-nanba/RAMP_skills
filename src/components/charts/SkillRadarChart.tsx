import React, { useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';
import { RUBRIC_AXES } from '../../data/seed';
import { EvaluationRecord, RubricAxis } from '../../types';
import { Info, X } from 'lucide-react';

interface SkillRadarChartProps {
  evaluations: EvaluationRecord[];
  companyTargetScores?: Record<string, number>;
  companyName?: string;
  showSelfEvaluation?: boolean;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  evaluations,
  companyTargetScores = {
    schedule_stability: 3,
    communication_certainty: 3,
    procedure_execution: 3,
    selfcare_utilization: 3,
    pc_office_skills: 3,
    digital_production: 3,
  },
  companyName = '御社の求める基準',
  showSelfEvaluation = false,
}) => {
  const [selectedAxis, setSelectedAxis] = useState<RubricAxis | null>(null);

  const unratedAxes: string[] = [];

  // チャート用データ構築
  const chartData = RUBRIC_AXES.map((axis) => {
    // 最新の合意到達点（evaluatedAt の降順で最新を取得）
    const milestone = [...evaluations]
      .filter((e) => e.skillId === axis.id && e.type === 'monthly_milestone')
      .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime())[0];

    // 最新の本人自己評価（evaluatedAt の降順で最新を取得）
    const selfEval = [...evaluations]
      .filter((e) => e.skillId === axis.id && e.type === 'self')
      .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime())[0];

    if (!milestone) {
      unratedAxes.push(axis.name);
    }

    return {
      axisId: axis.id,
      subject: axis.name,
      '本人と合意した到達点': milestone ? milestone.score : 0,
      '本人自己評価': selfEval ? selfEval.score : 0,
      [companyName]: companyTargetScores[axis.id] ?? 3,
      isUnrated: !milestone,
      fullMark: 5,
    };
  });

  return (
    <div className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <span>📊 スキル到達度と企業基準の比較（6軸）</span>
          <span className="text-[11px] font-normal text-slate-500">
            ※ 採用合否の判定ではなく、対話の入口としての比較です
          </span>
        </h4>
        <div className="text-xs text-indigo-600 font-medium flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          <span>軸名をクリックで評価基準（ルーブリック）を表示</span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={chartData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="subject"
              tick={({ payload, x, y, cx, cy, ...rest }) => {
                const axis = RUBRIC_AXES.find((a) => a.name === payload.value);
                return (
                  <text
                    {...rest}
                    x={x}
                    y={y}
                    className="text-[11px] font-medium fill-slate-700 hover:fill-indigo-600 cursor-pointer"
                    textAnchor={x > cx ? 'start' : x < cx ? 'end' : 'middle'}
                    onClick={() => axis && setSelectedAxis(axis)}
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#cbd5e1" tickCount={6} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

            {/* 企業の求める基準ライン (破線・薄い色) */}
            <Radar
              name={companyName}
              dataKey={companyName}
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth={2}
              fill="#94a3b8"
              fillOpacity={0.15}
            />

            {/* 本人自己評価 (研修生画面等でのみ表示オプション) */}
            {showSelfEvaluation && (
              <Radar
                name="本人自己評価"
                dataKey="本人自己評価"
                stroke="#38bdf8"
                strokeWidth={1.5}
                fill="#38bdf8"
                fillOpacity={0.15}
              />
            )}

            {/* 合意到達点 (実線・強調) */}
            <Radar
              name="本人と合意した到達点"
              dataKey="本人と合意した到達点"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="#10b981"
              fillOpacity={0.35}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 未評価軸の明示的注記 */}
      {unratedAxes.length > 0 && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
          <span>
            <strong>未確認項目あり:</strong> 【{unratedAxes.join('、')}】はまだ合意評価が記録されていません（お試し実習等で確認予定）。
          </span>
        </div>
      )}

      {/* ルーブリック詳細モーダル */}
      {selectedAxis && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-4 rounded-xl z-20 flex flex-col overflow-y-auto border border-indigo-200 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {selectedAxis.category === 'work_readiness' ? '就労基礎' : 'デジタル実務'}
              </span>
              <h5 className="font-bold text-slate-800 text-sm mt-1">{selectedAxis.name} 評価基準</h5>
            </div>
            <button
              onClick={() => setSelectedAxis(null)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-2 mb-3 bg-slate-50 p-2 rounded">
            {selectedAxis.description}
          </p>

          <div className="space-y-2 text-xs flex-1">
            {([1, 2, 3, 4, 5] as const).map((lvl) => {
              const rubric = selectedAxis.levels[lvl];
              return (
                <div
                  key={lvl}
                  className={`p-2 rounded border transition-colors ${
                    lvl === 3
                      ? 'border-emerald-300 bg-emerald-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-900">
                      レベル {lvl}: {rubric.label}
                    </span>
                    {lvl === 3 && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                        基準ライン
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{rubric.description}</p>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setSelectedAxis(null)}
            className="mt-3 w-full py-1.5 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-700"
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
};
