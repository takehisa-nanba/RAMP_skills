'use client';

import React, { useState, useEffect } from 'react';
import { DemoRole, TraineeProfile, CompanyWorkRequirement, Offer, SkillRequest, FeedbackSurvey } from '../types';
import { StorageService } from '../lib/storage';
import { DemoHeader } from '../components/ui/DemoHeader';
import { TraineeView } from '../components/views/TraineeView';
import { SupporterView } from '../components/views/SupporterView';
import { CompanyView } from '../components/views/CompanyView';

export default function Home() {
  const [currentRole, setCurrentRole] = useState<DemoRole>('company'); // ピッチ・展示では企業画面が主役
  const [trainees, setTrainees] = useState<TraineeProfile[]>([]);
  const [requirements, setRequirements] = useState<CompanyWorkRequirement[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<string>('');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [skillRequests, setSkillRequests] = useState<SkillRequest[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackSurvey[]>([]);
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
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-bold">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-300">RAMP デジタルスキルダッシュボードを起動中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-100/70">
      <div>
        {/* 固定デモヘッダー */}
        <DemoHeader
          currentRole={currentRole}
          onSelectRole={setCurrentRole}
          onResetDisplay={handleResetDisplay}
        />

        {/* メインビューの動的切替 */}
        <main className="pb-12">
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
            <CompanyView
              trainees={trainees}
              requirements={requirements}
              selectedRequirementId={selectedReqId}
              onSelectRequirement={handleSelectRequirement}
              onDataChange={loadData}
            />
          )}
        </main>
      </div>

      {/* フッター（哲学メッセージ） */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-3 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-slate-200">
              「この人は、御社にとって人財になり得ます。その根拠と、力を安定して発揮できる条件はこれです」
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              就労移行支援における「持続可能な作業周期」と企業要件の双方向接続システム | 株式会社RAMP
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500 space-y-0.5">
            <div>浜松市ソリューションピッチ＆ミートアップイベント（2026/09/01 登壇）</div>
            <div>オフライン完結型・デモ用プロトタイプ (LocalStorage + Next.js)</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
