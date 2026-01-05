import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryManager, debounce, throttle } from '../editorUtils';

describe('editorUtils', () => {
  describe('HistoryManager', () => {
    let history: HistoryManager;

    beforeEach(() => {
      history = new HistoryManager(5); // maxSize = 5 for testing
    });

    it('should initialize correctly', () => {
      history.initialize('initial state');
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
      expect(history.getCurrentIndex()).toBe(0);
      expect(history.getLength()).toBe(1);
    });

    it('should push new states', () => {
      history.initialize('state1');
      history.push('state2');
      history.push('state3');
      expect(history.getLength()).toBe(3);
      expect(history.getCurrentIndex()).toBe(2);
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
    });

    it('should undo correctly', () => {
      history.initialize('state1');
      history.push('state2');
      history.push('state3');

      const undoResult = history.undo();
      expect(undoResult).toBe('state2');
      expect(history.getCurrentIndex()).toBe(1);
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(true);
    });

    it('should redo correctly', () => {
      history.initialize('state1');
      history.push('state2');
      history.push('state3');
      history.undo();

      const redoResult = history.redo();
      expect(redoResult).toBe('state3');
      expect(history.getCurrentIndex()).toBe(2);
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
    });

    it('should not undo when at beginning', () => {
      history.initialize('state1');
      const undoResult = history.undo();
      expect(undoResult).toBeNull();
      expect(history.getCurrentIndex()).toBe(0);
    });

    it('should not redo when at end', () => {
      history.initialize('state1');
      history.push('state2');
      const redoResult = history.redo();
      expect(redoResult).toBeNull();
      expect(history.getCurrentIndex()).toBe(1);
    });

    it('should clear redo history when pushing after undo', () => {
      history.initialize('state1');
      history.push('state2');
      history.push('state3');
      history.undo(); // back to state2
      history.push('state4'); // should clear state3 from history

      expect(history.getLength()).toBe(3); // state1, state2, state4
      expect(history.canRedo()).toBe(false);
      expect(history.undo()).toBe('state2');
    });

    it('should limit history size', () => {
      history.initialize('state1');
      history.push('state2');
      history.push('state3');
      history.push('state4');
      history.push('state5');
      history.push('state6'); // should remove state1

      expect(history.getLength()).toBe(5); // maxSize = 5
      expect(history.getCurrentIndex()).toBe(4);

      // Undo all the way
      history.undo();
      history.undo();
      history.undo();
      history.undo();
      const oldestState = history.undo();
      expect(oldestState).toBeNull(); // Can't go further back
    });

    it('should clear history', () => {
      history.initialize('state1');
      history.push('state2');
      history.clear();

      expect(history.getLength()).toBe(0);
      expect(history.getCurrentIndex()).toBe(-1);
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const fn = debounce(() => {
        callCount++;
      }, 100);

      fn();
      fn();
      fn();

      // Should not have called yet
      expect(callCount).toBe(0);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should have called once
      expect(callCount).toBe(1);
    });

    it('should pass arguments correctly', async () => {
      let lastArg: string | null = null;
      const fn = debounce((arg: string) => {
        lastArg = arg;
      }, 100);

      fn('first');
      fn('second');
      fn('third');

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(lastArg).toBe('third');
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      let callCount = 0;
      const fn = throttle(() => {
        callCount++;
      }, 100);

      fn(); // Called immediately
      fn(); // Throttled
      fn(); // Throttled

      expect(callCount).toBe(1);

      // Wait for throttle
      await new Promise((resolve) => setTimeout(resolve, 150));

      fn(); // Called
      expect(callCount).toBe(2);
    });

    it('should pass arguments correctly', () => {
      let lastArg: string | null = null;
      const fn = throttle((arg: string) => {
        lastArg = arg;
      }, 100);

      fn('first'); // Called
      fn('second'); // Throttled

      expect(lastArg).toBe('first');
    });
  });
});
