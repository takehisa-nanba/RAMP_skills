import React, { useState } from 'react';
import { TraineeProfile } from '../../types';
import { SkillRadarChart } from '../charts/SkillRadarChart';
import { StorageService } from '../../lib/storage';
import { RUBRIC_AXES } from '../../data/seed';
import { Clock, CheckCircle2, Heart, Award, ArrowRight, Save } from 'lucide-react';

interface TraineeViewProps {
  trainee: TraineeProfile;
  onDataChange: () => void;
}

export const TraineeView: React.FC<TraineeViewProps> = ({ trainee, onDataChange }) => {
  // 日々の振り返り入力フォームの状態
  const [mood, setMood] = useState<'great' | 'good' | 'tired' | 'low'>('good');
  const [completedTask, setCompletedTask] = useState('領収書入力・照合 10件演習');
  const [cycleMinutes, setCycleMinutes] = useState(20);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [selfScoreMap, setSelfScoreMap] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    RUBRIC_AXES.forEach((axis) => {
      const existing = trainee.evaluations.find(
        (e) => e.skillId === axis.id && e.type === 'self'
      );
      initial[axis.id] = existing ? existing.score : 3;
    });
    return initial;
  });
  const [isSavedToast, setIsSavedToast] = useState(false);

  const handleSaveDailyReview = (e: React.FormEvent) => {
    e.preventDefault();

    // 各スキルの自己評価レコードを追加（追記型・上書きせず履歴保持）
    const now = new Date().toISOString();
    RUBRIC_AXES.forEach((axis) => {
      StorageService.addEvaluation(trainee.id, {
        id: `self-${Date.now()}-${axis.id}`,
        traineeId: trainee.id,
        skillId: axis.id,
        type: 'self',
        score: selfScoreMap[axis.id],
        comment: `日報振り返り: 気分[${mood}] / 成果[${completedTask}]`,
        evaluatorName: '本人 (自己評価)',
        evaluatedAt: now,
      });
    });

    onDataChange();
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* デモ注記バナー */}
      <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
            研修生視点
          </span>
          <span className="font-semibold">
            {trainee.codeName} のマイページ（架空のモデルケース・デモ用想定値）
          </span>
        </div>
        <div className="text-slate-500">
          合意就労条件: {trainee.desiredWorkCondition.daysPerWeek} / {trainee.desiredWorkCondition.hoursPerDay}
        </div>
      </div>

      {isSavedToast && (
        <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-lg flex items-center justify-between text-xs animate-bounce">
          <span>✅ 今日の振り返りと自己評価を記録しました！（支援員と共有されます）</span>
        </div>
      )}

      {/* 上部サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{trainee.codeName}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  {trainee.targetJob}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                私の目指す働き方: {trainee.desiredWorkCondition.workStyle}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">月次面談到達点の合意日: </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                {trainee.publicSummary.consentedAt}
              </span>
            </div>
          </div>

          {/* 安定する作業周期サマリー */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 mb-4">
            <h3 className="text-xs font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>支援員と確認した「私の持続可能なワークサイクル」</span>
              <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                デモ用想定値
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
              <div className="bg-white px-3 py-2 rounded-lg border border-emerald-200">
                <span className="text-slate-500 block text-[10px]">集中作業時間</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {trainee.workCycles[0]?.workDurationMinutes || 20}分
                </span>
              </div>
              <span className="text-slate-400 font-bold">+</span>
              <div className="bg-white px-3 py-2 rounded-lg border border-sky-200">
                <span className="text-slate-500 block text-[10px]">回復時間（深呼吸・水分）</span>
                <span className="font-bold text-sky-700 text-sm">
                  {trainee.workCycles[0]?.recoveryDurationMinutes || 10}分
                </span>
              </div>
              <span className="text-slate-400 font-bold">=</span>
              <div className="bg-white px-3 py-2 rounded-lg border border-indigo-200">
                <span className="text-slate-500 block text-[10px]">1サイクル成果</span>
                <span className="font-bold text-indigo-700 text-sm">
                  {trainee.workCycles[0]?.completedOutput}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed">
              💡 <strong>気づき:</strong> 「休憩を10分挟むことで、次の20分も高い正確性（{trainee.workCycles[0]?.qualityResult}）を維持できます。」
            </p>
          </div>

          {/* 実績バッジ */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
              <Award className="w-4 h-4 text-amber-500" />
              <span>これまでの達成実績・バッジ</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {trainee.badges.map((b, i) => (
                <span
                  key={i}
                  className="text-xs bg-slate-100 text-slate-800 font-medium px-2.5 py-1 rounded-lg border border-slate-200"
                >
                  🎖️ {b}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* スキルレーダーチャート (合意到達点 vs 自己評価) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <SkillRadarChart
            evaluations={trainee.evaluations}
            showSelfEvaluation={true}
            companyName="企業基準目安"
          />
          <div className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            緑の実線が<strong>「支援員と面談で合意した到達点」</strong>、水色の細線が<strong>「あなたの最新自己評価」</strong>です。
          </div>
        </div>
      </div>

      {/* 下部: 日々の振り返り入力 ＆ 私のトリセツ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 今日の振り返りフォーム */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>今日の振り返り・自己評価の入力</span>
            <span className="text-[11px] text-slate-400 font-normal">（日報感覚で数クリック）</span>
          </h3>

          <form onSubmit={handleSaveDailyReview} className="space-y-4 text-xs">
            {/* 体調・気分 */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                今日のコンディション・気分
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'great', label: '良好 ☀️' },
                  { key: 'good', label: '普通 ⛅' },
                  { key: 'tired', label: 'やや疲労 🌧️' },
                  { key: 'low', label: '不調 ⛈️' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => setMood(item.key as any)}
                    className={`py-2 text-center rounded-lg border font-semibold transition ${
                      mood === item.key
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 本日取り組んだ業務 */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">本日取り組んだ模擬業務</label>
              <input
                type="text"
                value={completedTask}
                onChange={(e) => setCompletedTask(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            {/* 作業時間と回復時間 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1サイクルの集中時間 (分)
                </label>
                <input
                  type="number"
                  value={cycleMinutes}
                  onChange={(e) => setCycleMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  min={5}
                  max={120}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  挟んだ回復時間 (分)
                </label>
                <input
                  type="number"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  min={0}
                  max={60}
                />
              </div>
            </div>

            {/* スキル項目ごとの自己評価スライダー (1〜5) */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <span className="font-semibold text-slate-800 block">各スキルの実感（自己評価）</span>
              {RUBRIC_AXES.map((axis) => (
                <div key={axis.id} className="flex items-center justify-between gap-3">
                  <span className="text-slate-700 w-44 font-medium truncate" title={axis.name}>
                    {axis.name}
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={selfScoreMap[axis.id] || 3}
                    onChange={(e) =>
                      setSelfScoreMap({ ...selfScoreMap, [axis.id]: Number(e.target.value) })
                    }
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                  <span className="w-8 text-center font-bold text-blue-700 bg-blue-50 py-0.5 rounded border border-blue-200">
                    {selfScoreMap[axis.id] || 3}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>振り返りと自己評価を記録する</span>
            </button>
          </form>
        </div>

        {/* 私のトリセツ確認 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>私のトリセツ（自己対処と希望するサポート環境）</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              自身の苦手や特性に対して、「自分で行う工夫」と「企業にお願いしたい配慮」を対比して整理しています。
            </p>

            <div className="space-y-3">
              {trainee.instructions.map((item, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>特性・苦手: {item.characteristic}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200 text-emerald-900">
                      <strong className="block text-[10px] text-emerald-700">🌱 私の自己対処</strong>
                      {item.selfCoping}
                    </div>
                    <div className="bg-indigo-50/70 p-2 rounded border border-indigo-200 text-indigo-900">
                      <strong className="block text-[10px] text-indigo-700">🤝 企業へのお願い（合理的配慮）</strong>
                      {item.requestedSupport}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 p-3 rounded-xl text-xs text-slate-600">
            <strong>月1面談での合意サマリー:</strong>
            <p className="mt-1 leading-relaxed text-slate-700 italic">
              「{trainee.publicSummary.strengths}」
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
