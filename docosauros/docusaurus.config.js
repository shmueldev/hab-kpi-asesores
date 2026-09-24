// @ts-check

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'HAB KPI Asesores',
  tagline: 'Señal comercial · Desempeño de asesores',
  favicon: 'img/ha-bicicletas.png',

  future: {
    v4: true,
  },

  url: 'http://localhost:3000',
  baseUrl: '/',

  organizationName: 'shmueldev',
  projectName: 'hab-kpi-asesores',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/ha-bicicletas.png',
      colorMode: {
        defaultMode: 'light',
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'HAB KPI Asesores',
        logo: {
          alt: 'HA Bicicletas',
          src: 'img/ha-bicicletas.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Guía',
          },
          {
            href: 'https://github.com/shmueldev/hab-kpi-asesores',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Producto',
            items: [
              {label: 'Empezar', to: '/docs/intro'},
              {label: 'KPIs', to: '/docs/kpis'},
              {label: 'Cartera', to: '/docs/cartera'},
              {label: 'Chat', to: '/docs/chat'},
            ],
          },
          {
            title: 'Técnico',
            items: [
              {label: 'Instalar', to: '/docs/instalar'},
              {label: 'API', to: '/docs/api'},
              {label: 'Arquitectura', to: '/docs/arquitectura'},
            ],
          },
        ],
        copyright: `Uso interno HAB · Señal comercial · ${new Date().getFullYear()}`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json', 'sql'],
      },
    }),
};

export default config;
