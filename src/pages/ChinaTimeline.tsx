import type { FrcEvent } from '@/types/data'

export default function ChinaTimeline({ groups, onSelect }: { groups: { event: FrcEvent; teams: { team: number; name: string }[] }[]; onSelect: (event: FrcEvent) => void }) {
  return <section aria-label="W1–W7 中国队伍赛区时间轴" className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-5">
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-lg font-semibold text-zinc-50">赛季行程 · W1–W7</h2><p className="text-xs text-zinc-400">随上方筛选联动 · 同赛区队伍合并展示 · 点击赛区查看全部队伍</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
      {Array.from({length: 7}, (_, i) => i + 1).map(w => {
        const events = groups.filter(g => g.event.week === w)
        return <div key={w} data-week={w} className="min-w-0 border-t-2 border-emerald-500/50 pt-3">
          <div className="mb-4 flex items-center justify-between"><span className="font-semibold text-emerald-300">W{w}</span><span className="text-xs text-zinc-500">{events.length} 个赛区</span></div>
          <div className="space-y-3">{events.map(({event,teams}) => <article key={event.code} data-event={event.code} className="rounded-lg border border-zinc-700 bg-zinc-950/60 p-3">
            <button onClick={() => onSelect(event)} className="text-left text-sm font-medium leading-5 text-zinc-100 hover:text-emerald-300">{event.name}</button>
            <p className="mt-2 text-xs text-zinc-500">{event.code} · {event.date_range}</p><p className="mt-1 text-xs text-zinc-400">{event.location}</p>
            <p className="mt-3 text-xs text-emerald-300">{teams.length} 支中国队伍</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{teams.map(t => <a key={t.team} title={`${t.team} ${t.name}`} href={`https://frc-events.firstinspires.org/2027/team/${t.team}`} target="_blank" rel="noreferrer" className="rounded border border-emerald-800 bg-emerald-950/60 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-900">{t.team}</a>)}</div>
          </article>)}{!events.length && <p className="py-4 text-xs text-zinc-500">当前筛选无参赛赛区</p>}</div>
        </div>
      })}
    </div>
  </section>
}

