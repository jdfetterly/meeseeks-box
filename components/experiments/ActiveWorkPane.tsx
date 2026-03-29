'use client';

import { useState, useEffect } from 'react';
import type { ActiveWorkPaneModel } from '@/lib/experiments/project-shell';

export function ActiveWorkPane({
  activeWork,
}: {
  activeWork: ActiveWorkPaneModel | null;
}) {
  const [title, setTitle] = useState(activeWork?.workItem.title ?? '');
  const [description, setDescription] = useState(activeWork?.spec?.intent ?? '');
  const [isExecuting, setIsExecuting] = useState(false);

  // Reset state when the activeWork prop changes (i.e. click a different card)
  useEffect(() => {
    setTitle(activeWork?.workItem.title ?? '');
    setDescription(activeWork?.spec?.intent ?? '');
    setIsExecuting(false);
  }, [activeWork?.workItem.id]);

  if (!activeWork) {
    return null;
  }

  return (
    <section className="flex flex-col gap-6 h-full relative">
      {/* Dynamic Header & Editor Section */}
      <div className={`flex flex-col gap-4 flex-none transition-all duration-300 ease-in-out ${isExecuting ? 'h-auto pb-4 border-b border-[var(--separator)]' : 'flex-1'}`}>
         {/* Eyebrow */}
         <div className="flex gap-2 text-[0.7rem] text-[var(--text-tertiary)] uppercase tracking-[0.08em] font-bold cursor-default select-none">
           <span>{activeWork.workItem.scope}</span>
           <span>•</span>
           <span>{activeWork.workItem.status}</span>
           <span>•</span>
           <span className={`${activeWork.workItem.priority === 'high' ? 'text-[var(--system-orange)]' : ''}`}>
             {activeWork.workItem.priority ?? 'default'} priority
           </span>
         </div>

         {/* Inline Editable Title */}
         <textarea
           value={title}
           onChange={(e) => setTitle(e.target.value)}
           className={`w-full bg-transparent font-bold leading-tight outline-none resize-none px-2 py-1 -mx-2 rounded-lg border border-transparent focus:border-[var(--separator)] focus:bg-[var(--material-ultra-thin)] transition-all ${isExecuting ? 'text-[1.3rem] md:text-[1.6rem]' : 'text-[1.65rem] md:text-[2.2rem]'} text-[var(--text-primary)]`}
           rows={Math.max(1, Math.ceil(title.length / 50))}
         />

         {/* Inline Editable Description */}
         <textarea
           value={description}
           onChange={(e) => setDescription(e.target.value)}
           placeholder="Add context or a spec (optional)..."
           className={`w-full bg-transparent text-[0.95rem] md:text-[1rem] text-[var(--text-secondary)] leading-relaxed outline-none resize-none px-3 py-2 -mx-3 rounded-lg border border-transparent focus:border-[var(--separator)] focus:bg-[var(--material-ultra-thin)] transition-all ${isExecuting ? 'min-h-[60px] max-h-[120px]' : 'min-h-[100px] flex-1 mt-2'} ${!description && !isExecuting ? 'opacity-50 hover:opacity-100 focus:opacity-100' : ''}`}
         />

         {activeWork.spec?.title || activeWork.spec?.outcome ? (
           <div className="grid gap-2 rounded-xl border border-[var(--separator)] bg-[var(--material-ultra-thin)] p-4">
             <span className="text-[0.72rem] uppercase tracking-[0.08em] font-bold text-[var(--text-quaternary)]">Plan context</span>
             {activeWork.spec?.title ? (
               <strong className="text-[var(--text-primary)]">{activeWork.spec.title}</strong>
             ) : null}
             {activeWork.spec?.outcome ? (
               <p className="m-0 text-sm text-[var(--text-secondary)]">{activeWork.spec.outcome}</p>
             ) : null}
           </div>
         ) : null}

         {activeWork.sourceConversationTitle ? (
           <div className="grid gap-1 rounded-xl border border-[var(--separator)] bg-[var(--material-ultra-thin)] p-4">
             <span className="text-[0.72rem] uppercase tracking-[0.08em] font-bold text-[var(--text-quaternary)]">Conversation linkage</span>
             <p className="m-0 text-sm text-[var(--text-secondary)]">{activeWork.sourceConversationTitle}</p>
           </div>
         ) : null}

         {activeWork.openReviewEntry ? (
           <div className="grid gap-2 rounded-xl border border-[color-mix(in_srgb,var(--system-green)_22%,transparent)] bg-[color-mix(in_srgb,var(--system-green)_10%,transparent)] p-4">
             <span className="text-[0.72rem] uppercase tracking-[0.08em] font-bold text-[var(--text-quaternary)]">Review waiting</span>
             <strong className="text-[var(--text-primary)]">{activeWork.openReviewEntry.summary}</strong>
             <p className="m-0 text-sm text-[var(--text-secondary)]">
               Review remains canonical. Use the queue for accept, reject, or request-changes decisions.
             </p>
           </div>
         ) : null}
      </div>

      {/* Conditional Rendering: Execution Terminal OR Action Buttons */}

      {isExecuting ? (
        <div className="flex-1 flex flex-col gap-4 bg-[var(--material-ultra-thin)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] rounded-xl overflow-hidden shadow-[0_8px_32px_0_color-mix(in_srgb,var(--accent)_5%,transparent)] animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border-b border-[color-mix(in_srgb,var(--accent)_15%,transparent)]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
              </span>
              <span className="text-xs font-semibold text-[color-mix(in_srgb,var(--accent)_90%,_white)] tracking-wide uppercase">Agent Active</span>
            </div>
            <button onClick={() => setIsExecuting(false)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              Stop
            </button>
          </div>

          {/* Terminal Feed (Mock) */}
          <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-4 text-sm font-mono text-[var(--text-secondary)]">
             <div className="flex flex-col gap-1">
               <span className="text-[var(--text-tertiary)]">14:02:11 — System Initialize</span>
               <span className="text-[color-mix(in_srgb,var(--accent)_80%,_white)]">$ Loading context for: {title}</span>
               <span>{">"} Analyzing spec requirements...</span>
             </div>
             
             <div className="flex flex-col gap-1">
               <span className="text-[var(--text-tertiary)]">14:02:12 — Workspace Check</span>
               <span>{">"} Verifying project bindings in current environment...</span>
               <span className="text-green-400">{">"} OK. Local bindings found.</span>
             </div>
             
             <div className="flex flex-col gap-1 animate-pulse">
               <span className="text-[var(--text-primary)]">_ Waiting for input or planning next step...</span>
             </div>
          </div>

          {/* Terminal Input */}
          <div className="p-3 border-t border-[color-mix(in_srgb,var(--accent)_15%,transparent)] bg-[color-mix(in_srgb,var(--bg)_50%,transparent)] backdrop-blur-md relative">
             <input type="text" placeholder="Tell the agent what to do next..." className="w-full h-10 px-4 pr-10 rounded-lg bg-[var(--material-thin)] border border-[var(--separator)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-tertiary)]" />
             <button className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--accent)] hover:text-white transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
             </button>
          </div>

        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-8 shrink-0 mt-auto animate-in fade-in duration-300">
          <button 
             onClick={() => setIsExecuting(true)}
             className="w-full h-12 rounded-[var(--radius-md,8px)] bg-[var(--foreground)] text-[var(--background)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-sm font-semibold shadow-[0_4px_14px_0_color-mix(in_srgb,var(--accent)_20%,transparent)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2z"/><path d="M15 8V4a3 3 0 0 0-6 0v4"/><path d="M7 8h10l1 9H6l1-9z"/></svg>
             Start Agent Work
          </button>
          
          <button className="w-full h-10 rounded-[var(--radius-md,8px)] bg-[var(--material-thin)] border border-[var(--separator)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--material-ultra-thin)] transition-colors flex items-center justify-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
             Open Attached Files
          </button>
          
          <button className="w-full h-10 rounded-[var(--radius-md,8px)] bg-[color-mix(in_srgb,var(--system-green)_10%,transparent)] border border-[color-mix(in_srgb,var(--system-green)_20%,transparent)] text-sm font-medium text-[color-mix(in_srgb,var(--system-green)_90%,_white)] hover:bg-[color-mix(in_srgb,var(--system-green)_15%,transparent)] transition-colors flex items-center justify-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
             Mark Complete
          </button>
        </div>
      )}
    </section>
  );
}
