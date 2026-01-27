# UI Design System

This document captures the complete UI design specifications for the Digital Twin Viewer. Use this as a reference when migrating or rebuilding the application to ensure visual consistency.

---

## Table of Contents

1. [Layout Structure](#layout-structure)
2. [Design Tokens](#design-tokens)
3. [Typography](#typography)
4. [Panel System](#panel-system)
5. [Tab System](#tab-system)
6. [Settings Bar](#settings-bar)
7. [Floating Toolbar](#floating-toolbar)
8. [Component Specifications](#component-specifications)
9. [Status Colors](#status-colors)
10. [Icons](#icons)

---

## Layout Structure

### Three-Panel Layout

```
┌──────────────────┬─────────────────────────────┬──────────────────┐
│   LEFT PANEL     │                             │   RIGHT PANEL    │
│   (MODEL)        │                             │   (SELECTION)    │
│   320px default  │        3D VIEWPORT          │   320px default  │
│   min: 200px     │          (1fr)              │   min: 200px     │
│   max: 480px     │                             │   max: 480px     │
│                  │                             │                  │
│ ┌──────────────┐ │                             │ ┌──────────────┐ │
│ │[Logo] [Icons]│ │                             │ │[Props][Sens] │ │
│ ├──────────────┤ │                             │ ├──────────────┤ │
│ │▼ Spatial Tree│ │                             │ │  Tab Content │ │
│ │  [Search...] │ │                             │ │  (scrollable)│ │
│ │  └─ Tree     │ │                             │ │              │ │
│ ├──────────────┤ │                             │ ├──────────────┤ │
│ │▼ Filter      │ │                             │ │▼ Documents   │ │
│ │  [+ Category]│ │                             │ │  (list)      │ │
│ │  [+ Attrib.] │ │                             │ │              │ │
│ └──────────────┘ │                             │ └──────────────┘ │
└──────────────────┴─────────────────────────────┴──────────────────┘
                              │
                   ┌──────────┴──────────┐
                   │   Floating Toolbar  │
                   │ [Nav][Meas][Clip][Vis]
                   └─────────────────────┘
```

### Grid Configuration

```css
#app {
  display: grid;
  grid-template-columns: [leftPanel] 320px [viewport] 1fr [rightPanel] 320px;
  grid-template-areas: "leftPanel viewport rightPanel";
  height: 100%;
  width: 100%;
}
```

### Panel Positioning

- **Left Panel**: Model navigation (Tree + Filter)
- **Right Panel**: Selection details (Properties/Sensors tabs + Documents)
- **Panels are resizable**: drag handles between panels and viewport
- **Panels are collapsible**: toggle buttons on panel edges

---

## Design Tokens

### Surface Colors

```css
/* LIGHT THEME (Default) - Warm Paper */
:root, [data-theme="light"] {
  --canvas: #e8e6e1;           /* Viewport/scene background */
  --surface-base: #f0eeea;     /* Panel backgrounds */
  --surface-raised: #f5f3ef;   /* Elevated elements, cards */
  --surface-overlay: #e3e1dc;  /* Dropdowns, modals */
}

/* DARK THEME - Blueprint Night */
[data-theme="dark"] {
  --canvas: #0f1117;           /* Viewport/scene background */
  --surface-base: #161922;     /* Panel backgrounds */
  --surface-raised: #1c1f2a;   /* Elevated elements, cards */
  --surface-overlay: #232733;  /* Dropdowns, modals */
}
```

### Text Colors

```css
/* Light Theme */
:root, [data-theme="light"] {
  --text-primary: rgba(28, 25, 23, 0.95);    /* Headings, important text */
  --text-secondary: rgba(28, 25, 23, 0.72);  /* Body text */
  --text-tertiary: rgba(28, 25, 23, 0.55);   /* Labels, hints */
  --text-muted: rgba(28, 25, 23, 0.38);      /* Disabled, placeholders */
}

/* Dark Theme */
[data-theme="dark"] {
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.72);
  --text-tertiary: rgba(255, 255, 255, 0.50);
  --text-muted: rgba(255, 255, 255, 0.32);
}
```

### Border Colors

```css
/* Light Theme */
:root, [data-theme="light"] {
  --border-subtle: rgba(28, 25, 23, 0.06);   /* Dividers */
  --border-default: rgba(28, 25, 23, 0.12);  /* Input borders */
  --border-strong: rgba(28, 25, 23, 0.18);   /* Hover states */
}

/* Dark Theme */
[data-theme="dark"] {
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.10);
  --border-strong: rgba(255, 255, 255, 0.16);
}
```

### Accent Colors

```css
/* Light Theme */
:root, [data-theme="light"] {
  --accent: #2563eb;                        /* Primary blue */
  --accent-muted: rgba(37, 99, 235, 0.12);  /* Background tint */
  --accent-hover: #3b82f6;                  /* Hover state */
}

/* Dark Theme */
[data-theme="dark"] {
  --accent: #3b82f6;
  --accent-muted: rgba(59, 130, 246, 0.15);
  --accent-hover: #60a5fa;
}
```

### Spacing Scale (4px base)

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
```

### Border Radius

```css
--radius-sm: 4px;   /* Small elements, chips */
--radius-md: 6px;   /* Buttons, inputs */
--radius-lg: 8px;   /* Cards, panels */
```

### Transitions

```css
--transition-fast: 120ms ease-out;    /* Hover states */
--transition-normal: 180ms ease-out;  /* Panel animations */
```

---

## Typography

### Font Families

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
```

### Font Imports

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Text Styles

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Panel header | Inter | 13px | 600 | --text-secondary |
| Section header | Inter | 11px | 600 | --text-primary |
| Body text | Inter | 13px | 400 | --text-secondary |
| Labels | Inter | 11px | 500 | --text-tertiary |
| Monospace values | JetBrains Mono | 11-12px | 400 | --text-primary |
| Button labels | Inter | 12px | 500 | --text-secondary |

---

## Panel System

### Panel Structure

```html
<bim-panel label="Panel Name">
  <bim-panel-section label="Section" icon="mdi:icon-name">
    <!-- Content -->
  </bim-panel-section>
</bim-panel>
```

### Panel Styling

```css
bim-panel {
  --bim-ui_bg-base: var(--surface-base);
  overflow: hidden;
}

bim-panel::part(header) {
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  padding: 16px;
  border-bottom: 1px solid var(--border-subtle);
}
```

### Panel Section Styling

```css
bim-panel-section::part(header) {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--text-tertiary);
  padding: 8px 12px;
}

bim-panel-section::part(content) {
  padding: 8px 12px;
}
```

### Collapsible Behavior

- Sections can have `collapsed` attribute for default collapsed state
- Click section header to toggle
- Smooth height animation on toggle

---

## Tab System

### Tab Structure (Right Panel)

```html
<bim-tabs>
  <bim-tab label="Properties" icon="mdi:information-outline">
    <!-- Properties content -->
  </bim-tab>
  <bim-tab label="Sensors" icon="mdi:gauge">
    <!-- Sensors content -->
  </bim-tab>
</bim-tabs>
```

### Tab Styling

```css
bim-tabs::part(tab-list) {
  background: var(--surface-raised);
  border-bottom: 1px solid var(--border-subtle);
  padding: 4px 8px;
  gap: 4px;
}

bim-tab::part(tab-button) {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 4px;
  color: var(--text-tertiary);
  background: transparent;
  border: none;
  transition: all 120ms ease-out;
}

bim-tab::part(tab-button):hover {
  color: var(--text-secondary);
  background: var(--surface-overlay);
}

bim-tab[active]::part(tab-button) {
  color: var(--accent);
  background: var(--accent-muted);
}
```

---

## Settings Bar

### Location

Top of the Left Panel (Model panel), below the panel header.

### Structure

```
┌────────────────────────────────┐
│ [LOGO]              [🌙][?][EN]│
└────────────────────────────────┘
```

### HTML Structure

```html
<div id="panel-settings-bar">
  <!-- Logo on left -->
  <img src="logo.png" alt="Logo" />

  <!-- Buttons on right -->
  <div class="settings-buttons">
    <button id="theme-toggle">🌙/☀️</button>
    <button id="help-toggle">?</button>
    <button id="lang-toggle">EN</button>
  </div>
</div>
```

### Settings Bar Styling

```css
#panel-settings-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-raised);
}

#panel-settings-bar img {
  height: 28px;
  width: auto;
  object-fit: contain;
}

.settings-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

### Settings Button Styling

```css
.panel-settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  background: var(--surface-base);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 150ms ease;
}

.panel-settings-btn:hover {
  background: var(--surface-overlay);
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.panel-settings-btn:active {
  background: var(--accent-muted);
}

/* Language button specific */
.panel-settings-btn.lang-toggle {
  font-weight: 600;
  font-size: 10px;
  letter-spacing: 0.5px;
  font-family: var(--font-sans);
}
```

### Theme Toggle Icons

- Light mode: Show moon icon (🌙)
- Dark mode: Show sun icon (☀️)

```css
/* In light mode */
.icon-moon { display: block; }
.icon-sun { display: none; }

/* In dark mode */
[data-theme="dark"] .icon-moon { display: none; }
[data-theme="dark"] .icon-sun { display: block; }
```

---

## Floating Toolbar

### Position

```css
#floating-toolbar {
  position: fixed;
  bottom: 26px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}
```

### Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [🔄][👁][📐]  │  [📏][📐][🗑]  │  [✂️][👁][🗑]  │  [👻][🎯][🚫][👁]  │
│   NAVIGATE     │    MEASURE     │    SECTION     │    VISIBILITY    │
└─────────────────────────────────────────────────────────────┘
```

### Toolbar Styling

```css
#floating-toolbar {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 5px;
  background: var(--surface-overlay);
  border: 1px solid var(--border-default);
  border-radius: 13px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4),
              0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
}

.toolbar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.toolbar-section-label {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-tertiary);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--surface-base);
  border-radius: 8px;
}

.toolbar-divider {
  width: 1px;
  height: 62px;
  background: var(--border-subtle);
  margin: 0 5px;
}
```

### Toolbar Button Styling

```css
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 100ms ease-out;
}

.toolbar-btn:hover {
  background: var(--surface-raised);
  color: var(--text-primary);
}

.toolbar-btn.active {
  background: var(--accent-muted);
  color: var(--accent);
}

.toolbar-btn svg {
  width: 21px;
  height: 21px;
}
```

### Toolbar Tooltips

```css
.toolbar-btn[data-tooltip]:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 5px 10px;
  background: var(--surface-overlay);
  border: 1px solid var(--border-default);
  border-radius: 5px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
}
```

### Views Toolbar (Top Right)

Vertical toolbar for 2D views, positioned relative to right panel:

```css
#views-toolbar {
  position: fixed;
  top: 20px;
  right: calc(320px + 12px); /* Panel width + margin */
  display: flex;
  flex-direction: column;
  /* Same styling as main toolbar */
  transition: right 250ms ease-out;
}

#views-toolbar.sidebar-collapsed {
  right: 12px;
}
```

---

## Component Specifications

### Properties Table

```css
bim-table {
  --bim-ui_bg-base: transparent;
  font-size: 13px;
}

bim-table-row {
  border-bottom: 1px solid var(--border-subtle);
  transition: background 120ms ease-out;
}

bim-table-row:hover {
  background: var(--surface-raised);
}

/* Property name column */
bim-table-cell:first-child {
  color: var(--text-tertiary);
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 11px;
  background: var(--property-label-bg);
  border-right: 1px solid var(--border-subtle);
}

/* Property value column */
bim-table-cell:last-child {
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 11px;
}

/* Alternate rows */
bim-table-row:nth-child(even) {
  background: var(--row-alternate-bg);
}
```

### Sensor Card

```css
.sensor-card {
  background: var(--surface-raised);
  border-radius: 8px;
  padding: 12px;
  border-left: 3px solid var(--status-color); /* Dynamic based on status */
}

.sensor-card .sensor-label {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 12px;
}

.sensor-card .sensor-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 8px 0;
}

.sensor-card .sensor-unit {
  font-size: 14px;
  color: var(--text-muted);
}

.sensor-card .status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  background: var(--status-bg);
  color: var(--status-color);
}
```

### Document List Item

```css
.document-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--surface-raised);
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 120ms ease-out;
}

.document-item:hover {
  background: var(--surface-overlay);
  border-color: var(--border-default);
}

.document-item .doc-icon {
  width: 32px;
  height: 32px;
  color: var(--accent);
}

.document-item .doc-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 13px;
}

.document-item .doc-meta {
  font-size: 11px;
  color: var(--text-muted);
}
```

### Empty State

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted);
}

.empty-state svg {
  width: 48px;
  height: 48px;
  opacity: 0.4;
  margin-bottom: 12px;
}

.empty-state .title {
  font-size: 12px;
  font-weight: 500;
}

.empty-state .subtitle {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.7;
}
```

### Buttons

```css
bim-button {
  --bim-button--bgc: var(--surface-raised);
  --bim-button--olc: var(--border-default);
  --bim-button--c: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 120ms ease-out;
}

bim-button:hover {
  --bim-button--bgc: var(--surface-overlay);
  --bim-button--c: var(--text-primary);
}
```

### Text Input

```css
bim-text-input {
  --bim-input--bgc: var(--surface-raised);
  --bim-input--olc: var(--border-default);
  --bim-input--c: var(--text-primary);
  --bim-input--fz: 13px;
  border-radius: 6px;
}

bim-text-input::placeholder {
  color: var(--text-muted);
}
```

### Checkbox

```css
bim-checkbox {
  font-size: 13px;
  color: var(--text-secondary);
}

bim-checkbox::part(box) {
  border-radius: 4px;
  border-color: var(--border-default);
}

bim-checkbox[checked]::part(box) {
  background: var(--accent);
  border-color: var(--accent);
}
```

---

## Status Colors

### Normal Status
```css
--status-normal: #16a34a;      /* Light theme */
--status-normal: #34d399;      /* Dark theme */
--status-normal-bg: rgba(22, 163, 74, 0.12);   /* Light */
--status-normal-bg: rgba(52, 211, 153, 0.15);  /* Dark */
```

### Warning Status
```css
--status-warning: #ca8a04;     /* Light theme */
--status-warning: #fbbf24;     /* Dark theme */
--status-warning-bg: rgba(202, 138, 4, 0.15);  /* Light */
--status-warning-bg: rgba(251, 191, 36, 0.18); /* Dark */
```

### Alarm Status
```css
--status-alarm: #dc2626;       /* Light theme */
--status-alarm: #f87171;       /* Dark theme */
--status-alarm-bg: rgba(220, 38, 38, 0.12);    /* Light */
--status-alarm-bg: rgba(248, 113, 113, 0.18);  /* Dark */
```

---

## Icons

### Icon Library

Using Material Design Icons (MDI) via `mdi:icon-name` format.

### Common Icons

| Purpose | Icon |
|---------|------|
| Properties | `mdi:information-outline` |
| Sensors/Gauge | `mdi:gauge` |
| Documents | `mdi:file-document-multiple` |
| Filter | `mdi:filter` |
| Search | `mdi:magnify` |
| Add | `mdi:plus` |
| Delete | `mdi:delete` |
| Check/Apply | `mdi:check` |
| Close/Clear | `mdi:close` |
| Eye (show) | `mdi:eye` / `mdi:eye-outline` |
| Eye off (hide) | `mdi:eye-off-outline` |
| Settings | `mdi:cog` |

### SVG Icon Styling

```css
svg {
  width: 16px;  /* Small: settings buttons */
  width: 18px;  /* Medium: toolbar buttons */
  width: 21px;  /* Large: main toolbar */
  height: auto;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}
```

---

## Scrollbar Styling

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-strong);
}
```

---

## Animation Guidelines

### Panel Collapse/Expand
- Duration: 250ms
- Easing: ease-out
- Properties: grid-template-columns, opacity

### Hover States
- Duration: 100-150ms
- Easing: ease-out
- Properties: background, color, border-color

### Button Active States
- Duration: 100ms
- Easing: ease-out

### Viewport Resize
- Block resize during panel animations
- Use requestAnimationFrame for smooth updates

---

## Responsive Behavior

### Panel Width Constraints
```css
--min-panel-width: 200px;
--max-panel-width: 480px;
--default-panel-width: 320px;
```

### Sidebar Toggle Buttons
- Position: Fixed on panel edges
- Visible on hover near edge
- Chevron icon indicates direction

---

## Z-Index Layers

```css
--z-panel: 1;
--z-toolbar: 1000;
--z-views-toolbar: 1000;
--z-sidebar-toggle: 100;
--z-resize-handle: 50;
--z-help-panel: 1500;
--z-modal: 2000;
```

---

## Key Visual Principles

1. **Subtle elevation**: Use opacity and subtle borders instead of heavy shadows
2. **Warm tones in light mode**: Paper-inspired cream/beige, not stark white
3. **Blueprint aesthetic in dark mode**: Deep blue-gray palette
4. **Consistent accent**: Blueprint blue (#3b82f6 dark, #2563eb light)
5. **Technical typography**: Inter for UI, JetBrains Mono for values
6. **4px spacing grid**: All spacing derived from 4px base
7. **Smooth transitions**: Fast but not instant, ease-out curves
8. **High contrast text**: Ensure readability with appropriate opacity levels
