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

  // 1. 安定ID (taskDefinitionId / requirementId) および 成果単位・数量による厳格な照合
  // ※ カテゴリ一致だけの安易なフォールバック（matches[0]）は絶対に行わない
  const relevantWorkCycle: WorkCycleEvidence | undefined = trainee.workCycles.find((wc) => {
    // プリセット業務の場合：taskDefinitionId と 成果単位・数量が一致
    if (requirement.taskDefinitionId && wc.taskDefinitionId) {
      const isUnitMatch =
        (requirement.outputUnitOnly && wc.outputUnit && requirement.outputUnitOnly === wc.outputUnit) ||
        requirement.workUnit === wc.workUnit;
      const isQtyMatch = !requirement.outputQuantity || !wc.outputQuantity || requirement.outputQuantity === wc.outputQuantity;
      return requirement.taskDefinitionId === wc.taskDefinitionId && isUnitMatch && isQtyMatch;
    }
    // 企業登録業務の場合：requirementId と 成果単位が一致
    if (requirement.id && wc.requirementId) {
      return requirement.id === wc.requirementId;
    }
    return false;
  });

  if (!relevantWorkCycle) {
    // 関連実績が存在しない場合：不足している情報として客観的に開示
    missingInfo.push(
      `この業務（成果単位: ${requirement.workUnit}）と直接比較できる模擬業務実績は、まだ観測されていません。同一成果単位での作業確認はお試し実習（1〜3日）等を通じて行う必要があります。`
    );
  } else {
    const wc = relevantWorkCycle;
    const minDuration = wc.observedRange?.minDurationMinutes ?? wc.workDurationMinutes;
    const maxDuration = wc.observedRange?.maxDurationMinutes ?? wc.workDurationMinutes;
    const minCycleTotal = minDuration + wc.recoveryDurationMinutes;
    const maxCycleTotal = maxDuration + wc.recoveryDurationMinutes;

    // --- A. すでに重なる条件の抽出 ---
    // 1サイクル全体が企業の許容上限以内に収まっているか（許容上限が設定されている場合のみ）
    if (requirement.acceptableDurationRange.max !== null && maxCycleTotal <= requirement.acceptableDurationRange.max) {
      matchingPoints.push(
        `作業時間と許容上限の合致: 本人の1サイクル（集中${minDuration}〜${maxDuration}分＋回復${wc.recoveryDurationMinutes}分＝計${minCycleTotal}〜${maxCycleTotal}分）は、御社の許容作業時間（最長${requirement.acceptableDurationRange.max}分）の範囲内に収まっています。`
      );
    }

    // 回復時間の工程内取得についての合致（明示的に許可されている場合のみ）
    const isRecoveryExplicitlyAllowed =
      requirement.timeAllocationState === 'delegated' ||
      requirement.timeAllocationState === 'negotiable' ||
      requirement.timeAllocation === '時間配分を本人に任せられる' ||
      requirement.timeAllocation === '事前相談で調整可能';

    if (isRecoveryExplicitlyAllowed) {
      matchingPoints.push(
        `工程内回復（ワークサイクル）の合意: 御社が回復時間の工程内取得を認めているため、本人の【集中${wc.workDurationMinutes}分＋回復${wc.recoveryDurationMinutes}分】という持続可能な作業周期をそのまま業務工程として活かせます。`
      );
    } else if (requirement.timeAllocationState === 'unknown' || !requirement.configuredDetails) {
      missingInfo.push(
        '時間配分の裁量（工程内回復）: 企業条件として未確認です。短時間休憩（10〜15分）を工程の一部として認めるかについて、お試し実習時に事前相談が必要です。'
      );
    }

    // 安定再現条件の明示
    if (wc.stabilizingConditions && wc.stabilizingConditions.length > 0) {
      matchingPoints.push(
        `安定稼働の再現条件: 本人が集中作業を再現するための具体的条件（${wc.stabilizingConditions.join('、')}）が客観的に観測されています。`
      );
    }

    // --- B. 調整で接続できる条件の抽出 ---
    // 想定時間が設定されている場合のみ余白を計算
    if (requirement.expectedDurationMinutes !== null && minCycleTotal < requirement.expectedDurationMinutes) {
      const minMargin = Math.max(0, requirement.expectedDurationMinutes - maxCycleTotal);
      const maxMargin = Math.max(0, requirement.expectedDurationMinutes - minCycleTotal);
      const handlingText =
        requirement.earlyFinishState === 'recovery' || requirement.earlyFinishHandling === 'recovery'
          ? '工程内回復・休息'
          : requirement.earlyFinishState === 'standby' || requirement.earlyFinishHandling === 'standby'
          ? '待機・次の指示待ち'
          : requirement.earlyFinishState === 'prepare_next' || requirement.earlyFinishHandling === 'next_task'
          ? '次の定常業務の準備'
          : '事前相談による合意';

      adjustablePoints.push({
        title: `予定より早く完了することで生まれる余白（約${minMargin}〜${maxMargin}分）の扱い`,
        companySide: `御社の想定作業時間（${requirement.expectedDurationMinutes}分）に対し、本人は計${minCycleTotal}〜${maxCycleTotal}分で完了するため、約${minMargin}〜${maxMargin}分の余白が生まれます。追加ノルマへ自動変換せず、【${handlingText}】として事前に扱いを合意することを推奨します。`,
        traineeSide: `予定より早く完了した際は速やかに報告を行い、事前に合意した過ごし方（${handlingText}）に沿って自律的に行動します。`,
      });
    } else if (requirement.expectedDurationMinutes === null) {
      missingInfo.push(
        `想定作業時間: 御社側の想定作業時間が【${requirement.durationMode === 'unknown' ? '未定' : requirement.durationMode}】のため、余白時間の算出は保留されています。お試し実習時に標準時間をすり合わせます。`
      );
    }

    // 作業ムラ幅と企業の許容条件のすり合わせ
    if (wc.observedRange?.isRangeCalculated) {
      const variance = maxDuration - minDuration;
      adjustablePoints.push({
        title: `作業時間のムラ幅（${minDuration}〜${maxDuration}分）と御社の許容条件の対比`,
        companySide: `本人の観測された集中作業時間には${variance}分のムラ幅があります。御社の許容条件（${requirement.acceptableVariation}）の範囲内であるか、日々の進捗管理での許容幅をすり合わせます。`,
        traineeSide: `体調や疲労の波をセルフチェックシートで把握し、ムラが許容範囲に収まるようセルフケアと手元タイマーを活用します。`,
      });
    } else {
      missingInfo.push(
        `観測幅の算出: 本業務の実践記録は1回のため、作業ムラ幅は未算出です。複数回の反復観測をお試し実習で行う必要があります。`
      );
    }

    // --- C. まだ不足している情報（対話材料） ---
    // 品質は自動判定せず、双方の数値を並べて実習時の確認事項とする
    missingInfo.push(
      `品質基準の直接照合: 本人の実績【${wc.qualityResult || '未測定'}】 / 御社の品質基準【${requirement.requiredQuality}】。自動判定は行わず、お試し実習時に御社のチェックシートを用いて合致を確認します。`
    );

    // 勤務時間全体での持続性
    missingInfo.push(
      `勤務時間全体での持続性: 観測枠内では安定して再現していますが、1日4〜6時間の勤務時間を通じた持続性はお試し実習（1〜3日）での確認が必要です。`
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
      '指示伝達方法の合致: 本人が希望するテキスト・マニュアル指示環境が用意されています。'
    );
  } else if (needsTextInstruction && !companyHasChat) {
    adjustablePoints.push({
      title: '指示伝達方法の調整（口頭指示からテキスト・チェックリストへ）',
      companySide: '口頭での長い指示を避け、箇条書きのチャットや手順書での指示出しをご検討ください。',
      traineeSide: '指示受領時にメモを取り、不明点はその場でチャットで確認する工夫を徹底します。',
    });
  }

  return {
    matchingPoints,
    adjustablePoints,
    missingInfo,
  };
}
