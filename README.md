# grid·intelligence — Ember redesign · Drop-in instructions

## 1. Reemplazar archivos

Copiá los archivos de esta carpeta a tu repo:

```
repo/src/App.jsx      →  src/App.jsx       (REEMPLAZA)
repo/src/index.css    →  src/index.css     (REEMPLAZA)
repo/index.html       →  index.html        (REEMPLAZA — agrega los <link> de fuentes)
repo/public/favicon.svg → public/favicon.svg (REEMPLAZA)
```

`main.jsx` y `package.json` quedan igual. Tus endpoints (`/predict`, `/explain`, `/backtest`, `/energy-mix`) tampoco cambian.

## 2. Borrar archivos viejos (ya no se usan)

```
src/App.css                       ← borrar
public/logo.png                   ← borrar (el logo ahora es SVG inline)
public/icons8-history-50.png      ← borrar
public/icons8-prediction-64.png   ← borrar
public/icons8-solar-energy-50.png ← borrar
public/icons.svg                  ← borrar (icons ahora son SVG inline)
```

## 3. Verificar dependencias

Ya tenés todo, pero por las dudas:

```bash
npm install
# axios + recharts + react + react-dom ya están en tu package.json
```

## 4. Probar

```bash
npm run dev
```

Vas a ver:
- Fondo gris-cálido oscuro por default
- Toggle ☀️/🌙 arriba a la derecha para light mode
- Logo nuevo (cuadrado-grid con sparkline ámbar)
- Iconos SVG nuevos en nav
- Indicador animado (logo pulsa + 4 barritas) mientras carga datos
- Paleta unificada: ámbar (#f0b070) como acento, verde/rojo solo para semántica

## 5. Si algo se rompe

- **Fonts no cargan**: revisá que el `<link>` de Google Fonts esté en `index.html`
- **Charts vacíos**: la API no respondió, vas a ver "API connection failed"
- **Light mode raro**: localStorage tiene `grid-mode` guardado, abrir DevTools → Application → Local Storage → borrar y refrescar

## Paleta (por si querés tunear algo)

```js
dark: {
  bg: '#16171a',         // fondo principal
  text: '#ededea',       // texto principal
  textMuted: '#82827d',  // texto secundario
  accent: '#f0b070',     // ámbar (acción / brand)
  pos: '#7dc497',        // verde (positivo)
  neg: '#e08672',        // rojo (negativo)
  info: '#9aa5b8',       // azul-gris (neutro)
}
```

Cambiá `accent` y se actualiza en todos lados.
