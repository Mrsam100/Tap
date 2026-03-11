import type { ThemeConfig } from '@tap/shared';

export const THEMES: Record<string, ThemeConfig> = {
  cream: {
    id: 'cream',
    name: 'Classic Cream',
    colors: {
      bg: 'bg-cream',
      text: 'text-ink',
      cardBg: 'bg-white',
      cardBorder: 'border-slate-200',
      cardText: 'text-ink',
      accent: 'text-slate-400',
      avatarBg: 'bg-slate-100',
      avatarText: 'text-ink'
    }
  },
  light: {
    id: 'light',
    name: 'Clean White',
    colors: {
      bg: 'bg-white',
      text: 'text-slate-900',
      cardBg: 'bg-slate-50',
      cardBorder: 'border-slate-100',
      cardText: 'text-slate-900',
      accent: 'text-slate-400',
      avatarBg: 'bg-slate-100',
      avatarText: 'text-slate-900'
    }
  },
  dark: {
    id: 'dark',
    name: 'Midnight',
    colors: {
      bg: 'bg-slate-900',
      text: 'text-white',
      cardBg: 'bg-slate-800',
      cardBorder: 'border-slate-700',
      cardText: 'text-white',
      accent: 'text-slate-500',
      avatarBg: 'bg-slate-800',
      avatarText: 'text-white'
    }
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    colors: {
      bg: 'bg-[#0f281e]',
      text: 'text-[#e2e8f0]',
      cardBg: 'bg-[#1a382d]',
      cardBorder: 'border-[#2d5244]',
      cardText: 'text-[#f0fdf4]',
      accent: 'text-[#5d8b77]',
      avatarBg: 'bg-[#2d5244]',
      avatarText: 'text-[#f0fdf4]'
    }
  },
  navy: {
    id: 'navy',
    name: 'Navy Blue',
    colors: {
      bg: 'bg-[#001f3f]',
      text: 'text-white',
      cardBg: 'bg-[#003366]',
      cardBorder: 'border-[#004080]',
      cardText: 'text-white',
      accent: 'text-[#3399ff]',
      avatarBg: 'bg-[#003366]',
      avatarText: 'text-white'
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Glow',
    colors: {
      bg: 'bg-[#ff7e5f]',
      text: 'text-white',
      cardBg: 'bg-[#feb47b]/20 backdrop-blur-md',
      cardBorder: 'border-white/20',
      cardText: 'text-white',
      accent: 'text-[#ffcc33]',
      avatarBg: 'bg-[#feb47b]',
      avatarText: 'text-white'
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Breeze',
    colors: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-900',
      cardBg: 'bg-white',
      cardBorder: 'border-cyan-200',
      cardText: 'text-cyan-800',
      accent: 'text-cyan-500',
      avatarBg: 'bg-cyan-100',
      avatarText: 'text-cyan-700'
    }
  },
  // ── New themes ──────────────────────────────────────────────────
  rose: {
    id: 'rose',
    name: 'Rose Garden',
    colors: {
      bg: 'bg-rose-50',
      text: 'text-rose-900',
      cardBg: 'bg-white',
      cardBorder: 'border-rose-200',
      cardText: 'text-rose-800',
      accent: 'text-rose-400',
      avatarBg: 'bg-rose-100',
      avatarText: 'text-rose-700'
    }
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender',
    colors: {
      bg: 'bg-[#f3f0ff]',
      text: 'text-[#3b2667]',
      cardBg: 'bg-white',
      cardBorder: 'border-[#d8ccff]',
      cardText: 'text-[#3b2667]',
      accent: 'text-[#7c5cbf]',
      avatarBg: 'bg-[#e8e0ff]',
      avatarText: 'text-[#3b2667]'
    }
  },
  mint: {
    id: 'mint',
    name: 'Fresh Mint',
    colors: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      cardBg: 'bg-white',
      cardBorder: 'border-emerald-200',
      cardText: 'text-emerald-800',
      accent: 'text-emerald-500',
      avatarBg: 'bg-emerald-100',
      avatarText: 'text-emerald-700'
    }
  },
  charcoal: {
    id: 'charcoal',
    name: 'Charcoal',
    colors: {
      bg: 'bg-[#1a1a2e]',
      text: 'text-[#e0e0e0]',
      cardBg: 'bg-[#16213e]',
      cardBorder: 'border-[#0f3460]',
      cardText: 'text-[#e0e0e0]',
      accent: 'text-[#e94560]',
      avatarBg: 'bg-[#0f3460]',
      avatarText: 'text-white'
    }
  },
  sand: {
    id: 'sand',
    name: 'Desert Sand',
    colors: {
      bg: 'bg-[#fdf6ec]',
      text: 'text-[#5c4033]',
      cardBg: 'bg-white',
      cardBorder: 'border-[#e8d5b7]',
      cardText: 'text-[#5c4033]',
      accent: 'text-[#c49a6c]',
      avatarBg: 'bg-[#f0e0c8]',
      avatarText: 'text-[#5c4033]'
    }
  },
  neon: {
    id: 'neon',
    name: 'Neon Night',
    colors: {
      bg: 'bg-[#0d0d0d]',
      text: 'text-[#39ff14]',
      cardBg: 'bg-[#1a1a1a]',
      cardBorder: 'border-[#39ff14]/30',
      cardText: 'text-[#39ff14]',
      accent: 'text-[#ff00ff]',
      avatarBg: 'bg-[#1a1a1a]',
      avatarText: 'text-[#39ff14]'
    }
  },
  cherry: {
    id: 'cherry',
    name: 'Cherry Blossom',
    colors: {
      bg: 'bg-[#fff0f5]',
      text: 'text-[#4a1942]',
      cardBg: 'bg-white',
      cardBorder: 'border-[#ffb6c1]',
      cardText: 'text-[#4a1942]',
      accent: 'text-[#ff69b4]',
      avatarBg: 'bg-[#ffe4e9]',
      avatarText: 'text-[#4a1942]'
    }
  },
  arctic: {
    id: 'arctic',
    name: 'Arctic Ice',
    colors: {
      bg: 'bg-[#e8f4fd]',
      text: 'text-[#1a365d]',
      cardBg: 'bg-white',
      cardBorder: 'border-[#bee3f8]',
      cardText: 'text-[#1a365d]',
      accent: 'text-[#4299e1]',
      avatarBg: 'bg-[#bee3f8]',
      avatarText: 'text-[#1a365d]'
    }
  },
  mocha: {
    id: 'mocha',
    name: 'Mocha',
    colors: {
      bg: 'bg-[#2d1b0e]',
      text: 'text-[#f5e6d3]',
      cardBg: 'bg-[#3d2b1f]',
      cardBorder: 'border-[#5c3d2e]',
      cardText: 'text-[#f5e6d3]',
      accent: 'text-[#d4a574]',
      avatarBg: 'bg-[#5c3d2e]',
      avatarText: 'text-[#f5e6d3]'
    }
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    colors: {
      bg: 'bg-[#0b0c10]',
      text: 'text-[#c5c6c7]',
      cardBg: 'bg-[#1f2833]',
      cardBorder: 'border-[#45a29e]/30',
      cardText: 'text-[#c5c6c7]',
      accent: 'text-[#66fcf1]',
      avatarBg: 'bg-[#1f2833]',
      avatarText: 'text-[#66fcf1]'
    }
  },
  coral: {
    id: 'coral',
    name: 'Coral Reef',
    colors: {
      bg: 'bg-[#fff5f3]',
      text: 'text-[#7c2d12]',
      cardBg: 'bg-white',
      cardBorder: 'border-[#fed7aa]',
      cardText: 'text-[#7c2d12]',
      accent: 'text-[#f97316]',
      avatarBg: 'bg-[#ffedd5]',
      avatarText: 'text-[#7c2d12]'
    }
  },
  slate: {
    id: 'slate',
    name: 'Modern Slate',
    colors: {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      cardBg: 'bg-white',
      cardBorder: 'border-slate-200',
      cardText: 'text-slate-800',
      accent: 'text-indigo-500',
      avatarBg: 'bg-indigo-100',
      avatarText: 'text-indigo-700'
    }
  },
  wine: {
    id: 'wine',
    name: 'Vintage Wine',
    colors: {
      bg: 'bg-[#1a0a1e]',
      text: 'text-[#f0d9ff]',
      cardBg: 'bg-[#2d1233]',
      cardBorder: 'border-[#5c2d6e]',
      cardText: 'text-[#f0d9ff]',
      accent: 'text-[#d946ef]',
      avatarBg: 'bg-[#5c2d6e]',
      avatarText: 'text-[#f0d9ff]'
    }
  },
  sunshine: {
    id: 'sunshine',
    name: 'Sunshine',
    colors: {
      bg: 'bg-[#fffbeb]',
      text: 'text-[#713f12]',
      cardBg: 'bg-white',
      cardBorder: 'border-amber-200',
      cardText: 'text-[#713f12]',
      accent: 'text-amber-500',
      avatarBg: 'bg-amber-100',
      avatarText: 'text-amber-800'
    }
  },
};
