// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    'instalar',
    {
      type: 'category',
      label: 'Producto',
      collapsed: false,
      items: ['tablero', 'kpis', 'cartera', 'pedidos', 'chat', 'uso'],
    },
    {
      type: 'category',
      label: 'Técnico',
      collapsed: false,
      items: ['arquitectura', 'api', 'usuarios', 'reglas'],
    },
  ],
};

export default sidebars;
