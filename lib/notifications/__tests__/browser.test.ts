import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';

// グローバルモックの設定
let mockPermission: NotificationPermission = 'default';
const mockNotificationConstructor = vi.fn();

class MockNotification {
  static permission: NotificationPermission = 'default';
  static requestPermission = vi.fn().mockResolvedValue('granted');

  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  onclick: (() => void) | null = null;
  close = vi.fn();

  constructor(title: string, options?: NotificationOptions) {
    mockNotificationConstructor(title, options);
    this.title = title;
    this.body = options?.body;
    this.icon = options?.icon;
    this.tag = options?.tag;
    this.requireInteraction = options?.requireInteraction;
  }
}

// permissionをgetterで動的に取得
Object.defineProperty(MockNotification, 'permission', {
  get: () => mockPermission,
  set: (v: NotificationPermission) => { mockPermission = v; },
  configurable: true,
});

// windowオブジェクトをモック
const mockWindow = {
  Notification: MockNotification,
  focus: vi.fn(),
  location: { href: '' },
};

vi.stubGlobal('window', mockWindow);
vi.stubGlobal('Notification', MockNotification);

// テスト対象をインポート（モックの後にインポート）
import {
  requestNotificationPermission,
  getNotificationPermission,
  showNotification,
  showAnalysisCompleteNotification,
  showHighRiskNotification,
} from '../browser';

describe('browser notifications', () => {
  beforeEach(() => {
    mockNotificationConstructor.mockClear();
    (MockNotification.requestPermission as Mock).mockClear();
    mockPermission = 'default';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getNotificationPermission', () => {
    it('現在の許可状態を返す', () => {
      mockPermission = 'granted';
      expect(getNotificationPermission()).toBe('granted');

      mockPermission = 'denied';
      expect(getNotificationPermission()).toBe('denied');

      mockPermission = 'default';
      expect(getNotificationPermission()).toBe('default');
    });
  });

  describe('requestNotificationPermission', () => {
    it('既に許可されている場合はgrantedを返す', async () => {
      mockPermission = 'granted';
      const result = await requestNotificationPermission();
      expect(result).toBe('granted');
    });

    it('許可をリクエストして結果を返す', async () => {
      mockPermission = 'default';
      (MockNotification.requestPermission as Mock).mockResolvedValue('granted');
      const result = await requestNotificationPermission();
      expect(result).toBe('granted');
    });
  });

  describe('showNotification', () => {
    it('許可されている場合は通知を表示する', () => {
      mockPermission = 'granted';
      showNotification({
        title: 'テスト通知',
        body: 'テスト本文',
      });

      expect(mockNotificationConstructor).toHaveBeenCalledWith('テスト通知', expect.objectContaining({
        body: 'テスト本文',
      }));
    });

    it('許可されていない場合はnullを返す', () => {
      mockPermission = 'denied';
      const result = showNotification({
        title: 'テスト通知',
        body: 'テスト本文',
      });

      expect(result).toBeNull();
      expect(mockNotificationConstructor).not.toHaveBeenCalled();
    });
  });

  describe('showAnalysisCompleteNotification', () => {
    it('分析完了通知を表示する', () => {
      mockPermission = 'granted';
      showAnalysisCompleteNotification({
        contractTitle: 'テスト契約書',
        contractId: 'test-id',
        riskLevel: 'high',
      });

      expect(mockNotificationConstructor).toHaveBeenCalledWith('契約書分析完了', expect.objectContaining({
        body: expect.stringContaining('テスト契約書'),
      }));
    });
  });

  describe('showHighRiskNotification', () => {
    it('高リスク通知を表示する', () => {
      mockPermission = 'granted';
      showHighRiskNotification({
        contractTitle: 'テスト契約書',
        contractId: 'test-id',
        riskCount: 3,
      });

      expect(mockNotificationConstructor).toHaveBeenCalledWith('高リスク項目を検出', expect.objectContaining({
        body: expect.stringContaining('3件'),
      }));
    });
  });
});
