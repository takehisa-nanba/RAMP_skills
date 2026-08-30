import {
  TraineeProfile,
  CompanyWorkRequirement,
  Offer,
  SkillRequest,
  FeedbackSurvey,
  EvaluationRecord,
} from '../types';
import { INITIAL_TRAINEES, INITIAL_COMPANY_REQUIREMENTS } from '../data/seed';

const STORAGE_KEYS = {
  TRAINEES: 'ramp_skills_trainees_v1',
  COMPANY_REQUIREMENTS: 'ramp_skills_company_reqs_v1',
  SELECTED_REQ_ID: 'ramp_skills_selected_req_id_v1',
  OFFERS: 'ramp_skills_offers_v1',
  SKILL_REQUESTS: 'ramp_skills_skill_requests_v1',
  FEEDBACKS: 'ramp_skills_feedbacks_v1',
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
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addOffer(offer: Offer): void {
    const offers = this.getOffers();
    offers.unshift(offer);
    localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offers));
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
  },

  // 6. 表示のみリセット（需要検証データは絶対保持）
  resetDisplayDemoData(): void {
    if (typeof window === 'undefined') return;
    // モデルケース初期化
    localStorage.setItem(STORAGE_KEYS.TRAINEES, JSON.stringify(INITIAL_TRAINEES));
    // 企業要件初期化
    localStorage.setItem(
      STORAGE_KEYS.COMPANY_REQUIREMENTS,
      JSON.stringify(INITIAL_COMPANY_REQUIREMENTS)
    );
    localStorage.setItem(STORAGE_KEYS.SELECTED_REQ_ID, INITIAL_COMPANY_REQUIREMENTS[0].id);
    // ※ オファー、業務リクエスト、アンケートは一切消さない！
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

  // 8. 需要検証データの安全なクリア（CSV出力後のみ）
  clearVerificationData(): boolean {
    if (typeof window === 'undefined') return false;
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

    this.markCsvExported();
  },
};

function escapeCsv(str?: string): string {
  if (!str) return '""';
  const clean = str.replace(/"/g, '""');
  return `"${clean}"`;
}
