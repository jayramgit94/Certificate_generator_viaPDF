import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Mail,
  Send,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TOUR_STORAGE_KEY = "certifypro_tour_completed";

const TOUR_STEPS = [
  {
    title: "Welcome to CertifyPro! 🎉",
    description:
      "Let's take a quick tour to help you get started with managing certificates. This will only take a minute!",
    icon: Award,
    color: "from-primary-500 to-primary-600",
    path: "/dashboard",
  },
  {
    title: "Create Templates",
    description:
      "Start by uploading a PDF or image to create a certificate template. You can customize layouts with text fields, signatures, and QR codes.",
    icon: FileImage,
    color: "from-emerald-500 to-emerald-600",
    path: "/templates",
  },
  {
    title: "Upload Recipients",
    description:
      "Upload a CSV, XLSX, or JSON file with your recipients' names and emails. We'll validate the data automatically.",
    icon: Users,
    color: "from-violet-500 to-violet-600",
    path: "/recipients",
  },
  {
    title: "Generate Certificates",
    description:
      "Select a template and a recipient batch to bulk-generate personalized certificates. Each gets a unique QR code for verification.",
    icon: Award,
    color: "from-blue-500 to-blue-600",
    path: "/certificates",
  },
  {
    title: "Send via Email",
    description:
      "Distribute certificates by email in one click. Track delivery status, retries, and analytics from the Emails section.",
    icon: Mail,
    color: "from-amber-500 to-amber-600",
    path: "/emails",
  },
  {
    title: "You're All Set!",
    description:
      "That's the basics! Explore Analytics for insights and Settings to configure your account. Happy certifying!",
    icon: Send,
    color: "from-pink-500 to-pink-600",
    path: "/dashboard",
  },
];

export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Small delay so the dashboard loads first
      const timer = setTimeout(() => setShowTour(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setShowTour(false);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setShowTour(true);
  }, []);

  return { showTour, completeTour, resetTour };
}

export default function OnboardingTour({ isOpen, onComplete }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const currentStep = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    const nextStep = TOUR_STEPS[step + 1];
    if (nextStep.path) navigate(nextStep.path);
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (isFirst) return;
    const prevStep = TOUR_STEPS[step - 1];
    if (prevStep.path) navigate(prevStep.path);
    setStep((s) => s - 1);
  };

  const handleSkip = () => {
    onComplete();
  };

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onComplete();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
              aria-label="Skip tour"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="px-6 pt-6 pb-4">
              {/* Step indicator */}
              <div className="flex items-center gap-1.5 mb-5">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step
                        ? "w-6 bg-primary-500"
                        : i < step
                          ? "w-3 bg-primary-300"
                          : "w-3 bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className={`w-14 h-14 bg-gradient-to-br ${currentStep.color} rounded-2xl flex items-center justify-center shadow-lg mb-4`}
              >
                <currentStep.icon className="w-7 h-7 text-white" />
              </motion.div>

              {/* Text */}
              <motion.h3
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="text-lg font-bold text-gray-900 font-display"
              >
                {currentStep.title}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-gray-500 mt-2 leading-relaxed"
              >
                {currentStep.description}
              </motion.p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex items-center justify-between gap-3">
              <div>
                {!isFirst && (
                  <button
                    onClick={handlePrev}
                    className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {!isLast && (
                  <button
                    onClick={handleSkip}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-3 py-2"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 px-5 py-2.5 rounded-xl shadow-lg shadow-primary-500/25 transition-all active:scale-95"
                >
                  {isLast ? "Get Started" : "Next"}
                  {!isLast && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
