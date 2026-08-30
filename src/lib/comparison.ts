import {
  CompanyWorkRequirement,
  TraineeProfile,
  ConnectionAnalysis,
  WorkCycleEvidence,
} from '../types';

/**
 * 企業要件と研修生の作業周期・特性を透明なルールに基づき比較し、対話の材料を抽出する。
 * ※ 採用合否や自動適合率判定、一方的な推薦は行いません。
 */
export function analyzeConnection(
  requirement: CompanyWorkRequirement,
  trainee: TraineeProfile
): ConnectionAnalysis {
  const matchingPoints: string[] = [];
  const adjustablePoints: { title: string; companySide: string; traineeSide: string }[] = [];
  const missingInfo: string[] = [];

  // 1. 業務カテゴリ（taskCategory）による型安全な模擬業務実績の照合
  // ※ 単なる文字列検索や、見つからない場合のフォールバック（workCycles[0]）は行わない
  const categoryMatches = requirement.taskCategory
    ? trainee.workCycles.filter((wc) => wc.taskCategory === requirement.taskCategory)
    : [];
  const relevantWorkCycle: WorkCycleEvidence | undefined =
    categoryMatches.find(
      (wc) =>
        requirement.taskName.includes(wc.taskName.slice(0, 4)) ||
        wc.taskName.includes(requirement.taskName.slice(0, 4)) ||
        requirement.workUnit === wc.workUnit
    ) || categoryMatches[0];

  if (!relevantWorkCycle) {
    // 関連実績が存在しない場合：不足している情報として客観的に開示
    missingInfo.push(
      `この業務（カテゴリ: ${requirement.taskCategory || '未指定'}）と直接比較できる模擬業務実績は、まだ観測されていません。同一成果単位（${requirement.workUnit}）での作業確認はお試し実習（1〜3日）等を通じて行う必要があります。`
    );
  } else {
    const wc = relevantWorkCycle;
    const minCycleTotal = wc.observedRange.minDurationMinutes + wc.recoveryDurationMinutes;
    const maxCycleTotal = wc.observedRange.maxDurationMinutes + wc.recoveryDurationMinutes;
    const repCycleTotal = wc.workDurationMinutes + wc.recoveryDurationMinutes;

    // --- A. すでに重なる条件の抽出 ---
    // 1サイクル全体が企業の許容上限以内に収まっているか
    if (maxCycleTotal <= requirement.acceptableDurationRange.max) {
      matchingPoints.push(
        `作業時間と許容上限の合致: 本人の1サイクル（集中${wc.observedRange.minDurationMinutes}〜${wc.observedRange.maxDurationMinutes}分＋回復${wc.recoveryDurationMinutes}分＝計${minCycleTotal}〜${maxCycleTotal}分）は、御社の許容作業時間（最長${requirement.acceptableDurationRange.max}分）の範囲内に収まっています。`
      );
    }

    // 回復時間の工程内取得についての合致
    if (requirement.recoveryTimeAllowed) {
      matchingPoints.push(
        `工程内回復（ワークサイクル）の合意: 御社が回復時間の工程内取得を認めているため、本人の【集中${wc.workDurationMinutes}分＋回復${wc.recoveryDurationMinutes}分】という持続可能な作業周期をそのまま業務工程として活かせます。`
      );
    }

    // 安定再現条件の明示
    if (wc.stabilizingConditions && wc.stabilizingConditions.length > 0) {
      matchingPoints.push(
        `安定稼働の再現条件: 本人が集中作業を再現するための具体的条件（${wc.stabilizingConditions.join('、')}）が客観的に観測されています。`
      );
    }

    // --- B. 調整で接続できる条件の抽出 ---
    // 予定より早く終わった場合の余白の扱い（自動ノルマ化せず事前合意）
    if (minCycleTotal < requirement.expectedDurationMinutes) {
      const minMargin = Math.max(0, requirement.expectedDurationMinutes - maxCycleTotal);
      const maxMargin = Math.max(0, requirement.expectedDurationMinutes - minCycleTotal);
      const handlingText =
        requirement.earlyFinishHandling === 'recovery'
          ? '工程内回復・休息'
          : requirement.earlyFinishHandling === 'standby'
          ? '待機・次の指示待ち'
          : requirement.earlyFinishHandling === 'next_task'
          ? '次の定常業務の準備'
          : '事前相談による合意';

      adjustablePoints.push({
        title: `予定より早く完了することで生まれる余白（約${minMargin}〜${maxMargin}分）の扱い`,
        companySide: `御社の想定作業時間（${requirement.expectedDurationMinutes}分）に対し、本人は計${minCycleTotal}〜${maxCycleTotal}分で完了するため、約${minMargin}〜${maxMargin}分の余白が生まれます。追加ノルマへ自動変換せず、【${handlingText}】として事前に扱いを合意することを推奨します。`,
        traineeSide: `予定より早く完了した際は速やかに報告を行い、事前に合意した過ごし方（${handlingText}）に沿って自律的に行動します。`,
      });
    }

    // 作業ムラ幅と企業の許容条件のすり合わせ
    adjustablePoints.push({
      title: `作業時間のムラ幅（${wc.observedRange.minDurationMinutes}〜${wc.observedRange.maxDurationMinutes}分）と御社の許容条件（${requirement.acceptableVariation}）の対比`,
      companySide: `本人の観測された集中作業時間には${wc.observedRange.maxDurationMinutes - wc.observedRange.minDurationMinutes}分のムラ幅があります。御社の許容条件（${requirement.acceptableVariation}）の範囲内であるか、日々の進捗管理での許容幅をすり合わせます。`,
      traineeSide: `体調や疲労の波をセルフチェックシートで把握し、ムラが許容範囲に収まるようセルフケアと手元タイマーを活用します。`,
    });

    // 企業側が回復時間を未許可の場合の調整
    if (!requirement.recoveryTimeAllowed) {
      adjustablePoints.push({
        title: '回復時間（短時間休憩）の工程内組み込みの検討',
        companySide: `一斉休憩だけでなく、成果と品質が維持される前提で、10〜15分の回復時間を工程の一部として認めることをご検討ください。`,
        traineeSide: `回復時間中はタイマーを用い、時間通りに集中作業を再開する自己管理を徹底します。`,
      });
    }

    // --- C. まだ不足している情報（対話材料） ---
    // ※ 品質は自動判定せず、双方の数値を並べて実習時の確認事項とする
    missingInfo.push(
      `品質基準の直接照合: 本人の観測実績【${wc.qualityResult}】 / 御社の品質基準【${requirement.requiredQuality}】。自動判定は行わず、お試し実習時に御社のチェックシートを用いて合致を確認します。`
    );

    // 勤務時間全体での持続性
    missingInfo.push(
      `勤務時間全体での持続性: 観測枠内（約${wc.observedRepeatRange.observedWindowMinutes}分、${wc.observedRepeatRange.minCycles}〜${wc.observedRepeatRange.maxCycles}サイクル）では安定して再現していますが、1日4〜6時間の勤務時間を通じた持続性はお試し実習（1〜3日）での確認が必要です。`
    );
  }

  // 2. 指示方法と配慮事項の比較
  const needsTextInstruction = trainee.instructions.some(
    (ins) => ins.characteristic.includes('口頭') || ins.requestedSupport.includes('テキスト')
  );
  const companyHasChat = requirement.availableSupports.some(
    (s) => s.includes('チャット') || s.includes('マニュアル')
  );

  if (needsTextInstruction && companyHasChat) {
    matchingPoints.push(
      '指示・連絡環境の合致: 御社のチャット・マニュアル支援環境と、本人が希望するテキスト指示・確認の配慮が一致しています。'
    );
  } else if (needsTextInstruction && !companyHasChat) {
    adjustablePoints.push({
      title: '指示出し方法の調整（口頭からテキスト/箇条書きへ）',
      companySide: '作業依頼時、チャットまたは箇条書きメモによる指示出しへの切り替えをご検討ください。',
      traineeSide: '口頭で指示を受けた際は、その場でメモを取り復唱確認してミスを防ぎます。',
    });
  }

  // 共通の不足情報
  missingInfo.push(
    '社内専用システム・ツールへの適応速度: 御社固有の業務ソフトやフォーマットに対する操作習熟の所要時間。'
  );
  missingInfo.push(
    '実際の執務環境（座席配置・音・照明）でのコンディション維持と必要な微調整。'
  );

  return {
    matchingPoints,
    adjustablePoints,
    missingInfo,
  };
}
