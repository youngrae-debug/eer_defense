export const theme = {
  colors: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceGlass: 'rgba(30,41,59,0.6)',
    primary: '#22D3EE',
    secondary: '#8B5CF6',
    danger: '#EF4444',
    gold: '#F59E0B',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    rarity: {
      common: '#64748B',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B',
      mythic: '#22D3EE',
    },
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  typography: {
    title: {
      fontSize: 20,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
    },
    numeric: {
      fontSize: 16,
      fontWeight: '700' as const,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
    },
  },
  shadow: {
    glow: {
      shadowColor: '#22D3EE',
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
      elevation: 6,
    },
    soft: {
      shadowColor: '#000000',
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
  },
} as const;

export type HeroRarity = keyof typeof theme.colors.rarity;
