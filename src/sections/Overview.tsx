import type { DataMeta } from '@/types/data'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, MapPin, Sparkles, ArrowLeftRight, RefreshCw, Users } from 'lucide-react'
import { useLang } from '@/lib/i18n'

export default function Overview({ meta }: { meta: DataMeta }) {
  const { t } = useLang()
  const items = [
    {
      icon: MapPin,
      label: t.cardEvents,
      value: meta.event_count_2027,
      sub: t.cardEventsSub(meta.event_count_2026),
      accent: 'text-sky-400',
    },
    {
      icon: Users,
      label: t.cardRegistered,
      value: meta.total_registered,
      sub: t.cardRegisteredSub,
      accent: 'text-violet-400',
    },
    {
      icon: Sparkles,
      label: t.cardNew,
      value: meta.new_event_count,
      sub: t.cardNewSub,
      accent: 'text-emerald-400',
    },
    {
      icon: ArrowLeftRight,
      label: t.cardWeekChanged,
      value: meta.week_changed_count,
      sub: t.cardWeekChangedSub,
      accent: 'text-amber-400',
    },
    {
      icon: CalendarDays,
      label: t.cardDiscontinued,
      value: meta.discontinued_count,
      sub: t.cardDiscontinuedSub,
      accent: 'text-rose-400',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
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
          {t.updatedAt(meta.generated_at)}
        </span>
        <span>{meta.epa_note}</span>
      </div>
    </div>
  )
}
