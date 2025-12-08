/**
 * 🎨 FICHIER DE CONFIGURATION DES THÈMES
 * =====================================
 * Modifiez les couleurs ici pour personnaliser tout le design de l'application
 * Design inspiré de Acadex Dashboard
 */

export const themes = {
  light: {
    // 🔵 Couleurs principales (Primary Colors)
    primary: '#4E73DF',           // Bleu principal Acadex
    primaryHover: '#2E59D9',      // Bleu hover
    primaryLight: '#E7F0FF',      // Bleu très clair pour backgrounds
    secondary: '#858796',         // Gris secondaire
    success: '#1CC88A',           // Vert success
    danger: '#E74A3B',            // Rouge danger
    warning: '#F6C23E',           // Jaune warning
    info: '#36B9CC',              // Cyan info

    // 🎨 Couleurs de fond (Background Colors)
    bodyBg: '#F8F9FC',            // Fond principal très clair
    contentBg: '#FFFFFF',         // Fond des contenus
    cardBg: '#FFFFFF',            // Fond des cartes

    // 📱 Sidebar Colors
    sidebarBg: '#FFFFFF',         // Fond sidebar blanc
    sidebarText: '#3C4858',       // Texte sidebar
    sidebarTextLight: '#858796',  // Texte secondaire sidebar
    sidebarHover: '#F8F9FC',      // Hover item sidebar
    sidebarActive: '#4E73DF',     // Couleur texte item actif
    sidebarActiveBg: '#E7F0FF',   // Fond item actif
    sidebarBorder: '#E3E6F0',     // Bordure sidebar
    sidebarLogo: '#4E73DF',       // Couleur du logo

    // 📊 Header/Navbar Colors
    headerBg: '#FFFFFF',          // Fond header
    headerText: '#3C4858',        // Texte header
    headerBorder: '#E3E6F0',      // Bordure header
    headerSearchBg: '#F8F9FC',    // Fond search input

    // 📝 Card Colors
    cardBorder: '#E3E6F0',        // Bordure des cartes
    cardShadow: '0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.05)',
    cardHoverShadow: '0 0.25rem 2rem 0 rgba(58, 59, 69, 0.15)',

    // ✍️ Text Colors
    textPrimary: '#3C4858',       // Texte principal
    textSecondary: '#858796',     // Texte secondaire
    textMuted: '#B7B9CC',         // Texte atténué
    textWhite: '#FFFFFF',         // Texte blanc
    textDark: '#2C2E33',          // Texte très foncé

    // 🎯 Border & Dividers
    border: '#E3E6F0',            // Bordures générales
    divider: '#E3E6F0',           // Séparateurs

    // 💎 Accent Colors (pour les statistiques)
    accentBlue: '#4E73DF',        // Bleu accent
    accentGreen: '#1CC88A',       // Vert accent
    accentOrange: '#F6C23E',      // Orange accent
    accentRed: '#E74A3B',         // Rouge accent
    accentPurple: '#6F42C1',      // Violet accent
    accentCyan: '#36B9CC',        // Cyan accent

    // 📈 Chart Colors
    chartBlue: '#4E73DF',
    chartGreen: '#1CC88A',
    chartOrange: '#F6C23E',
    chartRed: '#E74A3B',
    chartPurple: '#6F42C1',
    chartCyan: '#36B9CC',
    chartGray: '#858796',

    // 🌈 Gradients
    gradientPrimary: 'linear-gradient(180deg, #4E73DF 10%, #2E59D9 100%)',
    gradientSuccess: 'linear-gradient(180deg, #1CC88A 10%, #13855C 100%)',
    gradientWarning: 'linear-gradient(180deg, #F6C23E 10%, #D4A017 100%)',
    gradientDanger: 'linear-gradient(180deg, #E74A3B 10%, #BE2617 100%)',
    gradientInfo: 'linear-gradient(180deg, #36B9CC 10%, #258391 100%)',

    // 🔘 Button Styles
    btnPrimaryBg: '#4E73DF',
    btnPrimaryHover: '#2E59D9',
    btnPrimaryText: '#FFFFFF',
  },

  dark: {
    // 🔵 Couleurs principales (Primary Colors)
    primary: '#5A8DEE',           // Bleu principal dark mode
    primaryHover: '#4C7FE0',      // Bleu hover
    primaryLight: '#1E3A5F',      // Bleu très foncé pour backgrounds
    secondary: '#95A5A6',         // Gris secondaire
    success: '#1DD1A1',           // Vert success
    danger: '#EE5A6F',            // Rouge danger
    warning: '#F6C23E',           // Jaune warning
    info: '#48D1CC',              // Cyan info

    // 🎨 Couleurs de fond (Background Colors)
    bodyBg: '#0F1419',            // Fond principal très foncé
    contentBg: '#1A1F2E',         // Fond des contenus
    cardBg: '#1E2533',            // Fond des cartes

    // 📱 Sidebar Colors
    sidebarBg: '#1A1F2E',         // Fond sidebar foncé
    sidebarText: '#E4E6EB',       // Texte sidebar clair
    sidebarTextLight: '#95A5A6',  // Texte secondaire sidebar
    sidebarHover: '#252B3B',      // Hover item sidebar
    sidebarActive: '#5A8DEE',     // Couleur texte item actif
    sidebarActiveBg: '#1E3A5F',   // Fond item actif
    sidebarBorder: '#2D3548',     // Bordure sidebar
    sidebarLogo: '#5A8DEE',       // Couleur du logo

    // 📊 Header/Navbar Colors
    headerBg: '#1A1F2E',          // Fond header
    headerText: '#E4E6EB',        // Texte header
    headerBorder: '#2D3548',      // Bordure header
    headerSearchBg: '#252B3B',    // Fond search input

    // 📝 Card Colors
    cardBorder: '#2D3548',        // Bordure des cartes
    cardShadow: '0 0.15rem 1.75rem 0 rgba(0, 0, 0, 0.3)',
    cardHoverShadow: '0 0.25rem 2rem 0 rgba(0, 0, 0, 0.5)',

    // ✍️ Text Colors
    textPrimary: '#E4E6EB',       // Texte principal
    textSecondary: '#95A5A6',     // Texte secondaire
    textMuted: '#6C757D',         // Texte atténué
    textWhite: '#FFFFFF',         // Texte blanc
    textDark: '#0F1419',          // Texte très foncé

    // 🎯 Border & Dividers
    border: '#2D3548',            // Bordures générales
    divider: '#2D3548',           // Séparateurs

    // 💎 Accent Colors (pour les statistiques)
    accentBlue: '#5A8DEE',        // Bleu accent
    accentGreen: '#1DD1A1',       // Vert accent
    accentOrange: '#F6C23E',      // Orange accent
    accentRed: '#EE5A6F',         // Rouge accent
    accentPurple: '#9D72FF',      // Violet accent
    accentCyan: '#48D1CC',        // Cyan accent

    // 📈 Chart Colors
    chartBlue: '#5A8DEE',
    chartGreen: '#1DD1A1',
    chartOrange: '#F6C23E',
    chartRed: '#EE5A6F',
    chartPurple: '#9D72FF',
    chartCyan: '#48D1CC',
    chartGray: '#95A5A6',

    // 🌈 Gradients
    gradientPrimary: 'linear-gradient(180deg, #5A8DEE 10%, #4C7FE0 100%)',
    gradientSuccess: 'linear-gradient(180deg, #1DD1A1 10%, #17A589 100%)',
    gradientWarning: 'linear-gradient(180deg, #F6C23E 10%, #D4A017 100%)',
    gradientDanger: 'linear-gradient(180deg, #EE5A6F 10%, #D63447 100%)',
    gradientInfo: 'linear-gradient(180deg, #48D1CC 10%, #3AA6A3 100%)',

    // 🔘 Button Styles
    btnPrimaryBg: '#5A8DEE',
    btnPrimaryHover: '#4C7FE0',
    btnPrimaryText: '#FFFFFF',
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
