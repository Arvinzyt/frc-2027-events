# -*- coding: utf-8 -*-
"""
FRC 2027 赛区数据更新脚本
=========================
用法：
    python tools/update_data.py

功能：
1. 抓取 FIRST 官网 2026 / 2027 赛季 Regional 赛区列表
   （https://frc-events.firstinspires.org/<year>/Events/EventList?filter=REG）
2. 按 event code 匹配两年赛区，标记新增 / week 变化 / 场馆搬迁 / 取消或待定
3. 对每个有 2026 对应赛事的赛区，调用 Statbotics API 计算 EPA 分布统计
   （最高 / 前8均值 / 前24均值 / 全体均值 / 中位数 / 队伍数）
4. 代理规则：CNGU1、CNGU2 使用 2026cnsh（上海）；IMWR 使用 2026idbo（爱达荷）
5. 输出 public/data.json，网页直接读取该文件

只依赖标准库 + beautifulsoup4。
"""

import json
import re
import statistics
import sys
import time
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
OUT_FILE = ROOT / "public" / "data.json"
RAW_CACHE = ROOT / "tools" / "statbotics_2026_raw.json"  # API 失败时的回退缓存

EVENT_LIST_URL = "https://frc-events.firstinspires.org/{year}/Events/EventList?filter=REG"
STATBOTICS_URL = "https://api.statbotics.io/v3/team_events?event={key}&limit=200"

# 2027 新增赛区 -> 用于 EPA 参考的 2026 赛事 key
PROXY_2026 = {
    "CNGU1": ("2026cnsh", "2026 上海赛区 (Shanghai Regional)"),
    "CNGU2": ("2026cnsh", "2026 上海赛区 (Shanghai Regional)"),
    "IMWR": ("2026idbo", "2026 爱达荷赛区 (Idaho Regional)"),
}

HEADERS = {"User-Agent": "Mozilla/5.0 (FRC-Scouting data refresh)"}


def fetch_text(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read().decode("utf-8")
        except Exception as e:
            print(f"  [重试 {attempt + 1}/{retries}] {url}: {e}")
            time.sleep(2 + attempt * 2)
    return None


def parse_event_list(html):
    """解析 FIRST 赛事列表页，返回 {code: {...}}"""
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", id="eventTable")
    events = {}
    for tr in table.find("tbody").find_all("tr"):
        tds = tr.find_all("td")
        if len(tds) < 6:
            continue
        code = tds[0].get_text(strip=True)
        week_td = tds[1]
        # week 数字是单元格的裸文本，日期在 <span id="detail1"> 内；
        # 不能用 get_text()（会把日期数字拼进来）
        week_text = week_td.find(string=True, recursive=False) or ""
        m = re.search(r"(\d+)", week_text)
        week = int(m.group(1)) if m else None
        # 日期：title="Begins Thursday, 3/4/2027" + <span id="detail1"> 3/4 to 3/7
        title = week_td.get("title", "")
        m2 = re.search(r"(\d{1,2}/\d{1,2}/\d{4})", title)
        date_start = m2.group(1) if m2 else ""
        span1 = week_td.find("span", id="detail1")
        date_range = span1.get_text(strip=True).replace("\n", " ") if span1 else ""
        link = tds[2].find("a")
        name = link.get_text(strip=True) if link else tds[2].get_text(strip=True)
        span2 = tds[2].find("span", id="detail2")
        location = span2.get_text(strip=True) if span2 else ""
        capacity = tds[3].get_text(strip=True)
        registered = tds[4].get_text(strip=True)
        events[code] = {
            "code": code,
            "name": name,
            "week": week,
            "location": location,
            "date_start": date_start,          # 如 3/4/2027
            "date_range": date_range,          # 如 3/4 to 3/7
            "capacity": int(capacity) if capacity.isdigit() else None,
            "registered": int(registered) if registered.isdigit() else None,
        }
    return events


def epa_stats(event_key, raw_cache):
    """从 Statbotics 取某 2026 赛事的 EPA 分布统计；失败时回退到本地缓存"""
    data = None
    url = STATBOTICS_URL.format(key=event_key)
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=40) as r:
                data = json.load(r)
            break
        except Exception as e:
            print(f"  [Statbotics 重试 {attempt + 1}/3] {event_key}: {e}")
            time.sleep(2 + attempt * 2)
    if data is None and event_key in raw_cache:
        print(f"  [回退缓存] {event_key} 使用 statbotics_2026_raw.json")
        data = raw_cache[event_key]
    if not data:
        return None, None

    epas = sorted(
        (t["epa"]["total_points"] for t in data
         if t.get("epa") and t["epa"].get("total_points") is not None),
        reverse=True,
    )
    if not epas:
        return None, None
    n = len(epas)
    stats = {
        "event_key": event_key,
        "team_count": n,
        "max": round(epas[0], 2),
        "top8_avg": round(statistics.mean(epas[:8]), 2),
        "top24_avg": round(statistics.mean(epas[:24] if n >= 24 else epas), 2),
        "mean": round(statistics.mean(epas), 2),
        "median": round(statistics.median(epas), 2),
    }
    return stats, data


def main():
    print("== 抓取 FIRST 赛事列表 ==")
    html26 = fetch_text(EVENT_LIST_URL.format(year=2026))
    html27 = fetch_text(EVENT_LIST_URL.format(year=2027))
    if not html27:
        sys.exit("无法获取 2027 赛事列表，终止。")
    events27 = parse_event_list(html27)
    events26 = parse_event_list(html26) if html26 else {}
    print(f"2026: {len(events26)} 个 regional，2027: {len(events27)} 个 regional")

    raw_cache = {}
    if RAW_CACHE.exists():
        try:
            raw_cache = json.loads(RAW_CACHE.read_text(encoding="utf-8"))
        except Exception:
            raw_cache = {}
    new_raw = {}

    print("== 匹配并计算 EPA 统计 ==")
    out_events = []
    for code in sorted(events27, key=lambda c: (events27[c]["week"] or 99, c)):
        e27 = dict(events27[code])
        e26 = events26.get(code)
        proxy = PROXY_2026.get(code)

        # 状态标记
        if e26 is None:
            status = "new_2027"
        elif e26["week"] != e27["week"]:
            status = "week_changed"
        elif e26["location"] != e27["location"]:
            status = "unchanged_venue_moved"
        else:
            status = "unchanged"

        # 确定 EPA 数据来源
        epa = None
        epa_proxy = False
        epa_source = None
        if proxy:
            epa_key, epa_source = proxy
            epa_proxy = True
        elif e26 is not None:
            epa_key = f"2026{code.lower()}"
            epa_source = f"2026 {e26['name']}"
        else:
            epa_key = None

        if epa_key:
            stats, raw = epa_stats(epa_key, raw_cache)
            if raw is not None:
                new_raw[epa_key] = raw
            if stats:
                epa = stats
                print(f"  {code}: key={epa_key} n={stats['team_count']} "
                      f"max={stats['max']} mean={stats['mean']}")
            else:
                print(f"  {code}: key={epa_key} 无 EPA 数据")
            time.sleep(0.3)
        else:
            print(f"  {code}: 无 2026 对应赛事，暂无数据")

        if epa is None and epa_key is None:
            data_status = "no_data"
        elif epa_proxy:
            data_status = "proxy"
        else:
            data_status = "direct"

        out_events.append({
            **e27,
            "status": status,
            "data_status": data_status,      # direct / proxy / no_data
            "week_2026": e26["week"] if e26 else None,
            "location_2026": e26["location"] if e26 else None,
            "epa": epa,
            "epa_source": epa_source if epa else None,
        })

    # week 变化列表
    week_changes = [
        {
            "code": e["code"],
            "name": e["name"],
            "location": e["location"],
            "week_2026": e["week_2026"],
            "week_2027": e["week"],
            "change": e["week"] - e["week_2026"],
        }
        for e in out_events if e["status"] == "week_changed"
    ]

    # 2026 有而 2027 没有（取消或待定）
    discontinued = [
        {
            "code": c,
            "name": e["name"],
            "location": e["location"],
            "week_2026": e["week"],
        }
        for c, e in sorted(events26.items(), key=lambda kv: (kv[1]["week"] or 99, kv[0]))
        if c not in events27
    ]

    new_count = sum(1 for e in out_events if e["status"] == "new_2027")
    now = datetime.now(timezone(timedelta(hours=8)))
    payload = {
        "meta": {
            "generated_at": now.strftime("%Y-%m-%d %H:%M:%S %z"),
            "event_count_2027": len(out_events),
            "event_count_2026": len(events26),
            "new_event_count": new_count,
            "week_changed_count": len(week_changes),
            "discontinued_count": len(discontinued),
            "sources": [
                "https://frc-events.firstinspires.org/2027/Events/EventList?filter=REG",
                "https://api.statbotics.io/v3 (2026 赛季 EPA)",
            ],
            "epa_note": "EPA 统计基于 2026 赛季对应赛事的 epa.total_points；"
                        "广州 CNGU1/CNGU2 参考 2026 上海赛区，IMWR 参考 2026 爱达荷赛区。",
        },
        "events": out_events,
        "week_changes": week_changes,
        "discontinued": discontinued,
    }

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    # 更新本地缓存
    if new_raw:
        raw_cache.update(new_raw)
        RAW_CACHE.write_text(json.dumps(raw_cache), encoding="utf-8")

    print(f"\n完成：{OUT_FILE}")
    print(f"2027 赛区 {len(out_events)} 个（新增 {new_count}，week 变化 {len(week_changes)}，"
          f"2026 取消/待定 {len(discontinued)}）")


if __name__ == "__main__":
    main()
