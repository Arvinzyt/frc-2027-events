import { useMemo, useState } from 'react'
import type { FrcEvent } from '@/types/data'
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
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

type EpaKey = 'max' | 'top8_avg' | 'top24_avg' | 'mean' | 'median'

type SortKey = 'week' | 'name' | 'capacity' | EpaKey

const EPA_COLS: { key: EpaKey; label: string }[] = [
  { key: 'max', label: '最高' },
  { key: 'top8_avg', label: '前8均值' },
  { key: 'top24_avg', label: '前24均值' },
  { key: 'mean', label: '全体均值' },
  { key: 'median', label: '中位数' },
]

function sortVal(e: FrcEvent, key: SortKey): number | string {
  switch (key) {
    case 'week':
      return e.week ?? 99
    case 'name':
      return e.name
    case 'capacity':
      return e.capacity ?? -1
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

export default function EventsTable({ events }: { events: FrcEvent[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('week')
  const [sortAsc, setSortAsc] = useState(true)
  const [weekFilter, setWeekFilter] = useState<string>('all')

  const weeks = useMemo(
    () => [...new Set(events.map((e) => e.week).filter((w): w is number => w != null))].sort(),
    [events],
  )

  // 每列最大值，用于热度底色
  const colMax = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of EPA_COLS) {
      m[c.key] = Math.max(0, ...events.map((e) => (e.epa ? (e.epa[c.key] as number) : 0)))
    }
    return m
  }, [events])

  const rows = useMemo(() => {
    const filtered =
      weekFilter === 'all' ? events : events.filter((e) => e.week === Number(weekFilter))
    return [...filtered].sort((a, b) => {
      const va = sortVal(a, sortKey)
      const vb = sortVal(b, sortKey)
      const cmp =
        typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number)
      const r = sortAsc ? cmp : -cmp
      // 次级排序：week -> code，保证稳定
      return r !== 0 ? r : (a.week ?? 99) - (b.week ?? 99) || a.code.localeCompare(b.code)
    })
  }, [events, sortKey, sortAsc, weekFilter])

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(key === 'week' || key === 'name')
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <ChevronsUpDown className="ml-1 inline h-3 w-3 text-zinc-600" />
    return sortAsc ? (
      <ArrowUp className="ml-1 inline h-3 w-3 text-sky-400" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3 text-sky-400" />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-100">
          2027 全部赛区
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
              <TableHead
                className="cursor-pointer text-zinc-300"
                onClick={() => toggleSort('week')}
              >
                Week
                <SortIcon col="week" />
              </TableHead>
              <TableHead
                className="min-w-56 cursor-pointer text-zinc-300"
                onClick={() => toggleSort('name')}
              >
                赛区
                <SortIcon col="name" />
              </TableHead>
              <TableHead className="min-w-44 text-zinc-300">地点</TableHead>
              <TableHead className="text-zinc-300">日期</TableHead>
              <TableHead
                className="cursor-pointer text-right text-zinc-300"
                onClick={() => toggleSort('capacity')}
              >
                容量
                <SortIcon col="capacity" />
              </TableHead>
              {EPA_COLS.map((c) => (
                <TableHead
                  key={c.key}
                  className="cursor-pointer text-right text-zinc-300"
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
              const isProxy = e.data_status === 'proxy'
              const noData = e.data_status === 'no_data'
              return (
                <TableRow
                  key={e.code}
                  className={`border-zinc-800/70 ${
                    isProxy ? 'bg-amber-500/[0.06] hover:bg-amber-500/[0.1]' : 'hover:bg-zinc-900/70'
                  }`}
                >
                  <TableCell className="font-mono font-semibold text-zinc-200">
                    W{e.week ?? '?'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-zinc-100">{e.name}</span>
                      <StatusBadge e={e} />
                      {isProxy && (
                        <Badge className="border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">
                          代理数据
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                      {e.code}
                      {isProxy && e.epa_source ? ` · 参考：${e.epa_source}` : ''}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400">{e.location}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-zinc-400">
                    {e.date_range.replace(' to ', ' – ')}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-zinc-300">
                    {e.capacity ?? '—'}
                  </TableCell>
                  {noData ? (
                    <TableCell colSpan={5} className="text-center text-sm text-zinc-500">
                      暂无数据（2026 无对应赛事）
                    </TableCell>
                  ) : (
                    e.epa &&
                    EPA_COLS.map((c) => {
                      const v = e.epa![c.key] as number
                      const heat = colMax[c.key] > 0 ? v / colMax[c.key] : 0
                      return (
                        <TableCell
                          key={c.key}
                          className="text-right font-mono tabular-nums text-zinc-200"
                          style={{
                            backgroundColor: `rgba(56, 189, 248, ${(heat * heat * 0.16).toFixed(3)})`,
                          }}
                        >
                          {v.toFixed(2)}
                        </TableCell>
                      )
                    })
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-zinc-500">
        EPA 列为 2026 赛季对应赛事统计（Statbotics epa.total_points）；不足 24 队的赛区「前24均值」按全体均值计。
        点击表头可按该列排序。
      </p>
    </div>
  )
}
