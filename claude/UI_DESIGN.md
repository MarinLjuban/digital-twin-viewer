# IFC-Viewer Digital Twin - UI Design & Architecture

## Overview

A digital twin viewer for BIM/IFC models built with Three.js and the @thatopen component framework. Features real-time BMS sensor simulation, document management, and advanced 3D interaction tools.

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| 3D Engine | Three.js | 0.182.0 |
| BIM Framework | @thatopen/components | 3.2.7 |
| BIM Frontend | @thatopen/components-front | 3.2.17 |
| UI Framework | @thatopen/ui (BUI) | 3.2.4 |
| Pre-built UI | @thatopen/ui-obc (BUIC) | 3.2.3 |
| Fragments | @thatopen/fragments | 3.2.13 |
| Charts | Chart.js | 4.4.1 |
| Build Tool | Vite | 6.4.1 |
| Language | TypeScript | 5.9.3 |
| Storage | IndexedDB | Browser API |

## Current File Structure

```
digital-twin-viewer/
├── src/
│   ├── main.ts              # Application entry point and UI (5,062 lines)
│   ├── bms-mock.ts          # Building Management System mock API (456 lines)
│   ├── document-store.ts    # IndexedDB document storage service (758 lines)
│   └── i18n.ts              # Internationalization EN/HR (681 lines)
├── public/
│   ├── models/
│   │   ├── OfficeBuilding_complete_2024.frag # Pre-converted fragment (fast loading)
│   │   └── OfficeBuilding_complete_2024.ifc  # Original IFC model (fallback)
│   ├── documents/           # Pre-configured document PDFs (6 files)
│   ├── resources/
│   │   └── worker.mjs       # Web Worker for fragment processing
│   ├── USER_GUIDE.pdf       # English user guide
│   ├── USER_GUIDE_HR.pdf    # Croatian user guide
│   ├── USER_GUIDE.md        # English markdown guide
│   └── USER_GUIDE_HR.md     # Croatian markdown guide
├── claude/                  # Claude documentation
│   ├── CLAUDE_PROMPT.md     # Rebuild instructions
│   ├── REBUILD_GUIDELINES.md # Architecture guidelines
│   ├── CODE_PATTERNS.md     # Code patterns to preserve
│   └── UI_DESIGN.md         # This file
├── index.html               # HTML entry with CSS design system
├── package.json
├── tsconfig.json
└── vite.config.ts           # Vite bundler configuration
```

---

## UI Layout Architecture

### Three-Panel Layout

```
┌─────────────────┬──────────────────────┬─────────────────┐
│   Model Panel   │     3D Viewport      │ Selection Panel │
│    (20rem)      │       (1fr)          │    (20rem)      │
│                 │                      │                 │
│ • Load IFC/FRAG │                      │ ┌─────────────┐ │
│ • Spatial Tree  │   <bim-viewport>     │ │ Tabs:       │ │
│ • Filter Panel  │                      │ │ Properties  │ │
│                 │                      │ │ Sensors     │ │
│ Settings:       │                      │ │ Documents   │ │
│ [☀️][EN][❓]     │                      │ └─────────────┘ │
└─────────────────┴──────────────────────┴─────────────────┘
                         │
              ┌──────────┴──────────┐
              │  Floating Toolbar   │
              │ Nav│Measure│Clip│2D │
              └─────────────────────┘
```

### Panel Details

#### Model Panel (Left)
- **Load Section**: File input for IFC/FRAG files
- **Spatial Tree**: Hierarchical model structure using BUIC.tables.elementTree
- **Filter Panel**: Category and attribute-based filtering
- **Settings Row**: Theme toggle, Language toggle (EN/HR), Help button

#### Selection Panel (Right) - Tabbed Interface
- **Properties Tab**: Element properties table (BIM table groups)
- **Sensors Tab**: BMS sensor cards with real-time updates
- **Documents Tab**: Document list with upload/download/delete

#### Floating Toolbar (Bottom Center)
| Group | Features |
|-------|----------|
| Navigation | Orbit, FirstPerson, Plan camera modes |
| Measurement | Length, Area measurement + clear |
| Clipping | Create/toggle/delete section planes |
| Visibility | Ghost, Isolate, Hide, Show All |
| 2D Views | Floor Plans, Elevations, Exit 2D, Saved Views |

---

## Design System

### Color Scheme

#### Light Theme (Default - Warm Paper)
```css
:root, [data-theme="light"] {
  /* Surface hierarchy */
  --canvas: #e8e6e1;           /* Viewport background */
  --surface-base: #f0eeea;     /* Panel backgrounds */
  --surface-raised: #f5f3ef;   /* Elevated elements */
  --surface-overlay: #e3e1dc;  /* Overlays, dropdowns */

  /* Text hierarchy */
  --text-primary: rgba(28, 25, 23, 0.95);
  --text-secondary: rgba(28, 25, 23, 0.72);
  --text-tertiary: rgba(28, 25, 23, 0.55);
  --text-muted: rgba(28, 25, 23, 0.38);

  /* Borders */
  --border-subtle: rgba(28, 25, 23, 0.06);
  --border-default: rgba(28, 25, 23, 0.12);
  --border-strong: rgba(28, 25, 23, 0.18);

  /* Accent */
  --accent: #2563eb;           /* Blueprint blue */
  --accent-muted: rgba(37, 99, 235, 0.12);
  --accent-hover: #3b82f6;

  /* Status */
  --status-normal: #16a34a;
  --status-warning: #ca8a04;
  --status-alarm: #dc2626;
}
```

#### Dark Theme (Blueprint Night)
```css
[data-theme="dark"] {
  /* Surface hierarchy */
  --canvas: #0f1117;           /* Viewport background */
  --surface-base: #161922;     /* Panel backgrounds */
  --surface-raised: #1c1f2a;   /* Elevated elements */
  --surface-overlay: #232733;  /* Overlays, dropdowns */

  /* Text hierarchy */
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.72);
  --text-tertiary: rgba(255, 255, 255, 0.50);
  --text-muted: rgba(255, 255, 255, 0.32);

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.10);
  --border-strong: rgba(255, 255, 255, 0.16);

  /* Accent */
  --accent: #3b82f6;           /* Lighter blueprint */
  --accent-muted: rgba(59, 130, 246, 0.15);
  --accent-hover: #60a5fa;

  /* Status */
  --status-normal: #34d399;
  --status-warning: #fbbf24;
  --status-alarm: #f87171;
}
```

### Typography

- **UI Font**: Inter (400, 500, 600)
- **Monospace**: JetBrains Mono (for code/data)
- **Base Size**: 13px
- **Line Height**: 1.5

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
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
```

---

## BUI Component Customization

### Panel Styling
```css
bim-panel {
  --bim-ui_bg-base: var(--surface-base);
  --bim-ui_color-text: var(--text-primary);
  background: var(--surface-base) !important;
  border-right: 1px solid var(--border-subtle) !important;
}

bim-panel[label="Model"] {
  border-right: none !important;
  border-left: 1px solid var(--border-subtle) !important;
}

bim-panel[label="Selection"] {
  border-left: 1px solid var(--border-subtle) !important;
  border-right: none !important;
}
```

### Tab Styling
```css
bim-tabs::part(tab-list) {
  background: var(--surface-raised);
  border-bottom: 1px solid var(--border-subtle);
  padding: var(--space-1) var(--space-2);
  gap: var(--space-1);
}

bim-tab::part(tab-button) {
  font-size: 12px;
  font-weight: 500;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
}

bim-tab[active]::part(tab-button) {
  color: var(--accent);
  background: var(--accent-muted);
}
```

### Button Styling
```css
bim-button {
  --bim-button--bgc: var(--surface-raised);
  --bim-button--olc: var(--border-default);
  --bim-button--c: var(--text-primary);
  border-radius: var(--radius-md) !important;
  padding: var(--space-2) var(--space-3) !important;
  min-height: 36px !important;
}
```

---

## Key UI Components

### Settings Buttons (Model Panel Header)
```
┌────────────────────────────────┐
│  [☀️/🌙]  [EN/HR]  [❓]         │
│  Theme   Language  Help        │
└────────────────────────────────┘
```

- **Theme Toggle**: Switches between light/dark, updates scene background, persists to localStorage
- **Language Toggle**: Switches EN/HR, triggers page reload (required for BUI), persists to localStorage
- **Help Toggle**: Opens floating, draggable help panel with language-appropriate PDF

### Help Panel (Floating)
```css
.help-panel {
  position: fixed;
  top: 60px;
  right: 24px;
  width: 700px;
  height: 80vh;
  min-width: 400px;
  min-height: 300px;
  resize: both;
  z-index: 1500;
}
```

Features:
- Draggable via header
- Resizable
- Loads USER_GUIDE.pdf or USER_GUIDE_HR.pdf based on language
- Close button in header

### Sensor Card
```
┌─────────────────────────────────┐
│ ▌ Temperature        [NORMAL]  │
│ ▌                              │
│ ▌  23.5 °C                     │
│ ▌                              │
│ ▌  [Historical Chart Button]   │
└─────────────────────────────────┘
```

- Left border color indicates status (green/yellow/red)
- Status badge in top-right
- Large value display
- Optional historical chart expansion

### Document Card
```
┌─────────────────────────────────┐
│ 📄 HVAC Technical Manual       │
│    manual • 2.4 MB             │
│    [Download] [Delete]         │
└─────────────────────────────────┘
```

---

## State Management

### Global State Variables
```typescript
// Selection
let currentSelection: OBC.ModelIdMap = {};

// UI state
let modelPanelCollapsed = false;
let propertiesPanelCollapsed = false;
let ghostingEnabled = false;

// Filter state
let filterConditions: FilterCondition[] = [];
let filterAggregation: "inclusive" | "exclusive";

// Service state
let currentBMSSubscription: (() => void) | null;
let currentSelectedGuid: string | null;

// Theme and Language (persisted in localStorage)
// 'ifc-viewer-theme': 'light' | 'dark'
// 'ifc-viewer-language': 'en' | 'hr'
```

### State Update Patterns

1. **Selection Changes** → Updates all three tabs (Properties, Sensors, Documents)
2. **Filter Execution** → Updates Selection → Cascades to all panels
3. **BMS Updates** → Observer callback → Re-renders sensor display
4. **Camera Movement** → LOD recalculation
5. **Theme Change** → Updates CSS, scene background
6. **Language Change** → Saves preference, triggers page reload

---

## Data Flow

### IFC Loading Pipeline
```
IFC File → IfcLoader → FragmentsManager → Scene → Renderer → Canvas
                           │
                           └→ Classifier (builds spatial tree)
```

### Selection → Display Pipeline
```
Click Event
    └→ Highlighter.onSelection
            ├→ updatePropertiesTable()
            │       └→ model.getItemsData() → Render <bim-table>
            ├→ updateBMSSensorDisplay()
            │       └→ BMSApi.subscribe() → Render sensor cards
            └→ updateDocumentDisplay()
                    └→ DocumentStore.getDocuments() → Render list
```

---

## Internationalization

### Supported Languages
- **English (en)** - Default
- **Croatian (hr)**

### Implementation
- All UI strings in `i18n.ts` (681 lines)
- ~150+ translatable strings
- Sensor type labels, document type labels, status labels
- Language persisted in localStorage
- **Page reload required** to update BUI components (they don't support dynamic updates)

### Language Toggle Flow
```
User clicks [EN/HR] button
    └→ toggleLanguage() saves to localStorage
        └→ window.location.reload()
            └→ i18n.ts reads from localStorage on load
                └→ All BUI components render with new language
```

---

## Custom Services

### BMSApi (`bms-mock.ts` - 456 lines)
Mock Building Management System with real-time sensor simulation.

**Sensor Types**: temperature, humidity, CO2, occupancy, energy, lighting, airflow, pressure

**Key Methods**:
```typescript
BMSApi.initialize()                    // Load database, start simulation
BMSApi.getData(guid)                   // Get current sensor readings (async)
BMSApi.getMultipleData(guids)          // Get sensor data for multiple elements
BMSApi.getHistoricalData(guid, type, hours) // Time-series data
BMSApi.subscribe(guid, callback)       // Real-time updates (5s interval)
BMSApi.getRegisteredGuids()            // Get all registered IFC GUIDs
```

### DocumentStore (`document-store.ts` - 758 lines)
Client-side document management using IndexedDB.

**Document Types**: manual, specification, drawing, report, warranty, certificate, maintenance, other

**Key Methods**:
```typescript
DocumentStore.initialize()                        // Setup IndexedDB schema
DocumentStore.storeDocument(file, guid, metadata) // Store document
DocumentStore.getDocumentsForMultipleGuids(guids) // Bulk query
DocumentStore.downloadDocument(id)                // Trigger download
DocumentStore.deleteDocument(id)                  // Remove document
```

---

## Performance Optimizations

| Feature | Implementation |
|---------|----------------|
| LOD | FragmentsManager adjusts quality by camera distance |
| Update Rate | 50ms for visibility recalculation |
| Viewport Resize Blocking | Prevents resize during sidebar transitions |
| Ghosting | Optional transparency for non-selected elements |
| Async Storage | IndexedDB prevents UI blocking |
| BMS Simulation | 5s interval with delta updates |
| Query Optimization | ItemsFinder uses regex patterns |
| Fragment Format | 10-100x faster than IFC parsing |

---

## Key Event Handlers

```typescript
// Selection events
highlighter.onSelection.add((selection) => {
  currentSelection = selection;
  updatePropertiesTable(selection);
  updateBMSSensorDisplay(selection);
  updateDocumentDisplay(selection);
});

// Hover events
hoverer.onHover.add((result) => {
  // Visual feedback only
});

// Model loaded events
fragments.list.onItemSet.add(async ({ value: model }) => {
  world.scene.three.add(model.object);
  // Build spatial tree
});

// Camera events (LOD)
world.camera.controls.addEventListener("rest", () => fragments.core.update(true));
world.camera.controls.addEventListener("update", () => fragments.core.update(false));

// Theme change
themeToggle.addEventListener('click', () => {
  requestAnimationFrame(updateSceneBackground);
});

// Language change
langToggle.addEventListener('click', () => {
  toggleLanguage();
  window.location.reload();
});
```

---

## Extensibility Points

| Extension | Location | Pattern |
|-----------|----------|---------|
| New sensor types | `bms-mock.ts` → `sensorConfigs` | Add config object |
| Document types | `document-store.ts` → `DocumentType` | Extend union type |
| Custom filters | `main.ts` → `FilterCondition` | Extend interface |
| New tools | `main.ts` → toolbar | Add BUI button + handler |
| New language | `i18n.ts` | Add translation object |
| Theme colors | `index.html` → CSS variables | Add/modify variables |

---

## File Reference Guide (Current)

| File | Lines | Purpose |
|------|-------|---------|
| `src/main.ts` | 5,062 | Monolithic main application |
| `src/document-store.ts` | 758 | IndexedDB document management |
| `src/i18n.ts` | 681 | Internationalization EN/HR |
| `src/bms-mock.ts` | 456 | BMS sensor simulation |
| `index.html` | 843 | HTML + CSS design system |

**Total TypeScript**: ~6,957 lines

---

## Quick Start for Development

1. **Add new UI panel**: Create BUI.Component, add to grid layout
2. **Add new tool**: Add toolbar button, implement handler, wire events
3. **Add new data source**: Create service class (like BMSApi), initialize in main.ts
4. **Modify selection behavior**: Update `highlighter.onSelection` handler
5. **Add translation**: Add key to `i18n.ts` translations object
6. **Change theme colors**: Modify CSS variables in `index.html`
