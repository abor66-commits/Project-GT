'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface RichEDMEditorProps {
  content: string;
  onChange: (content: string) => void;
}

// Toolbar button helper
function ToolBtn({
  onClick, active, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      style={{
        padding: '4px 8px',
        borderRadius: '6px',
        border: 'none',
        background: active ? 'var(--primary)' : 'var(--bg-hover)',
        color: active ? 'white' : 'var(--text-main)',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: '600',
        lineHeight: 1,
        minWidth: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

// Minimal email-safe default HTML template
const DEFAULT_HTML = `<p>親愛的 <strong>{{contactName}}</strong>，</p><p><br></p><p>感謝您一直以來對 <strong>{{companyName}}</strong> 的支持。</p><p><br></p><p>此致</p>`;
const NEWSLETTER_HTML = `<h2 style="color:#2563eb">本月快訊</h2><p>親愛的 <strong>{{contactName}}</strong>，</p><p><br></p><p>以下是 <strong>{{companyName}}</strong> 本月的最新資訊：</p><ul><li>項目一</li><li>項目二</li><li>項目三</li></ul><p><br></p><p>如有任何問題，歡迎回覆此郵件。</p>`;

export default function RichEDMEditor({ content, onChange }: RichEDMEditorProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'rich' | 'html'>('rich');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image,
    ],
    content: content || DEFAULT_HTML,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        style: [
          'min-height: 380px',
          'padding: 20px',
          'outline: none',
          'font-family: sans-serif',
          'font-size: 15px',
          'line-height: 1.7',
          'color: #1e293b',
        ].join('; '),
      },
    },
    immediatelyRender: false,
  });

  // Sync external content changes (e.g. applying a template)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content && content !== current) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = useCallback((variable: string) => {
    const token = ` {{${variable}}} `;
    if (viewMode === 'html') {
      // HTML mode: insert at textarea cursor position without going through Tiptap
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const next = el.value.slice(0, start) + token + el.value.slice(end);
      onChange(next);
      // Restore cursor after the inserted token
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      });
    } else {
      editor?.chain().focus().insertContent(token).run();
    }
  }, [viewMode, editor, onChange]);

  const setLink = useCallback(() => {
    const prev = editor?.getAttributes('link').href ?? '';
    const url = window.prompt('URL:', prev);
    if (url === null) return;
    if (!url) { editor?.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const applyBuiltinTemplate = useCallback((key: string) => {
    if (!editor) return;
    if (!confirm(t('marketing.editor.switch_confirm'))) return;
    const html = key === 'newsletter' ? NEWSLETTER_HTML : DEFAULT_HTML;
    editor.commands.setContent(html, { emitUpdate: false });
    onChange(editor.getHTML());
  }, [editor, onChange, t]);

  const switchToHtml = useCallback(() => {
    if (!editor) return;
    // Sync latest rich content to state before switching
    onChange(editor.getHTML());
    setViewMode('html');
  }, [editor, onChange]);

  const switchToRich = useCallback(() => {
    if (!editor) return;
    if (!confirm(t('marketing.editor.html_mode_warning'))) return;
    editor.commands.setContent(content, { emitUpdate: false });
    setViewMode('rich');
  }, [editor, content, t]);

  if (!editor) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px 12px',
        borderBottom: '1px solid var(--border-color)', background: 'var(--bg-muted)',
        alignItems: 'center',
      }}>

        {/* History */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="復原">↩</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="重做">↪</ToolBtn>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />

        {/* Headings */}
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1">H1</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2">H2</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">H3</ToolBtn>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />

        {/* Marks */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="粗體"><b>B</b></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜體"><i>I</i></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="底線"><u>U</u></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="刪除線"><s>S</s></ToolBtn>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />

        {/* Colour */}
        <label title="文字顏色" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <span style={{ fontSize: '0.75rem', padding: '4px 6px', borderRadius: '6px', background: 'var(--bg-hover)', color: 'var(--text-main)', fontWeight: '600' }}>A</span>
          <input
            type="color"
            defaultValue="#1e293b"
            onChange={e => editor.chain().focus().setColor(e.target.value).run()}
            style={{ width: 0, height: 0, border: 'none', padding: 0, opacity: 0 }}
          />
        </label>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />

        {/* Align */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="靠左">≡</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="置中">≡</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="靠右">≡</ToolBtn>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="無序清單">• ≡</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="有序清單">1.</ToolBtn>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />

        {/* Link */}
        <ToolBtn onClick={setLink} active={editor.isActive('link')} title="插入連結">🔗</ToolBtn>

        {/* Divider */}
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="分隔線">—</ToolBtn>

        <div style={{ flex: 1 }} />

        {/* Template presets */}
        <select
          onChange={e => { if (e.target.value) applyBuiltinTemplate(e.target.value); e.target.value = ''; }}
          defaultValue=""
          style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', cursor: 'pointer' }}
        >
          <option value="" disabled>{t('marketing.editor.select_template')}</option>
          <option value="minimal">{t('marketing.editor.template_minimal')}</option>
          <option value="newsletter">{t('marketing.editor.template_newsletter')}</option>
        </select>

        {/* Mode toggle */}
        <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', marginLeft: '4px' }}>
          <button
            type="button"
            onClick={() => viewMode === 'html' ? switchToRich() : undefined}
            title={t('marketing.editor.rich_mode')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: '600',
              border: 'none',
              cursor: viewMode === 'html' ? 'pointer' : 'default',
              background: viewMode === 'rich' ? 'var(--primary)' : 'var(--bg-hover)',
              color: viewMode === 'rich' ? 'white' : 'var(--text-muted)',
              transition: 'background 0.15s',
            }}
          >
            {t('marketing.editor.rich_mode')}
          </button>
          <button
            type="button"
            onClick={() => viewMode === 'rich' ? switchToHtml() : undefined}
            title={t('marketing.editor.html_mode')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: '600',
              border: 'none',
              borderLeft: '1px solid var(--border-color)',
              cursor: viewMode === 'rich' ? 'pointer' : 'default',
              background: viewMode === 'html' ? 'var(--primary)' : 'var(--bg-hover)',
              color: viewMode === 'html' ? 'white' : 'var(--text-muted)',
              transition: 'background 0.15s',
            }}
          >
            {t('marketing.editor.html_mode')}
          </button>
        </div>
      </div>

      {/* ── Variable insert bar ── */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-muted)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('marketing.editor.insert_var')}</span>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); insertVariable('contactName'); }}
          className="btn-ghost"
          style={{ padding: '3px 10px', fontSize: '0.75rem' }}
        >
          👤 {t('marketing.editor.var_contact')}
        </button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); insertVariable('companyName'); }}
          className="btn-ghost"
          style={{ padding: '3px 10px', fontSize: '0.75rem' }}
        >
          🏢 {t('marketing.editor.var_company')}
        </button>
      </div>

      {/* ── Editor canvas ── */}
      {viewMode === 'rich' ? (
        <EditorContent editor={editor} />
      ) : (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%',
            minHeight: '380px',
            padding: '20px',
            fontFamily: "'Fira Code', 'Courier New', monospace",
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#1e293b',
            background: '#f8fafc',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      )}

      {/* Global styles for the editor content area */}
      <style>{`
        .tiptap { outline: none; }
        .tiptap p { margin: 0 0 8px 0; }
        .tiptap h1 { font-size: 1.6rem; font-weight: 800; margin: 0 0 12px 0; }
        .tiptap h2 { font-size: 1.3rem; font-weight: 700; margin: 0 0 10px 0; }
        .tiptap h3 { font-size: 1.1rem; font-weight: 600; margin: 0 0 8px 0; }
        .tiptap ul, .tiptap ol { padding-left: 20px; margin: 0 0 8px 0; }
        .tiptap a { color: #2563eb; text-decoration: underline; }
        .tiptap hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
        .tiptap strong { font-weight: 700; }
        .tiptap em { font-style: italic; }
        .tiptap u { text-decoration: underline; }
        .tiptap s { text-decoration: line-through; }
        .tiptap img { max-width: 100%; border-radius: 8px; }
      `}</style>
    </div>
  );
}
