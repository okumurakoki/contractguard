/**
 * エディタUX改善ユーティリティ
 */

/**
 * カーソル位置情報
 */
export interface CursorPosition {
  node: Node;
  offset: number;
}

/**
 * カーソル位置を取得
 */
export function getCursorPosition(): CursorPosition | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  return {
    node: range.startContainer,
    offset: range.startOffset,
  };
}

/**
 * カーソル位置を設定
 */
export function setCursorPosition(position: CursorPosition): void {
  try {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.setStart(position.node, position.offset);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
  } catch (error) {
    // ノードが存在しない場合などのエラーを無視
    console.debug('Failed to restore cursor position:', error);
  }
}

/**
 * HTMLコンテンツ内での相対的なカーソル位置を取得（文字オフセット）
 */
export function getRelativeCursorOffset(container: HTMLElement): number | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const preSelectionRange = range.cloneRange();
  preSelectionRange.selectNodeContents(container);
  preSelectionRange.setEnd(range.startContainer, range.startOffset);

  return preSelectionRange.toString().length;
}

/**
 * 相対的なカーソル位置を設定（文字オフセット）
 */
export function setRelativeCursorOffset(container: HTMLElement, offset: number): void {
  try {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    let currentOffset = 0;
    let found = false;

    function traverse(node: Node): boolean {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        if (currentOffset + textLength >= offset) {
          range.setStart(node, offset - currentOffset);
          range.collapse(true);
          found = true;
          return true;
        }
        currentOffset += textLength;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (let i = 0; i < node.childNodes.length; i++) {
          if (traverse(node.childNodes[i])) {
            return true;
          }
        }
      }
      return false;
    }

    traverse(container);

    if (found) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  } catch (error) {
    console.debug('Failed to restore relative cursor position:', error);
  }
}

/**
 * デバウンス関数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * スロットル関数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 履歴管理クラス
 */
export class HistoryManager {
  private history: string[] = [];
  private currentIndex: number = -1;
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  /**
   * 現在の状態を履歴に追加
   */
  push(state: string): void {
    // 現在位置以降の履歴を削除
    this.history = this.history.slice(0, this.currentIndex + 1);

    // 新しい状態を追加
    this.history.push(state);

    // 最大サイズを超えた場合、古い履歴を削除
    if (this.history.length > this.maxSize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  /**
   * Undo（戻る）
   */
  undo(): string | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Redo（進む）
   */
  redo(): string | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Undo可能かチェック
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Redo可能かチェック
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * 現在の履歴インデックス
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * 履歴の長さ
   */
  getLength(): number {
    return this.history.length;
  }

  /**
   * 履歴をクリア
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * 初期状態を設定
   */
  initialize(state: string): void {
    this.history = [state];
    this.currentIndex = 0;
  }
}

/**
 * IME入力中かどうかを判定
 */
export function isIMEComposing(element: HTMLElement): boolean {
  return element.getAttribute('data-composing') === 'true';
}

/**
 * IME入力状態を設定
 */
export function setIMEComposing(element: HTMLElement, composing: boolean): void {
  element.setAttribute('data-composing', composing.toString());
}
