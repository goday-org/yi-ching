
export enum AppStep {
  AUTH = 'AUTH',
  LANDING = 'LANDING',
  INPUT = 'INPUT',
  DIVINATION = 'DIVINATION',
  RESULT = 'RESULT',
  HISTORY = 'HISTORY',
  ADMIN = 'ADMIN',
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

export interface UserProfile {
  id: string;
  username: string;
  is_admin: boolean;
  daily_limit: number;
  extra_uses: number;
  created_at: string;
}

export interface DivinationRecord {
  id: string;
  user_id: string;
  type: string;
  question: string;
  hexagram: string;
  result: string;
  throws_data: ThrowResult[];
  created_at: string;
  // 关联的 profiles（管理员视图用）
  profiles?: { username: string };
}
