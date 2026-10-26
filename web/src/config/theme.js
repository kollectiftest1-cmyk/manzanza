/**
 * 🎨 FICHIER DE CONFIGURATION DES THÈMES
 * =====================================
 * Modifiez les couleurs ici pour personnaliser tout le design de l'application
 * Palette « Turquoise » (maquette de référence, cahier des charges v2)
 */

export const themes = {
  // Palette « Turquoise » — maquette de référence (sidebar et en-tête turquoise,
  // contenu blanc, badges de statut pastel). Toute l'interface lit ces jetons.
  light: {
    primary: '#0E8C9B',           // Turquoise principal
    primaryHover: '#0A7281',      // Turquoise foncé (survol)
    primaryLight: '#E2F3F5',      // Turquoise très clair (fonds, onglets)
    secondary: '#F08C2E',         // Orange (accent « À faire »)
    success: '#1F9D63',           // Vert (« Terminé »)
    danger: '#D64545',            // Rouge
    warning: '#F08C2E',           // Orange
    info: '#4C5FD5',              // Indigo (« En cours »)

    bodyBg: '#EEF4F5',            // Fond de l'application
    bgDark: '#F6FAFA',            // En-têtes de tableaux, zones calmes
    contentBg: '#FFFFFF',
    cardBg: '#FFFFFF',

    sidebarBg: 'linear-gradient(180deg, #15A0B0 0%, #0E8C9B 45%, #0A6F7D 100%)',
    sidebarText: '#FFFFFF',
    sidebarTextLight: '#D4F0F3',
    sidebarHover: 'rgba(255,255,255,0.12)',
    sidebarActive: '#FFFFFF',
    sidebarActiveBg: 'rgba(255,255,255,0.22)',
    sidebarBorder: 'rgba(255,255,255,0.18)',
    sidebarLogo: '#FFFFFF',

    headerBg: '#0E8C9B',
    headerText: '#FFFFFF',
    headerBorder: 'rgba(255,255,255,0.18)',
    headerSearchBg: 'rgba(255,255,255,0.20)',

    cardBorder: '#E1EBED',
    cardShadow: '0 1px 2px rgba(16, 60, 68, 0.06), 0 4px 16px rgba(16, 60, 68, 0.06)',
    cardHoverShadow: '0 6px 24px rgba(16, 60, 68, 0.12)',

    textPrimary: '#1F3A40',
    textSecondary: '#5F7A80',
    textMuted: '#9AB0B4',
    textWhite: '#FFFFFF',
    textDark: '#12282C',

    border: '#E1EBED',
    divider: '#EDF3F4',

    accentBlue: '#4C5FD5',
    accentGreen: '#1F9D63',
    accentOrange: '#F08C2E',
    accentRed: '#D64545',
    accentPurple: '#7B61D9',
    accentCyan: '#0E8C9B',

    // Badges de statut (fond pastel + texte soutenu), comme sur la maquette
    pillInfoBg: '#E6E9FF',     pillInfoText: '#4C5FD5',     // En cours
    pillWarningBg: '#FFEBD6',  pillWarningText: '#C76A12',  // À faire / en attente
    pillSuccessBg: '#D9F4E7',  pillSuccessText: '#1A8754',  // Terminé / validé
    pillDangerBg: '#FDE2E2',   pillDangerText: '#B83232',   // Rejeté / urgent
    pillNeutralBg: '#EDF3F4',  pillNeutralText: '#5F7A80',

    chartBlue: '#4C5FD5',
    chartGreen: '#1F9D63',
    chartOrange: '#F08C2E',
    chartRed: '#D64545',
    chartPurple: '#7B61D9',
    chartCyan: '#0E8C9B',
    chartGray: '#9AB0B4',

    gradientPrimary: 'linear-gradient(180deg, #15A0B0 0%, #0A7281 100%)',
    gradientSuccess: 'linear-gradient(180deg, #2BB673 0%, #1A8754 100%)',
    gradientWarning: 'linear-gradient(180deg, #F5A04D 0%, #D9771C 100%)',
    gradientDanger: 'linear-gradient(180deg, #E06363 0%, #B83232 100%)',
    gradientInfo: 'linear-gradient(180deg, #6A7BE3 0%, #4C5FD5 100%)',

    btnPrimaryBg: '#0E8C9B',
    btnPrimaryHover: '#0A7281',
    btnPrimaryText: '#FFFFFF',
  },

  dark: {
    primary: '#2BB8C8',
    primaryHover: '#46C9D7',
    primaryLight: '#123C42',
    secondary: '#F5A04D',
    success: '#3CCB8A',
    danger: '#EF6B6B',
    warning: '#F5A04D',
    info: '#8C9BFF',

    bodyBg: '#0D1A1C',
    bgDark: '#132427',
    contentBg: '#132427',
    cardBg: '#16292C',

    sidebarBg: 'linear-gradient(180deg, #0F4B53 0%, #0B353B 100%)',
    sidebarText: '#E6F4F5',
    sidebarTextLight: '#9CC3C8',
    sidebarHover: 'rgba(255,255,255,0.08)',
    sidebarActive: '#FFFFFF',
    sidebarActiveBg: 'rgba(43,184,200,0.25)',
    sidebarBorder: 'rgba(255,255,255,0.10)',
    sidebarLogo: '#2BB8C8',

    headerBg: '#0F4B53',
    headerText: '#E6F4F5',
    headerBorder: 'rgba(255,255,255,0.10)',
    headerSearchBg: 'rgba(255,255,255,0.10)',

    cardBorder: '#21393D',
    cardShadow: '0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.25)',
    cardHoverShadow: '0 6px 24px rgba(0,0,0,0.45)',

    textPrimary: '#E6F4F5',
    textSecondary: '#9CC3C8',
    textMuted: '#6A8C91',
    textWhite: '#FFFFFF',
    textDark: '#0D1A1C',

    border: '#21393D',
    divider: '#1B3034',

    accentBlue: '#8C9BFF',
    accentGreen: '#3CCB8A',
    accentOrange: '#F5A04D',
    accentRed: '#EF6B6B',
    accentPurple: '#A892FF',
    accentCyan: '#2BB8C8',

    pillInfoBg: 'rgba(140,155,255,0.16)',  pillInfoText: '#AEB8FF',
    pillWarningBg: 'rgba(245,160,77,0.16)', pillWarningText: '#F7B572',
    pillSuccessBg: 'rgba(60,203,138,0.16)', pillSuccessText: '#6FDCAA',
    pillDangerBg: 'rgba(239,107,107,0.16)', pillDangerText: '#F49A9A',
    pillNeutralBg: 'rgba(156,195,200,0.12)', pillNeutralText: '#9CC3C8',

    chartBlue: '#8C9BFF',
    chartGreen: '#3CCB8A',
    chartOrange: '#F5A04D',
    chartRed: '#EF6B6B',
    chartPurple: '#A892FF',
    chartCyan: '#2BB8C8',
    chartGray: '#6A8C91',

    gradientPrimary: 'linear-gradient(180deg, #2BB8C8 0%, #188F9D 100%)',
    gradientSuccess: 'linear-gradient(180deg, #3CCB8A 0%, #24A268 100%)',
    gradientWarning: 'linear-gradient(180deg, #F5A04D 0%, #D9771C 100%)',
    gradientDanger: 'linear-gradient(180deg, #EF6B6B 0%, #C94545 100%)',
    gradientInfo: 'linear-gradient(180deg, #8C9BFF 0%, #6A7BE3 100%)',

    btnPrimaryBg: '#2BB8C8',
    btnPrimaryHover: '#188F9D',
    btnPrimaryText: '#0D1A1C',
  }
};

/**
 * 📌 Obtenir le thème actuel depuis localStorage
 */
export const getCurrentTheme = () => {
  const savedTheme = localStorage.getItem('appTheme') || 'light';
  return themes[savedTheme] || themes.light;
};

/**
 * 📌 Obtenir le nom du thème actuel
 */
export const getCurrentThemeName = () => {
  return localStorage.getItem('appTheme') || 'light';
};

/**
 * 🎨 Appliquer les variables CSS du thème
 */
export const applyTheme = (themeName = 'light') => {
  const theme = themes[themeName] || themes.light;
  const root = document.documentElement;

  // Appliquer toutes les variables CSS
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  // Sauvegarder le thème actuel dans localStorage
  localStorage.setItem('appTheme', themeName);

  // Ajouter une classe au body pour faciliter les styles conditionnels
  document.body.setAttribute('data-theme', themeName);
};

/**
 * 🔄 Basculer entre light et dark mode
 */
export const toggleTheme = () => {
  const currentTheme = getCurrentThemeName();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  return newTheme;
};

/**
 * 🎨 Fonction helper pour obtenir une couleur du thème
 */
export const getThemeColor = (colorKey, themeName = null) => {
  const theme = themeName ? (themes[themeName] || themes.light) : getCurrentTheme();
  return theme[colorKey] || '#000000';
};

/**
 * ✅ Vérifier si le thème actuel est le mode sombre
 */
export const isDarkMode = () => {
  return getCurrentThemeName() === 'dark';
};
