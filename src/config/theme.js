/**
 * 🎨 FICHIER DE CONFIGURATION DES THÈMES
 * =====================================
 * Modifiez les couleurs ici pour personnaliser tout le design de l'application
 * Design inspiré de Acadex Dashboard
 */

export const themes = {
  light: {
    // 🔵 Couleurs principales - Université MANZANZA (Primary Colors)
    primary: '#001F54',           // Bleu Marine Université MANZANZA
    primaryHover: '#00143A',      // Bleu Marine foncé hover
    primaryLight: '#E6EAF2',      // Bleu très clair pour backgrounds
    secondary: '#F4A900',         // Or/Doré Université MANZANZA
    success: '#1CC88A',           // Vert success
    danger: '#E74A3B',            // Rouge danger
    warning: '#F4A900',           // Or/Doré (warning = secondary)
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
    sidebarActive: '#001F54',     // Couleur texte item actif (Bleu Marine)
    sidebarActiveBg: '#E6EAF2',   // Fond item actif (Bleu clair)
    sidebarBorder: '#E3E6F0',     // Bordure sidebar
    sidebarLogo: '#001F54',       // Couleur du logo (Bleu Marine)

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
    accentBlue: '#001F54',        // Bleu accent (Bleu Marine MANZANZA)
    accentGreen: '#1CC88A',       // Vert accent
    accentOrange: '#F4A900',      // Orange accent (Or MANZANZA)
    accentRed: '#E74A3B',         // Rouge accent
    accentPurple: '#6F42C1',      // Violet accent
    accentCyan: '#36B9CC',        // Cyan accent

    // 📈 Chart Colors
    chartBlue: '#001F54',
    chartGreen: '#1CC88A',
    chartOrange: '#F4A900',
    chartRed: '#E74A3B',
    chartPurple: '#6F42C1',
    chartCyan: '#36B9CC',
    chartGray: '#858796',

    // 🌈 Gradients
    gradientPrimary: 'linear-gradient(180deg, #001F54 10%, #00143A 100%)',
    gradientSuccess: 'linear-gradient(180deg, #1CC88A 10%, #13855C 100%)',
    gradientWarning: 'linear-gradient(180deg, #F4A900 10%, #D4A017 100%)',
    gradientDanger: 'linear-gradient(180deg, #E74A3B 10%, #BE2617 100%)',
    gradientInfo: 'linear-gradient(180deg, #36B9CC 10%, #258391 100%)',

    // 🔘 Button Styles
    btnPrimaryBg: '#001F54',
    btnPrimaryHover: '#00143A',
    btnPrimaryText: '#FFFFFF',
  },

  dark: {
    // 🔵 Couleurs principales - Université MANZANZA Dark Mode (Primary Colors)
    primary: '#2B5FCC',           // Bleu principal dark mode (plus clair que light)
    primaryHover: '#3D6FDE',      // Bleu hover
    primaryLight: '#1A2F5F',      // Bleu très foncé pour backgrounds
    secondary: '#F4A900',         // Or/Doré Université MANZANZA
    success: '#1DD1A1',           // Vert success
    danger: '#EE5A6F',            // Rouge danger
    warning: '#F4A900',           // Or/Doré (warning = secondary)
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
    sidebarActive: '#F4A900',     // Couleur texte item actif (Or)
    sidebarActiveBg: '#1A2F5F',   // Fond item actif
    sidebarBorder: '#2D3548',     // Bordure sidebar
    sidebarLogo: '#F4A900',       // Couleur du logo (Or)

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
    accentBlue: '#2B5FCC',        // Bleu accent
    accentGreen: '#1DD1A1',       // Vert accent
    accentOrange: '#F4A900',      // Orange accent (Or MANZANZA)
    accentRed: '#EE5A6F',         // Rouge accent
    accentPurple: '#9D72FF',      // Violet accent
    accentCyan: '#48D1CC',        // Cyan accent

    // 📈 Chart Colors
    chartBlue: '#2B5FCC',
    chartGreen: '#1DD1A1',
    chartOrange: '#F4A900',
    chartRed: '#EE5A6F',
    chartPurple: '#9D72FF',
    chartCyan: '#48D1CC',
    chartGray: '#95A5A6',

    // 🌈 Gradients
    gradientPrimary: 'linear-gradient(180deg, #2B5FCC 10%, #1A4BAA 100%)',
    gradientSuccess: 'linear-gradient(180deg, #1DD1A1 10%, #17A589 100%)',
    gradientWarning: 'linear-gradient(180deg, #F4A900 10%, #D4A017 100%)',
    gradientDanger: 'linear-gradient(180deg, #EE5A6F 10%, #D63447 100%)',
    gradientInfo: 'linear-gradient(180deg, #48D1CC 10%, #3AA6A3 100%)',

    // 🔘 Button Styles
    btnPrimaryBg: '#2B5FCC',
    btnPrimaryHover: '#1A4BAA',
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
