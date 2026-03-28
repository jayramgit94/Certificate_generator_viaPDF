import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Shield, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { scrollYProgress } = useScroll();
  const progressScale = useSpring(scrollYProgress, {
    stiffness: 130,
    damping: 24,
  });
  const brandY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const formY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, -160]);

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.length < 2)
      errs.name = "Name is required (min 2 chars)";
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Min 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      errs.password = "Must include uppercase, lowercase, and a number";
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords don't match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || "Registration failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => setForm({ ...form, [field]: value });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0e0f14] text-[#e5e1e4]">
      <motion.div
        className="fixed left-0 top-0 z-[70] h-[2px] w-full origin-left bg-gradient-to-r from-[#d0bcff] via-[#6ffbbe] to-[#a078ff]"
        style={{ scaleX: progressScale }}
      />

      <div className="pointer-events-none absolute inset-0">
        <motion.div
          style={{ y: glowY }}
          className="absolute -left-20 -top-20 h-[24rem] w-[24rem] rounded-full bg-[#a078ff]/25 blur-[120px]"
        />
        <motion.div
          style={{ y: formY }}
          className="absolute bottom-[-8rem] right-[-4rem] h-[20rem] w-[20rem] rounded-full bg-[#00a572]/20 blur-[110px]"
        />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:120px_120px]" />
      </div>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-6 pb-16 pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:pt-28">
        <motion.section style={{ y: brandY }} className="lg:sticky lg:top-24 lg:h-fit">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="grid h-11 w-11 place-content-center rounded-2xl bg-gradient-to-br from-[#d0bcff] to-[#a078ff] text-[#2b006d] shadow-[0_14px_30px_rgba(160,120,255,0.35)]">
              <Shield className="h-6 w-6" />
            </div>
            <span className="text-3xl leading-none text-white font-['Cormorant_Garamond']">
              CertifyPro
            </span>
          </Link>

          <div className="mt-10 rounded-[2rem] border border-white/10 bg-[#1a1b22]/65 p-8 backdrop-blur-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#d0bcff]">
              <Sparkles className="h-3.5 w-3.5" />
              Start Issuing
            </span>
            <h1 className="mt-7 text-5xl leading-[0.92] text-white sm:text-6xl font-['Cormorant_Garamond']">
              Build your
              <br />
              credential HQ
              <span className="italic text-[#d0bcff]"> today.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[#bfb8cb]">
              Launch your workspace for templates, recipient batches, generation,
              and public verification in one aligned operating flow.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                { label: "Setup", value: "5 min" },
                { label: "Templates", value: "5 max" },
                { label: "Storage", value: "200MB" },
              ].map((stat) => (
                <motion.div
                  whileHover={{ y: -5 }}
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-4 text-center"
                >
                  <p className="text-2xl text-white font-['Cormorant_Garamond']">{stat.value}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-[#8f8a9d]">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section style={{ y: formY }} className="flex items-start lg:justify-end">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#15161d]/75 p-7 backdrop-blur-xl sm:p-9">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8f8a9d]">Create account</p>
            <h2 className="mt-3 text-4xl text-white font-['Cormorant_Garamond']">Create your workspace</h2>
            <p className="mt-2 text-sm text-[#9a95a8]">Set up your team and start issuing trusted digital certificates in minutes.</p>

            {errors.general && (
              <div className="mt-5 rounded-xl border border-[#ffb4ab]/35 bg-[#93000a]/20 px-4 py-3 text-sm text-[#ffdad6]">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-[#958ea0]">
                  Full name
                </label>
                <Input
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  error={errors.name}
                  className="border-white/15 bg-white/[0.04] text-[#f2f0f3] placeholder:text-[#8f8a9d] focus:border-[#d0bcff] focus:ring-[#d0bcff]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-[#958ea0]">
                  Email address
                </label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  error={errors.email}
                  autoComplete="email"
                  className="border-white/15 bg-white/[0.04] text-[#f2f0f3] placeholder:text-[#8f8a9d] focus:border-[#d0bcff] focus:ring-[#d0bcff]/20"
                />
              </div>

              <div className="relative">
                <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-[#958ea0]">
                  Password
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  error={errors.password}
                  className="border-white/15 bg-white/[0.04] pr-11 text-[#f2f0f3] placeholder:text-[#8f8a9d] focus:border-[#d0bcff] focus:ring-[#d0bcff]/20"
                />
                <p className="mt-1 text-xs text-[#8f8a9d]">Min 8 chars with uppercase, lowercase, and number.</p>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[36px] text-[#8f8a9d] transition hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-[#958ea0]">
                  Confirm password
                </label>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  error={errors.confirmPassword}
                  className="border-white/15 bg-white/[0.04] text-[#f2f0f3] placeholder:text-[#8f8a9d] focus:border-[#d0bcff] focus:ring-[#d0bcff]/20"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#a078ff] py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#2c0072] hover:brightness-105"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[#9a95a8]">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-[#d0bcff] transition hover:text-white">
                Sign in
              </Link>
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8f8a9d]">Verification</p>
              <p className="mt-2 text-sm text-[#cbc3d7]">All issued certificates can be validated publicly with secure IDs and QR links.</p>
              <Link to="/verify" className="mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#6ffbbe] hover:text-white">
                Open verification portal
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </motion.section>
      </main>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16">
        <motion.div
          style={{ y: brandY }}
          className="grid gap-4 rounded-[2rem] border border-white/10 bg-[#13141b]/75 p-6 backdrop-blur-xl sm:grid-cols-3"
        >
          {[
            "Parallel scroll depth across sections",
            "Obsidian glassmorphism and glow accents",
            "Cinematic typography aligned with landing",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs uppercase tracking-[0.12em] text-[#b4adbf]">
              {item}
            </div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
