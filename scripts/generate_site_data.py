from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
import pandas as pd

SITE_ROOT = Path(__file__).resolve().parents[1]
ROOT = SITE_ROOT.parent
sys.path.insert(0, str(ROOT / "src"))

STYLE_META = {
    "traditional_value": {
        "label": "전통 가치",
        "image": "/portraits/traditional-value.jpg",
        "thesis": "가격과 내재가치의 간극을 기다리며, 재무 건전성과 현금창출력이 검증된 사업을 긴 호흡으로 보유합니다.",
        "principles": ["충분한 안전마진", "사업의 질과 자본배분", "낮은 회전율과 장기 보유"],
        "watch": "가치 함정과 산업 구조의 영구적 훼손을 가장 먼저 점검해야 합니다.",
    },
    "activist": {
        "label": "행동주의",
        "image": "/portraits/activist.jpg",
        "thesis": "소수의 고확신 기업에 집중한 뒤 지배구조, 비용 구조, 자본배분의 변화를 촉매로 기업가치 재평가를 노립니다.",
        "principles": ["소수 종목 집중", "명확한 변화 촉매", "경영진·이사회와의 관여"],
        "watch": "촉매가 지연되거나 이해관계자와의 갈등 비용이 커지는 상황을 경계해야 합니다.",
    },
    "value_macro_hybrid": {
        "label": "가치·매크로 혼합",
        "image": "/portraits/value-macro-hybrid.jpg",
        "thesis": "기업의 저평가 여부를 출발점으로 삼되 금리, 신용, 원자재, 경기순환이 손익 비대칭을 키우는 구간에 집중합니다.",
        "principles": ["역발상 가치", "거시 불균형", "비대칭 손익 구조"],
        "watch": "13F에는 숏·파생상품·현금이 보이지 않아 실제 헤지 구조를 복제하기 어렵습니다.",
    },
    "quality_compounder": {
        "label": "퀄리티 복리",
        "image": "/portraits/quality-compounder.jpg",
        "thesis": "높은 자본수익률과 긴 재투자 활주로, 주주 친화적인 경영진을 가진 기업을 오래 보유해 복리의 시간을 확보합니다.",
        "principles": ["높은 자본수익률", "긴 재투자 활주로", "예측 가능한 현금흐름"],
        "watch": "좋은 기업이라도 과도한 밸류에이션에서 매수하면 장기간 수익률이 압박될 수 있습니다.",
    },
    "deep_distressed": {
        "label": "딥밸류·부실",
        "image": "/portraits/deep-distressed.jpg",
        "thesis": "정상화 이익이나 청산가치 대비 큰 할인을 요구하고, 복잡한 자본구조에서 회수 가능성과 우선순위를 분석합니다.",
        "principles": ["정상화 가치", "자본구조 분석", "회수율과 하방 보호"],
        "watch": "재무 레버리지와 유동성 위험 때문에 손실의 크기와 보유 기간이 예상보다 커질 수 있습니다.",
    },
    "fundamental_growth": {
        "label": "펀더멘털 성장",
        "image": "/portraits/fundamental-growth.jpg",
        "thesis": "시장 규모, 경쟁우위, 단위경제성이 함께 개선되는 기업을 선별해 이익 성장의 지속성과 질에 베팅합니다.",
        "principles": ["구조적 성장", "단위경제성", "실행력 있는 경영진"],
        "watch": "성장률 둔화와 멀티플 축소가 동시에 나타나는 구간에서 낙폭이 확대될 수 있습니다.",
    },
    "global_macro": {
        "label": "글로벌 매크로",
        "image": "/portraits/global-macro.jpg",
        "thesis": "금리·통화·경기·정책의 큰 흐름을 읽고 자산 간 상대가치와 리스크 예산을 능동적으로 바꿉니다.",
        "principles": ["정책과 유동성", "자산 간 상대가치", "상황별 리스크 조절"],
        "watch": "13F는 미국 롱 주식만 보여주므로 실제 매크로 포트폴리오의 일부만 관찰됩니다.",
    },
    "event_driven_macro": {
        "label": "이벤트·매크로",
        "image": "/portraits/event-driven-macro.jpg",
        "thesis": "합병, 분할, 구조조정, 정책 변화처럼 시간표가 있는 사건과 거시 환경의 결합에서 촉매 수익을 추구합니다.",
        "principles": ["사건의 확률과 시간", "스프레드 대비 하방", "포지션 촉매 관리"],
        "watch": "거래 무산과 일정 지연이 기대수익을 급격히 바꿀 수 있어 사건별 손실 한도가 중요합니다.",
    },
}


def number(value: object, digits: int = 6) -> float | None:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(result):
        return None
    return round(result, digits)


def smart_title(value: object) -> str:
    text = str(value or "").strip()
    if not text:
        return "미확인 종목"
    if text.isupper():
        text = text.title()
    replacements = {" Inc": " Inc.", " Corp": " Corp.", " Co ": " Co. "}
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def monthly_curve(frame: pd.DataFrame, column: str) -> list[dict[str, object]]:
    if column not in frame:
        return []
    source = frame[["date", column, "SPY"]].dropna(subset=[column]).copy()
    if source.empty:
        return []
    source = source.set_index("date")
    nav = pd.DataFrame(index=source.index)
    nav["investor"] = (1.0 + source[column].fillna(0.0)).cumprod() * 100.0
    nav["market"] = (1.0 + source["SPY"].fillna(0.0)).cumprod() * 100.0
    sampled = nav.resample("ME").last().dropna(how="all")
    if sampled.index[-1] != nav.index[-1]:
        sampled.loc[nav.index[-1]] = nav.iloc[-1]
    return [
        {
            "date": date.strftime("%Y-%m-%d"),
            "investor": number(row["investor"], 2),
            "market": number(row["market"], 2),
        }
        for date, row in sampled.iterrows()
    ]


def load_price_map() -> dict[str, dict[str, object]]:
    sources: list[tuple[Path, str]] = [
        (ROOT / "data/processed/style_analysis/prices.csv.gz", "historical close"),
        (ROOT / "outputs/live_strategy/live_prices.csv.gz", "latest close"),
        (ROOT / "data/processed/site_prices/current_prices.csv.gz", "latest close"),
    ]
    result: dict[str, dict[str, object]] = {}
    for path, source in sources:
        if not path.exists():
            continue
        prices = pd.read_csv(path)
        date_col = prices.columns[0]
        prices[date_col] = pd.to_datetime(prices[date_col])
        for ticker in prices.columns[1:]:
            valid = prices[[date_col, ticker]].dropna()
            if valid.empty:
                continue
            last = valid.iloc[-1]
            result[str(ticker)] = {
                "price": number(last[ticker], 4),
                "date": pd.Timestamp(last[date_col]).strftime("%Y-%m-%d"),
                "source": source,
            }
    return result


def fetch_current_prices(tickers: list[str]) -> None:
    from giants13f.prices import download_yahoo_prices_chunked

    output = ROOT / "data/processed/site_prices/current_prices.csv.gz"
    prices, failed = download_yahoo_prices_chunked(
        tickers,
        start="2026-08-28",
        end="2026-09-06",
        cache_dir=ROOT / "data/processed/site_prices/chunks",
        chunk_size=75,
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    prices.to_csv(output, compression="gzip", index_label="date")
    print(f"Saved {len(prices.columns)} current-price series; {len(failed)} unavailable")


def aggregate_report(group: pd.DataFrame) -> pd.DataFrame:
    return (
        group.groupby("cusip", as_index=False)
        .agg(
            issuer=("issuer", "first"),
            ticker=("ticker", "first"),
            value_usd=("value_usd", "sum"),
            shares=("shares", "sum"),
        )
        .sort_values("value_usd", ascending=False)
    )


def inferred_reason(action: str, weight: float, delta_weight: float) -> str:
    if action == "신규":
        return "새로운 투자 논리나 촉매를 포착한 편입으로 추정됩니다."
    if action == "전량매도":
        return "투자 논리 종료, 밸류에이션 부담 또는 다른 기회로의 자본 재배분 가능성이 있습니다."
    if action == "확대":
        if weight >= 0.05:
            return "핵심 보유 종목으로의 확신 강화 또는 가격 조정 시 추가 매수로 해석할 수 있습니다."
        return "기존 투자 논리의 진전이나 상대 매력도 상승에 따른 비중 확대로 추정됩니다."
    if action == "축소":
        if delta_weight <= -0.03:
            return "집중 위험 완화, 차익 실현 또는 펀더멘털 기대치 조정 가능성이 있습니다."
        return "포트폴리오 리밸런싱이나 상대 매력도 하락에 따른 부분 축소로 추정됩니다."
    return "주식 수 기준으로 의미 있는 방향 변화는 제한적입니다."


def build_site_data(refresh_prices: bool) -> dict[str, object]:
    profiles = pd.read_csv(ROOT / "data/manager_profiles.csv")
    metrics = pd.read_csv(ROOT / "outputs/style_analysis/manager_style_metrics.csv")
    profile_metrics = profiles.merge(metrics, on="lineage", how="left", suffixes=("", "_metric"))

    returns = pd.read_csv(ROOT / "outputs/style_analysis/daily_manager_returns.csv.gz")
    returns["date"] = pd.to_datetime(returns["date"])

    mapping = pd.read_csv(ROOT / "data/processed/style_analysis/cusip_ticker.csv", dtype={"cusip": str})
    mapping["cusip"] = mapping["cusip"].str.upper().str.strip()
    mapping = mapping.dropna(subset=["ticker"]).drop_duplicates("cusip", keep="last")
    ticker_by_cusip = mapping.set_index("cusip")["ticker"].astype(str).to_dict()

    holdings = pd.read_csv(
        ROOT / "data/processed/managers/all_holdings.csv.gz",
        usecols=["lineage", "report_date", "issuer", "cusip", "value_usd", "shares", "put_call"],
        dtype={"cusip": str, "put_call": str},
        low_memory=False,
    )
    holdings = holdings[~holdings["put_call"].fillna("").str.upper().eq("PUT")].copy()
    holdings["cusip"] = holdings["cusip"].str.upper().str.strip()
    holdings["ticker"] = holdings["cusip"].map(ticker_by_cusip)
    holdings["report_date"] = pd.to_datetime(holdings["report_date"])
    holdings = holdings[holdings["lineage"].isin(profiles["lineage"])]

    report_dates = {
        lineage: sorted(group["report_date"].dropna().unique())[-2:]
        for lineage, group in holdings.groupby("lineage")
        if len(group["report_date"].dropna().unique())
    }
    recent = pd.concat(
        [
            holdings[(holdings["lineage"] == lineage) & (holdings["report_date"].isin(dates))]
            for lineage, dates in report_dates.items()
        ],
        ignore_index=True,
    )

    latest_reports: dict[str, pd.DataFrame] = {}
    previous_reports: dict[str, pd.DataFrame] = {}
    for lineage, dates in report_dates.items():
        latest_reports[lineage] = aggregate_report(
            recent[(recent["lineage"] == lineage) & (recent["report_date"] == dates[-1])]
        )
        if len(dates) > 1:
            previous_reports[lineage] = aggregate_report(
                recent[(recent["lineage"] == lineage) & (recent["report_date"] == dates[-2])]
            )

    if refresh_prices:
        required = sorted(
            {
                str(ticker)
                for report in latest_reports.values()
                for ticker in report.head(20)["ticker"].dropna().tolist()
            }
        )
        fetch_current_prices(required)
    price_map = load_price_map()

    investors: list[dict[str, object]] = []
    for _, row in profile_metrics.iterrows():
        lineage = str(row["lineage"])
        style = str(row["style_group"])
        style_meta = STYLE_META[style]
        report = latest_reports.get(lineage, pd.DataFrame())
        dates = report_dates.get(lineage, [])
        latest_date = pd.Timestamp(dates[-1]).strftime("%Y-%m-%d") if dates else None
        previous_date = pd.Timestamp(dates[-2]).strftime("%Y-%m-%d") if len(dates) > 1 else None

        portfolio: list[dict[str, object]] = []
        calculator: list[dict[str, object]] = []
        if not report.empty:
            total = float(report["value_usd"].sum())
            report = report.copy()
            report["weight"] = report["value_usd"] / total if total else 0.0
            top = report.head(8)
            for _, holding in top.iterrows():
                portfolio.append(
                    {
                        "ticker": None if pd.isna(holding["ticker"]) else str(holding["ticker"]),
                        "name": smart_title(holding["issuer"]),
                        "weight": number(holding["weight"], 6),
                        "valueUsd": number(holding["value_usd"], 0),
                    }
                )
            other_weight = max(0.0, 1.0 - float(top["weight"].sum()))
            if other_weight > 0.0005:
                portfolio.append({"ticker": None, "name": "기타", "weight": number(other_weight, 6), "valueUsd": None})

            investable = report.dropna(subset=["ticker"]).head(15).copy()
            valid_rows = []
            for _, holding in investable.iterrows():
                ticker = str(holding["ticker"])
                quote = price_map.get(ticker)
                estimated = False
                if quote is None and float(holding["shares"]) > 0:
                    quote = {
                        "price": number(float(holding["value_usd"]) / float(holding["shares"]), 4),
                        "date": latest_date,
                        "source": "13F implied price",
                    }
                    estimated = True
                if quote and quote["price"]:
                    valid_rows.append((holding, ticker, quote, estimated))
            investable_total = sum(float(item[0]["weight"]) for item in valid_rows)
            for holding, ticker, quote, estimated in valid_rows:
                calculator.append(
                    {
                        "ticker": ticker,
                        "name": smart_title(holding["issuer"]),
                        "weight": number(float(holding["weight"]) / investable_total, 6),
                        "price": quote["price"],
                        "priceDate": quote["date"],
                        "estimatedPrice": estimated or quote["source"] != "latest close",
                    }
                )

        changes: list[dict[str, object]] = []
        previous = previous_reports.get(lineage)
        if previous is not None and not report.empty:
            current_total = float(report["value_usd"].sum())
            previous_total = float(previous["value_usd"].sum())
            current = report.set_index("cusip")
            prior = previous.set_index("cusip")
            for cusip in current.index.union(prior.index):
                cur = current.loc[cusip] if cusip in current.index else None
                old = prior.loc[cusip] if cusip in prior.index else None
                cur_shares = 0.0 if cur is None else float(cur["shares"])
                old_shares = 0.0 if old is None else float(old["shares"])
                cur_weight = 0.0 if cur is None or not current_total else float(cur["value_usd"]) / current_total
                old_weight = 0.0 if old is None or not previous_total else float(old["value_usd"]) / previous_total
                if old_shares <= 0 and cur_shares > 0:
                    action = "신규"
                    shares_change = None
                elif cur_shares <= 0 and old_shares > 0:
                    action = "전량매도"
                    shares_change = -1.0
                else:
                    shares_change = cur_shares / old_shares - 1.0 if old_shares else None
                    action = "확대" if shares_change is not None and shares_change >= 0.05 else "축소" if shares_change is not None and shares_change <= -0.05 else "유지"
                ref = cur if cur is not None else old
                ticker_value = None if ref is None or pd.isna(ref["ticker"]) else str(ref["ticker"])
                delta_weight = cur_weight - old_weight
                changes.append(
                    {
                        "ticker": ticker_value or str(cusip),
                        "name": smart_title(ref["issuer"] if ref is not None else ""),
                        "action": action,
                        "currentWeight": number(cur_weight, 6),
                        "previousWeight": number(old_weight, 6),
                        "weightChange": number(delta_weight, 6),
                        "sharesChange": number(shares_change, 6),
                        "inference": inferred_reason(action, cur_weight, delta_weight),
                    }
                )
            changes.sort(key=lambda item: (item["action"] == "유지", -abs(float(item["weightChange"] or 0))))
            changes = changes[:14]

        cagr = number(row.get("cagr"))
        market_cagr = number(row.get("benchmark_cagr"))
        drawdown = number(row.get("max_drawdown"))
        turnover = number(row.get("average_annual_turnover"))
        top5 = sum(float(item.get("weight") or 0) for item in portfolio[:5])
        years = number(row.get("years"), 1)
        metric_story = (
            f"{years:.1f}년 백테스트에서 연복리 {cagr:.1%}, 같은 구간 SPY {market_cagr:.1%}를 기록했습니다. "
            f"최대 낙폭은 {drawdown:.1%}, 연평균 회전율은 {turnover:.1%}였습니다."
            if None not in (years, cagr, market_cagr, drawdown, turnover)
            else "가격·매핑 요건을 충족한 연속 백테스트 결과가 부족해 성과 수치는 제공하지 않습니다."
        )
        portfolio_story = (
            f"최근 공개 포트폴리오는 {len(report):,}개 종목이며 상위 5개가 {top5:.1%}를 차지합니다. "
            "비중은 13F에 보고된 미국 롱 포지션의 시장가치를 기준으로 계산했습니다."
            if not report.empty
            else "최근 13F 보유 데이터가 충분하지 않습니다."
        )
        investors.append(
            {
                "id": lineage,
                "manager": str(row["manager_name"]),
                "representative": str(row["representative"]),
                "style": style,
                "styleLabel": str(row["style_label_ko"]),
                "illustration": style_meta["image"],
                "characteristics": str(row["characteristics_ko"]),
                "thesis": style_meta["thesis"],
                "principles": style_meta["principles"],
                "watch": style_meta["watch"],
                "analysis": [
                    {"title": "투자 철학", "body": f"{row['characteristics_ko']} {style_meta['thesis']}"},
                    {"title": "수익률이 보여주는 실제 성향", "body": metric_story},
                    {"title": "최근 포트폴리오의 서명", "body": portfolio_story},
                    {"title": "복제할 때의 핵심 위험", "body": style_meta["watch"]},
                ],
                "metrics": {
                    "start": None if pd.isna(row.get("start")) else str(row.get("start")),
                    "end": None if pd.isna(row.get("end")) else str(row.get("end")),
                    "years": years,
                    "cagr": cagr,
                    "totalReturn": number(row.get("total_return")),
                    "volatility": number(row.get("annual_volatility")),
                    "sharpe": number(row.get("sharpe_zero_rf")),
                    "maxDrawdown": drawdown,
                    "marketCagr": market_cagr,
                    "marketTotalReturn": number(row.get("benchmark_total_return")),
                    "turnover": turnover,
                    "mappingCoverage": number(row.get("average_effective_coverage")),
                    "confidence": None if pd.isna(row.get("confidence")) else str(row.get("confidence")),
                },
                "curve": monthly_curve(returns, lineage),
                "portfolioDate": latest_date,
                "previousPortfolioDate": previous_date,
                "portfolio": portfolio,
                "positionCount": int(len(report)),
                "calculator": calculator,
                "changes": changes,
            }
        )

    live_targets = pd.read_csv(ROOT / "outputs/live_strategy/live_targets.csv")
    live_prices = pd.read_csv(ROOT / "outputs/live_strategy/live_prices.csv.gz")
    live_price_date = str(pd.to_datetime(live_prices.iloc[:, 0]).max().date())
    live_quote = load_price_map()
    consensus = []
    for _, target in live_targets.sort_values("weight", ascending=False).iterrows():
        ticker = str(target["ticker"])
        quote = live_quote.get(ticker)
        if not quote:
            continue
        consensus.append(
            {
                "ticker": ticker,
                "weight": number(target["weight"], 6),
                "price": quote["price"],
                "priceDate": quote["date"],
                "managerCount": int(target["manager_count"]),
                "supporters": str(target["supporters"]).split(","),
                "coreWeight": number(target["core_weight"], 6),
                "satelliteWeight": number(target["satellite_weight"], 6),
            }
        )

    strategy_returns = pd.read_csv(ROOT / "outputs/live_strategy/daily_returns.csv.gz")
    strategy_returns["date"] = pd.to_datetime(strategy_returns["date"])
    strategy_curves = []
    active = strategy_returns.dropna(subset=["blended_regime"]).copy().set_index("date")
    if not active.empty:
        nav = (1.0 + active[["SPY", "quality_core", "blended_static", "blended_regime"]].fillna(0.0)).cumprod() * 100.0
        sampled = nav.resample("ME").last()
        for date, values in sampled.iterrows():
            strategy_curves.append(
                {
                    "date": date.strftime("%Y-%m-%d"),
                    **{column: number(values[column], 2) for column in nav.columns},
                }
            )

    strategy_metrics = pd.read_csv(ROOT / "outputs/live_strategy/strategy_metrics.csv")
    paper_summary = json.loads((ROOT / "outputs/live_strategy/paper_account_summary.json").read_text(encoding="utf-8"))
    regime = str(live_targets.iloc[0]["regime"])
    regime_label = {"bull": "상승", "neutral": "전환", "bear": "하락"}.get(regime, regime)
    regime_exposure = number(live_targets.iloc[0]["equity_exposure"], 3)

    return {
        "generatedAt": "2026-09-05",
        "investorCount": len(investors),
        "investors": investors,
        "styles": [{"id": key, **value} for key, value in STYLE_META.items()],
        "regime": {
            "id": regime,
            "label": regime_label,
            "equityExposure": regime_exposure,
            "priceDate": live_price_date,
            "reportDate": str(live_targets.iloc[0]["report_date"]),
            "signalAt": str(live_targets.iloc[0]["signal_at"]),
            "rationale": "SPY의 200일 이동평균과 과거 12개월 모멘텀을 함께 사용한 규칙 기반 판정입니다.",
            "rules": [
                {"label": "상승", "exposure": 1.0, "description": "추세와 모멘텀이 모두 우호적"},
                {"label": "전환", "exposure": 0.8, "description": "두 조건 중 하나만 충족"},
                {"label": "하락", "exposure": 0.6, "description": "추세와 모멘텀이 모두 비우호적"},
            ],
        },
        "consensus": consensus,
        "strategyCurves": strategy_curves,
        "strategyMetrics": strategy_metrics.replace({np.nan: None}).to_dict("records"),
        "paperSummary": paper_summary,
        "methodology": {
            "delay": "13F 제출 확인 후 다음 거래일 종가 리밸런싱",
            "cost": "편도 5bp",
            "benchmark": "SPY 총수익 근사",
            "limitations": "13F는 최대 45일 지연되며 미국 상장 롱 포지션만 포함합니다. 현금, 숏, 선물, 통화와 일부 채권은 보이지 않습니다.",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh-prices", action="store_true")
    args = parser.parse_args()
    payload = build_site_data(args.refresh_prices)
    output = SITE_ROOT / "lib/site-data.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {output} ({output.stat().st_size / 1024:.1f} KiB)")


if __name__ == "__main__":
    main()
