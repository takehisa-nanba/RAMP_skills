export type DemoRole = 'trainee' | 'supporter' | 'company';

// 6軸のルーブリック定義
export type RubricLevel = {
  level: number;
  label: string;
  description: string;
};

export type RubricAxis = {
  id: string;
  name: string;
  category: 'work_readiness' | 'digital_skill';
  description: string;
  levels: Record<1 | 2 | 3 | 4 | 5, RubricLevel>;
};

// 評価種別
export type EvaluationType = 'self' | 'supporter' | 'monthly_milestone';

// 評価履歴レコード (追記型)
export type EvaluationRecord = {
  id: string;
  traineeId: string;
  skillId: string;
  type: EvaluationType;
  score: number; // 1〜5
  comment?: string;
  evaluatorName: string;
  evaluatedAt: string;
  targetPeriod?: string;
};

// 業務カテゴリ（型安全な照合用）
export type TaskCategory =
  | 'data_entry'
  | 'web_banner'
  | 'manual_creation'
  | 'document_editing'
  | 'general';

// 早く終わった場合の余白の扱い
export type EarlyFinishHandling =
  | 'consult'    // 事前相談（回復・待機・次業務のどれに使うか合意）
  | 'recovery'   // 工程内回復・休息として活用
  | 'standby'    // 待機・次の指示待ち
  | 'next_task'; // 次の定常業務の準備

// 持続可能な作業周期実績 (デモ用想定値)
export type WorkCycleEvidence = {
  id: string;
  traineeId: string;
  taskName: string;
  taskCategory?: TaskCategory;
  workUnit: string;
  workDurationMinutes: number; // デモ用想定作業時間 (代表値)
  recoveryDurationMinutes: number; // デモ用想定回復時間 (代表値)
  completedOutput: string;
  qualityResult: string;
  observedRepeatRange: {
    minCycles: number;
    maxCycles: number;
    observedWindowMinutes: number; // 観測時間枠 (分)
  };
  observedRange: {
    minDurationMinutes: number;
    maxDurationMinutes: number;
  };
  stabilizingConditions: string[];
  selfCopingUsed: string[];
  supportUsed: string[];
  observedAt: string;
  evidenceNote: string;
  isDemoSample: true;
};

// 私のトリセツ (自己対処と合理的配慮の対比)
export type InstructionItem = {
  characteristic: string;
  selfCoping: string;
  requestedSupport: string;
};

// 企業向け公開サマリー
export type PublicSummary = {
  strengths: string;
  growthHistory: string;
  futureGoals: string;
  consentedAt: string;
};

// 研修生プロファイルモデル
export type TraineeProfile = {
  id: string;
  codeName: string;
  avatarBg: string;
  targetJob: string;
  desiredWorkCondition: {
    daysPerWeek: string;
    hoursPerDay: string;
    workStyle: string;
  };
  instructions: InstructionItem[];
  publicSummary: PublicSummary;
  badges: string[];
  portfolio: {
    title: string;
    desc: string;
    type: 'excel' | 'web' | 'gas' | 'document';
    detailUrl?: string;
  }[];
  workCycles: WorkCycleEvidence[];
  evaluations: EvaluationRecord[];
};

// 企業側の業務要件モデル
export type RequirementHistory = {
  changedAt: string;
  previousExpectedDuration: number;
  previousExpectedOutput: string;
  reason: string;
  reAgreedWithTrainee: boolean;
};

export type CompanyWorkRequirement = {
  id: string;
  companyName: string;
  taskName: string;
  taskCategory?: TaskCategory;
  taskDescription: string;
  workUnit: string;
  expectedDurationMinutes: number;
  acceptableDurationRange: {
    min: number;
    max: number;
  };
  expectedOutput: string;
  requiredQuality: string;
  acceptableVariation: string;
  evaluationPeriod: 'hour' | 'day' | 'week' | 'deadline';
  priority: 'speed' | 'quality' | 'balance';
  recoveryTimeAllowed: boolean;
  flexibleWorkSequence: boolean;
  flexibleTimeOfDay: boolean;
  earlyFinishHandling?: EarlyFinishHandling;
  priorityConditions?: string[];
  timeFlexibility?: string;
  outputFlexibility?: string;
  timeAllocation?: string;
  earlyFinishPolicy?: string;
  configuredDetails?: boolean;
  availableSupports: string[];
  radarPresets?: Record<string, number>;
  createdAt: string;
  version: number;
  history?: RequirementHistory[];
};

// 利用者が企業の仕事を実際にやってみた実践記録
export type TraineePracticeRecord = {
  id: string;
  traineeId: string;
  requirementId: string;
  taskName: string;
  taskCategory?: TaskCategory;
  workUnit: string;
  workDurationMinutes: number;
  recoveryDurationMinutes: number;
  completedOutput: string;
  qualityResult: string;
  traineeComment: string; // 本人の振り返り・実感
  traineeCoping: string[]; // 本人の自己対処
  supporterNote?: string; // 支援員の補足見立て
  stabilizingConditions?: string[]; // 支援員が確認した再現条件
  status: 'practiced' | 'verified'; // 実践済み | 支援員確認・カルテ反映済み
  recordedAt: string;
};

// 業務接続分析 (透明なルールに基づく対話用3分類)
export type ConnectionAnalysis = {
  matchingPoints: string[];
  adjustablePoints: {
    title: string;
    companySide: string;
    traineeSide: string;
  }[];
  missingInfo: string[];
};

// 企業からのオファー
export type Offer = {
  id: string;
  companyName: string;
  traineeId: string;
  traineeName: string;
  type: 'interview' | 'trial';
  desiredWork: string;
  message: string;
  contactPerson: string;
  contactEmail: string;
  createdAt: string;
};

// 企業からの業務リクエスト
export type SkillRequest = {
  id: string;
  companyName: string;
  title: string;
  description: string;
  workUnit: string;
  expectedDuration: string;
  createdAt: string;
};

// 感想アンケート
export type FeedbackSurvey = {
  id: string;
  companyName: string;
  respondentRole: string;
  usefulnessScore: number; // 1-5
  impressions: string;
  neededInformation: string;
  createdAt: string;
};
