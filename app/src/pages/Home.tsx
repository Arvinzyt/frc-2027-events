import { useData } from '@/hooks/useData'
import Overview from '@/sections/Overview'
import EventsTable from '@/sections/EventsTable'
import { Discontinued, WeekChanges } from '@/sections/WeekChanges'

export default function Home() {
  const { data, error } = useData()

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-rose-400">
        数据加载失败：{error}
      </div>
    )
  }
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-500">
        正在加载数据…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="mx-auto max-w-[1800px] space-y-8 px-6 py-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            FRC 2027 赛季 · 赛区数据中心
          </h1>
          <p className="text-sm text-zinc-500">
            FIRST Robotics Competition 2027 Regional 赛区一览 · 第一轮报名进度 · 各队 2026 赛季 EPA（Statbotics）
          </p>
        </header>

        <Overview meta={data.meta} />
        <EventsTable events={data.events} />
        <WeekChanges changes={data.week_changes} />
        <Discontinued items={data.discontinued} />

        <footer className="border-t border-zinc-800 pt-4 text-xs text-zinc-600">
          数据来源：{data.meta.sources.join(' · ')}
        </footer>
      </div>
    </div>
  )
}
