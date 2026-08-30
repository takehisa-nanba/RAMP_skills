import { CompanyWorkRequirement, TraineeProfile, ConnectionAnalysis, WorkCycleEvidence } from '../types';

/**
 * 企業要件と研修生の作業周期・特性を透明なルールに基づき比較し、対話の材料を抽出する。
 * ※ 自動適合率や合否判定は行いません。
 */
export function analyzeConnection(
  requirement: CompanyWorkRequirement,
  trainee: TraineeProfile
): ConnectionAnalysis {
  const matchingPoints: string[] = [];
  const adjustablePoints: { title: string; companySide: string; traineeSide: string }[] = [];
  const missingInfo: string[] = [];

  // 1. 最も関連する模擬業務実績を探す
  const relevantWorkCycle: WorkCycleEvidence | undefined =
    trainee.workCycles.find((wc) =>
      requirement.taskName.includes('入力') || requirement.taskName.includes('データ')
        ? wc.taskName.includes('入力') || wc.taskName.includes('データ') || wc.taskName.includes('照合')
        : requirement.taskName.includes('バナー') || requirement.taskName.includes('Web')
        ? wc.taskName.includes('バナー') || wc.taskName.includes('Web') || wc.taskName.includes('画像')
        : wc.taskName.includes('マニュアル') || wc.taskName.includes('手順書') || wc.taskName.includes('メール')
    ) || trainee.workCycles[0];

  if (relevantWorkCycle) {
    // 作業スピードと成果量の比較
    const totalCycle = relevantWorkCycle.workDurationMinutes + relevantWorkCycle.recoveryDurationMinutes;
    if (totalCycle <= requirement.expectedDurationMinutes) {
      matchingPoints.push(
        `作業・回復サイクルと想定時間: 本人の1サイクル（集中${relevantWorkCycle.workDurationMinutes}分＋回復${relevantWorkCycle.recoveryDurationMinutes}分＝計${totalCycle}分）は、御社の想定作業時間（${requirement.expectedDurationMinutes}分）の範囲内で持続的に納品可能です。`
      );
    } else if (totalCycle <= requirement.acceptableDurationRange.max) {
      matchingPoints.push(
        `作業・回復サイクルと許容上限: 本人の1サイクル（計${totalCycle}分）は、御社の許容作業時間上限（${requirement.acceptableDurationRange.max}分）に収まっています。`
      );
    } else {
      adjustablePoints.push({
        title: '作業単位と所要時間のすり合わせ',
        companySide: `現在の作業単位（${requirement.workUnit}）を分割するか、許容上限（${requirement.acceptableDurationRange.max}分）の緩和を検討。`,
        traineeSide: '手順の習熟とセルフチェックの効率化により、所要時間の短縮を目指す。',
      });
    }

    // 品質・正確性の比較
    matchingPoints.push(
      `品質・仕上がり実績: デモ用想定実績として「${relevantWorkCycle.qualityResult}」が確認されており、御社の求める品質基準（${requirement.requiredQuality}）に適合しています。`
    );

    // 時間配分の裁量
    if (requirement.recoveryTimeAllowed) {
      matchingPoints.push(
        `所定労働時間内の時間配分裁量: 御社が回復時間の取得を認めているため、本人の【${relevantWorkCycle.workDurationMinutes}分作業＋${relevantWorkCycle.recoveryDurationMinutes}分回復】というワークサイクルをそのまま業務工程として活かせます。`
      );
    } else {
      adjustablePoints.push({
        title: '回復時間（休憩）の業務工程への組み込み',
        companySide: '決められた一斉休憩だけでなく、成果と品質が維持される前提で、短時間の回復周期（10〜15分）を工程の一部として許容することを検討。',
        traineeSide: '回復時間中はタイマーを用い、時間通りに集中作業を再開する自己管理を徹底。',
      });
    }

    // 余白の扱いについての調整点
    if (totalCycle < requirement.expectedDurationMinutes) {
      const marginMinutes = requirement.expectedDurationMinutes - totalCycle;
      adjustablePoints.push({
        title: `作業完了によって生まれる余白（約${marginMinutes}分）の扱い`,
        companySide: '予定より速く完了した際、自動的な追加ノルマとせず、回復や次の作業のバッファとして扱う合意を形成。',
        traineeSide: '予定より早く完了した旨を報告し、指示を仰ぐか休憩に充てるかを事前に確認。',
      });
    }
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

  // 3. 不足している情報（実習・面談での確認事項）
  missingInfo.push(
    '勤務時間全体での持続性: 観測範囲内（約90分枠）では安定して再現していますが、週契約時間（例: 1日4〜6時間）を通じた持続性はお試し実習（1〜3日）での確認が必要です。'
  );
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
