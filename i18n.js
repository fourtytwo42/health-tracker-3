module.exports = {
  locales: ['en', 'es', 'fr', 'de', 'zh', 'ja'],
  defaultLocale: 'en',
  localeDetection: true,
  pages: {
    '*': ['common'],
    '/': ['home'],
    '/chat': ['chat'],
    '/dashboard': ['dashboard'],
    '/leaderboard': ['leaderboard'],
    '/admin': ['admin'],
  },
  loadLocaleFrom: (lang, ns) =>
    import(`./locales/${lang}/${ns}.json`).then((m) => m.default),
}; 