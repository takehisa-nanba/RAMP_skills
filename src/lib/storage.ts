import {
  TraineeProfile,
  CompanyWorkRequirement,
  Offer,
  SkillRequest,
  FeedbackSurvey,
  EvaluationRecord,
  TraineePracticeRecord,
  WorkCycleEvidence,
} from '../types';
import { INITIAL_TRAINEES, INITIAL_COMPANY_REQUIREMENTS, INITIAL_OFFERS } from '../data/seed';

const STORAGE_KEYS = {
  TRAINEES: 'ramp_skills_trainees_v1',
  COMPANY_REQUIREMENTS: 'ramp_skills_company_reqs_v1',
  SELECTED_REQ_ID: 'ramp_skills_selected_req_id_v1',
  OFFERS: 'ramp_skills_offers_v1',
  SKILL_REQUESTS: 'ramp_skills_skill_requests_v1',
  FEEDBACKS: 'ramp_skills_feedbacks_v1',
  PRACTICE_RECORDS: 'ramp_skills_practice_records_v1',
  CSV_EXPORTED_FLAG: 'ramp_skills_csv_exported_flag_v1',
};

export const StorageService = {
  // 1. 研修生データ
  getTrainees(): TraineeProfile[] {
    if (typeof window === 'undefined') return INITIAL_TRAINEES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRAINEES);
      return data ? JSON.parse(data) : INITIAL_TRAINEES;
    } catch {
      return INITIAL_TRAINEES;
    }
  },

  saveTrainees(trainees: TraineeProfile[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TRAINEES, JSON.stringify(trainees));
  },

  addEvaluation(traineeId: string, evaluation: EvaluationRecord): void {
    const trainees = this.getTrainees();
    const updated = trainees.map((t) => {
      if (t.id === traineeId) {
        return {
          ...t,
          evaluations: [evaluation, ...t.evaluations],
        };
      }
      return t;
    });
    this.saveTrainees(updated);
  },

  // 2. 企業業務要件データ
  getCompanyRequirements(): CompanyWorkRequirement[] {
    if (typeof window === 'undefined') return INITIAL_COMPANY_REQUIREMENTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPANY_REQUIREMENTS);
      return data ? JSON.parse(data) : INITIAL_COMPANY_REQUIREMENTS;
    } catch {
      return INITIAL_COMPANY_REQUIREMENTS;
    }
  },

  saveCompanyRequirements(reqs: CompanyWorkRequirement[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.COMPANY_REQUIREMENTS, JSON.stringify(reqs));
  },

  deleteCompanyRequirement(id: string): boolean {
    if (typeof window === 'undefined') return false;
    // プリセット業務は保護
    if (INITIAL_COMPANY_REQUIREMENTS.some((r) => r.id === id)) {
      return false;
    }
    const current = this.getCompanyRequirements();
    const filtered = current.filter((r) => r.id !== id);
    this.saveCompanyRequirements(filtered);
    return true;
  },

  getSelectedRequirementId(): string {
    if (typeof window === 'undefined') return INITIAL_COMPANY_REQUIREMENTS[0].id;
    return localStorage.getItem(STORAGE_KEYS.SELECTED_REQ_ID) || INITIAL_COMPANY_REQUIREMENTS[0].id;
  },

  setSelectedRequirementId(id: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SELECTED_REQ_ID, id);
  },

  // 3. 需要検証データ (オファー)
  getOffers(): Offer[] {
    if (typeof window === 'undefined') return INITIAL_OFFERS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFERS);
      return data ? JSON.parse(data) : INITIAL_OFFERS;
    } catch {
      return INITIAL_OFFERS;
    }
  },

  addOffer(offer: Offer): void {
    const offers = this.getOffers();
    offers.unshift(offer);
    localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offers));
    // 新規追加時はCSV未出力状態へ自動リセット
    localStorage.removeItem(STORAGE_KEYS.CSV_EXPORTED_FLAG);
  },

  // 4. 需要検証データ (業務リクエスト)
  getSkillRequests(): SkillRequest[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SKILL_REQUESTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addSkillRequest(req: SkillRequest): void {
    const requests = this.getSkillRequests();
    requests.unshift(req);
    localStorage.setItem(STORAGE_KEYS.SKILL_REQUESTS, JSON.stringify(requests));
    // 新規追加時はCSV未出力状態へ自動リセット
    localStorage.removeItem(STORAGE_KEYS.CSV_EXPORTED_FLAG);
  },

  // 5. 需要検証データ (感想アンケート)
  getFeedbacks(): FeedbackSurvey[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addFeedback(feedback: FeedbackSurvey): void {
    const list = this.getFeedbacks();
    list.unshift(feedback);
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(list));
    // 新規追加時はCSV未出力状態へ自動リセット
    localStorage.removeItem(STORAGE_KEYS.CSV_EXPORTED_FLAG);
  },

  // 5.5 利用者の実践記録 (TraineePracticeRecord)
  getPracticeRecords(): TraineePracticeRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRACTICE_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addPracticeRecord(record: TraineePracticeRecord): void {
    if (typeof window === 'undefined') return;
    const records = this.getPracticeRecords();
    records.unshift(record);
    localStorage.setItem(STORAGE_KEYS.PRACTICE_RECORDS, JSON.stringify(records));
  },

  verifyPracticeRecordAndApplyToTrainee(
    recordId: string,
    supporterNote: string,
    stabilizingConditions: string[]
  ): boolean {
    if (typeof window === 'undefined') return false;
    const records = this.getPracticeRecords();
    const recordIndex = records.findIndex((r) => r.id === recordId);
    if (recordIndex === -1) return false;

    const record = records[recordIndex];
    record.status = 'verified';
    record.supporterNote = supporterNote;
    record.stabilizingConditions = stabilizingConditions;
    records[recordIndex] = record;
    localStorage.setItem(STORAGE_KEYS.PRACTICE_RECORDS, JSON.stringify(records));

    // 研修生カルテ (workCycles) への正式反映
    const trainees = this.getTrainees();
    const trainee = trainees.find((t) => t.id === record.traineeId);
    if (trainee) {
      const newWc: WorkCycleEvidence = {
        id: `wc-practice-${Date.now()}`,
        traineeId: record.traineeId,
        taskName: record.taskName,
        taskCategory: record.taskCategory || 'general',
        workUnit: record.workUnit,
        workDurationMinutes: record.workDurationMinutes,
        recoveryDurationMinutes: record.recoveryDurationMinutes,
        completedOutput: record.completedOutput,
        qualityResult: record.qualityResult,
        observedRepeatRange: {
          minCycles: 2,
          maxCycles: 3,
          observedWindowMinutes: (record.workDurationMinutes + record.recoveryDurationMinutes) * 3,
        },
        observedRange: {
          minDurationMinutes: Math.max(10, record.workDurationMinutes - 5),
          maxDurationMinutes: record.workDurationMinutes + 5,
        },
        stabilizingConditions: stabilizingConditions.length > 0 ? stabilizingConditions : ['手順書の事前確認'],
        selfCopingUsed: record.traineeCoping,
        supportUsed: ['開始時の仕様すり合わせ'],
        observedAt: new Date().toISOString().slice(0, 10),
        evidenceNote: supporterNote || '模擬業務にて実践確認済み。',
        isDemoSample: true,
      };

      const existingIdx = trainee.workCycles.findIndex(
        (wc) => wc.taskName === record.taskName || (record.taskCategory && wc.taskCategory === record.taskCategory)
      );
      if (existingIdx >= 0) {
        trainee.workCycles[existingIdx] = newWc;
      } else {
        trainee.workCycles.unshift(newWc);
      }
      this.saveTrainees(trainees);
    }
    return true;
  },

  quickSimulatePracticeAndApply(
    traineeId: string,
    req: CompanyWorkRequirement,
    workMinutes: number = 20,
    recoveryMinutes: number = 10
  ): boolean {
    const practiceId = `practice-${Date.now()}`;
    const record: TraineePracticeRecord = {
      id: practiceId,
      traineeId,
      requirementId: req.id,
      taskName: req.taskName,
      taskCategory: req.taskCategory || 'general',
      workUnit: req.workUnit,
      workDurationMinutes: workMinutes,
      recoveryDurationMinutes: recoveryMinutes,
      completedOutput: `${req.workUnit} 完了・セルフチェック完了`,
      qualityResult: '正確性99.5%（手順チェック済み）',
      traineeComment: 'マニュアルを見ながら自分のペースで集中して完遂できました。',
      traineeCoping: ['遮音イヤホン使用', '手元タイマーで回復管理'],
      status: 'verified',
      recordedAt: new Date().toISOString(),
      supporterNote: '手順書があればミスなく安定して完遂可能。集中作業＋回復のリズムで持続性あり。',
      stabilizingConditions: ['手順書・チェックリスト完備', '静かな執務環境'],
    };
    this.addPracticeRecord(record);
    return this.verifyPracticeRecordAndApplyToTrainee(
      practiceId,
      record.supporterNote!,
      record.stabilizingConditions!
    );
  },

  // 6. 表示のみリセット（選択中の仕事・人財のみ初期化）
  resetDisplayDemoData(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SELECTED_REQ_ID, INITIAL_COMPANY_REQUIREMENTS[0].id);
  },

  // システム側ですべてを初期シード状態へ完全リセット（カルテ、業務要件、オファー、実践記録、アンケートすべて初期化）
  resetAllToSeed(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.TRAINEES, JSON.stringify(INITIAL_TRAINEES));
      localStorage.setItem(
        STORAGE_KEYS.COMPANY_REQUIREMENTS,
        JSON.stringify(INITIAL_COMPANY_REQUIREMENTS)
      );
      localStorage.setItem(STORAGE_KEYS.SELECTED_REQ_ID, INITIAL_COMPANY_REQUIREMENTS[0].id);
      localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(INITIAL_OFFERS));
      localStorage.removeItem(STORAGE_KEYS.PRACTICE_RECORDS);
      localStorage.removeItem(STORAGE_KEYS.SKILL_REQUESTS);
      localStorage.removeItem(STORAGE_KEYS.FEEDBACKS);
      localStorage.removeItem(STORAGE_KEYS.CSV_EXPORTED_FLAG);
    } catch (e) {
      console.error('Failed to reset all data to seed:', e);
    }
  },

  // 互換性のためのエイリアス
  restoreSeedData(): void {
    this.resetAllToSeed();
  },

  // 7. CSV出力フラグ管理
  markCsvExported(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CSV_EXPORTED_FLAG, 'true');
  },

  isCsvExported(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.CSV_EXPORTED_FLAG) === 'true';
  },

  // 8. 需要検証データの安全なクリア（CSV出力後のみ。未出力時は拒否）
  clearVerificationData(): boolean {
    if (typeof window === 'undefined') return false;
    // CSV出力が完了していない場合は削除を拒否
    if (!this.isCsvExported()) {
      return false;
    }
    localStorage.removeItem(STORAGE_KEYS.OFFERS);
    localStorage.removeItem(STORAGE_KEYS.SKILL_REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.FEEDBACKS);
    localStorage.removeItem(STORAGE_KEYS.CSV_EXPORTED_FLAG);
    return true;
  },

  // 9. CSVエクスポート生成
  exportVerificationDataToCsv(): void {
    if (typeof window === 'undefined') return;

    const offers = this.getOffers();
    const requests = this.getSkillRequests();
    const feedbacks = this.getFeedbacks();

    // BOM付きUTF-8
    let csvContent = '\uFEFF';

    // 1. オファーセクション
    csvContent += '【企業からのオファー一覧】\n';
    csvContent += 'ID,送信日時,企業名,対象研修生,種別,任せたい業務,メッセージ,担当者名,連絡先\n';
    offers.forEach((o) => {
      const line = [
        o.id,
        o.createdAt,
        escapeCsv(o.companyName),
        escapeCsv(o.traineeName),
        o.type === 'trial' ? 'お試し実習打診' : 'すり合わせ面談希望',
        escapeCsv(o.desiredWork),
        escapeCsv(o.message),
        escapeCsv(o.contactPerson),
        escapeCsv(o.contactEmail),
      ].join(',');
      csvContent += line + '\n';
    });

    // 2. 業務リクエストセクション
    csvContent += '\n【企業からの求めるスキル・業務リクエスト】\n';
    csvContent += 'ID,投稿日時,企業名,業務タイトル,業務内容,作業単位,想定作業時間\n';
    requests.forEach((r) => {
      const line = [
        r.id,
        r.createdAt,
        escapeCsv(r.companyName),
        escapeCsv(r.title),
        escapeCsv(r.description),
        escapeCsv(r.workUnit),
        escapeCsv(r.expectedDuration),
      ].join(',');
      csvContent += line + '\n';
    });

    // 3. 感想アンケートセクション
    csvContent += '\n【操作後アンケート・感想】\n';
    csvContent += 'ID,回答日時,企業名,役職・部署,有用性評価(1-5),感想・フィードバック,不足・追加要望情報\n';
    feedbacks.forEach((f) => {
      const line = [
        f.id,
        f.createdAt,
        escapeCsv(f.companyName),
        escapeCsv(f.respondentRole),
        f.usefulnessScore,
        escapeCsv(f.impressions),
        escapeCsv(f.neededInformation),
      ].join(',');
      csvContent += line + '\n';
    });

    // ダウンロード実行
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.setAttribute('href', url);
    link.setAttribute('download', `RAMP_需要検証データ_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.markCsvExported();
  },
};

function escapeCsv(str?: string): string {
  if (!str) return '""';
  const clean = str.replace(/"/g, '""');
  return `"${clean}"`;
}

// 現場・開発者向けショートカット（コンソールから一発完全初期化可能）
if (typeof window !== 'undefined') {
  (window as any).resetAllData = () => {
    StorageService.resetAllToSeed();
    console.log('✅ 全データを初期シードデータへリセットしました。画面を再読み込みします。');
    window.location.reload();
  };
}
