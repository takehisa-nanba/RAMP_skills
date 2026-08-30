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
  const [offers, setOffers] = useState<Offer[]>([]);
  const [skillRequests, setSkillRequests] = useState<SkillRequest[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackSurvey[]>([]);
  const [experienceKey, setExperienceKey] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // データ初期ロード＆同期関数
  const loadData = () => {
    setTrainees(StorageService.getTrainees());
    setRequirements(StorageService.getCompanyRequirements());
    setSelectedReqId(StorageService.getSelectedRequirementId());
    setOffers(StorageService.getOffers());
    setSkillRequests(StorageService.getSkillRequests());
    setFeedbacks(StorageService.getFeedbacks());
  };

  useEffect(() => {
    loadData();
    setIsLoaded(true);
  }, []);

  const handleSelectRequirement = (id: string) => {
    setSelectedReqId(id);
    StorageService.setSelectedRequirementId(id);
  };

  const handleResetDisplay = () => {
    StorageService.resetDisplayDemoData();
    loadData();
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

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-100/60 text-slate-900">
      <div>
        {/* 1段スリムヘッダー */}
        <SlimHeader
          currentRole={currentRole}
          onSelectRole={setCurrentRole}
          onResetDisplay={handleResetDisplay}
        />

        {/* メインビューの動的切替 */}
        <main className="pb-8">
          {currentRole === 'trainee' && (
            <TraineeView
              trainee={trainees[0]}
              onDataChange={loadData}
            />
          )}

          {currentRole === 'supporter' && (
            <SupporterView
              trainees={trainees}
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
              onSelectRequirement={handleSelectRequirement}
              onDataChange={loadData}
              onReturnToStart={() => setExperienceKey((k) => k + 1)}
            />
          )}
        </main>
      </div>

      {/* 洗練されたコンパクトフッター */}
      <footer className="bg-slate-900 text-slate-400 py-4 border-t border-slate-800 text-[11px]">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-slate-300">
            「人を仕事に合わせるのではなく、人と仕事がつながる条件を探す。」
          </p>
          <div className="text-slate-500">
            株式会社RAMP | 浜松市ソリューションピッチ（2026/09/01）
          </div>
        </div>
      </footer>
    </div>
  );
}
