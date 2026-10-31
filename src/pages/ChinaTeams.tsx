import { useEffect, useMemo, useState } from 'react'
import { useData } from '@/hooks/useData'

interface ChinaTeam { team: number; name: string; organization: string; location: string; epa: number | null; event_codes: string[] }
interface ChinaData { meta: { generated_at: string; event_data_updated_at: string; scope: string; source: string }; teams: ChinaTeam[] }
type Sort = 'team' | 'epa' | 'week' | 'rank'
const fmt = (v: number | null | undefined) => v == null ? '—' : v.toFixed(2)

export default function ChinaTeams() {
  const { data, error } = useData()
  const [china, setChina] = useState<ChinaData | null>(null)
  const [failure, setFailure] = useState('')
  const [query, setQuery] = useState('')
  const [week, setWeek] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<Sort>('team')
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}china-teams.json?t=${Date.now()}`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<ChinaData> })
      .then(setChina).catch(e => { if (e.name !== 'AbortError') setFailure(String(e)) })
    return () => controller.abort()
  }, [])
  const rows = useMemo(() => {
    if (!data || !china) return []
    return china.teams.flatMap(team => {
      const events = data.events.filter(e => team.event_codes.includes(e.code))
      return (events.length ? events : [null]).map(event => {
        const epas = event?.teams.filter(t => t.epa !== null) ?? []
        const rank = event && team.epa !== null ? 1 + epas.filter(t => t.epa! > team.epa!).length : null
        const tied = rank !== null && epas.filter(t => t.epa === team.epa).length > 1
        return { team, event, rank, tied, ranked: epas.length }
      })
    }).filter(({ team, event }) => {
      const q = query.trim().toLowerCase()
      return (!q || `${team.team} ${team.name} ${team.organization} ${team.location} ${event?.name ?? ''} ${event?.code ?? ''}`.toLowerCase().includes(q))
        && (week === 'all' || String(event?.week) === week)
        && (status === 'all' || (status === 'registered' ? !!event : !event))
    }).sort((a, b) => {
      if (sort === 'epa') return (b.team.epa ?? -Infinity) - (a.team.epa ?? -Infinity) || a.team.team - b.team.team
      if (sort === 'rank') return (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.team.team - b.team.team
      if (sort === 'week') return (a.event?.week ?? 99) - (b.event?.week ?? 99) || a.team.team - b.team.team
      return a.team.team - b.team.team || (a.event?.week ?? 99) - (b.event?.week ?? 99)
    })
  }, [data, china, query, week, status, sort])
  const problem = error || failure
  if (problem) return <main className="min-h-screen bg-metallic p-8 text-rose-300"><p>数据加载失败：{problem}</p><button onClick={() => location.reload()} className="mt-4 underline">重新加载</button><a href="#/" className="ml-6 underline">返回赛区一览</a></main>
  if (!data || !china) return <main className="min-h-screen bg-metallic p-8 text-zinc-300">正在加载中国队伍报名数据…</main>
  const registered = china.teams.filter(t => t.event_codes.length > 0).length
  const entries = china.teams.reduce((n, t) => n + t.event_codes.length, 0)
  const weeks = [...new Set(data.events.map(e => e.week).filter((w): w is number => w !== null))].sort((a,b) => a-b)
  const control = 'rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500'
  return <main className="min-h-screen bg-metallic text-zinc-200">
    <div className="mx-auto max-w-[1800px] space-y-6 px-4 py-8 md:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="mb-2 text-xs font-semibold tracking-[0.2em] text-emerald-400">POWEREVENTS / CHINA TEAMS</p><h1 className="text-3xl font-bold text-zinc-50">中国队伍 · 2027 报名情况</h1><p className="mt-3 text-sm text-zinc-400">从队伍出发，查看报名赛区与去年 EPA 对比。</p></div>
        <a href="#/" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800">← 返回赛区一览</a>
      </header>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="报名概览">
        {[['赛季注册队伍', china.teams.length], ['已报名赛区的队伍', registered], ['报名席位', entries], ['暂无赛区报名', china.teams.length-registered]].map(([label,value]) => <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5"><div className="text-xs text-zinc-400">{label}</div><div className="mt-2 text-3xl font-semibold tabular-nums text-zinc-50">{value}</div></div>)}
      </section>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-xs leading-6 text-zinc-400">
        <p>名单范围：{china.meta.scope}。包含尚未报名赛区的已注册队伍；学校或机构名称沿用 FIRST 官方记录。</p>
        <p>队伍信息更新于 {china.meta.generated_at}；赛区报名更新于 {data.meta.generated_at}（北京时间）。报名信息以这两个更新时间为准。</p>
        <p>EPA 沿用 2026 赛季 Statbotics 记录。赛区统计和排名覆盖该赛区全部报名队伍；同分并列（1、1、3），无 EPA 的队伍不参与统计或排名。每个报名赛区单独显示一行。</p>
        {china.meta.event_data_updated_at !== data.meta.generated_at && <p className="text-amber-300">队伍名单与赛区数据更新时间不同，请刷新页面获取一致版本。</p>}
      </div>
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/40">
        <div className="flex flex-wrap gap-3 border-b border-zinc-800 p-4">
          <input aria-label="搜索队伍、学校或赛区" value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索队号、队名、学校或赛区…" className={`${control} min-w-60 flex-1`} />
          <select aria-label="筛选比赛周数" value={week} onChange={e=>setWeek(e.target.value)} className={control}><option value="all">全部周数</option>{weeks.map(w=><option key={w} value={w}>Week {w}</option>)}</select>
          <select aria-label="筛选报名状态" value={status} onChange={e=>setStatus(e.target.value)} className={control}><option value="all">全部队伍</option><option value="registered">已报名赛区</option><option value="none">暂无赛区报名</option></select>
          <select aria-label="排序方式" value={sort} onChange={e=>setSort(e.target.value as Sort)} className={control}><option value="team">队号升序</option><option value="epa">队伍 EPA 降序</option><option value="week">比赛周数升序</option><option value="rank">赛区排名升序</option></select>
        </div>
        <p className="px-4 py-3 text-xs text-zinc-500">显示 {new Set(rows.map(r=>r.team.team)).size} 支队伍 · {rows.length} 行 · 可横向滚动查看完整统计</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[1400px] text-left text-sm"><thead className="bg-zinc-900 text-xs text-zinc-400"><tr>{['队号 / 队名','学校或机构','报名赛区','周数','队伍 2026 EPA','赛区 EPA 排名','报名 / 有 EPA','赛区平均 EPA','赛区最高 EPA','前 8 均值','前 24 均值','中位数'].map(h=><th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{rows.map(({team,event,rank,tied,ranked})=><tr key={`${team.team}-${event?.code ?? 'none'}`} className="border-t border-zinc-800/70 align-top hover:bg-zinc-800/30">
            <td className="min-w-44 px-4 py-4"><a className="font-semibold text-emerald-300 hover:underline" href={`https://frc-events.firstinspires.org/2027/team/${team.team}`} target="_blank" rel="noreferrer">{team.team} ↗</a><p className="mt-1 text-zinc-200">{team.name}</p><p className="mt-1 text-xs text-zinc-500">{team.location}</p></td>
            <td className="min-w-56 max-w-72 px-4 py-4 leading-6 text-zinc-400">{team.organization || '官方暂未提供'}</td>
            <td className="min-w-48 px-4 py-4">{event ? <a href={`https://frc-events.firstinspires.org/2027/${event.code}`} target="_blank" rel="noreferrer" className="hover:text-emerald-300"><span className="block">{event.name}</span><span className="mt-1 block text-xs text-zinc-500">{event.code}</span></a> : <span className="text-amber-300">暂无赛区报名</span>}</td>
            <td className="px-4 py-4 tabular-nums">{event?.week ?? '—'}</td><td className="px-4 py-4 font-semibold tabular-nums">{team.epa === null ? <span className="text-xs font-normal text-zinc-500">暂无 2026 EPA</span> : fmt(team.epa)}</td>
            <td className="whitespace-nowrap px-4 py-4 tabular-nums">{rank === null ? '—' : <span className={rank<=8 ? 'text-emerald-300' : ''}>{tied ? '并列 ' : ''}{rank} / {ranked}</span>}</td>
            <td className="px-4 py-4 tabular-nums">{event ? `${event.registered} / ${event.epa?.with_epa ?? 0}` : '—'}</td>
            {(['mean','max','top8_avg','top24_avg','median'] as const).map(k=><td key={k} className="px-4 py-4 tabular-nums text-zinc-300">{fmt(event?.epa?.[k])}</td>)}
          </tr>)}</tbody></table></div>
        {!rows.length && <div className="p-12 text-center text-zinc-400">没有符合筛选条件的队伍。<button className="ml-2 text-emerald-300 underline" onClick={()=>{setQuery('');setWeek('all');setStatus('all')}}>清除筛选</button></div>}
      </section>
      <footer className="text-xs text-zinc-500">来源：<a className="underline" href={china.meta.source} target="_blank" rel="noreferrer">FIRST 2027 官方队伍目录</a>、各队伍及赛事详情、Statbotics 2026 赛季 EPA。</footer>
    </div>
  </main>
}
