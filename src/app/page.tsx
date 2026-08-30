'use client';

import React, { useState, useEffect } from 'react';
import { DemoRole, TraineeProfile, CompanyWorkRequirement, Offer, SkillRequest, FeedbackSurvey } from '../types';
import { StorageService } from '../lib/storage';
import { SlimHeader } from '../components/ui/SlimHeader';
import { TraineeView } from '../components/views/TraineeView';
import { SupporterView } from '../components/views/SupporterView';
import { CompanyExperienceView } from '../components/views/CompanyExperienceView';

export default function Home() {
  const [currentRole, setCurrentRole] = useState<DemoRole>('company'); // ピッチ・展示では企業画面が主役
  const [trainees, setTrainees] = useState<TraineeProfile[]>([]);
  const [requirements, setRequirements] = useState<CompanyWorkRequirement[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<string>('');
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('trainee-a');
  const [companyStep, setCompanyStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [skillRequests, setSkillRequests] = useState<SkillRequest[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackSurvey[]>([]);
  const [experienceKey, setExperienceKey] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // データ初期ロード＆同期関数
  const loadData = () => {
    const loadedTrainees = StorageService.getTrainees();
    const loadedReqs = StorageService.getCompanyRequirements();
    const loadedReqId = StorageService.getSelectedRequirementId();
    setTrainees(loadedTrainees);
    setRequirements(loadedReqs);
    setSelectedReqId(loadedReqId);
    setOffers(StorageService.getOffers());
    setSkillRequests(StorageService.getSkillRequests());
    setFeedbacks(StorageService.getFeedbacks());

    if (!selectedTraineeId && loadedTrainees.length > 0) {
      setSelectedTraineeId(loadedTrainees[0].id);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset') === 'true' || params.get('reset') === 'all') {
        StorageService.resetDisplayDemoData();
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
      const roleParam = params.get('role');
      if (roleParam && ['company', 'trainee', 'supporter'].includes(roleParam)) {
        setCurrentRole(roleParam as DemoRole);
      }
    }
    loadData();
    setIsLoaded(true);
  }, []);

  // 業務要件選択（全視点へ同期）
  const handleSelectRequirement = (id: string) => {
    setSelectedReqId(id);
    StorageService.setSelectedRequirementId(id);
  };

  // 研修生選択（全視点へ同期）
  const handleSelectTrainee = (id: string) => {
    setSelectedTraineeId(id);
  };

  // 視点切替（体験の文脈・同じケースを維持し、初期化は行わない）
  const handleSelectRole = (newRole: DemoRole) => {
    setCurrentRole(newRole);
  };

  // 明示的な初期化（ロゴクリック、表示初期化、次の来場者リセット時のみ実行）
  const handleResetToStart = () => {
    StorageService.resetDisplayDemoData();
    loadData();
    setCompanyStep(0);
    if (requirements.length > 0) {
      setSelectedReqId(requirements[0].id);
      StorageService.setSelectedRequirementId(requirements[0].id);
    }
    if (trainees.length > 0) {
      setSelectedTraineeId(trainees[0].id);
    }
    setExperienceKey((k) => k + 1);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-bold">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-300">RAMP デジタルスキルダッシュボードを起動中...</p>
        </div>
      </div>
    );
  }

  // 現在選択中の研修生オブジェクト
  const activeTrainee = trainees.find((t) => t.id === selectedTraineeId) || trainees[0];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-teal-50/40 via-slate-50 to-cyan-50/30 text-slate-900">
      <div>
        {/* 1段スリムヘッダー（視点切替は文脈維持、ロゴクリックで初期化） */}
        <SlimHeader
          currentRole={currentRole}
          selectedTraineeCodeName={activeTrainee?.codeName}
          onSelectRole={handleSelectRole}
          onResetDisplay={handleResetToStart}
          onReturnToStart={handleResetToStart}
        />

        {/* メインビューの動的切替（同一ケースの文脈を保持） */}
        <main className="pb-8">
          {currentRole === 'trainee' && (
            <TraineeView
              trainee={activeTrainee}
              focusedRequirementId={selectedReqId}
              onDataChange={loadData}
            />
          )}

          {currentRole === 'supporter' && (
            <SupporterView
              trainees={trainees}
              initialSelectedTraineeId={selectedTraineeId}
              focusedRequirementId={selectedReqId}
              offers={offers}
              skillRequests={skillRequests}
              feedbacks={feedbacks}
              onDataChange={loadData}
            />
          )}

          {currentRole === 'company' && (
            <CompanyExperienceView
              key={experienceKey}
              trainees={trainees}
              requirements={requirements}
              selectedRequirementId={selectedReqId}
              selectedTraineeId={selectedTraineeId}
              companyStep={companyStep}
              onStepChange={setCompanyStep}
              onSelectRequirement={handleSelectRequirement}
              onSelectTrainee={handleSelectTrainee}
              onDataChange={loadData}
              onReturnToStart={handleResetToStart}
            />
          )}
        </main>
      </div>

      {/* 洗練されたコンパクトフッター */}
      <footer className="bg-slate-900 text-slate-400 py-4 border-t border-slate-800 text-[11px]">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-slate-300">
            「人を仕事に合わせるのではなく、人と仕事がつながる条件で探す。」
          </p>
          <div className="text-slate-500">
            株式会社RAMP | 浜松市ソリューションピッチ（2026/09/01）
          </div>
        </div>
      </footer>
    </div>
  );
}
