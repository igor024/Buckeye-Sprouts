import { BookOpen, LockKeyhole, Send, Sparkles } from "lucide-react";
import type { SharedNotebook } from "@/types/contracts";

export function NotebookPanel({ notebook, locked = false }: { notebook: SharedNotebook | null; locked?: boolean }) {
  return (
    <section className="panel" aria-labelledby="notebook-title">
      <div className="panel-heading"><BookOpen size={18} /><h2 id="notebook-title">The shared notebook</h2><span className="tag ml-auto">Preview</span></div>
      {locked ? <div className="py-14 text-center"><LockKeyhole size={28} className="mx-auto text-stone-400" /><h3 className="font-semibold mt-4">A space for your group</h3><p className="muted mt-2">Join with host approval to read and write together.</p></div> : <>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5"><p className="text-xs text-stone-500">Markdown · saved fixture</p><button className="button-secondary" disabled><Sparkles size={14} />Catch me up</button></div>
        <label htmlFor="notebook-content" className="sr-only">Shared markdown notebook preview</label>
        <textarea id="notebook-content" className="notebook-editor mt-4" value={notebook?.content || "# Your next study session\n\nA shared space for notes, questions, and little breakthroughs.\n\nOpen a session to preview its notebook."} readOnly rows={11} />
        <div className="rounded-xl bg-amber-50/70 p-4 mt-4"><p className="flex items-center gap-2 text-xs font-semibold text-amber-900"><Sparkles size={14} />A LITTLE HELP, WHEN YOU NEED IT</p><p className="text-sm text-stone-600 leading-6 mt-2">{notebook?.aiSummary || "Catch up on group notes, get a hint, or discover groups exploring the same topic."}</p></div>
        <div className="flex gap-2 mt-4"><input className="input flex-1 min-w-0" aria-label="Ask the AI tutor (coming soon)" placeholder="Ask a question about your notes…" disabled /><button className="button-primary" disabled aria-label="Send question (coming soon)"><Send size={16} /></button></div>
      </>}
      <p className="stub-note">Notebook sync, ambient discovery, and AI controls are scaffold stubs.</p>
    </section>
  );
}
