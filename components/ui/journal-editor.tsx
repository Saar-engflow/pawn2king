"use client";

import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Typography } from '@tiptap/extension-typography';
import { CharacterCount } from '@tiptap/extension-character-count';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Code,
  Link as LinkIcon,
  CheckSquare,
  Smile,
  Save,
  ChevronLeft,
  Search
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Separator } from './separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";

// Extensive emoji library for the King
const EMOJI_LIBRARY = [
  { category: "Recent", emojis: ["🔥", "👑", "⚔️", "📈", "💪", "🧠", "🎯", "🛡️", "🔱", "🦅", "💎", "🔋"] },
  { category: "Tactical", emojis: ["♟️", "🗡️", "🏹", "🛰️", "🛸", "🦾", "⚡", "💥", "🔥", "☄️", "🌑", "🌓"] },
  { category: "Wealth", emojis: ["💰", "💸", "💳", "🏦", "🏛️", "🏢", "🏰", "💹", "📊", "🏆", "🥇", "🥈"] },
  { category: "Mindset", emojis: ["🧘", "🕯️", "📜", "📚", "📖", "🗝️", "🔑", "🔓", "⚖️", "🧭", "⌛", "⏳"] },
  { category: "Health", emojis: ["🥩", "🥦", "🥛", "🍳", "🏋️", "🏃", "🚶", "🧗", "🛌", "💤", "🧼", "🛀"] },
  { category: "Nature", emojis: ["🦁", "🐺", "🐅", "🐆", "🐎", "🦅", "🦉", "🐲", "🐉", "🐍", "🦍", "🐘"] }
];

interface JournalEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  onBack?: () => void;
  title: string;
  onTitleChange: (title: string) => void;
}

const MenuButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false, 
  children, 
  tooltip 
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  disabled?: boolean; 
  children: React.ReactNode;
  tooltip: string;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            onClick();
          }}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 transition-colors",
            isActive ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200" : "text-slate-600 hover:bg-slate-100"
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs font-medium">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export function JournalEditor({ content, onChange, onSave, onBack, title, onTitleChange }: JournalEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        link: {
          openOnClick: false,
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your legacy, King...',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Typography,
      CharacterCount,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none max-w-none min-h-[500px] px-4 py-8 text-slate-800 leading-relaxed',
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addEmoji = (emoji: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emoji).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transition-all duration-500">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/30 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-4 flex-1">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Journal Title..."
            className="bg-transparent text-xl md:text-2xl font-black text-slate-800 focus:outline-none placeholder:text-slate-300 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center mr-4 px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {editor.storage.characterCount?.characters() ?? 0} Characters
          </div>
          {onSave && (
            <Button onClick={onSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 gap-2 px-6">
              <Save className="w-4 h-4" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-50 bg-white sticky top-[73px] z-10 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-0.5 px-2">
          <MenuButton 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            isActive={editor.isActive('bold')}
            tooltip="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            isActive={editor.isActive('italic')}
            tooltip="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleUnderline().run()} 
            isActive={editor.isActive('underline')}
            tooltip="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </MenuButton>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 bg-slate-100" />

        <div className="flex items-center gap-0.5 px-2">
          <MenuButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
            isActive={editor.isActive('heading', { level: 1 })}
            tooltip="Heading 1"
          >
            <span className="font-bold">H1</span>
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
            isActive={editor.isActive('heading', { level: 2 })}
            tooltip="Heading 2"
          >
            <span className="font-bold">H2</span>
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleBulletList().run()} 
            isActive={editor.isActive('bulletList')}
            tooltip="Bullet List"
          >
            <List className="w-4 h-4" />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleOrderedList().run()} 
            isActive={editor.isActive('orderedList')}
            tooltip="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleTaskList().run()} 
            isActive={editor.isActive('taskList')}
            tooltip="Task List"
          >
            <CheckSquare className="w-4 h-4" />
          </MenuButton>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 bg-slate-100" />

        <div className="flex items-center gap-0.5 px-2">
          <MenuButton 
            onClick={() => editor.chain().focus().toggleBlockquote().run()} 
            isActive={editor.isActive('blockquote')}
            tooltip="Quote"
          >
            <Quote className="w-4 h-4" />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleCode().run()} 
            isActive={editor.isActive('code')}
            tooltip="Inline Code"
          >
            <Code className="w-4 h-4" />
          </MenuButton>
          <MenuButton 
            onClick={setLink} 
            isActive={editor.isActive('link')}
            tooltip="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </MenuButton>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 bg-slate-100" />

        <div className="flex items-center gap-0.5 px-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-100"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 rounded-2xl border-slate-100 shadow-2xl" side="bottom" align="start">
              <div className="p-4 border-b border-slate-50 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search emojis..." 
                  className="h-8 text-xs border-none bg-transparent p-0 focus-visible:ring-0"
                />
              </div>
              <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-4">
                  {EMOJI_LIBRARY.map((group) => (
                    <div key={group.category}>
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">{group.category}</h4>
                      <div className="grid grid-cols-6 gap-1">
                        {group.emojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => addEmoji(emoji)}
                            className="text-xl hover:bg-slate-100 p-1.5 rounded-lg transition-colors text-center"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-0.5 px-2">
          <MenuButton 
            onClick={() => editor.chain().focus().undo().run()} 
            disabled={!editor.can().undo()}
            tooltip="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().redo().run()} 
            disabled={!editor.can().redo()}
            tooltip="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="w-4 h-4" />
          </MenuButton>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar bg-white/50">
        <EditorContent editor={editor} />
      </div>

      {/* Bubble Menu for quick formatting */}
      {editor && (
        <BubbleMenu editor={editor} className="flex bg-slate-900 rounded-lg shadow-xl overflow-hidden p-1 border border-slate-700">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "p-2 text-white hover:bg-slate-800 transition-colors",
              editor.isActive('bold') && "text-indigo-400"
            )}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "p-2 text-white hover:bg-slate-800 transition-colors",
              editor.isActive('italic') && "text-indigo-400"
            )}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              "p-2 text-white hover:bg-slate-800 transition-colors",
              editor.isActive('underline') && "text-indigo-400"
            )}
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
        </BubbleMenu>
      )}

      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #cbd5e1;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          padding-left: 2rem;
          padding-right: 2rem;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #6366f1;
          padding-left: 1rem;
          font-style: italic;
          color: #475569;
          background-color: #f8fafc;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .ProseMirror code {
          background-color: #f1f5f9;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.9em;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        ul[data-type="taskList"] input[type="checkbox"] {
          margin-top: 0.4rem;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
