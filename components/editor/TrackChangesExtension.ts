import { Mark } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    deletion: {
      setDeletion: () => ReturnType;
      toggleDeletion: () => ReturnType;
      unsetDeletion: () => ReturnType;
    };
    insertion: {
      setInsertion: () => ReturnType;
      toggleInsertion: () => ReturnType;
      unsetInsertion: () => ReturnType;
    };
  }
}

// 削除された部分を表示するマーク
export const Deletion = Mark.create({
  name: 'deletion',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'del',
        attrs: { class: 'track-deletion' },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'del',
      {
        ...HTMLAttributes,
        class: 'track-deletion',
        style: 'text-decoration: line-through; color: #991b1b; background-color: #fef2f2;',
      },
      0,
    ];
  },

  addCommands() {
    return {
      setDeletion:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleDeletion:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetDeletion:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

// 追加された部分を表示するマーク
export const Insertion = Mark.create({
  name: 'insertion',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'ins',
        attrs: { class: 'track-insertion' },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'ins',
      {
        ...HTMLAttributes,
        class: 'track-insertion',
        style: 'text-decoration: underline; text-decoration-color: #166534; text-decoration-style: solid; color: inherit; background-color: #f0fdf4;',
      },
      0,
    ];
  },

  addCommands() {
    return {
      setInsertion:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleInsertion:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetInsertion:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
