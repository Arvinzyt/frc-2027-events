import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { FrcEvent, TeamEntry } from '@/types/data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Users,
} from 'lucide-react'

type EpaKey = 'max' | 'top8_avg' | 'top24_avg' | 'mean' | 'median'

type SortKey = 'week' | 'name' | 'capacity' | 'registered' | 'with_epa' | EpaKey

const EPA_COLS: { key: EpaKey; label: string }[] = [
  { key: 'max', label: '最高' },
  { key: 'top8_avg', label: '前8均值' },
  { key: 'top24_avg', label: '前24均值' },
  { key: 'mean', label: '全体均值' },
  { key: 'median', label: '中位数' },
]

const COL_COUNT = 7 + EPA_COLS.length // 展开 chevron + Week/赛区/地点/日期/容量/报名/有EPA + 5 EPA 列

function sortVal(e: FrcEvent, key: SortKey): number | string {
  switch (key) {
    case 'week':
      return e.week ?? 99
    case 'name':
      return e.name
    case 'capacity':
      return e.capacity ?? -1
    case 'registered':
      return e.registered ?? -1
    case 'with_epa':
      return e.epa ? e.epa.with_epa : -1
    default:
      return e.epa ? e.epa[key as EpaKey] : -1
  }
}

function StatusBadge({ e }: { e: FrcEvent }) {
  if (e.status === 'new_2027')
    return (
      <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10">
        新增
      </Badge>
    )
  if (e.status === 'week_changed')
    return (
      <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/10">
        W{e.week_2026}→W{e.week}
      </Badge>
    )
  if (e.status === 'unchanged_venue_moved')
    return (
      <Badge variant="outline" className="border-zinc-600 text-zinc-400">
        换馆
      </Badge>
    )
  return null
}

function TeamList({ teams }: { teams: TeamEntry[] }) {
  const sorted = useMemo(
    () =>
      [...teams].sort((a, b) => {
        if (a.epa == null && b.epa == null) return a.team - b.team
        if (a.epa == null) return 1
        if (b.epa == null) return -1
        return b.epa - a.epa
      }),
    [teams],
  )

  if (sorted.length === 0) {
    return <div className="px-4 py-3 text-sm text-zinc-500">暂无报名队伍</div>
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 bg-zinc-900/80 hover:bg-zinc-900/80">
            <TableHead className="w-12 text-right text-zinc-400">#</TableHead>
            <TableHead className="w-24 text-zinc-400">队号</TableHead>
            <TableHead className="text-zinc-400">队名</TableHead>
            <TableHead className="w-28 text-right text-zinc-400">2026 EPA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((t, i) => (
            <TableRow key={t.team} className="border-zinc-800/60 hover:bg-zinc-900/60">
              <TableCell className="text-right font-mono text-xs tabular-nums text-zinc-500">
                {t.epa != null ? i + 1 : '—'}
              </TableCell>
              <TableCell className="font-mono font-semibold text-sky-300">{t.team}</TableCell>
              <TableCell className="text-sm text-zinc-300">
                {t.name}
                {t.epa == null && (
                  <Badge
                    variant="outline"
                    className="ml-2 border-zinc-600 text-[10px] text-zinc-400"
                  >
                    新队伍
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums text-zinc-200">
                {t.epa != null ? t.epa.toFixed(2) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default function EventsTable({ events }: { events: FrcEvent[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('week')
  const [sortAsc, setSortAsc] = useState(true)
  const [weekFilter, setWeekFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const weeks = useMemo(
    () => [...new Set(events.map((e) => e.week).filter((w): w is number => w != null))].sort(),
    [events],
  )

  // 每列最大值，用于 EPA 列常态热度底色
  const colMax = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of EPA_COLS) {
      m[c.key] = Math.max(0, ...events.map((e) => (e.epa ? (e.epa[c.key] as number) : 0)))
    }
    return m
  }, [events])

  const filtered = useMemo(
    () =>
      weekFilter === 'all' ? events : events.filter((e) => e.week === Number(weekFilter)),
    [events, weekFilter],
  )

  // 各可排序数值列在当前筛选范围内的 min/max，用于「排序列由深到浅」渐变底色
  const colRange = useMemo(() => {
    const keys: SortKey[] = ['week', 'capacity', 'registered', 'with_epa', ...EPA_COLS.map((c) => c.key)]
    const m: Record<string, { min: number; max: number }> = {}
    for (const k of keys) {
      const vals = filtered
        .map((e) => sortVal(e, k))
        .filter((v): v is number => typeof v === 'number' && v >= 0)
      m[k] = vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : { min: 0, max: 0 }
    }
    return m
  }, [filtered])

  // 排序列渐变底色：值越大越深（0.06 → 0.34 alpha）；非排序列返回 undefined
  function sortHeatStyle(key: SortKey, v: number): CSSProperties | undefined {
    if (key !== sortKey || v < 0) return undefined
    const { min, max } = colRange[key] ?? { min: 0, max: 0 }
    const t = max > min ? (v - min) / (max - min) : 0.5
    return { backgroundColor: `rgba(56, 189, 248, ${(0.06 + t * 0.28).toFixed(3)})` }
  }

  const rows = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = sortVal(a, sortKey)
      const vb = sortVal(b, sortKey)
      const cmp =
        typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number)
      const r = sortAsc ? cmp : -cmp
      // 次级排序：week -> code，保证稳定
      return r !== 0 ? r : (a.week ?? 99) - (b.week ?? 99) || a.code.localeCompare(b.code)
    })
  }, [filtered, sortKey, sortAsc])

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(key === 'week' || key === 'name')
    }
  }

  function toggleExpand(code: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <ChevronsUpDown className="ml-1 inline h-3 w-3 text-zinc-600" />
    return sortAsc ? (
      <ArrowUp className="ml-1 inline h-3 w-3 text-sky-400" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3 text-sky-400" />
    )
  }

  // 排序列表头底色提示
  function headCls(col: SortKey, base: string): string {
    return `${base} ${col === sortKey ? 'bg-sky-500/15 text-sky-300' : ''}`
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-100">
          2027 全部赛区 · 第一轮报名
          <span className="ml-2 font-mono text-sm font-normal text-zinc-500">
            {rows.length} / {events.length}
          </span>
        </h2>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span>Week 筛选</span>
          <Select value={weekFilter} onValueChange={setWeekFilter}>
            <SelectTrigger className="h-8 w-28 border-zinc-700 bg-zinc-900 text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-200">
              <SelectItem value="all">全部</SelectItem>
              {weeks.map((w) => (
                <SelectItem key={w} value={String(w)}>
                  Week {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 bg-zinc-900 hover:bg-zinc-900">
              <TableHead className="w-8" />
              <TableHead
                className={headCls('week', 'cursor-pointer text-zinc-300')}
                onClick={() => toggleSort('week')}
              >
                Week
                <SortIcon col="week" />
              </TableHead>
              <TableHead
                className={headCls('name', 'min-w-56 cursor-pointer text-zinc-300')}
                onClick={() => toggleSort('name')}
              >
                赛区
                <SortIcon col="name" />
              </TableHead>
              <TableHead className="min-w-44 text-zinc-300">地点</TableHead>
              <TableHead className="text-zinc-300">日期</TableHead>
              <TableHead
                className={headCls('capacity', 'cursor-pointer text-right text-zinc-300')}
                onClick={() => toggleSort('capacity')}
              >
                容量
                <SortIcon col="capacity" />
              </TableHead>
              <TableHead
                className={headCls('registered', 'cursor-pointer text-right text-zinc-300')}
                onClick={() => toggleSort('registered')}
              >
                报名
                <SortIcon col="registered" />
              </TableHead>
              <TableHead
                className={headCls('with_epa', 'cursor-pointer text-right text-zinc-300')}
                onClick={() => toggleSort('with_epa')}
              >
                有EPA
                <SortIcon col="with_epa" />
              </TableHead>
              {EPA_COLS.map((c) => (
                <TableHead
                  key={c.key}
                  className={headCls(c.key, 'cursor-pointer text-right text-zinc-300')}
                  onClick={() => toggleSort(c.key)}
                >
                  {c.label}
                  <SortIcon col={c.key} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => {
              const hasEpa = e.data_status === 'registered' && e.epa != null
              const isOpen = expanded.has(e.code)
              return [
                <TableRow
                  key={e.code}
                  className={`cursor-pointer border-zinc-800/70 hover:bg-zinc-900/70 ${
                    isOpen ? 'bg-zinc-900/50' : ''
                  }`}
                  onClick={() => toggleExpand(e.code)}
                >
                  <TableCell className="w-8 pr-0">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-sky-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-600" />
                    )}
                  </TableCell>
                  <TableCell
                    className="font-mono font-semibold text-zinc-200"
                    style={sortHeatStyle('week', e.week ?? -1)}
                  >
                    W{e.week ?? '?'}
                  </TableCell>
                  <TableCell
                    style={
                      sortKey === 'name'
                        ? { backgroundColor: 'rgba(56, 189, 248, 0.08)' }
                        : undefined
                    }
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-zinc-100">{e.name}</span>
                      <StatusBadge e={e} />
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-zinc-500">{e.code}</div>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400">{e.location}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-zinc-400">
                    {e.date_range.replace(' to ', ' – ')}
                  </TableCell>
                  <TableCell
                    className="text-right font-mono tabular-nums text-zinc-300"
                    style={sortHeatStyle('capacity', e.capacity ?? -1)}
                  >
                    {e.capacity ?? '—'}
                  </TableCell>
                  <TableCell
                    className="text-right font-mono tabular-nums text-zinc-200"
                    style={sortHeatStyle('registered', e.registered ?? -1)}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3 text-zinc-500" />
                      {e.registered ?? '—'}
                    </span>
                  </TableCell>
                  {hasEpa ? (
                    <>
                      <TableCell
                        className="text-right font-mono tabular-nums text-zinc-200"
                        style={sortHeatStyle('with_epa', e.epa!.with_epa)}
                      >
                        {e.epa!.with_epa}
                        {e.epa!.with_epa < e.epa!.registered && (
                          <span className="ml-1 text-[10px] text-zinc-500">
                            /{e.epa!.registered}
                          </span>
                        )}
                      </TableCell>
                      {EPA_COLS.map((c) => {
                        const v = e.epa![c.key] as number
                        const sortedStyle = sortHeatStyle(c.key, v)
                        const heat = colMax[c.key] > 0 ? v / colMax[c.key] : 0
                        return (
                          <TableCell
                            key={c.key}
                            className="text-right font-mono tabular-nums text-zinc-200"
                            style={
                              sortedStyle ?? {
                                backgroundColor: `rgba(56, 189, 248, ${(heat * heat * 0.16).toFixed(3)})`,
                              }
                            }
                          >
                            {v.toFixed(2)}
                          </TableCell>
                        )
                      })}
                    </>
                  ) : (
                    <TableCell colSpan={6} className="text-center text-sm text-zinc-500">
                      暂无 EPA 数据
                    </TableCell>
                  )}
                </TableRow>,
                isOpen ? (
                  <TableRow key={`${e.code}-teams`} className="border-zinc-800/70 hover:bg-transparent">
                    <TableCell colSpan={COL_COUNT} className="bg-zinc-950/60 p-0">
                      <div className="border-l-2 border-sky-500/40">
                        <div className="flex items-center justify-between px-4 py-2 text-xs text-zinc-500">
                          <span>
                            已报名队伍 · 按 2026 赛季 EPA 降序
                            {e.epa
                              ? `（${e.epa.with_epa} 队有记录，${e.epa.registered - e.epa.with_epa} 支新队伍无 2026 记录）`
                              : ''}
                          </span>
                          <span className="font-mono">{e.teams?.length ?? 0} 队</span>
                        </div>
                        <TeamList teams={e.teams ?? []} />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null,
              ]
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-zinc-500">
        EPA 列为该赛区已报名队伍的 2026 赛季 EPA 统计（Statbotics
        epa.total_points，赛季末值）；新队伍（无 2026 记录）不计入五列统计，不足 24
        队的赛区「前24均值」按全体均值计。点击行展开查看完整报名名单，点击表头可按该列排序。
      </p>
    </div>
  )
}
