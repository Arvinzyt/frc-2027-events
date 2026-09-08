import type { DataMeta } from '@/types/data'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, MapPin, Sparkles, ArrowLeftRight, RefreshCw } from 'lucide-react'

export default function Overview({ meta }: { meta: DataMeta }) {
  const items = [
    {
      icon: MapPin,
      label: '2027 已发布赛区',
      value: meta.event_count_2027,
      sub: `2026 赛季为 ${meta.event_count_2026} 个`,
      accent: 'text-sky-400',
    },
    {
      icon: Sparkles,
      label: '新增赛区',
      value: meta.new_event_count,
      sub: '广州 ×2 · 台北 · AZ Valley · Intermountain West',
      accent: 'text-emerald-400',
    },
    {
      icon: ArrowLeftRight,
      label: 'Week 发生变化',
      value: meta.week_changed_count,
      sub: '对比 2026 同一赛区',
      accent: 'text-amber-400',
    },
    {
      icon: CalendarDays,
      label: '取消或待定（2026）',
      value: meta.discontinued_count,
      sub: '2026 有而 2027 暂未发布',
      accent: 'text-rose-400',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((it) => (
          <Card key={it.label} className="border-zinc-800 bg-zinc-900/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <it.icon className={`h-3.5 w-3.5 ${it.accent}`} />
                {it.label}
              </div>
              <div className={`mt-1 font-mono text-3xl font-semibold tabular-nums ${it.accent}`}>
                {it.value}
              </div>
              <div className="mt-1 truncate text-[11px] text-zinc-500" title={it.sub}>
                {it.sub}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          数据更新于 {meta.generated_at}
        </span>
        <span>{meta.epa_note}</span>
      </div>
    </div>
  )
}
