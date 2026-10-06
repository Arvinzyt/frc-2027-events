import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'zh' | 'en'

export interface Dict {
  title: string
  subtitle: string
  loading: string
  loadError: (err: string) => string
  footerSource: string
  updatedAt: (d: string) => string
  // Overview cards
  cardEvents: string
  cardEventsSub: (n: number) => string
  cardRegistered: string
  cardRegisteredSub: string
  cardNew: string
  cardNewSub: string
  cardWeekChanged: string
  cardWeekChangedSub: string
  cardDiscontinued: string
  cardDiscontinuedSub: string
  // Events table
  tableTitle: string
  weekFilter: string
  all: string
  thEvent: string
  thLocation: string
  thDates: string
  thCapacity: string
  thRegistered: string
  thWithEpa: string
  epaCols: { max: string; top8_avg: string; top24_avg: string; mean: string; median: string }
  badgeNew: string
  badgeMoved: string
  noEpa: string
  expandedTitle: string
  expandedStat: (withEpa: number, noRecord: number) => string
  teamCount: (n: number) => string
  thTeamNum: string
  thTeamName: string
  newTeam: string
  noTeams: string
  tableFootnote: string
  // Week changes
  wcTitle: string
  wcTh2026: string
  wcTh2027: string
  wcThChange: string
  wcChange: (n: number) => string
  // Discontinued
  discTitle: string
  discThWeek: string
  // Language toggle
  langToggle: string
}

const zh: Dict = {
  title: 'PowerEvents · 2027 BIOCORE',
  subtitle:
    'FIRST Robotics Competition 2027 Regional 赛区一览 · 第一轮报名进度 · 各队 2026 赛季 EPA（Statbotics）',
  loading: '正在加载数据…',
  loadError: (err) => `数据加载失败：${err}`,
  footerSource: '数据来源：',
  updatedAt: (d) => `数据更新于 ${d}`,
  cardEvents: '2027 已发布赛区',
  cardEventsSub: (n) => `2026 赛季为 ${n} 个`,
  cardRegistered: '第一轮已报名队伍',
  cardRegisteredSub: '全部赛区合计报名队次',
  cardNew: '新增赛区',
  cardNewSub: '2027 首次举办',
  cardWeekChanged: 'Week 发生变化',
  cardWeekChangedSub: '对比 2026 同一赛区',
  cardDiscontinued: '取消或待定（2026）',
  cardDiscontinuedSub: '2026 有而 2027 暂未发布',
  tableTitle: '2027 全部赛区 · 第一轮报名',
  weekFilter: 'Week 筛选',
  all: '全部',
  thEvent: '赛区',
  thLocation: '地点',
  thDates: '日期',
  thCapacity: '容量',
  thRegistered: '报名',
  thWithEpa: '有EPA',
  epaCols: { max: '最高', top8_avg: '前8均值', top24_avg: '前24均值', mean: '全体均值', median: '中位数' },
  badgeNew: '新增',
  badgeMoved: '换馆',
  noEpa: '暂无 EPA 数据',
  expandedTitle: '已报名队伍 · 按 2026 赛季 EPA 降序',
  expandedStat: (withEpa, noRecord) => `（${withEpa} 队有记录，${noRecord} 支新队伍无 2026 记录）`,
  teamCount: (n) => `${n} 队`,
  thTeamNum: '队号',
  thTeamName: '队名',
  newTeam: '新队伍',
  noTeams: '暂无报名队伍',
  tableFootnote:
    'EPA 列为该赛区已报名队伍的 2026 赛季 EPA 统计（Statbotics epa.total_points，赛季末值）；新队伍（无 2026 记录）不计入五列统计，不足 24 队的赛区「前24均值」按全体均值计。点击行展开查看完整报名名单，点击表头可按该列排序。',
  wcTitle: 'Week 变化（2026 → 2027）',
  wcTh2026: '2026',
  wcTh2027: '2027',
  wcThChange: '变化',
  wcChange: (n) => `${n > 0 ? `+${n}` : n} 周`,
  discTitle: '2026 已办、2027 暂未发布的赛区',
  discThWeek: '2026 Week',
  langToggle: 'EN',
}

const en: Dict = {
  title: 'PowerEvents · 2027 BIOCORE',
  subtitle:
    'FIRST Robotics Competition 2027 Regional events · Round 1 registration progress · Team 2026 season EPA (Statbotics)',
  loading: 'Loading data…',
  loadError: (err) => `Failed to load data: ${err}`,
  footerSource: 'Data sources: ',
  updatedAt: (d) => `Data updated at ${d}`,
  cardEvents: '2027 Events Published',
  cardEventsSub: (n) => `${n} events in the 2026 season`,
  cardRegistered: 'Teams Registered (Round 1)',
  cardRegisteredSub: 'Total registrations across all events',
  cardNew: 'New Events',
  cardNewSub: 'First held in 2027',
  cardWeekChanged: 'Week Changed',
  cardWeekChangedSub: 'vs. the same event in 2026',
  cardDiscontinued: 'Cancelled or TBD (2026)',
  cardDiscontinuedSub: 'Held in 2026, not yet announced for 2027',
  tableTitle: 'All 2027 Events · Round 1 Registration',
  weekFilter: 'Week',
  all: 'All',
  thEvent: 'Event',
  thLocation: 'Location',
  thDates: 'Dates',
  thCapacity: 'Capacity',
  thRegistered: 'Registered',
  thWithEpa: 'With EPA',
  epaCols: { max: 'Max', top8_avg: 'Top 8 Avg', top24_avg: 'Top 24 Avg', mean: 'Mean', median: 'Median' },
  badgeNew: 'New',
  badgeMoved: 'Moved',
  noEpa: 'No EPA data yet',
  expandedTitle: 'Registered Teams · Sorted by 2026 season EPA (desc)',
  expandedStat: (withEpa, noRecord) =>
    `(${withEpa} teams with records, ${noRecord} new teams without 2026 records)`,
  teamCount: (n) => `${n} teams`,
  thTeamNum: 'Team #',
  thTeamName: 'Team Name',
  newTeam: 'New Team',
  noTeams: 'No registered teams yet',
  tableFootnote:
    'EPA columns summarize the 2026 season EPA of registered teams (Statbotics epa.total_points, end-of-season values); new teams (no 2026 record) are excluded from the five stat columns, and for events with fewer than 24 teams "Top 24 Avg" falls back to the overall mean. Click a row to expand the full team list; click a header to sort by that column.',
  wcTitle: 'Week Changes (2026 → 2027)',
  wcTh2026: '2026',
  wcTh2027: '2027',
  wcThChange: 'Change',
  wcChange: (n) => `${n > 0 ? '+' : ''}${n} wk`,
  discTitle: 'Held in 2026, not yet announced for 2027',
  discThWeek: '2026 Week',
  langToggle: '中文',
}

const dictionaries: Record<Lang, Dict> = { zh, en }

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  toggleLang: () => void
  t: Dict
}

const LangContext = createContext<LangContextValue>({
  lang: 'zh',
  setLang: () => {},
  toggleLang: () => {},
  t: zh,
})

const STORAGE_KEY = 'powerevents-lang'

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh'
    } catch {
      return 'zh'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore storage errors
    }
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  }, [lang])

  const toggleLang = () => setLang((l) => (l === 'zh' ? 'en' : 'zh'))

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t: dictionaries[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
