# IFC-Viewer Digital Twin Application - Architecture

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

## Project Structure

```
ifc-viewer/
├── src/
│   ├── main.ts              # Application entry point and UI (3686 lines)
│   ├── bms-mock.ts          # Building Management System mock API
│   ├── document-store.ts    # IndexedDB document storage service
│   └── mi_maris_doo_logo.jpg # Company logo asset
├── public/
│   ├── models/
│   │   ├── OfficeBuilding_complete_2024.frag # Pre-converted fragment (fast loading)
│   │   └── OfficeBuilding_complete_2024.ifc  # Original IFC model (fallback)
│   ├── documents/           # Pre-configured document PDFs (6 files)
│   └── resources/
│       └── worker.mjs       # Web Worker for fragment processing
├── index.html               # HTML entry with CSS design system
├── package.json
├── tsconfig.json
├── vite.config.ts           # Vite bundler configuration
├── architecture.md          # This file (developer reference)
├── scriptReferences.md      # API reference guide
├── USER_GUIDE.md            # End-user documentation
└── convert-ifc-to-frag.html # IFC to Fragment conversion utility
```

## Core Architecture

### Component Registry Pattern

The application uses @thatopen's component registry pattern:

```typescript
const components = new OBC.Components();

// Access components via .get()
const ifcLoader = components.get(OBC.IfcLoader);
const highlighter = components.get(OBCF.Highlighter);
const fragments = components.get(OBC.FragmentsManager);
```

### Initialization Flow

```
index.html
    └── src/main.ts
            ├── OBC.Components initialization
            ├── World setup (Scene, Camera, Renderer)
            ├── IfcLoader configuration
            ├── Highlighter/Hoverer setup
            ├── FragmentsManager with LOD
            ├── loadDefaultModel()
            │   ├── Try: Load .frag file (fast path)
            │   └── Fallback: Load .ifc file (slower)
            ├── BMSApi.initialize()
            ├── DocumentStore.initialize()
            └── UI component creation
```

## Key Components

### Rendering System

| Component | Class | Purpose |
|-----------|-------|---------|
| Scene | `OBC.SimpleScene` | Three.js scene management |
| Camera | `OBC.OrthoPerspectiveCamera` | Orbit/FirstPerson/Plan modes |
| Renderer | `OBC.SimpleRenderer` | WebGL rendering |
| Grid | `OBC.Grids` | Scene grid visualization |
| Highlighter | `OBCF.Highlighter` | Selection/hover effects |

### IFC Model Management

| Component | Purpose |
|-----------|---------|
| `OBC.IfcLoader` | Parses IFC files into Fragment format |
| `OBC.FragmentsManager` | Model loading, LOD, scene management |
| `OBC.Classifier` | Categorizes elements (MEP systems) |
| `OBC.ItemsFinder` | Query execution (category/attribute filters) |

### Custom Services

#### BMSApi (`bms-mock.ts`)

Mock Building Management System with real-time sensor simulation.

```typescript
// Sensor types
type SensorType = 'temperature' | 'humidity' | 'occupancy' | 'co2' |
                  'energy' | 'lighting' | 'airflow' | 'pressure';

// Key methods
BMSApi.initialize()                    // Load database, start simulation
BMSApi.getData(guid)                   // Get current sensor readings (async)
BMSApi.getMultipleData(guids)          // Get sensor data for multiple elements
BMSApi.getHistoricalData(guid, type, hours) // Time-series data
BMSApi.subscribe(guid, callback)       // Real-time updates (5s interval)
BMSApi.getAllMonitoredElements()       // Get all elements with sensors
BMSApi.getAlertsElements()             // Get elements with warnings/alarms
BMSApi.getRegisteredGuids()            // Get all registered IFC GUIDs
```

**Features:**
- Maps sensors to IFC elements via GlobalId (GUID)
- Status tracking: normal/warning/alarm
- Observer pattern for real-time updates
- Historical data with time-based patterns

#### DocumentStore (`document-store.ts`)

Client-side document management using IndexedDB.

```typescript
// Document types
type DocumentType = 'manual' | 'specification' | 'drawing' | 'report' |
                    'warranty' | 'certificate' | 'maintenance' | 'other';

// Key methods
DocumentStore.initialize()                        // Setup IndexedDB schema
DocumentStore.storeDocument(file, guid, metadata) // Store document
DocumentStore.getDocumentsForMultipleGuids(guids) // Bulk query
DocumentStore.downloadDocument(id)                // Trigger download
DocumentStore.deleteDocument(id)                  // Remove document
```

## UI Architecture

### Three-Panel Layout

```
┌─────────────────┬──────────────────────┬─────────────────┐
│   Right Panel   │     3D Viewport      │   Left Panel    │
│   (20rem)       │       (1fr)          │    (20rem)      │
│                 │                      │                 │
│ • Load IFC/FRAG │                      │ • Properties    │
│ • Spatial Tree  │   <bim-viewport>     │ • BMS Sensors   │
│ • Filter Panel  │                      │ • Documents     │
│ • Systems Tree  │                      │                 │
└─────────────────┴──────────────────────┴─────────────────┘
                         │
              ┌──────────┴──────────┐
              │  Floating Toolbar   │
              │ Nav│Measure│Clip│2D │
              └─────────────────────┘
```

### UI Framework (BUI)

Uses @thatopen/ui web components:

```typescript
// Component creation pattern
const panel = BUI.Component.create(() => {
  return BUI.html`
    <bim-panel label="Properties">
      <bim-panel-section label="Element">
        <bim-table></bim-table>
      </bim-panel-section>
    </bim-panel>
  `;
});
```

**Key BUI Components:**
- `<bim-grid>` - Layout container
- `<bim-panel>` / `<bim-panel-section>` - Collapsible panels
- `<bim-viewport>` - 3D canvas container
- `<bim-toolbar>` / `<bim-toolbar-group>` - Floating toolbars
- `<bim-button>` / `<bim-dropdown>` - Interactive elements
- `<bim-table>` - Data display

### Floating Toolbar Features

| Group | Features |
|-------|----------|
| Navigation | Orbit, FirstPerson, Plan camera modes |
| Measurement | Length, Area measurement + clear |
| Clipping | Create/toggle/delete section planes |
| Visibility | Ghost, Isolate, Hide, Show All |
| 2D Views | Floor Plans, Elevations, Exit 2D, Saved Views |

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
```

### State Update Patterns

1. **Selection Changes** → Updates Properties, BMS, Documents panels
2. **Filter Execution** → Updates Selection → Cascades to all panels
3. **BMS Updates** → Observer callback → Re-renders sensor display
4. **Camera Movement** → LOD recalculation

## Data Flow

### IFC Loading Pipeline

```
IFC File → IfcLoader → FragmentsManager → Scene → Renderer → Canvas
                           │
                           └→ Classifier (builds Systems tree)
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
  world.scene.three.add(model);
  await buildSystemsClassification();
});

// Camera events (LOD)
world.camera.controls.addEventListener("rest", () => fragments.update());
```

## IFC Element Classification

### Systems Classification

Groups MEP elements by ObjectType:

```typescript
const mepTypes = [
  "IFCDUCTSEGMENT", "IFCPIPESEGMENT", "IFCFAN",
  "IFCVALVE", "IFCAIRTERMINAL", "IFCUNITARYEQUIPMENT"
];

// Builds tree structure under "Systems" category
await classifier.bySystems(model, modelSystems);
```

### Filter System

```typescript
interface FilterCondition {
  type: "category" | "attribute";
  category?: string;        // e.g., "IFCWALL"
  attribute?: string;       // e.g., "Name"
  operator?: string;        // "contains", "equals", "regex"
  value?: string;
}

// Aggregation modes
"inclusive"  // OR - any condition matches
"exclusive"  // AND - all conditions match
```

## Performance Optimizations

| Feature | Implementation |
|---------|----------------|
| LOD | FragmentsManager adjusts quality by camera distance |
| Update Rate | 50ms for visibility recalculation |
| Ghosting | Optional transparency for non-selected elements |
| Async Storage | IndexedDB prevents UI blocking |
| BMS Simulation | 5s interval with delta updates |
| Query Optimization | ItemsFinder uses regex patterns |

## Design System

### Colors (Dark Theme)

```css
--bim-ui--bg-base: #161922;      /* Panel backgrounds */
--bim-ui--color-accent: #3b82f6; /* Blueprint blue */
--bim-ui--bg-canvas: #0f1117;    /* Viewport background */
```

### Typography

- UI Text: Inter font family
- Code/Data: JetBrains Mono
- 4px base spacing scale

## Extensibility Points

| Extension | Location | Pattern |
|-----------|----------|---------|
| New sensor types | `bms-mock.ts` → `sensorConfigs` | Add config object |
| Document types | `document-store.ts` → `DocumentType` | Extend union type |
| Custom filters | `main.ts` → `FilterCondition` | Extend interface |
| New tools | `main.ts` → toolbar | Add BUI button + handler |
| Systems grouping | `buildSystemsClassification()` | Modify classification logic |

## File Reference Guide

| File | Lines | Key Functions |
|------|-------|---------------|
| `main.ts` | 1-150 | Imports, helpers, scene/camera/renderer setup |
| `main.ts` | 151-280 | IFC loader, FragmentsManager, default model loading |
| `main.ts` | 281-400 | Classifier, ItemsFinder, systems classification |
| `main.ts` | 401-630 | Systems tree rendering |
| `main.ts` | 631-820 | Properties panel, BIM tables |
| `main.ts` | 821-1150 | BMS sensor display, sensor icons |
| `main.ts` | 1151-1460 | Sensor chart visualization (Chart.js) |
| `main.ts` | 1461-1925 | Document management UI, upload, modal viewer |
| `main.ts` | 1926-2480 | Measurement tools, clipping, visibility controls |
| `main.ts` | 2481-2750 | Camera navigation modes, keyboard handlers |
| `main.ts` | 2751-3460 | Panel layouts, floating toolbar creation |
| `main.ts` | 3461-3686 | Layout assembly, grid setup, final initialization |
| `bms-mock.ts` | 1-457 | BMSApi class, sensor simulation, subscription logic |
| `document-store.ts` | 1-759 | DocumentStore class, IndexedDB ops, mock document seeding |

## Quick Start for Development

1. **Add new UI panel**: Create BUI.Component, add to grid layout
2. **Add new tool**: Add toolbar button, implement handler, wire events
3. **Add new data source**: Create service class (like BMSApi), initialize in main.ts
4. **Modify selection behavior**: Update `highlighter.onSelection` handler
5. **Change classification**: Modify `buildSystemsClassification()` function
