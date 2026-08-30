export type DemoRole = 'trainee' | 'supporter' | 'company';

// =========================================================================
// 運用フェーズ管理 (検証リハーサル vs イベント本番回収)
// =========================================================================
export type CollectionMode =
  | 'verification' // 開発・リハーサル・動作確認
  | 'event';       // イベント本番回収

export interface CollectionPhase {
  id: string;
  mode: CollectionMode;
  startedAt: string;
  endedAt?: string;
}

export type MigrationStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

// =========================================================================
// 証拠データの来歴（Provenance）管理
// =========================================================================
export type DataOrigin =
  | 'demo_seed'          // 架空モデルケースデータ
  | 'live_observation'  // 実際の研修生観測データ
  | 'legacy_unverified'; // v1から移行された出所未確認データ（隔離対象）

export type ObservationSource =
  | 'trainee_self_report' // 誰が：本人申告
  | 'supporter_observed'  // 誰が：支援員の現場直接観測
  | 'demo_seed';          // 誰が：架空デモ用シード

export type VerificationStatus =
  | 'unverified'          // 確認：未確認
  | 'supporter_confirmed';// 確認：支援員が内容確認・再現条件を補足

// =========================================================================
// 6軸のルーブリック定義
// =========================================================================
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
  collectionMode?: CollectionMode;
  collectionPhaseId?: string;
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

// =========================================================================
// 業務条件の客観的状態型（未回答・未確定を明示保持）
// =========================================================================
export type DurationMode =
  | 'minutes'        // 分数指定
  | 'half_day'       // 半日以内
  | 'one_day'        // 1日以内
  | 'deadline_based' // 期限まで任せる
  | 'unknown';       // まだ決まっていない

export type TimeAllocationState =
  | 'delegated'        // 時間配分を本人に任せられる
  | 'negotiable'       // 事前相談で調整可能
  | 'fixed_break_only' // 一斉休憩のみ（工程内回復不可）
  | 'consult'          // 事前相談事項
  | 'unknown';         // 企業条件として未確認

export type FlexibilityState =
  | 'strict'        // 厳格に固定
  | 'margin_small'  // ±10分程度 / ±1件程度
  | 'margin_medium' // ±30分程度 / ±2件程度
  | 'max_limit_ok'  // 期限・上限まで自由
  | 'consult'       // 事前相談事項
  | 'unknown';      // 企業条件として未確認

export type EarlyFinishState =
  | 'recovery'     // 工程内回復に使える
  | 'prepare_next' // 次の定常業務の準備
  | 'standby'      // 待機・指示待ち
  | 'consult'      // 事前相談で決める
  | 'next_task'    // 次の業務を追加投入
  | 'unknown';     // 企業条件として未確認

// =========================================================================
// 生ログ：1回ごとの実践観測記録 (PracticeObservationRecord)
// =========================================================================
export interface PracticeObservationRecord {
  id: string;
  traineeId: string;
  requirementId?: string;       // 企業登録業務ID
  taskDefinitionId?: string;    // プリセット業務定義ID
  taskName: string;
  taskCategory: TaskCategory;
  workDurationMinutes: number;
  recoveryDurationMinutes: number;
  outputQuantity: number;       // 成果数量 (例: 10)
  outputUnit: string;           // 成果単位 (例: "件")
  qualityResult: string | null; // 未測定なら null
  measurementMethod: string | null; // 未測定なら null (例: "自己チェックリスト", "支援員目視検品")
  source: ObservationSource;
  verificationStatus: VerificationStatus;
  dataOrigin: DataOrigin;
  collectionMode: CollectionMode;
  collectionPhaseId: string;
  traineeComment?: string;
  traineeCoping?: string[];
  workUnit?: string;           // 互換性用
  status?: string;             // 互換性用
  completedOutput?: string;    // 互換性用
  recordedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  supporterNote?: string;
  stabilizingConditions?: string[];
}

// 互換性エイリアス
export type TraineePracticeRecord = PracticeObservationRecord;

// =========================================================================
// 集計結果：出所別ブレイクダウンと代表値 (WorkCycleEvidence)
// =========================================================================
export interface SourceBreakdownItem {
  source: ObservationSource;
  count: number;
  confirmedCount: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  isRangeCalculated: boolean; // 2回以上で true
}

export type WorkCycleEvidence = {
  id: string;
  traineeId: string;
  taskDefinitionId?: string;
  requirementId?: string;
  taskName: string;
  taskCategory?: TaskCategory;
  outputQuantity: number;
  outputUnit: string;
  workUnit?: string; // 互換性用（例: "10件"）

  // 代表値（中央値を採用）
  workDurationMinutes: number; // 代表作業時間 (中央値)
  recoveryDurationMinutes: number; // 代表回復時間 (中央値)
  medianWorkDurationMinutes?: number;
  medianRecoveryDurationMinutes?: number;
  latestWorkDurationMinutes?: number;
  minWorkDurationMinutes?: number;
  maxWorkDurationMinutes?: number;

  completedOutput: string;
  qualityResult: string | null;

  observedRepeatRange: {
    minCycles: number;
    maxCycles: number;
    observedWindowMinutes: number; // 観測時間枠 (分)
  };
  observedRange: {
    minDurationMinutes: number;
    maxDurationMinutes: number;
    isRangeCalculated?: boolean;
  };
  isRangeCalculated?: boolean;

  // 出所別の詳細ブレイクダウン
  sourceBreakdown?: SourceBreakdownItem[];
  dataOrigin: DataOrigin;
  totalObservationCount?: number;

  // 品質並列記録
  qualityRecords?: Array<{
    result: string;
    method: string | null;
    source: ObservationSource;
    recordedAt: string;
  }>;

  stabilizingConditions: string[];
  selfCopingUsed: string[];
  supportUsed: string[];
  observedAt: string;
  evidenceNote: string;
  isDemoSample?: boolean;
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
  previousExpectedDuration: number | null;
  previousExpectedOutput: string;
  reason: string;
  reAgreedWithTrainee: boolean;
};

export type CompanyWorkRequirement = {
  id: string;
  taskDefinitionId?: string; // プリセット業務ID (preset-data-entry 等)
  companyName: string;
  taskName: string;
  taskCategory?: TaskCategory;
  taskDescription: string;
  workUnit: string; // 成果単位表記 (例: "10件")
  outputQuantity?: number; // 成果数量 (例: 10)
  outputUnitOnly?: string; // 単位のみ (例: "件")

  durationMode: DurationMode;
  expectedDurationMinutes: number | null; // 分数指定時のみ数値、未定/半日/1日/期限は null
  acceptableDurationRange: {
    min: number | null;
    max: number | null;
  };
  expectedOutput: string;
  requiredQuality: string;
  acceptableVariation: string;
  evaluationPeriod: 'hour' | 'day' | 'week' | 'deadline' | 'unknown';
  priority: 'speed' | 'quality' | 'balance';

  recoveryTimeAllowed: boolean;
  flexibleWorkSequence: boolean;
  flexibleTimeOfDay: boolean;

  timeAllocationState?: TimeAllocationState;
  timeFlexibilityState?: FlexibilityState;
  outputFlexibilityState?: FlexibilityState;
  earlyFinishState?: EarlyFinishState;

  earlyFinishHandling?: EarlyFinishHandling;
  priorityConditions?: string[];
  timeFlexibility?: string;
  outputFlexibility?: string;
  timeAllocation?: string;
  earlyFinishPolicy?: string;
  configuredDetails?: boolean;
  availableSupports: string[];
  radarPresets?: Record<string, number>;

  collectionMode?: CollectionMode;
  collectionPhaseId?: string;

  createdAt: string;
  version: number;
  history?: RequirementHistory[];
};

// =========================================================================
// 企業回答スナップショット（【この条件で比較する】明示押下時の履歴）
// =========================================================================
export interface CompanyRequirementResponse {
  id: string;
  sessionId: string;
  revision: number;
  supersedesResponseId?: string;
  requirementId: string;
  taskDefinitionId?: string;
  taskName: string;
  taskCategory: TaskCategory;
  durationMode: DurationMode;
  expectedDurationMinutes: number | null;
  maxDurationMinutes: number | null;
  outputQuantity: number | null;
  outputUnit: string;
  timeFlexibility: FlexibilityState;
  outputFlexibility: FlexibilityState;
  timeAllocation: TimeAllocationState;
  earlyFinishPolicy: EarlyFinishState;
  availableSupports: string[];
  priorityConditions: string[];
  configuredDetails: boolean;
  collectionMode: CollectionMode;
  collectionPhaseId: string;
  submittedAt: string;
  schemaVersion: 'v2';
}

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
  dataOrigin?: DataOrigin;
  collectionMode?: CollectionMode;
  collectionPhaseId?: string;
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
  collectionMode?: CollectionMode;
  collectionPhaseId?: string;
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
  collectionMode?: CollectionMode;
  collectionPhaseId?: string;
};
