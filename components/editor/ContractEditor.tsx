'use client';

import * as React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  getRelativeCursorOffset,
  setRelativeCursorOffset,
  debounce,
  HistoryManager,
} from '@/lib/utils/editorUtils';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Paper,
  IconButton,
  Divider,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
} from '@mui/material';
import {
  Undo as UndoIcon,
  Redo as RedoIcon,
  PostAdd as TemplateIcon,
  DragIndicator as DragIcon,
  AutoFixHigh as AutoFixIcon,
  CheckCircle as AcceptIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  StrikethroughS as StrikethroughIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FormatListNumbered as FormatListNumberedIcon,
  FormatAlignLeft as FormatAlignLeftIcon,
  FormatAlignCenter as FormatAlignCenterIcon,
  FormatAlignRight as FormatAlignRightIcon,
  FormatAlignJustify as FormatAlignJustifyIcon,
  FormatIndentIncrease as IndentIncreaseIcon,
  FormatIndentDecrease as IndentDecreaseIcon,
} from '@mui/icons-material';

interface ContractEditorProps {
  content: string;
  onChange: (content: string) => void;
  onEditorReady?: (editor: any) => void;
  contractId?: string;
}

interface ArticleItem {
  id: string;
  number: string;
  title: string;
  content: string;
}

// サイドバー用のソート可能な条項アイテムコンポーネント（メモ化）
const SortableArticleItem = React.memo(function SortableArticleItem({ article, onJump }: { article: ArticleItem; onJump: (number: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id });

  const style = React.useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }), [transform, transition, isDragging]);

  const handleClick = React.useCallback(() => {
    onJump(article.number);
  }, [onJump, article.number]);

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        p: 1,
        borderRadius: 1,
        cursor: isDragging ? 'grabbing' : 'pointer',
        fontSize: '0.75rem',
        transition: 'all 0.2s',
        bgcolor: isDragging ? 'grey.200' : 'transparent',
        '&:hover': {
          bgcolor: 'grey.100',
        },
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          color: 'grey.500',
          '&:active': {
            cursor: 'grabbing',
          },
        }}
      >
        <DragIcon sx={{ fontSize: '1rem' }} />
      </Box>
      <Box sx={{ flex: 1 }} onClick={handleClick}>
        <Typography variant="caption" fontWeight={600} sx={{ display: 'block' }}>
          第{article.number}条
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {article.title}
        </Typography>
      </Box>
    </Box>
  );
});

// エディタ内のドラッグ可能な条項コンポーネント
interface SortableEditorArticleProps {
  article: ArticleItem;
  onContentChange: (id: string, newContent: string) => void;
  onCompositionStart: () => void;
  onCompositionEnd: (e: React.CompositionEvent<HTMLDivElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  isComposing: boolean;
}

const SortableEditorArticle = React.memo(function SortableEditorArticle({
  article,
  onContentChange,
  onCompositionStart,
  onCompositionEnd,
  onKeyDown,
  isComposing
}: SortableEditorArticleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id });

  const style = React.useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
  }), [transform, transition, isDragging]);

  const handleInput = React.useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (isComposing) return;
    const newContent = e.currentTarget.innerHTML;
    onContentChange(article.id, newContent);
  }, [isComposing, onContentChange, article.id]);

  // コンテンツのメモ化（不要な再レンダリングを防止）
  const contentHtml = React.useMemo(() => ({ __html: article.content }), [article.content]);

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        position: 'relative',
        margin: '1.5em 0',
        paddingLeft: '2.5em',
        opacity: isDragging ? 0.4 : 1,
        bgcolor: isDragging ? 'grey.50' : 'transparent',
        borderRadius: isDragging ? 1 : 0,
        '&:hover .drag-handle': {
          opacity: 1,
        },
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        className="drag-handle"
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '2em',
          height: '2em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: 0,
          transition: 'opacity 0.2s',
          color: 'grey.500',
          '&:hover': {
            color: 'grey.700',
            bgcolor: 'grey.100',
            borderRadius: 1,
          },
        }}
      >
        <DragIcon sx={{ fontSize: '1.25rem' }} />
      </Box>
      <Box
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onKeyDown={onKeyDown}
        dangerouslySetInnerHTML={contentHtml}
        sx={{ outline: 'none' }}
      />
    </Box>
  );
});

// 条項テンプレートの定義
const articleTemplates = [
  {
    id: 'termination',
    title: '契約解除',
    content: `<h3>第○条（契約解除）</h3>
<p>甲及び乙は、相手方が次の各号のいずれかに該当したときは、何らの催告なしに直ちに本契約の全部又は一部を解除することができる。</p>
<ol>
<li>本契約に定める条項に違反し、相当期間を定めた催告後も是正されない場合</li>
<li>監督官庁より営業停止または営業免許もしくは営業登録の取消の処分を受けた場合</li>
<li>支払停止もしくは支払不能の状態に陥った場合、または手形交換所の取引停止処分を受けた場合</li>
<li>第三者より差押え、仮差押え、仮処分もしくは競売の申立て、または公租公課の滞納処分を受けた場合</li>
<li>破産手続開始、民事再生手続開始、会社更生手続開始、特別清算開始の申立てがあった場合</li>
</ol>`
  },
  {
    id: 'intellectual-property',
    title: '知的財産権',
    content: `<h3>第○条（知的財産権）</h3>
<p>本契約に基づき乙が作成した成果物に関する著作権（著作権法第27条及び第28条に定める権利を含む）その他一切の知的財産権は、乙又は第三者が従前より保有していた著作物の著作権及びノウハウ等を除き、甲に帰属するものとする。</p>
<p>乙は、甲及び甲が指定する第三者に対し、著作者人格権を行使しないものとする。</p>`
  },
  {
    id: 'confidentiality',
    title: '秘密保持',
    content: `<h3>第○条（秘密保持）</h3>
<p>甲及び乙は、本契約の履行に関連して相手方より開示を受けた技術上、営業上その他一切の秘密情報を、本契約の履行以外の目的に使用してはならず、相手方の事前の書面による承諾なしに第三者に開示又は漏洩してはならない。</p>
<p>前項の規定は、本契約終了後も3年間有効とする。</p>`
  },
  {
    id: 'jurisdiction',
    title: '管轄裁判所',
    content: `<h3>第○条（管轄裁判所）</h3>
<p>本契約に関する一切の紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とする。</p>`
  },
  {
    id: 'contract-amendment',
    title: '契約の変更',
    content: `<h3>第○条（契約の変更）</h3>
<p>本契約の変更は、甲乙双方が記名押印した書面によってのみ行うことができる。</p>`
  },
  {
    id: 'entire-agreement',
    title: '完全合意',
    content: `<h3>第○条（完全合意）</h3>
<p>本契約は、本契約に関する甲乙間の完全な合意を構成し、本契約締結以前の甲乙間における口頭又は書面による合意、表明及び了解事項に優先する。</p>`
  },
  {
    id: 'assignment',
    title: '権利義務の譲渡禁止',
    content: `<h3>第○条（権利義務の譲渡禁止）</h3>
<p>甲及び乙は、相手方の事前の書面による承諾なしに、本契約上の地位及び本契約から生じる権利義務の全部又は一部を第三者に譲渡し、又は担保に供してはならない。</p>`
  },
  {
    id: 'force-majeure',
    title: '不可抗力',
    content: `<h3>第○条（不可抗力）</h3>
<p>天災地変、戦争、暴動、内乱、法令の改廃制定、公権力による命令処分、ストライキその他の労働争議、輸送機関の事故、その他甲乙双方の責に帰すことのできない事由により本契約の全部又は一部の履行が不可能又は著しく困難となった場合、甲乙双方は、その履行義務を免れるものとする。</p>`
  },
];

export default function ContractEditor({ content, onChange, onEditorReady, contractId }: ContractEditorProps) {
  const [articles, setArticles] = React.useState<ArticleItem[]>([]);
  const [headerContent, setHeaderContent] = React.useState('');
  const [footerContent, setFooterContent] = React.useState('');
  const [templateDialogOpen, setTemplateDialogOpen] = React.useState(false);

  // AI並び替え関連
  const [aiReordering, setAiReordering] = React.useState(false);
  const [aiReorderDialogOpen, setAiReorderDialogOpen] = React.useState(false);
  const [suggestedOrder, setSuggestedOrder] = React.useState<string[] | null>(null);
  const [reorderReasoning, setReorderReasoning] = React.useState<string[]>([]);

  // IME対応
  const [isComposing, setIsComposing] = React.useState(false);
  const savedCursorOffsetRef = React.useRef<number | null>(null);

  const editorContainerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef(content);

  // contentRefを常に最新の値に更新
  React.useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Undo/Redo用の履歴管理（HistoryManagerクラスを使用）
  const historyManagerRef = React.useRef(new HistoryManager(50));
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  // 履歴マネージャーを初期化（初期化時のみ実行、contentの変更では再実行しない）
  React.useEffect(() => {
    historyManagerRef.current.initialize(content);
    setCanUndo(false);
    setCanRedo(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // コンテンツ変更のデバウンス用ref
  const parseTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastParsedContentRef = React.useRef<string>('');

  // 契約書の条項を抽出（ヘッダーとフッターを分離）- デバウンス付き
  React.useEffect(() => {
    if (!content) return;

    // 同じコンテンツの場合はスキップ
    if (content === lastParsedContentRef.current) return;

    // 前回のタイムアウトをクリア
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current);
    }

    // 100msのデバウンスでパース
    parseTimeoutRef.current = setTimeout(() => {
      lastParsedContentRef.current = content;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const headings = tempDiv.querySelectorAll('h3');
    const extractedArticles: ArticleItem[] = [];

    // ヘッダー部分（最初のh3より前）を取得
    const firstH3 = tempDiv.querySelector('h3');
    let header = '';
    if (firstH3) {
      let currentNode = tempDiv.firstChild;
      while (currentNode && currentNode !== firstH3) {
        header += currentNode instanceof Element ? currentNode.outerHTML : currentNode.textContent;
        currentNode = currentNode.nextSibling;
      }
    }
    setHeaderContent(header);

    // まず全体から署名部分（フッター）を探す
    let footer = '';
    let footerStartNode: Element | null = null;

    const allElements = tempDiv.querySelectorAll('p');
    allElements.forEach((p) => {
      const text = p.textContent || '';
      if (text.includes('以上、本契約の成立を証するため')) {
        footerStartNode = p;
      }
    });

    // フッター部分を抽出（署名開始から最後まで）
    if (footerStartNode) {
      let currentFooterNode: ChildNode | null = footerStartNode as ChildNode;
      while (currentFooterNode !== null) {
        if (currentFooterNode.nodeType === Node.ELEMENT_NODE) {
          footer += (currentFooterNode as Element).outerHTML;
        } else {
          footer += currentFooterNode.textContent || '';
        }
        currentFooterNode = currentFooterNode.nextSibling;
      }
    }
    setFooterContent(footer);

    // 条項を抽出（署名部分より前まで）
    headings.forEach((h3, index) => {
      const text = h3.textContent || '';
      const match = text.match(/第(\d+)条[（(]([^）)]+)[）)]/);
      if (match) {
        // h3とその後の内容を取得（次のh3または署名部分まで）
        let articleContent = h3.outerHTML;
        let nextSibling = h3.nextElementSibling;

        while (nextSibling && nextSibling.tagName !== 'H3' && nextSibling !== footerStartNode) {
          // 署名部分に到達したら終了
          if (nextSibling instanceof Element) {
            const siblingText = nextSibling.textContent || '';
            if (siblingText.includes('以上、本契約の成立を証するため')) {
              break;
            }
          }

          if (nextSibling instanceof Element) {
            articleContent += nextSibling.outerHTML;
          } else if (nextSibling) {
            articleContent += (nextSibling as ChildNode).textContent || '';
          }
          nextSibling = nextSibling.nextElementSibling;
        }

        extractedArticles.push({
          id: `article-${index}`,
          number: match[1],
          title: match[2],
          content: articleContent,
        });
      }
    });

    setArticles(extractedArticles);
    }, 100); // 100msのデバウンス

    return () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }
    };
  }, [content]);
  // Tiptapエディタは使用しない - シンプルなcontentEditableを使用

  // カーソル位置の保存（相対的なオフセットとして保存）
  const saveCursorPosition = React.useCallback(() => {
    if (editorContainerRef.current) {
      const offset = getRelativeCursorOffset(editorContainerRef.current);
      savedCursorOffsetRef.current = offset;
    }
  }, []);

  // カーソル位置の復元
  const restoreCursorPosition = React.useCallback(() => {
    if (editorContainerRef.current && savedCursorOffsetRef.current !== null) {
      // 次のフレームで復元（DOMの更新を待つ）
      requestAnimationFrame(() => {
        if (editorContainerRef.current && savedCursorOffsetRef.current !== null) {
          setRelativeCursorOffset(editorContainerRef.current, savedCursorOffsetRef.current);
        }
      });
    }
  }, []);

  // IME入力開始
  const handleCompositionStart = React.useCallback(() => {
    setIsComposing(true);
    saveCursorPosition();
  }, [saveCursorPosition]);

  // IME入力終了
  const handleCompositionEnd = React.useCallback((e: React.CompositionEvent<HTMLDivElement>) => {
    setIsComposing(false);
    // IME確定後にコンテンツを更新
    const newContent = e.currentTarget.innerHTML;

    // 履歴に追加（デバウンス処理付き）
    debouncedAddToHistory(newContent);

    // 即座に onChange を呼ぶ
    onChange(newContent);

    // カーソル位置を復元
    restoreCursorPosition();
    // debouncedAddToHistoryはuseMemoで安定しているため依存配列から除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, restoreCursorPosition]);

  // 履歴に追加
  const addToHistory = React.useCallback((newContent: string) => {
    if (isComposing) return;

    historyManagerRef.current.push(newContent);
    setCanUndo(historyManagerRef.current.canUndo());
    setCanRedo(historyManagerRef.current.canRedo());
  }, [isComposing]);

  // デバウンス処理付きの履歴追加（500ms）
  const debouncedAddToHistory = React.useMemo(
    () => debounce(addToHistory, 500),
    [addToHistory]
  );

  // Undo実行
  const performUndo = React.useCallback(() => {
    const previousContent = historyManagerRef.current.undo();
    if (previousContent !== null) {
      onChange(previousContent);
      setCanUndo(historyManagerRef.current.canUndo());
      setCanRedo(historyManagerRef.current.canRedo());
    }
  }, [onChange]);

  // Redo実行
  const performRedo = React.useCallback(() => {
    const nextContent = historyManagerRef.current.redo();
    if (nextContent !== null) {
      onChange(nextContent);
      setCanUndo(historyManagerRef.current.canUndo());
      setCanRedo(historyManagerRef.current.canRedo());
    }
  }, [onChange]);

  // キーボードショートカット
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // IME入力中はショートカットを無効化
    if (isComposing) return;

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    if (isCtrlOrCmd) {
      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            // Redo
            performRedo();
          } else {
            // Undo
            performUndo();
          }
          break;
        case 'b':
          e.preventDefault();
          document.execCommand('bold', false);
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic', false);
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline', false);
          break;
        case 's':
          // Ctrl+S はブラウザのデフォルト動作（保存）を許可
          break;
      }
    }
  }, [isComposing, performUndo, performRedo]);

  // エディタインスタンスを模擬（Tiptap互換のAPI）- 一度だけ実行
  const editorReadyCalledRef = React.useRef(false);

  React.useEffect(() => {
    if (onEditorReady && !editorReadyCalledRef.current) {
      const mockEditor = {
        getHTML: () => contentRef.current,
        commands: {
          setContent: (newContent: string) => {
            // 履歴に追加
            addToHistory(newContent);
            onChange(newContent);
          },
        },
        chain: () => ({
          focus: () => ({
            insertContent: (html: string) => ({
              insertContent: (html2: string) => ({
                run: () => {
                  const currentContent = contentRef.current;
                  const newContent = currentContent + html + html2;
                  // 履歴に追加
                  addToHistory(newContent);
                  onChange(newContent);
                },
              }),
            }),
          }),
        }),
      };
      onEditorReady(mockEditor);
      editorReadyCalledRef.current = true;
    }
  }, [onEditorReady, onChange, addToHistory]);

  // テキストフォーマット関数
  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  // 変更マークを挿入する関数（状態: pending → confirmed → finalized）
  const insertDeletion = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      const del = document.createElement('del');
      del.className = 'track-deletion track-pending';
      del.setAttribute('data-change-time', Date.now().toString());
      del.textContent = selectedText;
      range.deleteContents();
      range.insertNode(del);
    }
  };

  const insertInsertion = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      const ins = document.createElement('ins');
      ins.className = 'track-insertion track-pending';
      ins.setAttribute('data-change-time', Date.now().toString());
      ins.textContent = selectedText;
      range.deleteContents();
      range.insertNode(ins);
    }
  };

  // デバウンス付きのonChange（入力中の高頻度更新を抑制）
  const debouncedOnChange = React.useMemo(
    () => debounce((content: string) => {
      onChange(content);
    }, 150),
    [onChange]
  );

  const handleArticleContentChange = React.useCallback((id: string, newContent: string) => {
    // カーソル位置を保存
    saveCursorPosition();

    setArticles((prevArticles) => {
      const updatedArticles = prevArticles.map((article) =>
        article.id === id ? { ...article, content: newContent } : article
      );

      // 全体のコンテンツを更新（次のフレームで実行）
      requestAnimationFrame(() => {
        const fullContent = headerContent + updatedArticles.map(a => a.content).join('') + footerContent;
        debouncedAddToHistory(fullContent);
        debouncedOnChange(fullContent);

        // カーソル位置を復元
        restoreCursorPosition();
      });

      return updatedArticles;
    });
  }, [saveCursorPosition, headerContent, footerContent, debouncedAddToHistory, debouncedOnChange, restoreCursorPosition]);

  // SortableContext用のIDリストをメモ化
  const articleIds = React.useMemo(() => articles.map(a => a.id), [articles]);

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setArticles((prevArticles) => {
        const oldIndex = prevArticles.findIndex((item) => item.id === active.id);
        const newIndex = prevArticles.findIndex((item) => item.id === over.id);
        const newArticles = arrayMove(prevArticles, oldIndex, newIndex);

        // 条番号を自動的に振り直す
        const updatedArticles = newArticles.map((article, index) => {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = article.content;
          const h3 = tempDiv.querySelector('h3');

          if (h3) {
            const text = h3.textContent || '';
            const match = text.match(/第(\d+)条[（(]([^）)]+)[）)]/);
            if (match) {
              const newNumber = index + 1;
              const newText = text.replace(/第\d+条/, `第${newNumber}条`);
              h3.textContent = newText;

              return {
                ...article,
                number: newNumber.toString(),
                content: tempDiv.innerHTML,
              };
            }
          }

          return article;
        });

        // 並び替えた条項を結合してonChangeで通知
        requestAnimationFrame(() => {
          const reorderedContent = headerContent + updatedArticles.map(article => article.content).join('') + footerContent;
          addToHistory(reorderedContent);
          onChange(reorderedContent);
        });

        return updatedArticles;
      });
    }
  }, [headerContent, footerContent, addToHistory, onChange]);

  const handleRenumberArticles = () => {
    if (articles.length === 0) return;

    // 条番号を1から順に振り直す
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const headings = tempDiv.querySelectorAll('h3');

    headings.forEach((h3, index) => {
      const text = h3.textContent || '';
      const match = text.match(/第(\d+)条[（(]([^）)]+)[）)]/);
      if (match) {
        const newNumber = index + 1;
        const newText = text.replace(/第\d+条/, `第${newNumber}条`);
        h3.textContent = newText;
      }
    });

    const renumberedContent = tempDiv.innerHTML;
    addToHistory(renumberedContent);
    onChange(renumberedContent);
  };

  const handleJumpToArticle = React.useCallback((articleNumber: string) => {
    // エディタ内のh3要素を検索してスクロール
    if (editorContainerRef.current) {
      const headings = editorContainerRef.current.querySelectorAll('h3');

      headings.forEach((h3) => {
        const text = h3.textContent || '';
        if (text.includes(`第${articleNumber}条`)) {
          h3.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }, []);

  const handleInsertTemplate = React.useCallback((template: typeof articleTemplates[0]) => {
    // エディタの最後に条項を追加（insertion マークで追加）
    const templateWithMark = `<ins class="track-insertion">${template.content}</ins>`;
    const updatedContent = content + templateWithMark;

    addToHistory(updatedContent);
    onChange(updatedContent);
    setTemplateDialogOpen(false);

    // 追加した条項にスクロール
    setTimeout(() => {
      if (editorContainerRef.current) {
        const lastHeading = editorContainerRef.current.querySelector('ins:last-of-type h3');
        if (lastHeading) {
          lastHeading.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  }, [content, addToHistory, onChange]);

  const handleAcceptAllChanges = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // すべてのdel要素を削除（最も深いものから処理）
    let deletions = tempDiv.querySelectorAll('del');
    while (deletions.length > 0) {
      deletions.forEach((del) => {
        del.remove();
      });
      deletions = tempDiv.querySelectorAll('del');
    }

    // すべてのins要素をアンラップ（最も深いものから処理）
    let insertions = tempDiv.querySelectorAll('ins');
    while (insertions.length > 0) {
      insertions.forEach((ins) => {
        const parent = ins.parentNode;
        if (parent) {
          while (ins.firstChild) {
            parent.insertBefore(ins.firstChild, ins);
          }
          ins.remove();
        }
      });
      insertions = tempDiv.querySelectorAll('ins');
    }

    const cleanedContent = tempDiv.innerHTML;
    addToHistory(cleanedContent);
    onChange(cleanedContent);
  };

  // AI並び替え提案を取得
  const handleAIReorder = async () => {
    if (!contractId || articles.length === 0) return;

    setAiReordering(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/suggest-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: articles.map((a) => ({ number: a.number, title: a.title })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedOrder(data.suggestedOrder);
        setReorderReasoning(data.reasoning || []);
        setAiReorderDialogOpen(true);
      }
    } catch (error) {
      console.error('AI reorder error:', error);
    } finally {
      setAiReordering(false);
    }
  };

  // AI提案の順序を適用
  const applyAIReorder = () => {
    if (!suggestedOrder) return;

    // 提案された順序に基づいて条項を並び替え
    const reorderedArticles = suggestedOrder
      .map((num) => articles.find((a) => a.number === num))
      .filter(Boolean) as ArticleItem[];

    // 条番号を1から振り直す
    const updatedArticles = reorderedArticles.map((article, index) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = article.content;
      const h3 = tempDiv.querySelector('h3');

      if (h3) {
        const text = h3.textContent || '';
        const newNumber = index + 1;
        const newText = text.replace(/第\d+条/, `第${newNumber}条`);
        h3.textContent = newText;

        return {
          ...article,
          number: newNumber.toString(),
          content: tempDiv.innerHTML,
        };
      }

      return { ...article, number: (index + 1).toString() };
    });

    setArticles(updatedArticles);

    // 並び替えた内容を通知
    const reorderedContent = headerContent + updatedArticles.map((a) => a.content).join('') + footerContent;
    addToHistory(reorderedContent);
    onChange(reorderedContent);

    setAiReorderDialogOpen(false);
    setSuggestedOrder(null);
    setReorderReasoning([]);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
      {/* 条項一覧サイドバー */}
      {articles.length > 0 && (
        <Paper
          sx={{
            width: 200,
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'grey.200',
            borderRadius: 1,
            p: 1.5,
            position: 'sticky',
            top: 16,
            maxHeight: 'calc(100vh - 250px)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              条項一覧
            </Typography>
            <Tooltip title="条番号を整理">
              <IconButton size="small" onClick={handleRenumberArticles} sx={{ p: 0.5 }}>
                <AutoFixIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={articleIds} strategy={verticalListSortingStrategy}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {articles.map((article) => (
                    <SortableArticleItem
                      key={article.id}
                      article={article}
                      onJump={handleJumpToArticle}
                    />
                  ))}
                </Box>
              </SortableContext>
            </DndContext>
          </Box>
        </Paper>
      )}

      {/* エディタ本体 */}
      <Paper
        sx={{
          flex: 1,
          border: '1px solid',
          borderColor: 'grey.200',
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ツールバー */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1.5,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'grey.50',
          flexWrap: 'wrap',
        }}
      >
        {/* Undo/Redo */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="元に戻す (Ctrl+Z)">
            <IconButton
              size="small"
              onClick={performUndo}
              disabled={!canUndo}
              sx={{ bgcolor: 'white' }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="やり直す (Ctrl+Shift+Z)">
            <IconButton
              size="small"
              onClick={performRedo}
              disabled={!canRedo}
              sx={{ bgcolor: 'white' }}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* テキストフォーマット */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="太字">
            <IconButton
              size="small"
              onClick={() => applyFormat('bold')}
              sx={{ bgcolor: 'white' }}
            >
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="斜体">
            <IconButton
              size="small"
              onClick={() => applyFormat('italic')}
              sx={{ bgcolor: 'white' }}
            >
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="下線">
            <IconButton
              size="small"
              onClick={() => applyFormat('underline')}
              sx={{ bgcolor: 'white' }}
            >
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="取り消し線">
            <IconButton
              size="small"
              onClick={() => applyFormat('strikeThrough')}
              sx={{ bgcolor: 'white' }}
            >
              <StrikethroughIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* リスト */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="箇条書き">
            <IconButton
              size="small"
              onClick={() => applyFormat('insertUnorderedList')}
              sx={{ bgcolor: 'white' }}
            >
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="番号付きリスト">
            <IconButton
              size="small"
              onClick={() => applyFormat('insertOrderedList')}
              sx={{ bgcolor: 'white' }}
            >
              <FormatListNumberedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* テキスト配置 */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="左揃え">
            <IconButton
              size="small"
              onClick={() => applyFormat('justifyLeft')}
              sx={{ bgcolor: 'white' }}
            >
              <FormatAlignLeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="中央揃え">
            <IconButton
              size="small"
              onClick={() => applyFormat('justifyCenter')}
              sx={{ bgcolor: 'white' }}
            >
              <FormatAlignCenterIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="右揃え">
            <IconButton
              size="small"
              onClick={() => applyFormat('justifyRight')}
              sx={{ bgcolor: 'white' }}
            >
              <FormatAlignRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="両端揃え">
            <IconButton
              size="small"
              onClick={() => applyFormat('justifyFull')}
              sx={{ bgcolor: 'white' }}
            >
              <FormatAlignJustifyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* インデント */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="インデントを増やす">
            <IconButton
              size="small"
              onClick={() => applyFormat('indent')}
              sx={{ bgcolor: 'white' }}
            >
              <IndentIncreaseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="インデントを減らす">
            <IconButton
              size="small"
              onClick={() => applyFormat('outdent')}
              sx={{ bgcolor: 'white' }}
            >
              <IndentDecreaseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* 変更追跡マーク */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="削除マークを追加">
            <IconButton
              size="small"
              onClick={insertDeletion}
              sx={{
                bgcolor: 'white',
                '&:hover': {
                  bgcolor: '#fef2f2',
                  color: '#991b1b',
                }
              }}
            >
              <StrikethroughIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="追加マークを追加">
            <IconButton
              size="small"
              onClick={insertInsertion}
              sx={{
                bgcolor: 'white',
                '&:hover': {
                  bgcolor: '#f0fdf4',
                  color: '#166534',
                }
              }}
            >
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* 条項テンプレート追加 */}
        <Tooltip title="条項テンプレートから追加">
          <Button
            size="small"
            variant="contained"
            startIcon={<TemplateIcon />}
            onClick={() => setTemplateDialogOpen(true)}
            sx={{
              bgcolor: '#1e40af',
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              '&:hover': {
                bgcolor: '#1e3a8a',
              },
            }}
          >
            条項を追加
          </Button>
        </Tooltip>

        {/* AI並び替え */}
        {contractId && articles.length > 1 && (
          <Tooltip title="AIが最適な条項順序を提案">
            <Button
              size="small"
              variant="outlined"
              startIcon={aiReordering ? <AutoFixIcon className="animate-spin" /> : <AutoFixIcon />}
              onClick={handleAIReorder}
              disabled={aiReordering}
              sx={{
                borderColor: '#6366f1',
                color: '#6366f1',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                '&:hover': {
                  borderColor: '#4f46e5',
                  bgcolor: '#eef2ff',
                },
              }}
            >
              {aiReordering ? 'AI分析中...' : 'AI並び替え'}
            </Button>
          </Tooltip>
        )}

        <Divider orientation="vertical" flexItem />

        {/* 変更を確定 */}
        <Tooltip title="全ての変更マークを削除して確定">
          <Button
            size="small"
            variant="contained"
            startIcon={<AcceptIcon />}
            onClick={handleAcceptAllChanges}
            sx={{
              bgcolor: '#059669',
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              '&:hover': {
                bgcolor: '#047857',
              },
            }}
          >
            変更を確定
          </Button>
        </Tooltip>
      </Box>

      {/* エディタ本体 */}
      <Box
        ref={editorContainerRef}
        sx={{
          p: 3,
          px: 4,
          bgcolor: 'white',
          position: 'relative',
          fontSize: '14px',
          lineHeight: 1.8,
          fontFamily: '"Noto Sans JP", "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif',
          color: '#1a1a1a',
          maxWidth: '100%',
          '& p': {
            margin: '0.8em 0',
            textAlign: 'justify',
          },
          '& h1': {
            fontSize: '1.8em',
            fontWeight: 700,
            textAlign: 'center',
            marginTop: '0',
            marginBottom: '1.5em',
            padding: 0,
          },
          '& h2': {
            fontSize: '1.3em',
            fontWeight: 700,
            marginTop: '2em',
            marginBottom: '1em',
            padding: '0.5em 0',
            borderBottom: '2px solid #e5e7eb',
          },
          '& h3': {
            fontSize: '1.1em',
            fontWeight: 700,
            marginTop: '1.5em',
            marginBottom: '0.8em',
            padding: '0.6em 0.8em',
            marginLeft: '-0.8em',
            marginRight: '-0.8em',
            borderRadius: '6px',
            transition: 'background-color 0.2s, box-shadow 0.2s',
            cursor: 'text',
            '&:hover': {
              backgroundColor: '#f9fafb',
            },
          },
          '& h3:focus, & h3:focus-within': {
            backgroundColor: '#eff6ff !important',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
          },
          '& ul, & ol': {
            paddingLeft: '2em',
            margin: '1em 0',
          },
          '& li': {
            marginBottom: '0.5em',
            lineHeight: 1.9,
          },
          '& strong': {
            fontWeight: 700,
          },
          '& em': {
            fontStyle: 'italic',
          },
          '& u': {
            textDecoration: 'underline',
          },
          // 変更追跡: 編集中（赤系）
          '& .track-pending': {
            backgroundColor: '#fef2f2 !important',
            borderLeft: '3px solid #ef4444',
            paddingLeft: '0.3em',
          },
          '& del.track-deletion.track-pending': {
            textDecoration: 'line-through',
            color: '#991b1b',
          },
          '& ins.track-insertion.track-pending': {
            textDecoration: 'underline',
            textDecorationColor: '#ef4444',
            color: '#991b1b',
          },
          // 変更追跡: 確定済み（緑系）
          '& .track-confirmed': {
            backgroundColor: '#f0fdf4 !important',
            borderLeft: '3px solid #22c55e',
            paddingLeft: '0.3em',
          },
          '& del.track-deletion.track-confirmed': {
            textDecoration: 'line-through',
            color: '#166534',
          },
          '& ins.track-insertion.track-confirmed': {
            textDecoration: 'underline',
            textDecorationColor: '#22c55e',
            color: '#166534',
          },
          // 変更追跡: 最終確定（通常表示）
          '& .track-finalized': {
            backgroundColor: 'transparent !important',
            borderLeft: 'none',
            paddingLeft: '0',
          },
          '& del.track-deletion.track-finalized': {
            textDecoration: 'line-through',
            color: 'inherit',
            opacity: 0.5,
          },
          '& ins.track-insertion.track-finalized': {
            textDecoration: 'none',
            color: 'inherit',
          },
          // フォールバック（古いクラス名用）
          '& del.track-deletion:not(.track-pending):not(.track-confirmed):not(.track-finalized)': {
            textDecoration: 'line-through',
            color: '#991b1b',
            backgroundColor: '#fef2f2',
            padding: '0.1em 0.2em',
            borderRadius: '2px',
          },
          '& ins.track-insertion:not(.track-pending):not(.track-confirmed):not(.track-finalized)': {
            textDecoration: 'underline',
            textDecorationColor: '#166534',
            textDecorationStyle: 'solid',
            backgroundColor: '#f0fdf4',
            padding: '0.1em 0.2em',
            borderRadius: '2px',
          },
          '& [data-text-align="left"]': {
            textAlign: 'left',
          },
          '& [data-text-align="center"]': {
            textAlign: 'center',
          },
          '& [data-text-align="right"]': {
            textAlign: 'right',
          },
          '& [data-text-align="justify"]': {
            textAlign: 'justify',
          },
        }}
      >
        {/* 条項が検出されない場合はシンプルな編集モード */}
        {articles.length === 0 ? (
          <Box
            contentEditable
            suppressContentEditableWarning
            onInput={(e: React.FormEvent<HTMLDivElement>) => {
              if (isComposing) return;
              const newContent = e.currentTarget.innerHTML;
              addToHistory(newContent);
              onChange(newContent);
            }}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onKeyDown={handleKeyDown}
            dangerouslySetInnerHTML={{ __html: content }}
            sx={{ outline: 'none', minHeight: '300px' }}
          />
        ) : (
          <>
            {/* ヘッダー部分 */}
            {headerContent && (
              <Box
                contentEditable
                suppressContentEditableWarning
                onInput={(e: React.FormEvent<HTMLDivElement>) => {
                  if (isComposing) return;
                  const newHeader = e.currentTarget.innerHTML;
                  setHeaderContent(newHeader);
                  setTimeout(() => {
                    const fullContent = newHeader + articles.map(a => a.content).join('') + footerContent;
                    addToHistory(fullContent);
                    onChange(fullContent);
                  }, 0);
                }}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onKeyDown={handleKeyDown}
                dangerouslySetInnerHTML={{ __html: headerContent }}
                sx={{ mb: 2, outline: 'none' }}
              />
            )}

            {/* 条項部分（ドラッグ&ドロップ可能） */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={articleIds} strategy={verticalListSortingStrategy}>
                {articles.map((article) => (
                  <SortableEditorArticle
                    key={article.id}
                    article={article}
                    onContentChange={handleArticleContentChange}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    onKeyDown={handleKeyDown}
                    isComposing={isComposing}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* フッター部分（署名など） */}
            {footerContent && (
              <Box
                contentEditable
                suppressContentEditableWarning
                onInput={(e: React.FormEvent<HTMLDivElement>) => {
                  if (isComposing) return;
                  const newFooter = e.currentTarget.innerHTML;
                  setFooterContent(newFooter);
                  setTimeout(() => {
                    const fullContent = headerContent + articles.map(a => a.content).join('') + newFooter;
                    addToHistory(fullContent);
                    onChange(fullContent);
                  }, 0);
                }}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onKeyDown={handleKeyDown}
                dangerouslySetInnerHTML={{ __html: footerContent }}
                sx={{
                  mt: 6,
                  pt: 4,
                  textAlign: 'center',
                  outline: 'none',
                  '& p': {
                    margin: '1.2em 0',
                    lineHeight: 2.2,
                  },
                }}
              />
            )}
          </>
        )}
      </Box>
    </Paper>

      {/* 条項テンプレート選択ダイアログ */}
      <Dialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'grey.200', pb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" fontWeight={700}>
              条項テンプレートを選択
            </Typography>
            <Typography variant="caption" component="div" color="text.secondary">
              契約書に追加する条項を選択してください
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List disablePadding>
            {articleTemplates.map((template, index) => (
              <ListItem
                key={template.id}
                disablePadding
                sx={{
                  borderBottom: index < articleTemplates.length - 1 ? '1px solid' : 'none',
                  borderColor: 'grey.100',
                }}
              >
                <ListItemButton
                  onClick={() => handleInsertTemplate(template)}
                  sx={{
                    py: 2,
                    '&:hover': {
                      bgcolor: 'grey.50',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight={600}>
                        {template.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {template.id === 'termination' && '契約違反時の解除条件を定める条項'}
                        {template.id === 'intellectual-property' && '成果物の知的財産権の帰属を定める条項'}
                        {template.id === 'confidentiality' && '秘密情報の取り扱いを定める条項'}
                        {template.id === 'jurisdiction' && '紛争時の管轄裁判所を定める条項'}
                        {template.id === 'contract-amendment' && '契約内容の変更手続きを定める条項'}
                        {template.id === 'entire-agreement' && '本契約が完全な合意であることを定める条項'}
                        {template.id === 'assignment' && '権利義務の譲渡制限を定める条項'}
                        {template.id === 'force-majeure' && '不可抗力による免責を定める条項'}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* AI並び替え提案ダイアログ */}
      <Dialog
        open={aiReorderDialogOpen}
        onClose={() => setAiReorderDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'grey.200', pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoFixIcon sx={{ color: '#6366f1' }} />
            <Box>
              <Typography variant="h6" component="div" fontWeight={700}>
                AIによる条項並び替え提案
              </Typography>
              <Typography variant="caption" component="div" color="text.secondary">
                一般的な契約書の構成に基づいた最適な順序を提案します
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {suggestedOrder && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                提案される順序
              </Typography>
              <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1, p: 1 }}>
                {suggestedOrder.map((num, index) => {
                  const article = articles.find((a) => a.number === num);
                  return (
                    <ListItem key={num} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                bgcolor: '#6366f1',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              {index + 1}
                            </Box>
                            <Typography variant="body2">
                              第{num}条（{article?.title || '不明'}）
                            </Typography>
                            {num !== (index + 1).toString() && (
                              <Typography variant="caption" color="primary">
                                ← 第{index + 1}条へ変更
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
              {reorderReasoning.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    変更理由
                  </Typography>
                  <Box sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                    {reorderReasoning.slice(0, 3).map((reason, i) => (
                      <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                        • {reason}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
          <Button onClick={() => setAiReorderDialogOpen(false)} sx={{ color: 'grey.600' }}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={applyAIReorder}
            sx={{
              bgcolor: '#6366f1',
              '&:hover': { bgcolor: '#4f46e5' },
            }}
          >
            この順序を適用
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
