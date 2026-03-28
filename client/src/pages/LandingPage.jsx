import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Database,
  FileCheck2,
  Fingerprint,
  LayoutTemplate,
  Mail,
  Menu,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const navItems = [
  { label: "Product", href: "#product" },
  { label: "Flow", href: "#flow" },
  { label: "Scale", href: "#scale" },
  { label: "Security", href: "#security" },
];

const flowSteps = [
  {
    icon: Database,
    title: "Ingest Data",
    copy: "Upload CSV, XLSX, and JSON batches with field mapping and instant validation.",
  },
  {
    icon: LayoutTemplate,
    title: "Design",
    copy: "Create premium certificate templates with placeholders, signatures, and branding.",
  },
  {
    icon: Mail,
    title: "Issue",
    copy: "Generate and email large credential batches with tracked delivery status.",
  },
  {
    icon: BadgeCheck,
    title: "Verify",
    copy: "Every certificate gets a verifiable public ID and QR proof endpoint.",
  },
];

const pricingCards = [
  {
    name: "Starter",
    price: "$199",
    unit: "/mo",
    highlight: false,
    items: [
      "Up to 1,000 certificates",
      "Template studio",
      "Public verification pages",
      "Email support",
    ],
  },
  {
    name: "Enterprise",
    price: "$899",
    unit: "/mo",
    highlight: true,
    items: [
      "Unlimited issuance",
      "Full API and automation",
      "Priority delivery pipeline",
      "24/7 premium support",
    ],
  },
  {
    name: "Custom",
    price: "Quote",
    unit: "",
    highlight: false,
    items: [
      "Dedicated infrastructure",
      "Advanced compliance workflows",
      "Private deployment options",
      "Custom SLA agreement",
    ],
  },
];

const personalProfile = {
  name: "Jayram Sangawat",
  title: "Creator, CertifyPro",
  bio: "Building smooth, premium digital credential experiences for institutions and modern teams.",
  links: [
    { label: "Portfolio", href: "https://jayram.me" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/jayram-s-6b1865293/" },
    { label: "GitHub", href: "https://github.com/jayramgit94" },
    { label: "Email", href: "mailto:sangawatjayram@gmail.com" },
  ],
};

function SectionLabel({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d0bcff]">
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function FloatingGem({ className, delay = 0, tone = "", reduceMotion = false }) {
  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
      animate={
        reduceMotion
          ? undefined
          : { y: [0, -18, 0], rotate: [0, 10, 0], rotateZ: [0, -8, 0] }
      }
      transition={
        reduceMotion
          ? undefined
          : { duration: 8, repeat: Infinity, ease: "easeInOut", delay }
      }
    >
      <div
        className={`relative h-24 w-24 rounded-[28%] bg-gradient-to-br ${tone} shadow-[0_22px_40px_rgba(0,0,0,0.35)] [transform:rotateX(52deg)_rotateZ(22deg)]`}
        style={{ clipPath: "polygon(50% 0%, 100% 35%, 82% 100%, 18% 100%, 0% 35%)" }}
      >
        <div className="absolute inset-2 rounded-[22%] border border-white/25 bg-white/10 backdrop-blur-sm" />
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [cursorPressed, setCursorPressed] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const heroRef = useRef(null);
  const flowRef = useRef(null);
  const productRef = useRef(null);
  const scaleRef = useRef(null);
  const securityRef = useRef(null);
  const ctaRef = useRef(null);
  const footerRef = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), {
    stiffness: 150,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), {
    stiffness: 150,
    damping: 18,
  });

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const cursorSmoothX = useSpring(cursorX, { stiffness: 320, damping: 30 });
  const cursorSmoothY = useSpring(cursorY, { stiffness: 320, damping: 30 });
  const cursorScale = useSpring(cursorPressed ? 1.45 : 1, {
    stiffness: 240,
    damping: 18,
  });

  const { scrollYProgress } = useScroll();
  const { scrollYProgress: heroSectionProgress } = useScroll({
    target: heroRef,
    offset: ["start end", "end start"],
  });
  const { scrollYProgress: flowSectionProgress } = useScroll({
    target: flowRef,
    offset: ["start end", "end start"],
  });
  const { scrollYProgress: productSectionProgress } = useScroll({
    target: productRef,
    offset: ["start end", "end start"],
  });
  const { scrollYProgress: scaleSectionProgress } = useScroll({
    target: scaleRef,
    offset: ["start end", "end start"],
  });
  const { scrollYProgress: securitySectionProgress } = useScroll({
    target: securityRef,
    offset: ["start end", "end start"],
  });
  const { scrollYProgress: ctaSectionProgress } = useScroll({
    target: ctaRef,
    offset: ["start end", "end start"],
  });
  const { scrollYProgress: footerSectionProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  });

  const scrollLineScale = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
  });
  const heroY = useSpring(useTransform(heroSectionProgress, [0, 1], [34, -58]), {
    stiffness: 90,
    damping: 24,
  });
  const heroOpacity = useTransform(heroSectionProgress, [0, 0.5, 1], [0.92, 1, 0.86]);
  const heroCardsY = useSpring(useTransform(heroSectionProgress, [0, 1], [38, -36]), {
    stiffness: 90,
    damping: 24,
  });
  const flowY = useSpring(useTransform(flowSectionProgress, [0, 1], [42, -42]), {
    stiffness: 90,
    damping: 24,
  });
  const productY = useSpring(useTransform(productSectionProgress, [0, 1], [46, -46]), {
    stiffness: 90,
    damping: 24,
  });
  const scaleY = useSpring(useTransform(scaleSectionProgress, [0, 1], [40, -40]), {
    stiffness: 90,
    damping: 24,
  });
  const securityY = useSpring(useTransform(securitySectionProgress, [0, 1], [34, -30]), {
    stiffness: 90,
    damping: 24,
  });
  const ctaY = useSpring(useTransform(ctaSectionProgress, [0, 1], [44, -28]), {
    stiffness: 90,
    damping: 24,
  });
  const footerWordY = useSpring(useTransform(footerSectionProgress, [0, 1], [180, 0]), {
    stiffness: 80,
    damping: 24,
  });

  const heroProgress = useMemo(() => [88, 73, 96, 81], []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer || shouldReduceMotion) {
      return undefined;
    }

    setShowCursor(true);

    const onMove = (event) => {
      cursorX.set(event.clientX);
      cursorY.set(event.clientY);
    };
    const onDown = () => setCursorPressed(true);
    const onUp = () => setCursorPressed(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, [cursorX, cursorY, shouldReduceMotion]);

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    x.set(px);
    y.set(py);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className={`relative min-h-screen overflow-x-hidden bg-[var(--cp-bg)] text-[var(--cp-text)] font-['Sora'] ${shouldReduceMotion ? "" : "md:cursor-none"}`}>
      <motion.div
        className="fixed left-0 top-0 z-[80] h-[2px] w-full origin-left bg-gradient-to-r from-[var(--cp-primary)] via-[var(--cp-secondary-soft)] to-[var(--cp-primary-strong)]"
        style={{ scaleX: scrollLineScale }}
      />

      <div className="pointer-events-none absolute inset-0 soft-noise">
        <motion.div
          className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-[var(--cp-primary-strong)]/25 blur-[120px]"
          animate={shouldReduceMotion ? undefined : { x: [0, 30, 0], y: [0, -20, 0] }}
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 12, repeat: Infinity, ease: "easeInOut" }
          }
        />
        <motion.div
          className="absolute right-[-7rem] top-[16rem] h-[24rem] w-[24rem] rounded-full bg-[var(--cp-secondary)]/20 blur-[110px]"
          animate={shouldReduceMotion ? undefined : { x: [0, -35, 0], y: [0, 25, 0] }}
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 14, repeat: Infinity, ease: "easeInOut" }
          }
        />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:120px_120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_45%)]" />
      </div>

      {showCursor && (
        <>
          <motion.div
            className="pointer-events-none fixed left-0 top-0 z-[90] hidden h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white mix-blend-difference md:block"
            style={{ x: cursorSmoothX, y: cursorSmoothY, scale: cursorScale }}
          />
          <motion.div
            className="pointer-events-none fixed left-0 top-0 z-[89] hidden h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/55 mix-blend-difference md:block"
            style={{ x: cursorSmoothX, y: cursorSmoothY }}
          />
        </>
      )}

      <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-white/10 bg-[#0f1118]/70 px-4 py-3 backdrop-blur-xl sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#d0bcff] to-[#a078ff] text-[#23005c] shadow-[0_14px_30px_rgba(160,120,255,0.35)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-2xl leading-none tracking-tight text-white font-['Cormorant_Garamond']">
              CertifyPro
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-base tracking-tight text-[#cbc3d7] transition hover:text-white font-['Cormorant_Garamond']"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#cbc3d7] transition hover:bg-white/5 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-[#d0bcff] px-5 py-2.5 text-sm font-extrabold text-[#3c0091] transition hover:scale-[1.02]"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white sm:hidden"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mx-auto mt-3 w-full max-w-6xl rounded-3xl border border-white/10 bg-[#17181f]/95 p-5 backdrop-blur"
          >
            <div className="space-y-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm text-[#cbc3d7] transition hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
              <div className="flex gap-3 pt-2">
                <Link
                  to="/login"
                  className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-center text-sm font-semibold text-[#cbc3d7]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex-1 rounded-xl bg-[#d0bcff] px-4 py-2.5 text-center text-sm font-bold text-[#3c0091]"
                >
                  Start
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      <main className="relative z-10">
        <section ref={heroRef} className="relative mx-auto min-h-screen w-full max-w-7xl px-6 pb-24 pt-36 sm:pb-28 md:pt-44 lg:pb-36">
          <FloatingGem
            delay={0.2}
            className="left-[2%] top-[22%] hidden lg:block"
            tone="from-[#e9ddff]/80 to-[#d0bcff]/20"
            reduceMotion={shouldReduceMotion}
          />
          <FloatingGem
            delay={0.6}
            className="right-[4%] top-[26%] hidden md:block"
            tone="from-[#6ffbbe]/70 to-[#00a572]/25"
            reduceMotion={shouldReduceMotion}
          />
          <FloatingGem
            delay={0.95}
            className="right-[12%] bottom-[10%] hidden xl:block"
            tone="from-[#ffdcbb]/70 to-[#ca801e]/20"
            reduceMotion={shouldReduceMotion}
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            style={shouldReduceMotion ? undefined : { y: heroY, opacity: heroOpacity }}
            className="mx-auto max-w-5xl text-center"
          >
            <SectionLabel>Digital Credential Infrastructure</SectionLabel>
            <h1 className="mt-10 text-[3rem] font-semibold leading-[0.92] tracking-tight text-white sm:text-[4.2rem] lg:text-[6.4rem] font-['Cormorant_Garamond']">
              Credentials That Move
              <br />
              <span className="font-light italic text-[#d0bcff]">With Authority.</span>
            </h1>
            <p className="mx-auto mt-9 max-w-3xl text-base leading-relaxed text-[#cbc3d7] sm:text-lg lg:text-xl">
              CertifyPro gives teams a single system to design templates, process
              recipients, issue certificates at scale, and verify authenticity through
              secure IDs and QR proof in seconds.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#d0bcff] to-[#a078ff] px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-[#3c0091] shadow-[0_18px_45px_rgba(160,120,255,0.35)] transition hover:scale-[1.02]"
              >
                Issue First Certificate
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#flow"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                <PlayCircle className="h-4 w-4 text-[#4edea3]" />
                View Workflow
              </a>
            </div>

            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                "3D-like interactive dashboard preview",
                "Realtime batch issuance visibility",
                "Fast public trust verification layer",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-[0.12em] text-[#cbc3d7]"
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            style={shouldReduceMotion ? undefined : { y: heroCardsY }}
            className="relative mx-auto mt-16 max-w-5xl [perspective:1200px] sm:mt-24"
          >
            <motion.div
              style={
                shouldReduceMotion
                  ? { transformStyle: "preserve-3d" }
                  : {
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                  }
              }
              onMouseMove={handlePointerMove}
              onMouseLeave={handlePointerLeave}
              className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(53,52,55,0.8),rgba(19,19,21,0.95))] p-6 shadow-[0_40px_90px_rgba(0,0,0,0.45)] sm:p-8 gpu will-transform"
            >
              <div className="relative rounded-3xl border border-white/10 bg-[#201f22]/60 p-6 backdrop-blur-xl sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[#958ea0]">Credential Activity</p>
                    <h2 className="mt-2 text-3xl text-white font-['Cormorant_Garamond']">Realtime Issuance</h2>
                  </div>
                  <span className="rounded-full bg-[#4edea3]/20 px-3 py-1 text-xs font-semibold text-[#6ffbbe]">
                    Live
                  </span>
                </div>

                <div className="mt-8 space-y-4">
                  {heroProgress.map((value, index) => (
                    <div key={value} className="flex items-center gap-3">
                      <span className="w-20 text-xs uppercase tracking-[0.14em] text-[#958ea0]">
                        Batch {index + 1}
                      </span>
                      <div className="h-2.5 flex-1 rounded-full bg-white/10">
                        <motion.div
                          className="h-2.5 rounded-full bg-gradient-to-r from-[#d0bcff] to-[#4edea3]"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.85, delay: 0.12 * index }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold text-[#cbc3d7]">
                        {value}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    "GridFS file integrity",
                    "Role-based access",
                    "Public QR verification",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#cbc3d7]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section ref={flowRef} id="flow" className="bg-[#0f1014] px-6 py-24">
          <motion.div style={shouldReduceMotion ? undefined : { y: flowY }} className="mx-auto w-full max-w-7xl will-transform">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
            >
              <h2 className="text-5xl leading-[0.95] text-white sm:text-6xl lg:text-7xl font-['Cormorant_Garamond']">
                A seamless path
                <br />
                <span className="font-light italic text-[#4edea3]">to trust.</span>
              </h2>
              <p className="max-w-md text-[#cbc3d7]">
                Every workflow step is connected from data ingestion to public
                authenticity proof with one continuous operational chain.
              </p>
            </motion.div>

            <div className="relative grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent md:block" />
              {flowSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : { y: -8, rotateX: 3, rotateY: index % 2 ? -2.5 : 2.5 }
                  }
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="group relative rounded-3xl border border-white/10 bg-[#1c1b1d]/70 p-6 backdrop-blur"
                >
                  <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top,rgba(208,188,255,0.18),transparent_55%)] opacity-0 transition duration-300 group-hover:opacity-100" />
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-[#d0bcff]">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <p className="mt-5 text-sm uppercase tracking-[0.22em] text-[#958ea0]">
                    0{index + 1}
                  </p>
                  <h3 className="mt-2 text-2xl text-white font-['Cormorant_Garamond']">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#cbc3d7]">{step.copy}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section ref={productRef} id="product" className="px-6 py-24">
          <motion.div
            style={shouldReduceMotion ? undefined : { y: productY }}
            className="mx-auto grid w-full max-w-7xl gap-6 md:grid-cols-6 md:grid-rows-2 will-transform"
          >
            <motion.article
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              whileHover={shouldReduceMotion ? undefined : { y: -8, rotateX: 2, rotateY: -2 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#201f22]/70 p-8 md:col-span-3 md:row-span-2"
            >
              <div className="absolute bottom-[-70px] right-[-70px] h-64 w-64 rounded-full bg-[#d0bcff]/20 blur-3xl transition duration-500 group-hover:scale-125" />
              <Rocket className="h-10 w-10 text-[#4edea3]" />
              <h3 className="mt-8 text-4xl leading-tight text-white font-['Cormorant_Garamond']">
                Scale Without
                <br />
                Friction
              </h3>
              <p className="mt-6 max-w-sm text-[#cbc3d7]">
                Generate and deliver credential batches at enterprise speed with
                retry-safe processing and consistent audit visibility.
              </p>
              <div className="mt-12 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#958ea0]">Hourly Throughput</p>
                  <p className="mt-2 text-2xl text-white font-['Cormorant_Garamond']">250K+</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#958ea0]">Queue Stability</p>
                  <p className="mt-2 text-2xl text-white font-['Cormorant_Garamond']">99.9%</p>
                </div>
              </div>
            </motion.article>

            <motion.article
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              whileHover={shouldReduceMotion ? undefined : { y: -6, rotateX: 2, rotateY: 2 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="group relative rounded-3xl border border-white/10 bg-[#201f22]/70 p-8 md:col-span-3"
            >
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_right,rgba(208,188,255,0.16),transparent_58%)] opacity-0 transition duration-300 group-hover:opacity-100" />
              <Workflow className="h-8 w-8 text-[#d0bcff]" />
              <h3 className="mt-4 text-3xl text-white font-['Cormorant_Garamond']">Automation Core</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#cbc3d7]">
                End-to-end automation across imports, generation, and delivery with
                recipient-ready output and status telemetry.
              </p>
            </motion.article>

            <motion.article
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              whileHover={shouldReduceMotion ? undefined : { y: -6, rotateX: 2, rotateY: -2 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="group relative rounded-3xl border border-white/10 bg-[#201f22]/70 p-8 md:col-span-3"
            >
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_bottom_left,rgba(78,222,163,0.16),transparent_58%)] opacity-0 transition duration-300 group-hover:opacity-100" />
              <FileCheck2 className="h-8 w-8 text-[#4edea3]" />
              <h3 className="mt-4 text-3xl text-white font-['Cormorant_Garamond']">Trust Layer</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#cbc3d7]">
                Unique certificate IDs, QR links, and verification endpoints give
                each credential durable and tamper-resistant proof.
              </p>
            </motion.article>
          </motion.div>
        </section>

        <section ref={scaleRef} id="scale" className="bg-[#101115] px-6 py-24">
          <motion.div style={shouldReduceMotion ? undefined : { y: scaleY }} className="mx-auto w-full max-w-7xl will-transform">
            <div className="mb-14 text-center">
              <SectionLabel>Infrastructure Pricing</SectionLabel>
              <h2 className="mt-6 text-5xl text-white sm:text-6xl lg:text-7xl font-['Cormorant_Garamond']">
                Predictable growth
                <span className="font-light italic text-[#d0bcff]"> economics.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[#cbc3d7]">
                Flexible plans for institutions, training companies, and enterprise
                operations teams.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {pricingCards.map((plan, index) => (
                <motion.article
                  key={plan.name}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : { y: -8, rotateX: 2.5, rotateY: index % 2 ? -2 : 2 }
                  }
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className={`group relative rounded-3xl border p-8 backdrop-blur ${
                    plan.highlight
                      ? "scale-[1.02] border-[#d0bcff]/40 bg-[#221f2f]/80 shadow-[0_24px_65px_rgba(160,120,255,0.3)]"
                      : "border-white/10 bg-[#1c1b1d]/70"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top,rgba(208,188,255,0.16),transparent_60%)] opacity-0 transition duration-300 group-hover:opacity-100" />
                  <h3 className="text-3xl text-white font-['Cormorant_Garamond']">{plan.name}</h3>
                  <p className="mt-4 text-5xl text-white font-['Cormorant_Garamond']">
                    {plan.price}
                    <span className="ml-1 text-lg text-[#958ea0]">{plan.unit}</span>
                  </p>
                  <ul className="mt-8 space-y-3">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-[#cbc3d7]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4edea3]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`mt-8 w-full rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] transition ${
                      plan.highlight
                        ? "bg-[#d0bcff] text-[#3c0091] hover:brightness-110"
                        : "border border-white/10 text-white hover:bg-white/5"
                    }`}
                  >
                    {plan.highlight ? "Choose Enterprise" : "Get Started"}
                  </button>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </section>

        <section ref={securityRef} id="security" className="px-6 py-24">
          <motion.div
            style={shouldReduceMotion ? undefined : { y: securityY }}
            className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.2fr_0.8fr] will-transform"
          >
            <motion.article
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55 }}
              className="rounded-3xl border border-white/10 bg-[#1c1b1d]/70 p-8"
            >
              <Fingerprint className="h-8 w-8 text-[#d0bcff]" />
              <h3 className="mt-4 text-4xl text-white font-['Cormorant_Garamond']">
                Security By Default
              </h3>
              <p className="mt-4 max-w-2xl text-[#cbc3d7]">
                CertifyPro combines JWT auth, role-based controls, storage quotas,
                and immutable verification paths so every credential remains trusted.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  "Max 5 templates per account",
                  "Global 200MB MongoDB storage cap",
                  "Rate-limited critical API endpoints",
                  "Verifiable public certificate pages",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 text-sm text-[#cbc3d7]">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#4edea3]" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.article>

            <motion.article
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="rounded-3xl border border-white/10 bg-[linear-gradient(155deg,rgba(53,52,55,0.75),rgba(19,19,21,0.95))] p-8"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-[#958ea0]">Platform Snapshot</p>
              <div className="mt-8 space-y-6">
                <div>
                  <p className="text-4xl text-white font-['Cormorant_Garamond']">5</p>
                  <p className="text-sm text-[#cbc3d7]">Templates per account</p>
                </div>
                <div>
                  <p className="text-4xl text-white font-['Cormorant_Garamond']">200MB</p>
                  <p className="text-sm text-[#cbc3d7]">MongoDB storage guardrail</p>
                </div>
                <div>
                  <p className="text-4xl text-white font-['Cormorant_Garamond']">24/7</p>
                  <p className="text-sm text-[#cbc3d7]">Monitoring for critical paths</p>
                </div>
              </div>
              <Link
                to="/verify"
                className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[#d0bcff] transition hover:text-white"
              >
                Open verification portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.article>
          </motion.div>
        </section>

        <section ref={ctaRef} className="relative overflow-hidden px-6 pb-24 pt-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55 }}
            style={shouldReduceMotion ? undefined : { y: ctaY }}
            className="relative mx-auto max-w-6xl rounded-[2.5rem] border border-white/10 bg-[linear-gradient(160deg,rgba(32,31,34,0.8),rgba(19,19,21,0.95))] px-8 py-16 text-center sm:px-12"
          >
            <div className="absolute -bottom-20 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-[#d0bcff]/25 blur-[90px]" />
            <SectionLabel>Ready to Build</SectionLabel>
            <h2 className="mt-6 text-5xl leading-tight text-white sm:text-7xl font-['Cormorant_Garamond']">
              Secure your credential
              <br />
              <span className="font-light italic text-[#4edea3]">pipeline today.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-[#cbc3d7]">
              Move from manual issuing to a premium, auditable, and verifiable
              credential operation in one platform.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-extrabold uppercase tracking-[0.15em] text-[#131315] transition hover:scale-[1.02]"
              >
                Build with CertifyPro
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <footer ref={footerRef} className="relative overflow-hidden border-t border-white/10 bg-[var(--cp-bg-deep)] px-6 pt-20 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:220px_220px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(208,188,255,0.16),transparent_45%)]" />

        <motion.p
          style={shouldReduceMotion ? undefined : { y: footerWordY }}
          className="pointer-events-none absolute bottom-[-28px] left-1/2 -translate-x-1/2 select-none text-[4.2rem] font-semibold uppercase leading-none tracking-[-0.06em] text-white/[0.04] sm:text-[8rem] lg:text-[14rem] font-['Cormorant_Garamond']"
        >
          Certify
        </motion.p>

        <div className="relative mx-auto flex w-full max-w-7xl flex-col">
          <div className="grid gap-10 border-b border-white/10 pb-16 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="max-w-xl">
              <h2 className="text-[3rem] font-semibold leading-[0.9] tracking-tight text-[#f2f0f3] sm:text-[4.4rem] font-['Cormorant_Garamond']">
                Build the
                <br />
                Permanent.
              </h2>
              <p className="mt-8 max-w-md text-base leading-relaxed text-[#9a95a8]">
                Join teams defining the next century of digital proof with secure
                issuance, verifiable trust, and premium credential experiences.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 lg:items-end">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 text-[11px] font-bold uppercase tracking-[0.24em] text-[#ece9f2] transition hover:bg-white/10"
              >
                Request Credentials
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#7a7488]">
                By invitation only
              </p>
            </div>
          </div>

          <div className="grid gap-12 border-b border-white/10 py-14 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-[2.1rem] leading-none text-white font-['Cormorant_Garamond']">CertifyPro</p>
              <p className="mt-5 max-w-md text-[11px] uppercase tracking-[0.2em] text-[#7a7488]">
                Forging immutable digital proof for modern organizations.
              </p>
              <motion.div
                whileHover={{ y: -4 }}
                className="mt-8 w-fit rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#7a7488]">Live reliability</p>
                <p className="mt-1 text-xl text-[#f2f0f3] font-['Cormorant_Garamond']">99.9% uptime</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="mt-5 max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#7a7488]">Built by</p>
                <p className="mt-1 text-2xl text-white font-['Cormorant_Garamond']">{personalProfile.name}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#b4adbf]">{personalProfile.title}</p>
                <p className="mt-3 text-sm text-[#9a95a8]">{personalProfile.bio}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {personalProfile.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-[#d7d1e3] transition hover:bg-white/10 hover:text-white"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-10 text-xs uppercase tracking-[0.15em] text-[#9a95a8] sm:grid-cols-3 lg:grid-cols-4">
              <div className="space-y-4">
                <p className="text-[#d0bcff]">Nav</p>
                <a href="#product" className="block transition hover:text-white">Journal</a>
                <a href="#flow" className="block transition hover:text-white">Workflow</a>
                <a href="#scale" className="block transition hover:text-white">Technology</a>
              </div>
              <div className="space-y-4">
                <p className="text-[#d0bcff]">Legal</p>
                <a href="#security" className="block transition hover:text-white">Privacy</a>
                <a href="#security" className="block transition hover:text-white">Terms</a>
                <Link to="/verify" className="block transition hover:text-white">Verify</Link>
              </div>
              <div className="space-y-4">
                <p className="text-[#d0bcff]">Product</p>
                <a href="#product" className="block transition hover:text-white">Templates</a>
                <a href="#flow" className="block transition hover:text-white">Issuance</a>
                <a href="#security" className="block transition hover:text-white">Trust</a>
              </div>
              <div className="space-y-4">
                <p className="text-[#d0bcff]">Access</p>
                <Link to="/login" className="block transition hover:text-white">Sign In</Link>
                <Link to="/register" className="block transition hover:text-white">Start</Link>
                <Link to="/verify" className="block transition hover:text-white">Status</Link>
              </div>
            </div>
          </div>

          <div className="py-7 text-center text-[10px] uppercase tracking-[0.22em] text-[#615b6d]">
            © 2026 CertifyPro. Built for the architects of digital proof.
          </div>
        </div>
      </footer>
    </div>
  );
}
