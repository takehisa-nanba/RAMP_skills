import {
  TraineeProfile,
  CompanyWorkRequirement,
  EvaluationRecord,
  Offer,
  SkillRequest,
  FeedbackSurvey,
  PracticeObservationRecord,
  CompanyRequirementResponse,
  WorkCycleEvidence,
  CollectionMode,
  CollectionPhase,
  MigrationStatus,
  DataOrigin,
  ObservationSource,
  SourceBreakdownItem,
} from '../types';
import { INITIAL_TRAINEES, INITIAL_COMPANY_REQUIREMENTS, INITIAL_OFFERS } from '../data/seed';

// =========================================================================
// v2 ストレージキー（v1から完全分離）
// =========================================================================
const V2_KEYS = {
  MIGRATION_STATUS: 'ramp_skills_v2_migration_status',
  COLLECTION_PHASE: 'ramp_skills_v2_collection_phase',
  TRAINEES: 'ramp_skills_v2_trainees',
  COMPANY_REQUIREMENTS: 'ramp_skills_v2_company_reqs',
  SELECTED_REQ_ID: 'ramp_skills_v2_selected_req_id',
  OFFERS: 'ramp_skills_v2_offers',
  SKILL_REQUESTS: 'ramp_skills_v2_skill_requests',
  FEEDBACKS: 'ramp_skills_v2_feedbacks',
  PRACTICE_RECORDS: 'ramp_skills_v2_practice_observations',
  REQ_RESPONSES: 'ramp_skills_v2_req_responses',
  CSV_EXPORTED_FLAG: 'ramp_skills_v2_csv_exported_flag',
};

// 旧 v1 ストレージキー（読み取り・移行用、削除しない）
const V1_KEYS = {
  TRAINEES: 'ramp_skills_trainees_v1',
  COMPANY_REQUIREMENTS: 'ramp_skills_company_reqs_v1',
  SELECTED_REQ_ID: 'ramp_skills_selected_req_id_v1',
  OFFERS: 'ramp_skills_offers_v1',
  SKILL_REQUESTS: 'ramp_skills_skill_requests_v1',
  FEEDBACKS: 'ramp_skills_feedbacks_v1',
  PRACTICE_RECORDS: 'ramp_skills_practice_records_v1',
  CSV_EXPORTED_FLAG: 'ramp_skills_csv_exported_flag_v1',
};

// 中央値算出ヘルパー
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export const StorageService = {
  // =========================================================================
  // 1. 安全な二段階データ移行 (v1 ➔ v2)
  // =========================================================================
  ensureMigration(): MigrationStatus {
    if (typeof window === 'undefined') return 'completed';

    const currentStatus = localStorage.getItem(V2_KEYS.MIGRATION_STATUS) as MigrationStatus | null;
    if (currentStatus === 'completed') {
      return 'completed';
    }

    try {
      localStorage.setItem(V2_KEYS.MIGRATION_STATUS, 'in_progress');

      // 1. フェーズ初期化
      if (!localStorage.getItem(V2_KEYS.COLLECTION_PHASE)) {
        const initialPhase: CollectionPhase = {
          id: `phase-verification-${Date.now()}`,
          mode: 'verification',
          startedAt: new Date().toISOString(),
        };
        localStorage.setItem(V2_KEYS.COLLECTION_PHASE, JSON.stringify(initialPhase));
      }

      // 2. 研修生データ (v1観測データは legacy_unverified として隔離)
      const v1TraineesRaw = localStorage.getItem(V1_KEYS.TRAINEES);
      let traineesToSave = INITIAL_TRAINEES;
      if (v1TraineesRaw) {
        try {
          const parsed = JSON.parse(v1TraineesRaw) as TraineeProfile[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            // v1由来の観測データを legacy_unverified としてタグ付け隔離
            traineesToSave = parsed.map((t) => ({
              ...t,
              workCycles: t.workCycles.map((wc) => ({
                ...wc,
                dataOrigin: 'legacy_unverified' as DataOrigin,
              })),
            }));
          }
        } catch {
          traineesToSave = INITIAL_TRAINEES;
        }
      }
      localStorage.setItem(V2_KEYS.TRAINEES, JSON.stringify(traineesToSave));

      // 3. 企業業務要件
      const v1ReqsRaw = localStorage.getItem(V1_KEYS.COMPANY_REQUIREMENTS);
      let reqsToSave = INITIAL_COMPANY_REQUIREMENTS;
      if (v1ReqsRaw) {
        try {
          const parsed = JSON.parse(v1ReqsRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            reqsToSave = parsed;
          }
        } catch {
          reqsToSave = INITIAL_COMPANY_REQUIREMENTS;
        }
      }
      localStorage.setItem(V2_KEYS.COMPANY_REQUIREMENTS, JSON.stringify(reqsToSave));

      // 4. 選択中ID
      const v1SelectedId = localStorage.getItem(V1_KEYS.SELECTED_REQ_ID);
      localStorage.setItem(V2_KEYS.SELECTED_REQ_ID, v1SelectedId || INITIAL_COMPANY_REQUIREMENTS[0].id);

      // 5. 需要データ移行 (既存v1は verification として移行)
      const v1OffersRaw = localStorage.getItem(V1_KEYS.OFFERS);
      const offersToSave: Offer[] = v1OffersRaw ? JSON.parse(v1OffersRaw) : INITIAL_OFFERS;
      const normalizedOffers = offersToSave.map((o) => ({
        ...o,
        collectionMode: o.collectionMode || ('verification' as CollectionMode),
      }));
      localStorage.setItem(V2_KEYS.OFFERS, JSON.stringify(normalizedOffers));

      const v1ReqsDataRaw = localStorage.getItem(V1_KEYS.SKILL_REQUESTS);
      const reqsDataToSave: SkillRequest[] = v1ReqsDataRaw ? JSON.parse(v1ReqsDataRaw) : [];
      localStorage.setItem(
        V2_KEYS.SKILL_REQUESTS,
        JSON.stringify(reqsDataToSave.map((r) => ({ ...r, collectionMode: r.collectionMode || 'verification' })))
      );

      const v1FeedbacksRaw = localStorage.getItem(V1_KEYS.FEEDBACKS);
      const feedbacksToSave: FeedbackSurvey[] = v1FeedbacksRaw ? JSON.parse(v1FeedbacksRaw) : [];
      localStorage.setItem(
        V2_KEYS.FEEDBACKS,
        JSON.stringify(feedbacksToSave.map((f) => ({ ...f, collectionMode: f.collectionMode || 'verification' })))
      );

      // 6. 実践観測生ログ
      const v1PracticeRaw = localStorage.getItem(V1_KEYS.PRACTICE_RECORDS);
      const practiceToSave: PracticeObservationRecord[] = v1PracticeRaw ? JSON.parse(v1PracticeRaw) : [];
      localStorage.setItem(
        V2_KEYS.PRACTICE_RECORDS,
        JSON.stringify(practiceToSave.map((p) => ({ ...p, collectionMode: p.collectionMode || 'verification', dataOrigin: 'legacy_unverified' })))
      );

      // 7. 回答スナップショット初期化
      if (!localStorage.getItem(V2_KEYS.REQ_RESPONSES)) {
        localStorage.setItem(V2_KEYS.REQ_RESPONSES, JSON.stringify([]));
      }

      // 完了マーカーの記録（v1データは一切削除せず保持）
      localStorage.setItem(V2_KEYS.MIGRATION_STATUS, 'completed');
      return 'completed';
    } catch (e) {
      console.error('v1 to v2 migration failed:', e);
      localStorage.setItem(V2_KEYS.MIGRATION_STATUS, 'failed');
      return 'failed';
    }
  },

  // =========================================================================
  // 2. 運用フェーズ管理 (verification vs event)
  // =========================================================================
  getCurrentCollectionPhase(): CollectionPhase {
    if (typeof window === 'undefined') {
      return { id: 'phase-default', mode: 'verification', startedAt: '' };
    }
    this.ensureMigration();
    try {
      const data = localStorage.getItem(V2_KEYS.COLLECTION_PHASE);
      if (data) return JSON.parse(data);
    } catch {}
    const initialPhase: CollectionPhase = {
      id: `phase-verification-${Date.now()}`,
      mode: 'verification',
      startedAt: new Date().toISOString(),
    };
    localStorage.setItem(V2_KEYS.COLLECTION_PHASE, JSON.stringify(initialPhase));
    return initialPhase;
  },

  startEventCollectionPhase(): CollectionPhase {
    if (typeof window === 'undefined') {
      return { id: 'phase-event', mode: 'event', startedAt: '' };
    }
    const newPhase: CollectionPhase = {
      id: `phase-event-${Date.now()}`,
      mode: 'event',
      startedAt: new Date().toISOString(),
    };
    localStorage.setItem(V2_KEYS.COLLECTION_PHASE, JSON.stringify(newPhase));
    return newPhase;
  },

  startVerificationCollectionPhase(): CollectionPhase {
    if (typeof window === 'undefined') {
      return { id: 'phase-verification', mode: 'verification', startedAt: '' };
    }
    const newPhase: CollectionPhase = {
      id: `phase-verification-${Date.now()}`,
      mode: 'verification',
      startedAt: new Date().toISOString(),
    };
    localStorage.setItem(V2_KEYS.COLLECTION_PHASE, JSON.stringify(newPhase));
    return newPhase;
  },

  // =========================================================================
  // 3. 研修生データ & 観測生ログ集計
  // =========================================================================
  getTrainees(): TraineeProfile[] {
    if (typeof window === 'undefined') return INITIAL_TRAINEES;
    this.ensureMigration();
    try {
      const data = localStorage.getItem(V2_KEYS.TRAINEES);
      return data ? JSON.parse(data) : INITIAL_TRAINEES;
    } catch {
      return INITIAL_TRAINEES;
    }
  },

  saveTrainees(trainees: TraineeProfile[]): void {
    if (typeof window === 'undefined') return;
    this.ensureMigration();
    localStorage.setItem(V2_KEYS.TRAINEES, JSON.stringify(trainees));
  },

  addEvaluation(traineeId: string, evaluation: Omit<EvaluationRecord, 'collectionMode' | 'collectionPhaseId'>): void {
    const phase = this.getCurrentCollectionPhase();
    const fullEval: EvaluationRecord = {
      ...evaluation,
      collectionMode: phase.mode,
      collectionPhaseId: phase.id,
    };
    const trainees = this.getTrainees();
    const updated = trainees.map((t) => {
      if (t.id === traineeId) {
        return {
          ...t,
          evaluations: [fullEval, ...t.evaluations],
        };
      }
      return t;
    });
    this.saveTrainees(updated);
  },

  // 生ログ：実践観測記録
  getPracticeRecords(): PracticeObservationRecord[] {
    if (typeof window === 'undefined') return [];
    this.ensureMigration();
    try {
      const data = localStorage.getItem(V2_KEYS.PRACTICE_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addPracticeRecord(record: Omit<PracticeObservationRecord, 'collectionMode' | 'collectionPhaseId'>): void {
    if (typeof window === 'undefined') return;
    const phase = this.getCurrentCollectionPhase();
    const fullRecord: PracticeObservationRecord = {
      ...record,
      collectionMode: phase.mode,
      collectionPhaseId: phase.id,
    };
    const records = this.getPracticeRecords();
    records.unshift(fullRecord);
    localStorage.setItem(V2_KEYS.PRACTICE_RECORDS, JSON.stringify(records));
  },

  // 支援員確認メタ追記（verificationStatus: supporter_confirmed）
  confirmPracticeRecord(
    recordId: string,
    supporterName: string,
    supporterNote: string,
    stabilizingConditions: string[]
  ): boolean {
    if (typeof window === 'undefined') return false;
    const records = this.getPracticeRecords();
    const idx = records.findIndex((r) => r.id === recordId);
    if (idx === -1) return false;

    records[idx] = {
      ...records[idx],
      verificationStatus: 'supporter_confirmed',
      status: 'verified',
      verifiedBy: supporterName,
      verifiedAt: new Date().toISOString(),
      supporterNote,
      stabilizingConditions,
    };
    localStorage.setItem(V2_KEYS.PRACTICE_RECORDS, JSON.stringify(records));
    return true;
  },

  // 生ログから出所別に WorkCycleEvidence を動的集計
  calculateWorkCycleEvidence(
    traineeId: string,
    taskIdentifier: { taskDefinitionId?: string; requirementId?: string; outputUnit: string; outputQuantity: number }
  ): WorkCycleEvidence | undefined {
    const records = this.getPracticeRecords().filter(
      (r) =>
        r.traineeId === traineeId &&
        r.dataOrigin === 'live_observation' && // デモシードや隔離データとは合算しない
        r.outputUnit === taskIdentifier.outputUnit &&
        r.outputQuantity === taskIdentifier.outputQuantity &&
        ((taskIdentifier.taskDefinitionId && r.taskDefinitionId === taskIdentifier.taskDefinitionId) ||
          (taskIdentifier.requirementId && r.requirementId === taskIdentifier.requirementId))
    );

    if (records.length === 0) return undefined;

    // 出所別ブレイクダウンの集計
    const sources: ObservationSource[] = ['trainee_self_report', 'supporter_observed'];
    const breakdown: SourceBreakdownItem[] = [];

    sources.forEach((src) => {
      const srcRecords = records.filter((r) => r.source === src);
      if (srcRecords.length > 0) {
        const durations = srcRecords.map((r) => r.workDurationMinutes);
        const min = Math.min(...durations);
        const max = Math.max(...durations);
        breakdown.push({
          source: src,
          count: srcRecords.length,
          confirmedCount: srcRecords.filter((r) => r.verificationStatus === 'supporter_confirmed').length,
          minDurationMinutes: min,
          maxDurationMinutes: max,
          isRangeCalculated: srcRecords.length >= 2,
        });
      }
    });

    const allWorkDurations = records.map((r) => r.workDurationMinutes);
    const allRecoveryDurations = records.map((r) => r.recoveryDurationMinutes);
    const latest = records[0];

    const medianWork = calculateMedian(allWorkDurations);
    const medianRecovery = calculateMedian(allRecoveryDurations);
    const minWork = Math.min(...allWorkDurations);
    const maxWork = Math.max(...allWorkDurations);

    // 全ての安定再現条件をユニーク統合
    const allConditions = Array.from(
      new Set(records.flatMap((r) => r.stabilizingConditions || []))
    );
    const allCoping = Array.from(
      new Set(records.flatMap((r) => r.traineeCoping || []))
    );

    return {
      id: `agg-${traineeId}-${Date.now()}`,
      traineeId,
      taskDefinitionId: taskIdentifier.taskDefinitionId,
      requirementId: taskIdentifier.requirementId,
      taskName: latest.taskName,
      taskCategory: latest.taskCategory,
      outputQuantity: latest.outputQuantity,
      outputUnit: latest.outputUnit,
      workUnit: `${latest.outputQuantity}${latest.outputUnit}`,
      workDurationMinutes: medianWork,
      recoveryDurationMinutes: medianRecovery,
      medianWorkDurationMinutes: medianWork,
      medianRecoveryDurationMinutes: medianRecovery,
      latestWorkDurationMinutes: latest.workDurationMinutes,
      minWorkDurationMinutes: minWork,
      maxWorkDurationMinutes: maxWork,
      isRangeCalculated: records.length >= 2,
      totalObservationCount: records.length,
      sourceBreakdown: breakdown,
      dataOrigin: 'live_observation',
      completedOutput: `${latest.outputQuantity}${latest.outputUnit} 完了`,
      qualityResult: latest.qualityResult,
      qualityRecords: records.map((r) => ({
        result: r.qualityResult || '未測定',
        method: r.measurementMethod,
        source: r.source,
        recordedAt: r.recordedAt,
      })),
      observedRepeatRange: {
        minCycles: Math.min(records.length, 2),
        maxCycles: Math.max(records.length, 3),
        observedWindowMinutes: (medianWork + medianRecovery) * Math.max(records.length, 1),
      },
      observedRange: {
        minDurationMinutes: minWork,
        maxDurationMinutes: maxWork,
        isRangeCalculated: records.length >= 2,
      },
      stabilizingConditions: allConditions.length > 0 ? allConditions : ['手順書の事前確認'],
      selfCopingUsed: allCoping,
      supportUsed: ['開始時の仕様確認'],
      observedAt: latest.recordedAt.slice(0, 10),
      evidenceNote: `生ログ${records.length}件から集計（中央値作業${medianWork}分＋回復${medianRecovery}分）。`,
    };
  },

  // =========================================================================
  // 4. 企業業務要件データ
  // =========================================================================
  getCompanyRequirements(): CompanyWorkRequirement[] {
    if (typeof window === 'undefined') return INITIAL_COMPANY_REQUIREMENTS;
    this.ensureMigration();
    try {
      const data = localStorage.getItem(V2_KEYS.COMPANY_REQUIREMENTS);
      return data ? JSON.parse(data) : INITIAL_COMPANY_REQUIREMENTS;
    } catch {
      return INITIAL_COMPANY_REQUIREMENTS;
    }
  },

  saveCompanyRequirements(reqs: CompanyWorkRequirement[]): void {
    if (typeof window === 'undefined') return;
    this.ensureMigration();
    const phase = this.getCurrentCollectionPhase();
    const normalized = reqs.map((r) => ({
      ...r,
      collectionMode: r.collectionMode || phase.mode,
      collectionPhaseId: r.collectionPhaseId || phase.id,
    }));
    localStorage.setItem(V2_KEYS.COMPANY_REQUIREMENTS, JSON.stringify(normalized));
  },

  deleteCompanyRequirement(id: string): boolean {
    if (typeof window === 'undefined') return false;
    if (INITIAL_COMPANY_REQUIREMENTS.some((r) => r.id === id)) {
      return false; // プリセット業務は保護
    }
    const current = this.getCompanyRequirements();
    const filtered = current.filter((r) => r.id !== id);
    this.saveCompanyRequirements(filtered);
    return true;
  },

  getSelectedRequirementId(): string {
    if (typeof window === 'undefined') return INITIAL_COMPANY_REQUIREMENTS[0].id;
    this.ensureMigration();
    return localStorage.getItem(V2_KEYS.SELECTED_REQ_ID) || INITIAL_COMPANY_REQUIREMENTS[0].id;
  },

  setSelectedRequirementId(id: string): void {
    if (typeof window === 'undefined') return;
    this.ensureMigration();
    localStorage.setItem(V2_KEYS.SELECTED_REQ_ID, id);
  },

  // =========================================================================
  // 5. 企業要件回答スナップショット（【この条件で比較する】明示押下時）
  // =========================================================================
  getRequirementResponses(): CompanyRequirementResponse[] {
    if (typeof window === 'undefined') return [];
    this.ensureMigration();
    try {
      const data = localStorage.getItem(V2_KEYS.REQ_RESPONSES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addRequirementResponse(
    response: Omit<CompanyRequirementResponse, 'collectionMode' | 'collectionPhaseId'>
  ): void {
    if (typeof window === 'undefined') return;
    const phase = this.getCurrentCollectionPhase();
    const fullResponse: CompanyRequirementResponse = {
      ...response,
      collectionMode: phase.mode,
      collectionPhaseId: phase.id,
    };
    const current = this.getRequirementResponses();
    current.unshift(fullResponse);
    localStorage.setItem(V2_KEYS.REQ_RESPONSES, JSON.stringify(current));
    // 新規回答追加時はCSV未出力状態へリセット
    localStorage.removeItem(V2_KEYS.CSV_EXPORTED_FLAG);
  },

  // =========================================================================
  // 6. 需要検証データ (オファー・リクエスト・アンケート)
  // =========================================================================
  getOffers(): Offer[] {
    if (typeof window === 'undefined') return INITIAL_OFFERS;
    this.ensureMigration();
    try {
      const data = localStorage.getItem(V2_KEYS.OFFERS);
      return data ? JSON.parse(data) : INITIAL_OFFERS;
    } catch {
      return INITIAL_OFFERS;
    }
  },

  addOffer(offer: Omit<Offer, 'collectionMode' | 'collectionPhaseId'>): void {
    const phase = this.getCurrentCollectionPhase();
    const fullOffer: Offer = {
      ...offer,
      collectionMode: phase.mode,
      collectionPhaseId: phase.id,
    };
    const offers = this.getOffers();
    offers.unshift(fullOffer);
    localStorage.setItem(V2_KEYS.OFFERS, JSON.stringify(offers));
    localStorage.removeItem(V2_KEYS.CSV_EXPORTED_FLAG);
  },

  getSkillRequests(): SkillRequest[] {
    if (typeof window === 'undefined') return [];
    this.ensureMigration();
    try {
      const data = localStorage.getItem(V2_KEYS.SKILL_REQUESTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addSkillRequest(req: Omit<SkillRequest, 'collectionMode' | 'collectionPhaseId'>): void {
    const phase = this.getCurrentCollectionPhase();
    const fullReq: SkillRequest = {
      ...req,
      collectionMode: phase.mode,
      collectionPhaseId: phase.id,
    };
    const requests = this.getSkillRequests();
    requests.unshift(fullReq);
    localStorage.setItem(V2_KEYS.SKILL_REQUESTS, JSON.stringify(requests));
    localStorage.removeItem(V2_KEYS.CSV_EXPORTED_FLAG);
  },

  getFeedbacks(): FeedbackSurvey[] {
    if (typeof window === 'undefined') return [];
    this.ensureMigration();
    try {
      const data = localStorage.getItem(V2_KEYS.FEEDBACKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addFeedback(survey: Omit<FeedbackSurvey, 'collectionMode' | 'collectionPhaseId'>): void {
    const phase = this.getCurrentCollectionPhase();
    const fullSurvey: FeedbackSurvey = {
      ...survey,
      collectionMode: phase.mode,
      collectionPhaseId: phase.id,
    };
    const feedbacks = this.getFeedbacks();
    feedbacks.unshift(fullSurvey);
    localStorage.setItem(V2_KEYS.FEEDBACKS, JSON.stringify(feedbacks));
    localStorage.removeItem(V2_KEYS.CSV_EXPORTED_FLAG);
  },

  // =========================================================================
  // 7. リセット・初期化・運用操作
  // =========================================================================
  // 表示のみ初期化（選択中IDのみリセット、全データ完全保持）
  resetDisplayDemoData(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(V2_KEYS.SELECTED_REQ_ID, INITIAL_COMPANY_REQUIREMENTS[0].id);
  },

  // 互換性用
  resetAllToSeed(): void {
    this.resetDisplayDemoData();
  },

  // 検証データ内訳カウント取得（demo_seed は保護・除外）
  getVerificationDataCounts() {
    const offers = this.getOffers().filter(
      (o) => o.dataOrigin !== 'demo_seed' && o.collectionMode === 'verification'
    );
    const skillRequests = this.getSkillRequests().filter((r) => r.collectionMode === 'verification');
    const feedbacks = this.getFeedbacks().filter((f) => f.collectionMode === 'verification');
    const responses = this.getRequirementResponses().filter((r) => r.collectionMode === 'verification');
    const customReqs = this.getCompanyRequirements().filter(
      (r) => !INITIAL_COMPANY_REQUIREMENTS.some((init) => init.id === r.id) && r.collectionMode === 'verification'
    );
    const practices = this.getPracticeRecords().filter((p) => p.collectionMode === 'verification');

    return {
      offers: offers.length,
      skillRequests: skillRequests.length,
      feedbacks: feedbacks.length,
      responses: responses.length,
      customReqs: customReqs.length,
      practices: practices.length,
      total:
        offers.length +
        skillRequests.length +
        feedbacks.length +
        responses.length +
        customReqs.length +
        practices.length,
    };
  },

  // 本番データ内訳カウント取得
  getEventDataCounts() {
    const offers = this.getOffers().filter((o) => o.collectionMode === 'event');
    const skillRequests = this.getSkillRequests().filter((r) => r.collectionMode === 'event');
    const feedbacks = this.getFeedbacks().filter((f) => f.collectionMode === 'event');
    const responses = this.getRequirementResponses().filter((r) => r.collectionMode === 'event');
    const customReqs = this.getCompanyRequirements().filter(
      (r) => !INITIAL_COMPANY_REQUIREMENTS.some((init) => init.id === r.id) && r.collectionMode === 'event'
    );
    const practices = this.getPracticeRecords().filter((p) => p.collectionMode === 'event');

    return {
      offers: offers.length,
      skillRequests: skillRequests.length,
      feedbacks: feedbacks.length,
      responses: responses.length,
      customReqs: customReqs.length,
      practices: practices.length,
      total:
        offers.length +
        skillRequests.length +
        feedbacks.length +
        responses.length +
        customReqs.length +
        practices.length,
    };
  },

  // 【検証データを削除してイベント収集を開始】（demo_seed 初期オファーは完全永続保護）
  purgeVerificationDataAndStartEvent(): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false, error: 'Window undefined' };

    try {
      // 1. 現在のイベント・シード件数を事前記録
      const preEventOffers = this.getOffers().filter((o) => o.collectionMode === 'event').length;
      const preEventRequests = this.getSkillRequests().filter((r) => r.collectionMode === 'event').length;
      const preEventFeedbacks = this.getFeedbacks().filter((f) => f.collectionMode === 'event').length;
      const preEventResponses = this.getRequirementResponses().filter((r) => r.collectionMode === 'event').length;

      // 2. demo_seed を保護し、ユーザー追加の verification のみを除外して保存
      const currentOffers = this.getOffers();
      let remainingOffers = currentOffers.filter(
        (o) => o.dataOrigin === 'demo_seed' || o.collectionMode !== 'verification'
      );
      // 万が一 INITIAL_OFFERS が含まれていなければ確実に復元
      INITIAL_OFFERS.forEach((seed) => {
        if (!remainingOffers.some((o) => o.id === seed.id)) {
          remainingOffers.unshift(seed);
        }
      });

      const remainingRequests = this.getSkillRequests().filter((r) => r.collectionMode !== 'verification');
      const remainingFeedbacks = this.getFeedbacks().filter((f) => f.collectionMode !== 'verification');
      const remainingResponses = this.getRequirementResponses().filter((r) => r.collectionMode !== 'verification');
      const remainingReqs = this.getCompanyRequirements().filter(
        (r) => INITIAL_COMPANY_REQUIREMENTS.some((init) => init.id === r.id) || r.collectionMode !== 'verification'
      );
      const remainingPractices = this.getPracticeRecords().filter((p) => p.collectionMode !== 'verification');

      localStorage.setItem(V2_KEYS.OFFERS, JSON.stringify(remainingOffers));
      localStorage.setItem(V2_KEYS.SKILL_REQUESTS, JSON.stringify(remainingRequests));
      localStorage.setItem(V2_KEYS.FEEDBACKS, JSON.stringify(remainingFeedbacks));
      localStorage.setItem(V2_KEYS.REQ_RESPONSES, JSON.stringify(remainingResponses));
      localStorage.setItem(V2_KEYS.COMPANY_REQUIREMENTS, JSON.stringify(remainingReqs.length > 0 ? remainingReqs : INITIAL_COMPANY_REQUIREMENTS));
      localStorage.setItem(V2_KEYS.PRACTICE_RECORDS, JSON.stringify(remainingPractices));

      // 3. 再読込して整合性検証
      const postVerificationCounts = this.getVerificationDataCounts();
      if (postVerificationCounts.total > 0) {
        throw new Error('検証データの完全消去に失敗しました。');
      }

      const postEventOffers = this.getOffers().filter((o) => o.collectionMode === 'event').length;
      if (postEventOffers !== preEventOffers) {
        throw new Error('イベント本番データが影響を受けたためロールバックします。');
      }

      // 4. すべて成功した場合のみ event モードへ切り替え
      this.startEventCollectionPhase();
      this.resetDisplayDemoData();
      return { success: true };
    } catch (e: any) {
      console.error('purgeVerificationDataAndStartEvent failed:', e);
      return { success: false, error: e.message || '消去処理中にエラーが発生しました。' };
    }
  },

  // 検証データを消去せずに直接イベント収集フェーズを開始
  startEventCollectionPhaseDirectly(): void {
    if (typeof window === 'undefined') return;
    this.startEventCollectionPhase();
    this.resetDisplayDemoData();
  },

  // イベント回収データの安全消去（CSV出力必須 ＋ 2段階確認）
  // ※ CSV出力対象の4種（オファー、業務リクエスト、アンケート、回答スナップショット）の event モードのみを消去
  // ※ 企業要件 (COMPANY_REQUIREMENTS) と 実践観測記録 (PRACTICE_RECORDS) は削除対象にせず完全保護
  clearEventData(): boolean {
    if (typeof window === 'undefined') return false;
    const isExported = localStorage.getItem(V2_KEYS.CSV_EXPORTED_FLAG);
    if (!isExported) {
      return false; // 安全保護のためCSV出力必須
    }

    // イベント本番データ (collectionMode === 'event') のみを除去
    const currentOffers = this.getOffers();
    let remainingOffers = currentOffers.filter((o) => o.collectionMode !== 'event');
    INITIAL_OFFERS.forEach((seed) => {
      if (!remainingOffers.some((o) => o.id === seed.id)) {
        remainingOffers.unshift(seed);
      }
    });

    const remainingRequests = this.getSkillRequests().filter((r) => r.collectionMode !== 'event');
    const remainingFeedbacks = this.getFeedbacks().filter((f) => f.collectionMode !== 'event');
    const remainingResponses = this.getRequirementResponses().filter((r) => r.collectionMode !== 'event');

    // 4種のみを更新（企業要件と実践観測記録は触らない）
    localStorage.setItem(V2_KEYS.OFFERS, JSON.stringify(remainingOffers));
    localStorage.setItem(V2_KEYS.SKILL_REQUESTS, JSON.stringify(remainingRequests));
    localStorage.setItem(V2_KEYS.FEEDBACKS, JSON.stringify(remainingFeedbacks));
    localStorage.setItem(V2_KEYS.REQ_RESPONSES, JSON.stringify(remainingResponses));

    localStorage.removeItem(V2_KEYS.CSV_EXPORTED_FLAG);
    return true;
  },

  // 互換性エイリアス
  clearVerificationData(): boolean {
    return this.clearEventData();
  },

  isCsvExported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(V2_KEYS.CSV_EXPORTED_FLAG);
  },

  // =========================================================================
  // 8. CSV出力（数式インジェクション対策 ＆ 第4セクション出力）
  // =========================================================================
  exportVerificationDataToCsv(onlyEventMode: boolean = false): void {
    if (typeof window === 'undefined') return;

    let offers = this.getOffers();
    let requests = this.getSkillRequests();
    let feedbacks = this.getFeedbacks();
    let responses = this.getRequirementResponses();

    if (onlyEventMode) {
      offers = offers.filter((o) => o.collectionMode === 'event');
      requests = requests.filter((r) => r.collectionMode === 'event');
      feedbacks = feedbacks.filter((f) => f.collectionMode === 'event');
      responses = responses.filter((r) => r.collectionMode === 'event');
    }

    let csvContent = '\uFEFF'; // BOM付きUTF-8

    // 1. オファーセクション
    csvContent += '【企業からのオファー一覧】\n';
    csvContent += 'ID,送信日時,フェーズ,企業名,対象研修生,種別,任せたい業務,メッセージ,担当者名,連絡先\n';
    offers.forEach((o) => {
      csvContent += [
        sanitizeCsv(o.id),
        sanitizeCsv(o.createdAt),
        sanitizeCsv(o.collectionMode || 'verification'),
        sanitizeCsv(o.companyName),
        sanitizeCsv(o.traineeName),
        sanitizeCsv(o.type === 'trial' ? 'お試し実習打診' : 'すり合わせ面談希望'),
        sanitizeCsv(o.desiredWork),
        sanitizeCsv(o.message),
        sanitizeCsv(o.contactPerson),
        sanitizeCsv(o.contactEmail),
      ].join(',') + '\n';
    });

    // 2. 業務リクエストセクション
    csvContent += '\n【企業からの求めるスキル・業務リクエスト】\n';
    csvContent += 'ID,投稿日時,フェーズ,企業名,業務タイトル,業務内容,作業単位,想定作業時間\n';
    requests.forEach((r) => {
      csvContent += [
        sanitizeCsv(r.id),
        sanitizeCsv(r.createdAt),
        sanitizeCsv(r.collectionMode || 'verification'),
        sanitizeCsv(r.companyName),
        sanitizeCsv(r.title),
        sanitizeCsv(r.description),
        sanitizeCsv(r.workUnit),
        sanitizeCsv(r.expectedDuration),
      ].join(',') + '\n';
    });

    // 3. 感想アンケートセクション
    csvContent += '\n【操作後アンケート・感想】\n';
    csvContent += 'ID,回答日時,フェーズ,企業名,役職・部署,有用性評価(1-5),感想・フィードバック,不足・追加要望情報\n';
    feedbacks.forEach((f) => {
      csvContent += [
        sanitizeCsv(f.id),
        sanitizeCsv(f.createdAt),
        sanitizeCsv(f.collectionMode || 'verification'),
        sanitizeCsv(f.companyName),
        sanitizeCsv(f.respondentRole),
        sanitizeCsv(f.usefulnessScore),
        sanitizeCsv(f.impressions),
        sanitizeCsv(f.neededInformation),
      ].join(',') + '\n';
    });

    // 4. 企業回答スナップショットセクション (需要分析用)
    csvContent += '\n【企業が検討・登録した業務要件スナップショット】\n';
    csvContent += 'ID,送信日時,フェーズ,業務ID,業務名,カテゴリ,時間指定モード,想定作業時間(分),最長許容時間(分),成果数量,成果単位,時間配分方針,余白扱い方針,詳細入力有無\n';
    responses.forEach((r) => {
      csvContent += [
        sanitizeCsv(r.id),
        sanitizeCsv(r.submittedAt),
        sanitizeCsv(r.collectionMode),
        sanitizeCsv(r.requirementId),
        sanitizeCsv(r.taskName),
        sanitizeCsv(r.taskCategory),
        sanitizeCsv(r.durationMode),
        sanitizeCsv(r.expectedDurationMinutes !== null ? `${r.expectedDurationMinutes}分` : '未定'),
        sanitizeCsv(r.maxDurationMinutes !== null ? `${r.maxDurationMinutes}分` : '未定'),
        sanitizeCsv(r.outputQuantity),
        sanitizeCsv(r.outputUnit),
        sanitizeCsv(r.timeAllocation),
        sanitizeCsv(r.earlyFinishPolicy),
        sanitizeCsv(r.configuredDetails ? '詳細設定あり' : '基本のみ(未確認保持)'),
      ].join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    const prefix = onlyEventMode ? 'RAMP_イベント本番需要データ_' : 'RAMP_全需要検証データ_';
    link.setAttribute('href', url);
    link.setAttribute('download', `${prefix}${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    localStorage.setItem(V2_KEYS.CSV_EXPORTED_FLAG, 'true');
  },
};

// Excel数式インジェクション（CSV Injection）対策ヘルパー
function sanitizeCsv(val?: string | number | null): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // =, +, -, @, \t, \r で始まる場合は先頭にアポストロフィを付与して無害化
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}
