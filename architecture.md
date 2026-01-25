# IFC-Viewer Digital Twin Application - Architecture

## Overview

A digital twin viewer for BIM/IFC models built with Three.js and the @thatopen component framework. Features real-time BMS sensor simulation, document management, and advanced 3D interaction tools.

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| 3D Engine | Three.js | 0.182.0 |
| BIM Framework | @thatopen/components | 3.2.7 |
| UI Framework | @thatopen/ui (BUI) | 3.2.4 |
| Build Tool | Vite | 6.4.1 |
| Language | TypeScript | 5.9.3 |
| Storage | IndexedDB | Browser API |

## Project Structure

```
ifc-viewer/
├── src/
│   ├── main.ts              # Application entry point and UI
│   ├── bms-mock.ts          # Building Management System mock API
│   └── document-store.ts    # IndexedDB document storage service
├── public/
│   └── resources/
│       └── worker.mjs       # Web Worker for fragment processing
├── index.html               # HTML entry with CSS design system
├── package.json
└── tsconfig.json
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
BMSApi.getSensorData(guid)             // Get current sensor readings
BMSApi.subscribe(guid, callback)       // Real-time updates (5s interval)
BMSApi.getHistoricalData(guid, hours)  // Time-series data
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
type DocumentType = 'manual' | 'specification' | 'drawing' |
                    'certificate' | 'photo' | 'report' | 'other';

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
| `main.ts` | 1-200 | Initialization, component setup |
| `main.ts` | 200-400 | Event handlers, data fetching |
| `main.ts` | 400-600 | UI components (panels) |
| `main.ts` | 600-800 | Toolbar, layout assembly |
| `bms-mock.ts` | All | BMSApi class, simulation logic |
| `document-store.ts` | All | DocumentStore class, IndexedDB ops |

## Quick Start for Development

1. **Add new UI panel**: Create BUI.Component, add to grid layout
2. **Add new tool**: Add toolbar button, implement handler, wire events
3. **Add new data source**: Create service class (like BMSApi), initialize in main.ts
4. **Modify selection behavior**: Update `highlighter.onSelection` handler
5. **Change classification**: Modify `buildSystemsClassification()` function
