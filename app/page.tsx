"use client";

import { useState } from "react";
import { Search, ChevronDown, Paperclip, Download } from "lucide-react";
import Image from "next/image";

const notices = [
  {
    id: 1,
    badge: "중요",
    title: "Wonn Factory MES 발표자료 및 데모 영상 공개",
    date: "2026.04.14",
    hasAttachment: true,
  },
  {
    id: 2,
    badge: "공지",
    title: "2026 스마트공장 보급·확산 사업 연계 MES 지원 안내",
    date: "2026.04.10",
    hasAttachment: false,
  },
  {
    id: 3,
    badge: "공지",
    title: "Wonn Factory MES 시스템 유지보수 일정 공지 (4월)",
    date: "2026.04.05",
    hasAttachment: false,
  },
  {
    id: 4,
    badge: "공지",
    title: "제조 데이터 통합 관리 웨비나 참가자 모집 (마감임박)",
    date: "2026.03.28",
    hasAttachment: true,
  },
  {
    id: 5,
    badge: "공지",
    title: "1분기 MES 업데이트 내역 및 신기능 소개",
    date: "2026.03.15",
    hasAttachment: false,
  },
];

const faqs = [
  {
    id: 2,
    question: "[시장 현황] 국내 중소 제조기업의 MES 도입 현황은 어떻게 되나요?",
    answer:
      "중소벤처기업부 스마트제조혁신 실태조사(2025)에 따르면, 국내 중소제조기업의 스마트공장 도입률은 19.5%에 불과하며, 그 중 MES를 실질적으로 활용하는 비율은 14.4%에 그칩니다.\n\n즉, 국내 16만여 공장을 보유한 중소제조기업의 80% 이상이 아직도 수작업·엑셀 중심으로 생산을 관리하고 있습니다.\n\n글로벌 MES 시장은 2026년 약 183억 달러(약 25조 원) 규모로 성장 중이나, 자연어·음성 기반 AI Agent를 핵심으로 한 SaaS형 솔루션은 아직 초기 단계입니다. 이 80% 이상의 미도입 기업이 Wonn Factory MES의 직접적인 잠재 수요처입니다.",
  },
  {
    id: 3,
    question: "[차별점] 기존 MES와 Wonn Factory MES는 무엇이 다른가요?",
    answer:
      '기존 MES의 두 가지 핵심 장벽을 해결합니다.\n\n① 기준정보 세팅의 복잡성\nBOM·ROUTING 등 기준정보 등록에 IT 전문 인력이 수개월을 투입해야 하며, 추가 컨설팅 비용까지 발생합니다. 전담 IT 인력을 보유한 중소기업은 전체의 19.5%에 불과합니다.\n\n② 현장 작업자의 접근성 한계\n50대 이상이 다수인 제조 현장에서 복잡한 화면과 키보드 입력은 높은 진입 장벽입니다. 실적 입력이 지연되며 재고 오류, 불량률 증가로 이어집니다.\n\nWonn Factory MES는 자연어·음성 명령("A품목 100개 작업지시 만들어줘", "현재고 알려줘")으로 작업지시 생성, 재고 조회, 생산 현황 확인 등 핵심 기능을 실행할 수 있어 이 두 장벽을 근본적으로 제거합니다.\n\n국내 주요 경쟁사(엠아이큐브, HD솔루션즈, 비젠트로 등)는 대부분 구축형·전통 UI 중심으로 자연어·음성 AI Agent 기능이 거의 없고 초기 도입 비용이 높아 중소기업 진입이 제한적입니다.',
  },
  {
    id: 4,
    question: "[기능] 음성으로 재고 이동도 처리할 수 있나요?",
    answer:
      '네, 가능합니다. 현장에서 흔히 발생하는 상황 — 예를 들어 옆 창고에서 볼트 2개를 가져가거나 공장 간 소량 이동이 발생했을 때, 별도 화면을 찾아 창고이동·공장이동 메뉴를 조작하는 번거로움 때문에 재고 불일치가 빈번하게 생깁니다.\n\nWonn Factory MES에서는 담당자가 마이크를 통해 "B공장으로 볼트 2개 이동"이라고 말하는 것만으로 공장이동 트랜잭션이 발생합니다. 특정 권한을 가진 담당자에게만 음성 마이크를 지급하여 보안을 유지하면서도, 현장에서 즉시 재고를 정확하게 기록할 수 있어 재고 관리 정확도를 획기적으로 높일 수 있습니다.',
  },
  {
    id: 5,
    question: "[요금제] 이용 요금은 어떻게 되나요?",
    answer:
      "Tiered Subscription + AI 사용량(토큰) 과금의 하이브리드 모델로 운영됩니다.\n\n• Basic: 월 25,000원 — 소규모 공장 대상, 월 5,000회 초과 시 100회당 100원\n• Pro: 월 100,000원 — 월 50,000회 초과 시 100회당 70원\n• Business: 월 590,000원 — 월 500,000회 초과 시 100회당 50원\n• Enterprise: 월 150~200만 원 + 독립 서버 — 구조적 커스텀 로직·전용 인스턴스 별도 협의\n\n초기에는 저가형 Basic으로 빠르게 고객 수를 확보하고, 사용량 증가 및 고도화 요구 시 Enterprise 티어로 전환하여 고마진 수익을 실현하는 구조입니다.\n\n2026년 MVP 완성 후 중기부·지자체 스마트공장 구축 지원사업을 통해 무상 파일럿(1~3개사)을 진행하며, 2027년부터 유료 전환을 확대할 계획입니다.",
  },
];

const ideaImages = [
  {
    src: "/idea_1.png",
    alt: "아이디어 1",
    title: "Wonn-Factory-MES",
    desc: "말 한마디로 작동하는 AI 제조실행시스템. 국내 중소제조기업 80%가 아직 수작업·엑셀로 생산관리 중이며, 이 시장을 음성·자연어 기반 SaaS MES로 공략합니다.",
  },
  {
    src: "/idea_2.png",
    alt: "아이디어 2",
    title: "기존 MES와 무엇이 다른가?",
    desc: "기존 MES의 3가지 핵심 장벽(복잡한 UI·고비용·현장 접근성 한계)을 Wonn이 어떻게 해결하는지 직접 비교합니다. 자연어·음성 AI 인터페이스가 핵심 차별점입니다.",
  },
  {
    src: "/idea_3.png",
    alt: "아이디어 3",
    title: "핵심 기술 ① 음성·자연어 AI Agent",
    desc: "음성 입력 → STT → LLM 의도 파악 → MES 실행 → 음성 응답까지 5단계 처리 흐름. '양품 100개 생성', 'B공장으로 볼트 2개 이동' 등 실제 현장 시나리오 4가지를 함께 제시합니다.",
  },
  {
    src: "/idea_4.png",
    alt: "아이디어 4",
    title: "핵심 기술 ② 이중 AI 엔진·기술 아키텍처",
    desc: "대화형 명령 AI(LLM 기반)와 불량 예측 AI(IoT 센서·생산 이력 기반) 두 엔진이 같은 DB를 공유하며 동시에 작동하는 구조. 현장 인터페이스부터 데이터·예측까지 4 Layer 아키텍처를 정리합니다.",
  },
  {
    src: "/idea_5.png",
    alt: "아이디어 5",
    title: "고객 성장 여정 (₩25,000 맛보기 → Enterprise)",
    desc: "월 25,000원으로 진입장벽을 낮추고, Pro/Business 확장 → 정부 지원사업 연계 IoT 연결 → Enterprise 전환까지 이어지는 4단계 고객 성장 구조를 보여줍니다.",
  },
  {
    src: "/idea_6.png",
    alt: "아이디어 6",
    title: "성장 로드맵 (2026~)",
    desc: "2026년 MVP·파일럿 완성부터 2030년 이후 제조 AI 플랫폼화까지 Phase 1~4 목표와 핵심 마일스톤을 타임라인으로 정리합니다.",
  },
];

export default function Home() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#FAFBFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <Image
                  src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo.png`}
                  alt="Wonn Factory"
                  width={120}
                  height={36}
                  className="h-9 w-auto object-contain"
                  priority
                />
              </div>
              <nav className="hidden md:flex items-center gap-6">
                <a
                  href="#"
                  className="text-sm text-gray-700 hover:text-primary font-medium"
                >
                  시작은 이렇게
                </a>
                <a
                  href="#video"
                  className="text-sm text-gray-700 hover:text-primary font-medium flex items-center gap-1"
                >
                  발표 영상
                </a>
                <a
                  href="#resources"
                  className="text-sm text-gray-700 hover:text-primary font-medium flex items-center gap-1"
                >
                  자료실
                </a>
                <a
                  href="#faq"
                  className="text-sm text-gray-700 hover:text-primary font-medium flex items-center gap-1"
                >
                  FAQ <ChevronDown className="w-4 h-4" />
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-sm text-gray-700 hover:text-primary font-medium">로그인</button>
              <a
                href="/Wonn-Factory-MES.pptx"
                download
                className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                자료 받기
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ── 아이디어 갤러리 ── */}
        <section id="ideas" className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">아이디어</h2>
          <div className="h-1 w-full bg-primary mb-8" />

          <div className="grid grid-cols-3 grid-rows-2 gap-4">
            {ideaImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxSrc(img.src)}
                className="overflow-hidden rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary text-left"
              >
                <div className="px-4 pt-4 pb-3">
                  <p className="text-sm font-bold text-gray-900 leading-snug">{img.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{img.desc}</p>
                </div>
                <div className="relative w-full aspect-video">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${img.src}`}
                    alt={img.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── 발표 영상 ── */}
        <section
          id="video"
          className="mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-2">발표 영상</h2>
          <div className="h-1 w-full bg-primary mb-8" />

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div
              className="relative w-full"
              style={{ paddingBottom: "56.25%" }}
            >
              <video
                controls
                preload="metadata"
                className="absolute top-0 left-0 w-full h-full object-contain bg-black"
              >
                <source
                  src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/발표_cowork.mp4`}
                  type="video/mp4"
                />
                이 브라우저는 동영상 재생을 지원하지 않습니다.
              </video>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-800">Wonn Factory MES 협업 사례 발표</p>
              <p className="text-xs text-gray-400 mt-1">발표_cowork.mp4</p>
            </div>
          </div>
        </section>

        {/* ── 첨부 자료 ── */}
        <section
          id="resources"
          className="mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-2">첨부 자료</h2>
          <div className="h-1 w-full bg-primary mb-8" />

          <div className="bg-white rounded-lg shadow-sm">
            <a
              href="/Wonn-Factory-MES.pptx"
              download
              className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors group no-underline"
            >
              <div className="flex items-center gap-4">
                {/* PPT icon */}
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #C0392B, #E74C3C)" }}
                >
                  PPT
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    Wonn-Factory-MES.pptx
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Microsoft PowerPoint · MES 소개 발표자료</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-primary font-semibold text-sm flex-shrink-0">
                <Download className="w-5 h-5" />
                다운로드
              </div>
            </a>
          </div>
        </section>

        {/* ── 아이디어 FAQ ── */}
        <section id="faq">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">아이디어 FAQ</h2>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-primary text-xl font-bold flex-shrink-0">Q.</span>
                    <span className="text-gray-900 font-medium">{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-4 ${
                      openFAQ === faq.id ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFAQ === faq.id && (
                  <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
                    <div className="flex gap-3">
                      <span className="text-primary text-xl font-bold flex-shrink-0">A.</span>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── 라이트박스 ── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setLightboxSrc(null)}
        >
          <div
            className="relative"
            style={{ width: "80vw", height: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxSrc(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors flex items-center gap-1 text-sm font-medium"
              aria-label="닫기"
            >
              <span>✕</span>
              <span>닫기</span>
            </button>
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${lightboxSrc}`}
              alt="아이디어 이미지 확대"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Recent Notice */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200 flex-wrap">
            <span className="text-gray-600 font-medium">📢 공지사항</span>
            <span className="text-gray-900">Wonn Factory MES 발표자료 및 데모 영상 공개</span>
            <Paperclip className="w-4 h-4 text-gray-400" />
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <a
                href="#"
                className="hover:text-primary"
              >
                Wonn Factory 소개
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="#"
                className="hover:text-primary"
              >
                서비스약관
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="#"
                className="hover:text-primary"
              >
                개인정보 처리방침
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="#faq"
                className="hover:text-primary"
              >
                FAQ / 공지사항
              </a>
            </div>
            <div className="text-gray-600 text-sm">
              <span className="font-medium">문의: info@wonnfactory.com</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Download Button */}
      <a
        href="/Wonn-Factory-MES.pptx"
        download
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
        title="자료 다운로드"
      >
        <Download className="w-6 h-6" />
      </a>
    </div>
  );
}
