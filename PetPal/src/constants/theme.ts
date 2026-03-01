export const COLORS = {
  light: {
    primary: '#FFB6C1',
    primaryDark: '#FF91A4',
    primaryLight: '#FFD1D9',
    background: '#FFF8F0',
    hunger: '#FF6B6B',
    thirst: '#4ECDC4',
    hygiene: '#95E1D3',
    mood: '#FFE66D',
    intimacy: '#DDA0DD',
    text: '#4A4A4A',
    textLight: '#8A8A8A',
    textWhite: '#FFFFFF',
    button: '#FFB6C1',
    card: '#FFFFFF',
    statusHappy: '#4CAF50',
    statusNormal: '#FFC107',
    statusWorried: '#FF9800',
    statusCritical: '#F44336',
  },
  dark: {
    primary: '#FF91A4',
    primaryDark: '#FF6B7A',
    primaryLight: '#FFB6C1',
    background: '#1A1A2E',
    hunger: '#FF6B6B',
    thirst: '#4ECDC4',
    hygiene: '#95E1D3',
    mood: '#FFE66D',
    intimacy: '#DDA0DD',
    text: '#E0E0E0',
    textLight: '#A0A0A0',
    textWhite: '#FFFFFF',
    button: '#FF91A4',
    card: '#2D2D4A',
    statusHappy: '#4CAF50',
    statusNormal: '#FFC107',
    statusWorried: '#FF9800',
    statusCritical: '#F44336',
  },
};

export const getColors = (isDark: boolean) => isDark ? COLORS.dark : COLORS.light;

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const FONT_SIZES = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32 };
export const BORDER_RADIUS = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };
