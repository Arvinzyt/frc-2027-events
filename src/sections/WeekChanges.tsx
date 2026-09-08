import type { DiscontinuedEvent, WeekChange } from '@/types/data'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export function WeekChanges({ changes }: { changes: WeekChange[] }) {
  if (changes.length === 0) return null
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-100">
        Week 变化（2026 → 2027）
        <span className="ml-2 font-mono text-sm font-normal text-zinc-500">{changes.length}</span>
      </h2>
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 bg-zinc-900 hover:bg-zinc-900">
              <TableHead className="text-zinc-300">赛区</TableHead>
              <TableHead className="text-zinc-300">地点</TableHead>
              <TableHead className="text-right text-zinc-300">2026</TableHead>
              <TableHead className="w-10" />
              <TableHead className="text-right text-zinc-300">2027</TableHead>
              <TableHead className="text-right text-zinc-300">变化</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {changes.map((c) => (
              <TableRow key={c.code} className="border-zinc-800/70 hover:bg-zinc-900/70">
                <TableCell>
                  <span className="font-medium text-zinc-100">{c.name}</span>
                  <span className="ml-2 font-mono text-[11px] text-zinc-500">{c.code}</span>
                </TableCell>
                <TableCell className="text-sm text-zinc-400">{c.location}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-zinc-300">
                  W{c.week_2026}
                </TableCell>
                <TableCell className="text-center">
                  <ArrowRight className="inline h-3.5 w-3.5 text-zinc-600" />
                </TableCell>
                <TableCell className="text-right font-mono font-semibold tabular-nums text-zinc-100">
                  W{c.week_2027}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    className={
                      c.change < 0
                        ? 'border-sky-500/40 bg-sky-500/10 font-mono text-sky-400 hover:bg-sky-500/10'
                        : 'border-amber-500/40 bg-amber-500/10 font-mono text-amber-400 hover:bg-amber-500/10'
                    }
                  >
                    {c.change > 0 ? `+${c.change}` : c.change} 周
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function Discontinued({ items }: { items: DiscontinuedEvent[] }) {
  const [open, setOpen] = useState(false)
  if (items.length === 0) return null
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-left hover:bg-zinc-900/70">
        <span className="text-sm font-medium text-zinc-300">
          2026 已办、2027 暂未发布的赛区
          <span className="ml-2 font-mono text-xs text-zinc-500">{items.length}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 overflow-x-auto rounded-lg border border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 bg-zinc-900 hover:bg-zinc-900">
                <TableHead className="text-zinc-300">2026 Week</TableHead>
                <TableHead className="text-zinc-300">赛区</TableHead>
                <TableHead className="text-zinc-300">地点</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((d) => (
                <TableRow key={d.code} className="border-zinc-800/70 hover:bg-zinc-900/70">
                  <TableCell className="font-mono text-zinc-400">
                    {d.week_2026 ? `W${d.week_2026}` : '—'}
                  </TableCell>
                  <TableCell>
                    <span className="text-zinc-300">{d.name}</span>
                    <span className="ml-2 font-mono text-[11px] text-zinc-500">{d.code}</span>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400">{d.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
