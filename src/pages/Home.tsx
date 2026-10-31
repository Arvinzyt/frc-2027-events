import { useData } from '@/hooks/useData'
import Overview from '@/sections/Overview'
import EventsTable from '@/sections/EventsTable'
import { Discontinued, WeekChanges } from '@/sections/WeekChanges'
import { useLang } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'

export default function Home() {
  const { data, error } = useData()
  const { t, toggleLang } = useLang()

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-metallic text-rose-400">
        {t.loadError(error)}
      </div>
    )
  }
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-metallic text-zinc-500">
        {t.loading}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-metallic text-zinc-200">
      <div className="mx-auto max-w-[1800px] space-y-8 px-6 py-8">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="PowerEvents logo"
              className="h-9 w-9 shrink-0"
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-50">{t.title}</h1>
              <p className="text-sm text-zinc-500">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <a href="#/china-teams" className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20">中国队伍报名 ↗</a>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLang}
            className="shrink-0 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Languages className="h-3.5 w-3.5" />
            {t.langToggle}
          </Button>
          </div>
        </header>

        <Overview meta={data.meta} />
        <EventsTable events={data.events} />
        <WeekChanges changes={data.week_changes} />
        <Discontinued items={data.discontinued} />

        <footer className="border-t border-zinc-800 pt-4 text-xs text-zinc-600">
          {t.footerSource}
          {data.meta.sources.join(' · ')}
        </footer>
      </div>
    </div>
  )
}
