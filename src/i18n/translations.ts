export const translations = {
  en: {
    nav: {
      features: "Features",
      pricing: "Pricing",
      contact: "Contact",
      getAudit: "Get Free Audit",
    },
    hero: {
      tagline: "Most Powerful GEO (Generative Engine Optimization) Agent",
      title: "Make sure AI recommends your protocol — ",
      titleHighlight: "correctly.",
      subtitle:
        "Monitor how ChatGPT, Gemini, Claude, Grok, Deepseek, and Google AI represent your Web3 project. Catch misinformation about fees, audits, and tokenomics. Become the trusted answer.",
      cta: "Signup Today",
      ctaLoggedIn: "Upgrade Plan",
      ctaSecondary: "See How It Works",
    },
    problem: {
      label: "The Problem",
      title: "Your users stopped Googling. AI answers for them now.",
      card1Title: "Invisible to AI",
      card1Desc:
        "Competing protocols show up when users ask AI about your category — but you don't. Even with strong on-chain traction and docs.",
      card2Title: "AI Gets It Wrong",
      card2Desc:
        "AI quotes wrong fees, outdated tokenomics, or false claims about your audits and custody model. You don't know until users complain.",
      card3Title: "Zero Visibility Control",
      card3Desc:
        "No dashboard, no alerts, no way to know what AI is saying about your protocol right now — across any chain, language, or market.",
    },
    solution: {
      label: "The Solution",
      title: "One platform. Full AI visibility loop for Web3.",
      step1Label: "Monitor",
      step1Title: "Track Your AI Presence",
      step1Desc:
        "See exactly how every major AI engine talks about your protocol across hundreds of relevant Web3 queries.",
      step2Label: "Detect",
      step2Title: "Catch Misinformation",
      step2Desc:
        "Compare AI responses against your Canonical Facts — the single source of truth you define for fees, audits, and tokenomics.",
      step3Label: "Distribute",
      step3Title: "Become The Answer",
      step3Desc:
        "Strategically place your project content in the on-chain and off-chain sources that AI engines trust and cite.",
      step4Label: "Measure",
      step4Title: "Prove The Impact",
      step4Desc:
        "Track Share of Answer, accuracy scores, and citation rates over time. See what's moving the needle.",
    },
    metrics: {
      title: "Key Metrics We Track",
      soa: "Share of Answer",
      soaDesc: "How often AI mentions your protocol vs competitors",
      accuracy: "Accuracy Score",
      accuracyDesc: "How correctly AI represents your protocol facts",
      citation: "Citation Rate",
      citationDesc: "How often your sources are cited by AI",
    },
    features: {
      label: "Key Features",
      title: "Built for Web3 protocols",
      f1Title: "Multi-Engine Monitoring",
      f1Desc: "ChatGPT, Gemini, Claude, Grok, Deepseek, and Google AI — all in one dashboard.",
      f2Title: "Canonical Facts",
      f2Desc:
        "Define your protocol's source of truth — fees, audits, tokenomics. Get alerted when AI contradicts it.",
      f3Title: "On-Chain Intelligence",
      f3Desc:
        "Monitor and analyze AI responses across multiple chains, languages, and regional markets from a single platform.",
      f4Title: "Competitor Intelligence",
      f4Desc:
        "See where rival protocols appear and you don't. Find the gaps in your AI visibility.",
      f5Title: "Distribution Engine",
      f5Desc:
        "Strategic content placement in sources AI trusts — docs, schema markup, knowledge bases, and more.",
      f6Title: "Actionable Reports",
      f6Desc:
        "Clear, visual reports showing what changed, what's at risk, and what to do next.",
    },
    pricing: {
      label: "Pricing",
      title: "Plans that grow with you",
      subtitle: "Start with an audit. Scale to full monitoring and distribution.",
      audit: {
        name: "Free",
        desc: "Get started with basic AI visibility",
        price: "$0",
        features: [
          "1 protocol monitoring",
          "1 competitor tracking",
          "Multi-engine scan (6 AI engines)",
          "Basic accuracy audit",
          "Weekly summary report",
        ],
        cta: "Get Started Free",
      },
      foundations: {
        name: "Starter",
        desc: "Ongoing monitoring for growing protocols",
        price: "$49",
        period: "/month",
        features: [
          "Everything in Free, plus:",
          "3 competitor tracking",
          "Share of Answer tracking",
          "Canonical Facts management",
          "Misinformation alerts",
          "Weekly & monthly reports",
        ],
        cta: "Get Started",
      },
      growth: {
        name: "Pro",
        desc: "Active visibility improvement",
        price: "$149",
        period: "/month",
        popular: true,
        features: [
          "Everything in Starter, plus:",
          "5 competitor tracking",
          "Distribution target mapping",
          "Content & schema generation",
          "Impact measurement",
          "Priority support",
        ],
        cta: "Get Started",
      },
      enterprise: {
        name: "Enterprise",
        desc: "Full-service for large protocols & foundations",
        price: "Custom",
        features: [
          "Everything in Pro, plus:",
          "10 competitor tracking",
          "Intensive monitoring",
          "Misinformation correction",
          "Deep analytics & reporting",
          "Dedicated account manager",
        ],
        cta: "Contact Sales",
      },
    },
    industries: {
      label: "Verticals",
      title: "Web3 verticals we serve",
      cex: "CEXs",
      dex: "DEXs",
      rwa: "RWA",
      payment: "Payment",
      stablecoin: "Stablecoin",
      gamefi: "GameFi",
    },
    quickScan: {
      label: "Quick Scan",
      title: "How visible is your protocol to AI?",
      subtitle: "Enter your project name and get an instant AI visibility snapshot.",
      placeholder: "Enter your protocol name...",
      button: "Scan Now",
      scanning: "Scanning",
      scanSuffix: "across AI engines...",
      progress: "Progress",
      step1: "Querying ChatGPT...",
      step2: "Querying Gemini...",
      step3: "Querying Claude...",
      step4: "Querying Grok...",
      step5: "Querying Deepseek...",
      step6: "Analyzing Google AI...",
    },
    cta: {
      title: "Is AI telling the truth about your protocol?",
      titleLoggedIn: "Get deeper insights for your protocol",
      subtitle:
        "Sign up now and find out exactly how AI engines see you — and where you're invisible.",
      subtitleLoggedIn:
        "Upgrade your plan to unlock more competitor tracking, advanced analytics, and priority support.",
      button: "Signup Today",
      buttonLoggedIn: "Upgrade Plan",
    },
    footer: {
      tagline: "The most powerful GEO agent for Web3.",
      product: "Product",
      company: "Company",
      monitoring: "Monitoring",
      distribution: "Distribution",
      audit: "Protocol Audit",
      about: "About",
      contact: "Contact",
      privacy: "Privacy",
      terms: "Terms",
      rights: "All rights reserved.",
    },
  },
} as const;

export type Locale = keyof typeof translations;
export type Translations = (typeof translations)[Locale];
