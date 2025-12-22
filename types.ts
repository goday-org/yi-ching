
export enum AppStep {
  LANDING = 'LANDING',
  INPUT = 'INPUT',
  DIVINATION = 'DIVINATION',
  RESULT = 'RESULT'
}

export type DivinationType = '感情问题' | '事业方向' | '健康问题' | '工作问题' | '学业财运' | '其他';

export interface ThrowResult {
  heads: number; // 0-3 heads
  lineType: 'yang' | 'yin' | 'old_yang' | 'old_yin';
}

export interface DivinationData {
  type: DivinationType;
  question: string;
  throws: ThrowResult[];
}
