"use client";

import { useState, useRef, useCallback } from "react";

const SCENARIOS = {
  purchase: {
    quote: "원자재 A 재고가 부족한 것 같은데, 구매 요청 넣어줘",
    intent: "CREATE_PURCHASE_ORDER",
    domain: "PURCHASE",
    entityItem: "원자재 A",
    entityQty: "자동 산출",
    auth: "✅ 구매 권한 확인",
    confidence: 94,
  },
  work: {
    quote: "A품목 100개 작업지시 만들어줘",
    intent: "CREATE_WORK_ORDER",
    domain: "PRODUCTION",
    entityItem: "A품목",
    entityQty: "100개",
    auth: "✅ 생산 권한 확인",
    confidence: 97,
  },
  inventory: {
    quote: "B공장으로 볼트 2개 이동해줘",
    intent: "MOVE_INVENTORY",
    domain: "INVENTORY",
    entityItem: "볼트",
    entityQty: "2개",
    auth: "✅ 창고 이동 권한 확인",
    confidence: 96,
  },
  status: {
    quote: "현재 생산 현황 알려줘",
    intent: "QUERY_STATUS",
    domain: "ANALYTICS",
    entityItem: "전체 라인",
    entityQty: "—",
    auth: "✅ 조회 권한 확인",
    confidence: 99,
  },
} as const;

type ScenarioKey = keyof typeof SCENARIOS;
type AgentKey = "orch" | "purchase" | "inventory-a" | "supplier-a" | "doc-a";
type AgentStatus = "idle" | "active" | "done";

const STEP_DESCS = [
  "",
  "🎤 사용자가 음성 또는 텍스트로 명령을 입력합니다. STT 엔진이 음성을 텍스트로 변환하고 시스템에 전달합니다.",
  "🧠 Master Orchestrator가 입력을 NLP로 분석합니다. 온톨로지 엔진이 인텐트·엔티티를 추출하고 구매 도메인으로 라우팅을 결정합니다.",
  "🛒 Purchase Agent가 활성화됩니다. 재고 확인, BOM 참조, 공급업체 조회 등 구매에 필요한 서브태스크를 병렬로 분배합니다.",
  "⚡ Inventory · Supplier · Document 3개 서브 에이전트가 동시에 병렬 실행됩니다. 각 에이전트는 전용 툴과 DB에 접근하여 결과를 생성합니다.",
  "✅ 에이전트가 발주서 초안을 음성으로 요약하여 사용자에게 확인을 요청합니다. 사용자가 승인하면 최종 실행이 진행됩니다.",
  "🚀 모든 후속 작업(ERP 기록, 메일 발송, 알림)이 자동으로 완료되고 사용자에게 결과를 보고합니다.",
];

const INIT_STATUS: Record<AgentKey, AgentStatus> = {
  orch: "idle",
  purchase: "idle",
  "inventory-a": "idle",
  "supplier-a": "idle",
  "doc-a": "idle",
};

const AGENT_LABELS: Record<AgentKey, string> = {
  orch: "Master Orchestrator",
  purchase: "Purchase Agent",
  "inventory-a": "Inventory Sub-Agent",
  "supplier-a": "Supplier Sub-Agent",
  "doc-a": "Document Sub-Agent",
};

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

interface IntentData {
  intent: string;
  domain: string;
  entityItem: string;
  entityQty: string;
  auth: string;
  confidence: number;
}

export default function AgentOrchestration() {
  const [scenario, setScenario] = useState<ScenarioKey>("purchase");
  const [step, setStep] = useState(0);
  const [simRunning, setSimRunning] = useState(false);
  const [btnLabel, setBtnLabel] = useState("▶ 흐름 시뮬레이션 실행");
  const [agentStatus, setAgentStatus] = useState<Record<AgentKey, AgentStatus>>(INIT_STATUS);
  const [intentData, setIntentData] = useState<IntentData | null>(null);
  const [stepDesc, setStepDesc] = useState(
    "▶ 시뮬레이션을 실행하면 각 단계의 에이전트 동작을 순차적으로 확인할 수 있습니다."
  );
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const highlight = useCallback((id: string) => {
    setHighlighted(null);
    requestAnimationFrame(() => setHighlighted(id));
    setTimeout(() => setHighlighted((cur) => (cur === id ? null : cur)), 700);
  }, []);

  const setAgent = useCallback((key: AgentKey, status: AgentStatus) => {
    setAgentStatus((prev) => ({ ...prev, [key]: status }));
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setSimRunning(false);
    setBtnLabel("▶ 흐름 시뮬레이션 실행");
    setStep(0);
    setAgentStatus({ ...INIT_STATUS });
    setIntentData(null);
    setHighlighted(null);
    setStepDesc(
      "▶ 시뮬레이션을 실행하면 각 단계의 에이전트 동작을 순차적으로 확인할 수 있습니다."
    );
  }, []);

  const switchScenario = useCallback(
    (s: ScenarioKey) => {
      setScenario(s);
      reset();
      cancelRef.current = false;
    },
    [reset]
  );

  const runSim = useCallback(async () => {
    if (simRunning) return;
    cancelRef.current = false;
    setSimRunning(true);
    const sc = SCENARIOS[scenario];
    const check = () => cancelRef.current;

    // Step 1
    setStep(1); highlight("block-user"); setStepDesc(STEP_DESCS[1]);
    await sleep(1200); if (check()) return;

    // Step 2 — Orchestrator
    setStep(2); highlight("block-orch");
    setStepDesc(STEP_DESCS[2]);
    setAgent("orch", "active");
    await sleep(400); if (check()) return;
    setIntentData({
      intent: sc.intent, domain: sc.domain,
      entityItem: sc.entityItem, entityQty: sc.entityQty,
      auth: sc.auth, confidence: sc.confidence,
    });
    await sleep(1400); if (check()) return;
    setAgent("orch", "done");

    // Step 3 — Purchase Agent
    setStep(3); highlight("block-purchase");
    setStepDesc(STEP_DESCS[3]);
    setAgent("purchase", "active");
    await sleep(1500); if (check()) return;
    setAgent("purchase", "done");

    // Step 4 — Parallel sub-agents
    setStep(4); highlight("block-parallel");
    setStepDesc(STEP_DESCS[4]);
    setAgent("inventory-a", "active");
    setAgent("supplier-a", "active");
    setAgent("doc-a", "active");
    await sleep(700); if (check()) return;
    setAgent("inventory-a", "done");
    await sleep(400); if (check()) return;
    setAgent("supplier-a", "done");
    await sleep(300); if (check()) return;
    setAgent("doc-a", "done");
    await sleep(400); if (check()) return;

    // Step 5 — Confirm
    setStep(5); highlight("block-confirm");
    setStepDesc(STEP_DESCS[5]);
    await sleep(2000); if (check()) return;

    // Step 6 — Done
    setStep(6); highlight("block-result");
    setStepDesc(STEP_DESCS[6]);

    setSimRunning(false);
    setBtnLabel("▶ 다시 실행");
  }, [simRunning, scenario, highlight, setAgent]);

  const sc = SCENARIOS[scenario];

  const dotClass = (key: AgentKey) => {
    const s = agentStatus[key];
    if (s === "active") return "wo-dot wo-dot-active";
    if (s === "done") return "wo-dot wo-dot-done";
    return "wo-dot wo-dot-idle";
  };
  const stateText = (key: AgentKey) => {
    const s = agentStatus[key];
    if (s === "active") return { label: "처리 중", cls: "wo-state-active" };
    if (s === "done") return { label: "완료", cls: "wo-state-done" };
    return { label: "대기중", cls: "wo-state-idle" };
  };
  const stepDotCls = (n: number) => {
    if (n < step) return "wo-sdot wo-sdot-done";
    if (n === step) return "wo-sdot wo-sdot-active";
    return "wo-sdot wo-sdot-pending";
  };
  const stepLineCls = (n: number) => (n < step ? "wo-sline wo-sline-done" : "wo-sline");

  const TABS: { key: ScenarioKey; label: string }[] = [
    { key: "purchase", label: "🛒 구매 발주" },
    { key: "work", label: "📋 작업 지시" },
    { key: "inventory", label: "📦 재고 이동" },
    { key: "status", label: "📊 현황 조회" },
  ];

  const isHighlighted = (id: string) => highlighted === id ? " wo-highlight" : "";

  return (
    <section id="agent-flow" className="mb-16">
      <h2 className="text-4xl font-bold text-gray-900 mb-2">AI 에이전트 오케스트레이션</h2>
      <div className="h-1 w-full bg-primary mb-8" />

      <div className="wo-wrap">
        {/* 시나리오 탭 */}
        <div className="wo-scenario-bar">
          <span className="wo-scenario-label">시나리오</span>
          <div className="wo-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={"wo-tab" + (scenario === t.key ? " wo-tab-active" : "")}
                onClick={() => switchScenario(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 메인 그리드 */}
        <div className="wo-main">
          {/* 흐름도 */}
          <div className="wo-flow">
            <div className="wo-flow-title">사용자 입력 → AI 에이전트 오케스트레이션 → 실행 결과 흐름</div>

            {/* 사용자 입력 */}
            <div id="block-user" className={"wo-user-block" + isHighlighted("block-user")}>
              <div className="wo-user-header">
                <div className="wo-avatar">👤</div>
                <div>
                  <div className="wo-user-label">사용자 (현장 작업자 / 관리자)</div>
                  <div className="wo-modes">
                    <span className="wo-mode-voice">🎤 음성 입력</span>
                    <span className="wo-mode-text">⌨️ 텍스트 입력</span>
                  </div>
                </div>
              </div>
              <div className="wo-quote">"{sc.quote}"</div>
            </div>

            <div className="wo-arrow">
              <div className="wo-arrow-line" />
              <div className="wo-arrow-label">STT 변환 · 의도 파악</div>
              <div className="wo-arrow-head" />
            </div>

            {/* 오케스트레이터 */}
            <div id="block-orch" className={"wo-card wo-card-orch" + isHighlighted("block-orch")}>
              <div className="wo-card-header">
                <div className="wo-icon wo-icon-orch">🧠</div>
                <div className="wo-card-title-wrap">
                  <div className="wo-card-title">Master Orchestrator Agent</div>
                  <div className="wo-card-sub">최상위 오케스트레이터 — 의도 분석 · 에이전트 라우팅 · 컨텍스트 관리</div>
                </div>
                <div className="wo-badge wo-badge-orch">ORCHESTRATOR</div>
              </div>
              <div className="wo-card-desc">
                사용자 입력(음성/텍스트)을 NLP로 파싱하여 <strong className="wo-hl-purple">인텐트(Intent)</strong>와{" "}
                <strong className="wo-hl-purple">엔티티(Entity)</strong>를 추출합니다. 온톨로지 기반으로 어떤 도메인
                에이전트가 필요한지 판단하고 작업을 위임합니다. 멀티턴 컨텍스트를 유지하며 대화 흐름을 관리합니다.
              </div>
              <div className="wo-tools">
                {["🔍 NLP / STT Parser","🕸️ Ontology Engine","💬 Context Manager","📡 Agent Router","🔐 Auth & Permission"].map((t) => (
                  <span key={t} className="wo-tool">{t}</span>
                ))}
              </div>
            </div>

            <div className="wo-arrow">
              <div className="wo-arrow-line" />
              <div className="wo-arrow-label">구매 도메인 → 위임</div>
              <div className="wo-arrow-head" />
            </div>

            {/* 구매 에이전트 */}
            <div id="block-purchase" className={"wo-card wo-card-domain" + isHighlighted("block-purchase")}>
              <div className="wo-card-header">
                <div className="wo-icon wo-icon-domain">🛒</div>
                <div className="wo-card-title-wrap">
                  <div className="wo-card-title">Purchase Agent (구매 에이전트)</div>
                  <div className="wo-card-sub">구매 도메인 전문 에이전트 — 발주 생성 · 공급업체 조회 · 승인 요청</div>
                </div>
                <div className="wo-badge wo-badge-domain">DOMAIN AGENT</div>
              </div>
              <div className="wo-card-desc">
                오케스트레이터로부터 위임받은 구매 관련 작업을 수행합니다. 현재 재고 수준을 확인하고, BOM/발주
                기준정보를 참조하여 필요 수량을 계산합니다. 공급업체 마스터를 조회하고 최적 공급업체를 선정하여
                발주서 초안을 생성합니다.
              </div>
              <div className="wo-tools">
                {["📊 재고 조회 API","📄 BOM 참조 Tool","🏢 공급업체 Master DB","📝 발주서 생성 Tool","💰 단가 이력 조회"].map((t) => (
                  <span key={t} className="wo-tool">{t}</span>
                ))}
              </div>
            </div>

            <div className="wo-arrow">
              <div className="wo-arrow-line" />
              <div className="wo-arrow-label">병렬 서브태스크 분배</div>
              <div className="wo-arrow-head" />
            </div>

            {/* 병렬 서브 에이전트 */}
            <div id="block-parallel" className={"wo-parallel" + isHighlighted("block-parallel")}>
              <div className="wo-parallel-label">⚡ 병렬 실행 (Sub-Agents)</div>
              <div className="wo-parallel-grid">
                {[
                  { icon: "📦", title: "Inventory Agent", sub: "재고 수준 분석", desc: "현재 재고, 안전재고, 리드타임 기반 발주 필요량 산출", tools: ["📊 재고 DB","📈 소비량 분석"] },
                  { icon: "🏢", title: "Supplier Agent", sub: "공급업체 선정", desc: "거래 이력·납기·단가 기반 최적 공급업체 자동 추천", tools: ["🏢 업체 Master","📋 거래 이력"] },
                  { icon: "📝", title: "Document Agent", sub: "문서 자동 생성", desc: "발주서·품의서 초안 자동 생성 및 ERP 연동 준비", tools: ["📄 템플릿 Engine","🔗 ERP API"] },
                ].map((a) => (
                  <div key={a.title} className="wo-card wo-card-spec wo-sub-card">
                    <div className="wo-card-header">
                      <div className="wo-icon wo-icon-spec">{a.icon}</div>
                      <div>
                        <div className="wo-card-title wo-card-title-sm">{a.title}</div>
                        <div className="wo-card-sub">{a.sub}</div>
                      </div>
                    </div>
                    <div className="wo-card-desc wo-card-desc-sm">{a.desc}</div>
                    <div className="wo-tools">
                      {a.tools.map((t) => <span key={t} className="wo-tool wo-tool-sm">{t}</span>)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="wo-parallel-bracket" />
            </div>

            <div className="wo-arrow">
              <div className="wo-arrow-line" />
              <div className="wo-arrow-label">결과 집계 → 승인 요청</div>
              <div className="wo-arrow-head" />
            </div>

            {/* 승인 */}
            <div id="block-confirm" className={"wo-confirm" + isHighlighted("block-confirm")}>
              <div className="wo-card-header">
                <div className="wo-icon wo-icon-confirm">✅</div>
                <div className="wo-card-title-wrap">
                  <div className="wo-card-title">사용자 확인 & 승인 (Human-in-the-Loop)</div>
                  <div className="wo-card-sub">AI가 발주 초안을 요약하여 사용자에게 확인 요청</div>
                </div>
                <div className="wo-badge wo-badge-confirm">APPROVAL</div>
              </div>
              <div className="wo-card-desc">
                에이전트가 작성한 발주서 초안을 <strong className="wo-hl-green">음성 또는 화면</strong>으로 요약하여 사용자에게
                제시합니다.
                <br />"원자재 A를 [공급업체명]에 500kg, 단가 3,200원, 총 160만원으로 발주하겠습니다. 진행할까요?"
              </div>
              <div className="wo-tools">
                {["🎤 TTS 음성 안내","📱 모바일 Push","👆 원터치 승인 UI","🔄 수정 요청 처리"].map((t) => (
                  <span key={t} className="wo-tool">{t}</span>
                ))}
              </div>
            </div>

            <div className="wo-arrow">
              <div className="wo-arrow-line" />
              <div className="wo-arrow-label">"응, 진행해" / "승인"</div>
              <div className="wo-arrow-head" />
            </div>

            {/* 결과 */}
            <div id="block-result" className={"wo-result" + isHighlighted("block-result")}>
              <div className="wo-card-header">
                <div className="wo-icon wo-icon-result">🚀</div>
                <div>
                  <div className="wo-result-title">실행 완료 & 결과 피드백</div>
                  <div className="wo-card-sub">모든 작업 자동 실행 후 사용자에게 결과 보고</div>
                </div>
              </div>
              <div className="wo-result-items">
                {["✅ 발주서 생성 완료","✅ ERP 전표 자동 기록","✅ 공급업체 메일 발송","✅ 재고 예약 처리","✅ 담당자 알림 전송","🎤 \"발주가 완료되었습니다\""].map((r) => (
                  <span key={r} className="wo-result-item">{r}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 사이드 패널 */}
          <div className="wo-side">
            <button className="wo-sim-btn" disabled={simRunning} onClick={runSim}>{btnLabel}</button>
            <button className="wo-reset-btn" onClick={reset}>↺ 초기화</button>

            {/* 단계 인디케이터 */}
            <div className="wo-side-section">
              <div className="wo-side-title">진행 단계</div>
              <div className="wo-step-row">
                {[1,2,3,4,5,6].map((n) => (
                  <>
                    <div key={"d"+n} className={stepDotCls(n)}>{n}</div>
                    {n < 6 && <div key={"l"+n} className={stepLineCls(n)} />}
                  </>
                ))}
              </div>
            </div>

            <div className="wo-step-desc">{stepDesc}</div>

            {/* Intent 분석 */}
            <div className="wo-side-title">Intent 분석 (온톨로지)</div>
            <div className="wo-intent-box">
              {([
                ["Intent", intentData?.intent],
                ["Domain", intentData?.domain],
                ["Entity: 품목", intentData?.entityItem],
                ["Entity: 수량", intentData?.entityQty],
                ["권한 검증", intentData?.auth],
              ] as [string, string | undefined][]).map(([k, v]) => (
                <div key={k} className="wo-intent-row">
                  <span className="wo-intent-key">{k}</span>
                  <span className="wo-intent-val">{v ?? "—"}</span>
                </div>
              ))}
              <div style={{ marginTop: 10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span className="wo-conf-label">신뢰도</span>
                  <span className="wo-conf-text">{intentData ? intentData.confidence + "%" : "—"}</span>
                </div>
                <div className="wo-conf-track">
                  <div className="wo-conf-bar" style={{ width: intentData ? intentData.confidence + "%" : "0%" }} />
                </div>
              </div>
            </div>

            {/* 에이전트 상태 */}
            <div className="wo-side-title">에이전트 실행 상태</div>
            <div className="wo-status-box">
              {(Object.keys(AGENT_LABELS) as AgentKey[]).map((key) => {
                const st = stateText(key);
                return (
                  <div key={key} className="wo-status-row">
                    <div className={dotClass(key)} />
                    <span className="wo-status-name">{AGENT_LABELS[key]}</span>
                    <span className={"wo-state " + st.cls}>{st.label}</span>
                  </div>
                );
              })}
            </div>

            {/* 온톨로지 매핑 */}
            <div className="wo-side-title">온톨로지 매핑 구조</div>
            <div className="wo-ontology-box">
              <div className="wo-ontology-title">🕸️ 도메인 → 에이전트 라우팅</div>
              {[
                ["구매/발주","Purchase Agent → Inventory · Supplier · Document Sub-Agents"],
                ["작업지시","Production Agent → Work Order · BOM · Resource Sub-Agents"],
                ["재고이동","Inventory Agent → Location · Transfer · Log Sub-Agents"],
                ["현황조회","Analytics Agent → KPI · Chart · Report Sub-Agents"],
              ].map(([k,v]) => (
                <div key={k} className="wo-ontology-row">
                  <span className="wo-ontology-key">{k}</span>
                  <span className="wo-ontology-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .wo-wrap {
          background: #0a0e1a;
          border-radius: 16px;
          overflow: hidden;
          font-family: 'Pretendard Variable', 'Segoe UI', 'Apple SD Gothic Neo', sans-serif;
          color: #e2e8f0;
        }

        /* 시나리오 탭 */
        .wo-scenario-bar {
          background: #0f172a;
          padding: 14px 24px;
          border-bottom: 1px solid #1e293b;
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
        }
        .wo-scenario-label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .wo-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .wo-tab {
          padding: 6px 16px; border-radius: 8px; font-size: 13px; font-weight: 500;
          cursor: pointer; border: 1px solid #1e293b;
          background: #1e293b; color: #64748b;
          transition: all 0.2s;
        }
        .wo-tab.wo-tab-active {
          background: linear-gradient(135deg, #1d4ed8, #7c3aed);
          border-color: transparent; color: #fff;
          box-shadow: 0 2px 12px #3b82f633;
        }
        .wo-tab:hover:not(.wo-tab-active) { background: #334155; color: #cbd5e1; }

        /* 메인 그리드 */
        .wo-main {
          display: grid;
          grid-template-columns: 1fr 300px;
          min-height: 600px;
        }

        /* 흐름도 */
        .wo-flow { padding: 24px; overflow: auto; }
        .wo-flow-title {
          font-size: 12px; color: #64748b; margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }
        .wo-flow-title::before {
          content: ''; display: block; width: 3px; height: 13px;
          background: linear-gradient(#3b82f6, #8b5cf6); border-radius: 2px;
        }

        /* 사용자 블록 */
        .wo-user-block {
          background: linear-gradient(135deg, #0c1445, #111827);
          border: 1px solid #1e40af;
          border-radius: 14px; padding: 18px 20px; margin-bottom: 8px;
          transition: all 0.25s;
        }
        .wo-user-block:hover { border-color: #3b82f6; box-shadow: 0 0 20px #3b82f622; }
        .wo-user-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .wo-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #1d4ed8, #6d28d9);
          display: flex; align-items: center; justify-content: center; font-size: 14px;
          flex-shrink: 0;
        }
        .wo-user-label { font-size: 11px; color: #60a5fa; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
        .wo-modes { display: flex; gap: 6px; margin-top: 4px; }
        .wo-mode-voice, .wo-mode-text {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 10px; font-size: 10px; font-weight: 600; border: 1px solid;
        }
        .wo-mode-voice { background: #14532d22; border-color: #16a34a; color: #4ade80; }
        .wo-mode-text  { background: #1e3a5f22; border-color: #2563eb; color: #60a5fa; }
        .wo-quote {
          background: #1e293b; border-left: 3px solid #3b82f6; border-radius: 8px;
          padding: 9px 13px; font-size: 13px; color: #e2e8f0; font-style: italic; margin-top: 8px;
        }

        /* 화살표 */
        .wo-arrow {
          display: flex; flex-direction: column; align-items: center;
          height: 40px; position: relative; margin-bottom: 0;
        }
        .wo-arrow-line { width: 2px; flex: 1; background: linear-gradient(to bottom, #3b82f6, #8b5cf6); }
        .wo-arrow-head {
          width: 0; height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 8px solid #8b5cf6;
        }
        .wo-arrow-label {
          position: absolute; left: 50%; transform: translateX(-50%); top: 7px;
          background: #0a0e1a; padding: 2px 7px;
          font-size: 10px; color: #7c3aed; font-weight: 600;
          white-space: nowrap; border-radius: 4px; border: 1px solid #4c1d9533;
        }

        /* 에이전트 카드 */
        .wo-card {
          border-radius: 12px; padding: 16px 20px; margin-bottom: 8px; border: 1px solid;
          transition: all 0.25s;
        }
        .wo-card:hover { transform: translateY(-1px); }
        .wo-card-orch  { background: linear-gradient(135deg,#1a1040,#1e1b4b); border-color: #7c3aed; }
        .wo-card-orch:hover  { border-color: #a78bfa; box-shadow: 0 0 20px #7c3aed22; }
        .wo-card-domain { background: linear-gradient(135deg,#0c1f3f,#0f2a5c); border-color: #2563eb; }
        .wo-card-domain:hover { border-color: #60a5fa; box-shadow: 0 0 20px #3b82f622; }
        .wo-card-spec   { background: linear-gradient(135deg,#0c2340,#0e3058); border-color: #0ea5e9; }
        .wo-card-spec:hover   { border-color: #38bdf8; box-shadow: 0 0 20px #0ea5e922; }
        .wo-sub-card { margin-bottom: 0; }

        .wo-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .wo-icon {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .wo-icon-orch     { background: linear-gradient(135deg,#5b21b6,#7c3aed); }
        .wo-icon-domain   { background: linear-gradient(135deg,#1d4ed8,#2563eb); }
        .wo-icon-spec     { background: linear-gradient(135deg,#0369a1,#0ea5e9); }
        .wo-icon-confirm  { background: linear-gradient(135deg,#065f46,#059669); }
        .wo-icon-result   { background: linear-gradient(135deg,#065f46,#10b981); }

        .wo-card-title-wrap { flex: 1; }
        .wo-card-title    { font-size: 14px; font-weight: 700; color: #f1f5f9; }
        .wo-card-title-sm { font-size: 13px; }
        .wo-card-sub      { font-size: 11px; color: #64748b; margin-top: 1px; }
        .wo-badge {
          padding: 3px 9px; border-radius: 10px;
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0;
        }
        .wo-badge-orch    { background: #4c1d9533; color: #a78bfa; border: 1px solid #7c3aed44; }
        .wo-badge-domain  { background: #1e3a8a33; color: #93c5fd; border: 1px solid #2563eb44; }
        .wo-badge-confirm { background: #06402033; color: #6ee7b7; border: 1px solid #05966944; }
        .wo-card-desc     { font-size: 12px; color: #94a3b8; line-height: 1.6; margin-bottom: 10px; }
        .wo-card-desc-sm  { font-size: 11px; }
        .wo-hl-purple { color: #a78bfa; }
        .wo-hl-green  { color: #4ade80; }

        /* 툴 태그 */
        .wo-tools { display: flex; flex-wrap: wrap; gap: 5px; }
        .wo-tool {
          padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 500;
          background: #1e293b; border: 1px solid #334155; color: #94a3b8;
          transition: all 0.2s;
        }
        .wo-tool:hover { background: #334155; color: #e2e8f0; }
        .wo-tool-sm { font-size: 10px; padding: 2px 7px; }

        /* 병렬 섹션 */
        .wo-parallel { position: relative; margin-bottom: 8px; padding: 12px; background: #0f172a22; border-radius: 14px; }
        .wo-parallel-label { font-size: 11px; color: #7c3aed; font-weight: 700; text-align: center; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .wo-parallel-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .wo-parallel-bracket {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          border: 1px dashed #7c3aed44; border-radius: 14px; pointer-events: none;
        }

        /* 승인 */
        .wo-confirm {
          background: linear-gradient(135deg,#04261a,#065f46);
          border: 1px solid #059669; border-radius: 12px; padding: 16px 20px; margin-bottom: 8px;
          transition: all 0.25s;
        }
        .wo-confirm:hover { border-color: #34d399; box-shadow: 0 0 20px #05966922; }

        /* 결과 */
        .wo-result {
          background: linear-gradient(135deg,#0c1f0c,#14532d);
          border: 1px solid #16a34a; border-radius: 12px; padding: 16px 20px;
        }
        .wo-result-title { font-size: 14px; font-weight: 700; color: #4ade80; }
        .wo-result-items { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
        .wo-result-item {
          display: flex; align-items: center; gap: 5px;
          background: #14532d44; border: 1px solid #16a34a44;
          padding: 5px 10px; border-radius: 7px; font-size: 11px; color: #86efac;
        }

        /* 하이라이트 */
        .wo-highlight { animation: wo-glow 0.6s ease-out; }
        @keyframes wo-glow {
          0%   { box-shadow: 0 0 0px #3b82f600; }
          50%  { box-shadow: 0 0 28px #3b82f666; }
          100% { box-shadow: none; }
        }

        /* 사이드 패널 */
        .wo-side {
          background: #0f172a; border-left: 1px solid #1e293b;
          padding: 20px 16px; overflow-y: auto;
        }
        .wo-side-section { margin: 14px 0 8px; }
        .wo-side-title {
          font-size: 11px; color: #64748b; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1px;
          margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
        }
        .wo-side-title::before {
          content: ''; display: block; width: 3px; height: 11px;
          background: #8b5cf6; border-radius: 2px;
        }

        /* 시뮬레이션 버튼 */
        .wo-sim-btn {
          width: 100%; padding: 11px;
          background: linear-gradient(135deg,#1d4ed8,#7c3aed);
          border: none; border-radius: 9px; color: #fff; font-size: 13px; font-weight: 700;
          cursor: pointer; margin-bottom: 10px; transition: all 0.2s; letter-spacing: 0.5px;
        }
        .wo-sim-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 14px #3b82f633; }
        .wo-sim-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .wo-reset-btn {
          width: 100%; padding: 9px;
          background: transparent; border: 1px solid #334155;
          border-radius: 9px; color: #64748b; font-size: 12px; cursor: pointer; transition: all 0.2s;
        }
        .wo-reset-btn:hover { border-color: #475569; color: #94a3b8; }

        /* 단계 인디케이터 */
        .wo-step-row { display: flex; align-items: center; gap: 5px; margin-bottom: 16px; }
        .wo-sdot {
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; border: 2px solid; flex-shrink: 0;
          transition: all 0.3s;
        }
        .wo-sdot-done    { background: #10b981; border-color: #10b981; color: #fff; }
        .wo-sdot-active  { background: #3b82f6; border-color: #3b82f6; color: #fff; box-shadow: 0 0 8px #3b82f6; }
        .wo-sdot-pending { background: transparent; border-color: #334155; color: #475569; }
        .wo-sline { flex: 1; height: 1px; background: #1e293b; min-width: 6px; transition: background 0.4s; }
        .wo-sline-done  { background: linear-gradient(90deg,#10b981,#3b82f6); }

        /* 단계 설명 */
        .wo-step-desc {
          font-size: 11px; color: #94a3b8; line-height: 1.6;
          background: #1e293b; border-radius: 8px; padding: 9px 11px;
          border: 1px solid #334155; margin-bottom: 14px;
        }

        /* Intent */
        .wo-intent-box { background: #1e293b; border-radius: 10px; padding: 14px; margin-bottom: 14px; border: 1px solid #334155; }
        .wo-intent-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #0f172a; }
        .wo-intent-row:last-of-type { border-bottom: none; }
        .wo-intent-key { font-size: 11px; color: #64748b; }
        .wo-intent-val { font-size: 11px; font-weight: 600; color: #a78bfa; }
        .wo-conf-label { font-size: 11px; color: #64748b; }
        .wo-conf-text  { font-size: 11px; color: #a78bfa; }
        .wo-conf-track { height: 4px; background: #0f172a; border-radius: 2px; }
        .wo-conf-bar   { height: 100%; border-radius: 2px; background: linear-gradient(90deg,#3b82f6,#8b5cf6); transition: width 0.8s ease; }

        /* 상태 */
        .wo-status-box  { background: #1e293b; border-radius: 10px; padding: 14px; margin-bottom: 14px; border: 1px solid #334155; }
        .wo-status-row  { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px solid #0f172a; }
        .wo-status-row:last-child { border-bottom: none; }
        .wo-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; transition: all 0.3s; }
        .wo-dot-idle   { background: #374151; }
        .wo-dot-active { background: #3b82f6; box-shadow: 0 0 5px #3b82f6; animation: wo-pulse 1.5s infinite; }
        .wo-dot-done   { background: #10b981; }
        @keyframes wo-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .wo-status-name { font-size: 11px; color: #cbd5e1; flex: 1; }
        .wo-state       { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .wo-state-idle   { color: #374151; }
        .wo-state-active { color: #60a5fa; }
        .wo-state-done   { color: #34d399; }

        /* 온톨로지 */
        .wo-ontology-box   { background: #1e293b; border-radius: 10px; padding: 14px; border: 1px solid #334155; }
        .wo-ontology-title { font-size: 12px; font-weight: 700; color: #e2e8f0; margin-bottom: 9px; }
        .wo-ontology-row   { display: flex; align-items: flex-start; gap: 8px; padding: 7px 0; border-bottom: 1px solid #0f172a; font-size: 11px; }
        .wo-ontology-row:last-child { border-bottom: none; }
        .wo-ontology-key { color: #60a5fa; font-weight: 600; min-width: 58px; flex-shrink: 0; }
        .wo-ontology-val { color: #94a3b8; line-height: 1.5; }

        @media (max-width: 860px) {
          .wo-main { grid-template-columns: 1fr; }
          .wo-side { border-left: none; border-top: 1px solid #1e293b; }
          .wo-parallel-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
