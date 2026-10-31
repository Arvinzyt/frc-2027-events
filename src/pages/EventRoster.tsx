import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { FrcEvent } from '@/types/data'

export default function EventRoster({ event, chinaIds, onClose }: { event: FrcEvent | null; chinaIds: Set<number>; onClose: () => void }) {
  const teams = [...(event?.teams ?? [])].sort((a,b) => (b.epa ?? -Infinity) - (a.epa ?? -Infinity) || a.team - b.team)
  const valid = teams.filter(t => t.epa !== null)
  return <Dialog open={!!event} onOpenChange={open => { if (!open) onClose() }}><DialogContent className="max-h-[90dvh] overflow-y-auto border-zinc-700 bg-zinc-950 text-zinc-200 sm:max-w-3xl">
    <DialogTitle className="pr-6 leading-6">{event?.name} · 全部报名队伍</DialogTitle>
    <DialogDescription className="text-zinc-400">Week {event?.week ?? '—'} · {event?.location} · 报名 {teams.length} 队 / 有 EPA {valid.length} 队。按 2026 EPA 降序，同分并列；绿色标记为中国队伍。</DialogDescription>
    {event && <a href={`https://frc-events.firstinspires.org/2027/${event.code}`} target="_blank" rel="noreferrer" className="text-sm text-emerald-300 underline">打开 FIRST 官方赛区页面 ↗</a>}
    <div className="overflow-x-auto"><table className="w-full text-left text-sm" aria-label="赛区完整报名名单"><thead className="text-xs text-zinc-400"><tr>{['EPA 排名','队号','队名','2026 EPA'].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>
      {teams.map(t => <tr key={t.team} className="border-t border-zinc-800"><td className="px-3 py-3 tabular-nums">{t.epa === null ? '—' : 1 + valid.filter(x => x.epa! > t.epa!).length}</td><td className="px-3 py-3"><a href={`https://frc-events.firstinspires.org/2027/team/${t.team}`} target="_blank" rel="noreferrer" className="text-emerald-300 hover:underline">{t.team}</a></td><td className="px-3 py-3">{t.name || '暂无队名'} {chinaIds.has(t.team) && <span className="ml-1 inline-block rounded bg-emerald-900/60 px-1.5 py-0.5 text-xs text-emerald-300">中国队伍</span>}</td><td className="px-3 py-3 tabular-nums">{t.epa === null ? '暂无 EPA' : t.epa.toFixed(2)}</td></tr>)}
    </tbody></table>{!teams.length && <p className="p-5 text-zinc-400">暂无报名队伍</p>}</div>
  </DialogContent></Dialog>
}
