# Digital Twin IFC Viewer - Rebuild Guidelines

This document provides complete context and architectural guidelines for rebuilding the IFC Viewer digital twin application from scratch using proper patterns.

## Project Overview

**Purpose:** A digital twin application for Building Information Modeling (BIM) that combines:
- 3D visualization of IFC building models
- Real-time BMS (Building Management System) sensor integration
- Document management linked to building elements
- Interactive filtering, measuring, and sectioning tools
- Multi-language support (English & Croatian)

**Current State (January 2026):** The application works but has a monolithic architecture (5,062 line main.ts) that's difficult to maintain and extend. Total codebase is ~7,000 lines of TypeScript.

---

## Tech Stack (Keep These)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | ^6.x | Build tool, dev server |
| **TypeScript** | ^5.x | Type-safe development |
| **Three.js** | ^0.182.x | WebGL 3D rendering |
| **@thatopen/components** | ^3.2.x | Core BIM/IFC processing |
| **@thatopen/components-front** | ^3.2.x | Highlighter, selection UI |
| **@thatopen/ui (BUI)** | ^3.2.x | Web component UI library |
| **@thatopen/ui-obc (BUIC)** | ^3.2.x | Pre-built BIM UI components |
| **@thatopen/fragments** | ^3.2.x | Optimized model format |
| **Chart.js** | ^4.x | Historical data visualization |
| **IndexedDB** | Browser API | Client-side document storage |

---

## Target Architecture

### Directory Structure

```
src/
├── main.ts                    # Entry point only (~50 lines)
├── app.ts                     # Application orchestrator
│
├── core/                      # Core infrastructure
│   ├── index.ts
│   ├── state/                 # Centralized state management
│   │   ├── index.ts
│   │   ├── store.ts           # State store with subscriptions
│   │   ├── actions.ts         # Action types and creators
│   │   └── selectors.ts       # State selectors
│   │
│   ├── events/                # Event bus system
│   │   ├── index.ts
│   │   ├── event-bus.ts       # Central event emitter
│   │   └── events.ts          # Event type definitions
│   │
│   └── config/                # Configuration
│       ├── index.ts
│       ├── app-config.ts      # Application settings
│       ├── ifc-categories.ts  # IFC category definitions
│       └── sensor-config.ts   # BMS sensor thresholds
│
├── scene/                     # 3D Scene management
│   ├── index.ts
│   ├── scene-manager.ts       # Scene, camera, renderer setup
│   ├── model-loader.ts        # IFC/Fragment loading
│   ├── lod-controller.ts      # Level of detail management
│   └── theme-handler.ts       # Scene background theming
│
├── features/                  # Feature modules (each self-contained)
│   ├── selection/
│   │   ├── index.ts
│   │   ├── selection-manager.ts
│   │   ├── highlighter-config.ts
│   │   └── ghosting-effect.ts
│   │
│   ├── filtering/
│   │   ├── index.ts
│   │   ├── filter-engine.ts
│   │   ├── filter-types.ts
│   │   └── filter-utils.ts
│   │
│   ├── measurement/
│   │   ├── index.ts
│   │   ├── measurement-manager.ts
│   │   ├── length-measurement.ts
│   │   └── area-measurement.ts
│   │
│   ├── sectioning/
│   │   ├── index.ts
│   │   ├── clipper-manager.ts
│   │   └── section-plane.ts
│   │
│   ├── visibility/
│   │   ├── index.ts
│   │   ├── visibility-manager.ts
│   │   └── isolation-handler.ts
│   │
│   └── navigation/
│       ├── index.ts
│       ├── camera-controller.ts
│       ├── plan-views.ts
│       └── saved-views.ts
│
├── services/                  # External integrations
│   ├── index.ts
│   ├── bms/
│   │   ├── index.ts
│   │   ├── bms-service.ts     # Interface for BMS data
│   │   ├── bms-mock.ts        # Mock implementation
│   │   ├── bms-types.ts       # Type definitions
│   │   └── sensor-database.ts # GUID-to-sensor mappings
│   │
│   ├── documents/
│   │   ├── index.ts
│   │   ├── document-service.ts
│   │   ├── document-store.ts  # IndexedDB implementation
│   │   └── document-types.ts
│   │
│   └── i18n/
│       ├── index.ts
│       ├── i18n-service.ts
│       ├── translations/
│       │   ├── en.ts
│       │   └── hr.ts
│       └── translation-types.ts
│
├── ui/                        # UI layer
│   ├── index.ts
│   ├── layout/
│   │   ├── index.ts
│   │   ├── app-layout.ts      # Main grid layout
│   │   ├── panel-manager.ts   # Panel show/hide logic
│   │   └── viewport.ts        # 3D viewport container
│   │
│   ├── panels/
│   │   ├── index.ts
│   │   ├── model-panel/       # Left panel - model controls
│   │   │   ├── index.ts
│   │   │   ├── model-panel.ts
│   │   │   ├── file-loader.ts
│   │   │   ├── spatial-tree.ts
│   │   │   └── filter-panel.ts
│   │   │
│   │   └── selection-panel/   # Right panel - tabbed (Properties, Sensors, Documents)
│   │       ├── index.ts
│   │       ├── selection-panel.ts
│   │       ├── properties-tab.ts
│   │       ├── sensors-tab.ts
│   │       └── documents-tab.ts
│   │
│   ├── toolbar/
│   │   ├── index.ts
│   │   ├── toolbar.ts
│   │   ├── navigation-tools.ts
│   │   ├── measurement-tools.ts
│   │   ├── section-tools.ts
│   │   ├── visibility-tools.ts
│   │   └── view-tools.ts
│   │
│   └── components/            # Reusable UI components
│       ├── index.ts
│       ├── sensor-card.ts
│       ├── document-card.ts
│       ├── filter-condition.ts
│       ├── history-chart.ts
│       └── help-panel.ts
│
├── utils/                     # Utility functions
│   ├── index.ts
│   ├── guid-utils.ts
│   ├── format-utils.ts
│   ├── dom-utils.ts
│   └── async-utils.ts
│
└── types/                     # Shared type definitions
    ├── index.ts
    ├── model-types.ts
    ├── selection-types.ts
    ├── filter-types.ts
    └── ui-types.ts
```

---

## Core Patterns to Implement

### 1. State Management

Implement a simple, predictable state store:

```typescript
// core/state/store.ts
interface AppState {
  scene: {
    isLoading: boolean;
    loadedModels: string[];
    graphicsQuality: number;
  };
  selection: {
    current: ModelIdMap;
    history: ModelIdMap[];
  };
  filters: {
    conditions: FilterCondition[];
    mode: 'inclusive' | 'exclusive';
    results: ModelIdMap;
  };
  visibility: {
    ghostingEnabled: boolean;
    hiddenElements: Set<string>;
    isolatedElements: Set<string>;
  };
  ui: {
    theme: 'light' | 'dark';
    language: 'en' | 'hr';
    leftPanelVisible: boolean;
    rightPanelVisible: boolean;
    activeSelectionTab: 'properties' | 'sensors' | 'documents';
  };
}

// Action-based updates
type Action =
  | { type: 'SET_SELECTION'; payload: ModelIdMap }
  | { type: 'ADD_FILTER'; payload: FilterCondition }
  | { type: 'TOGGLE_GHOSTING' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'hr' }
  | { type: 'SET_ACTIVE_TAB'; payload: 'properties' | 'sensors' | 'documents' };

// Store with subscriptions
class Store {
  private state: AppState;
  private listeners: Set<(state: AppState) => void>;

  dispatch(action: Action): void;
  subscribe(listener: (state: AppState) => void): () => void;
  getState(): AppState;
  select<T>(selector: (state: AppState) => T): T;
}
```

### 2. Event Bus

Decouple components with events:

```typescript
// core/events/event-bus.ts
type EventMap = {
  'model:loaded': { modelId: string; fragmentsCount: number };
  'model:unloaded': { modelId: string };
  'selection:changed': { selection: ModelIdMap; source: string };
  'filter:applied': { conditions: FilterCondition[]; resultCount: number };
  'sensor:updated': { guid: string; data: SensorReading };
  'theme:changed': { theme: 'light' | 'dark' };
  'language:changed': { language: 'en' | 'hr' };
};

class EventBus {
  on<K extends keyof EventMap>(event: K, handler: (data: EventMap[K]) => void): () => void;
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void;
  once<K extends keyof EventMap>(event: K, handler: (data: EventMap[K]) => void): void;
}

export const eventBus = new EventBus();
```

### 3. Feature Module Pattern

Each feature is self-contained:

```typescript
// features/selection/index.ts
export interface SelectionModule {
  init(components: OBC.Components, world: OBC.World): void;
  dispose(): void;
  select(items: ModelIdMap): void;
  clearSelection(): void;
  getSelection(): ModelIdMap;
}

// features/selection/selection-manager.ts
export function createSelectionModule(): SelectionModule {
  let highlighter: OBCF.Highlighter;
  let currentSelection: ModelIdMap = {};

  return {
    init(components, world) {
      highlighter = components.get(OBCF.Highlighter);
      highlighter.setup({ world });
      // Configure styles, register event handlers
    },

    dispose() {
      // Clean up event handlers, subscriptions
    },

    select(items) {
      currentSelection = items;
      highlighter.highlightByID('select', items);
      eventBus.emit('selection:changed', { selection: items, source: 'selection-manager' });
    },

    clearSelection() {
      highlighter.clear('select');
      currentSelection = {};
      eventBus.emit('selection:changed', { selection: {}, source: 'selection-manager' });
    },

    getSelection() {
      return currentSelection;
    }
  };
}
```

### 4. Service Interface Pattern

Services have clear interfaces with implementations:

```typescript
// services/bms/bms-service.ts
export interface BMSService {
  getSensorData(guid: string): Promise<SensorReading | null>;
  getMultipleSensorData(guids: string[]): Promise<Map<string, SensorReading>>;
  getHistoricalData(guid: string, hours: number): Promise<HistoricalData>;
  subscribe(guid: string, callback: (data: SensorReading) => void): () => void;
  startSimulation(): void;
  stopSimulation(): void;
}

// Can swap mock for real implementation
export function createBMSService(config: BMSConfig): BMSService {
  // Return mock or real implementation based on config
}
```

### 5. UI Component Factory Pattern

UI components are created via factories:

```typescript
// ui/panels/selection-panel/sensors-tab.ts
export interface SensorsTabComponent {
  element: HTMLElement;
  update(guids: string[]): Promise<void>;
  dispose(): void;
}

export function createSensorsTab(
  bmsService: BMSService,
  i18n: I18nService
): SensorsTabComponent {
  const element = BUI.html`<div class="sensors-tab"></div>`;
  const subscriptions: (() => void)[] = [];

  return {
    element,

    async update(guids) {
      // Clear previous subscriptions
      subscriptions.forEach(unsub => unsub());
      subscriptions.length = 0;

      // Fetch and display sensor data
      const data = await bmsService.getMultipleSensorData(guids);
      // Render cards, set up subscriptions
    },

    dispose() {
      subscriptions.forEach(unsub => unsub());
    }
  };
}
```

---

## Implementation Order

### Phase 1: Core Infrastructure
1. Set up project with Vite + TypeScript
2. Implement `core/state/store.ts` - state management
3. Implement `core/events/event-bus.ts` - event system
4. Implement `core/config/` - externalized configuration

### Phase 2: Scene Foundation
1. Implement `scene/scene-manager.ts` - Three.js setup
2. Implement `scene/model-loader.ts` - IFC/Fragment loading
3. Implement `scene/theme-handler.ts` - light/dark theme with scene background sync
4. Verify model loads and renders correctly

### Phase 3: Services Layer
1. Migrate `services/bms/` - BMS mock service
2. Migrate `services/documents/` - document store
3. Migrate `services/i18n/` - translations (EN/HR with page reload on change)
4. Write unit tests for all services

### Phase 4: Core Features
1. Implement `features/selection/` - highlighting, ghosting
2. Implement `features/filtering/` - property-based filtering
3. Implement `features/visibility/` - hide, isolate, show all
4. Implement `features/navigation/` - camera modes, plan views

### Phase 5: Advanced Features
1. Implement `features/measurement/` - length, area tools
2. Implement `features/sectioning/` - clipping planes

### Phase 6: UI Layer
1. Implement `ui/layout/` - grid layout, viewport
2. Implement `ui/toolbar/` - floating toolbar
3. Implement `ui/panels/model-panel/` - left panel (file loader, spatial tree, filters)
4. Implement `ui/panels/selection-panel/` - right panel with tabs (Properties, Sensors, Documents)
5. Implement `ui/components/` - reusable components including help-panel
6. Implement settings buttons (theme toggle, language toggle, help button)

### Phase 7: Integration & Polish
1. Wire everything together in `app.ts`
2. Add error handling and user notifications
3. Performance optimization (debouncing, memoization)
4. Accessibility improvements

---

## Key Features to Implement

### Model Loading
- Support both `.ifc` and `.frag` file formats
- Fragment format is 10-100x faster, prefer when available
- Show loading progress indicator
- Configure LOD (Level of Detail) based on graphics quality setting

### Selection & Highlighting
- Click to select single element
- Shift+click to add to selection
- Visual feedback: blue highlight (#3b82f6)
- Ghosting: non-selected elements at 15% opacity
- Selection triggers updates to all three tabs (properties, sensors, documents)

### Property Filtering
- Filter by IFC category (IfcWall, IfcDoor, etc.)
- Filter by attribute name/value pairs
- Inclusive mode (OR): show any matching
- Exclusive mode (AND): show only all matching
- Display result count

### BMS Sensor Integration
- Sensors linked to elements by IFC GUID
- Types: temperature, humidity, CO2, occupancy, energy, lighting, airflow, pressure
- Real-time updates via subscription (5-second intervals)
- Historical data with Chart.js graphs
- Status indicators: normal (green), warning (yellow), alarm (red)

### Document Management
- Documents linked to elements by IFC GUID
- Types: manual, specification, drawing, report, warranty, certificate, maintenance, other
- Upload, download, delete operations
- IndexedDB storage (works offline)
- Pre-seeded mock documents

### Measurement Tools
- Length measurement between two points
- Area measurement with polygon drawing
- Display measurements in scene
- Clear all measurements

### Section Planes
- Create clipping planes from 3 points
- Toggle plane visibility
- Delete planes
- Multiple planes supported

### Navigation
- Orbit mode (default rotation around point)
- First-person mode (WASD + mouse)
- Plan mode (top-down orthographic)
- Saved floor plan views
- Saved elevation views

### Visibility Controls
- Ghost: fade non-selected elements
- Isolate: show only selected elements
- Hide: hide selected elements
- Show All: reset visibility

### Internationalization
- English (en) - default
- Croatian (hr)
- Persisted language preference
- All UI strings translated
- Page reload required to update BUI components

### Theming
- Light/dark theme toggle
- Scene background adapts to theme (warm paper light / blueprint night dark)
- CSS variables for all colors
- Persisted preference in localStorage

### Help System
- Floating, draggable help panel
- Language-aware PDF loading (USER_GUIDE.pdf or USER_GUIDE_HR.pdf)
- Resizable panel

---

## @thatopen Component Reference

### Core Components (OBC)
```typescript
import * as OBC from "@thatopen/components";

// Initialize
const components = new OBC.Components();
const worlds = components.get(OBC.Worlds);
const world = worlds.create<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>();

// Setup world
world.scene = new OBC.SimpleScene(components);
world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.OrthoPerspectiveCamera(components);

// Essential components
const fragments = components.get(OBC.FragmentsManager);
const ifcLoader = components.get(OBC.IfcLoader);
const classifier = components.get(OBC.Classifier);
const itemsFinder = components.get(OBC.ItemsFinder);
```

### Frontend Components (OBCF)
```typescript
import * as OBCF from "@thatopen/components-front";

const highlighter = components.get(OBCF.Highlighter);
const hoverer = components.get(OBCF.Hoverer);
const lengthMeasurement = components.get(OBCF.LengthMeasurement);
const areaMeasurement = components.get(OBCF.AreaMeasurement);
const clipper = components.get(OBCF.Clipper);
const plans = components.get(OBCF.Plans);
```

### UI Components (BUI)
```typescript
import * as BUI from "@thatopen/ui";
import * as BUIC from "@thatopen/ui-obc";

// Initialize UI
BUI.Manager.init();

// Create elements with tagged templates
const panel = BUI.html`
  <bim-panel label="Properties">
    <bim-panel-section label="Info">
      <bim-table></bim-table>
    </bim-panel-section>
  </bim-panel>
`;

// Tabbed interface
const tabs = BUI.html`
  <bim-tabs>
    <bim-tab label="Properties">...</bim-tab>
    <bim-tab label="Sensors">...</bim-tab>
    <bim-tab label="Documents">...</bim-tab>
  </bim-tabs>
`;

// Pre-built components
const [spatialTree, updateTree] = BUIC.tables.elementTree({
  components,
  models: [],
  selectHighlighterName: "select"
});
```

---

## Configuration Files

### IFC Categories
```typescript
// core/config/ifc-categories.ts
export const IFC_CATEGORIES = [
  { id: 'structural', label: 'Structural', pattern: /Ifc(Wall|Slab|Column|Beam|Footing|Pile)/i },
  { id: 'architectural', label: 'Architectural', pattern: /Ifc(Door|Window|Stair|Ramp|Roof|Ceiling)/i },
  { id: 'mep', label: 'MEP', pattern: /Ifc(Duct|Pipe|Cable|FlowTerminal|EnergyConversion)/i },
  { id: 'furniture', label: 'Furniture', pattern: /IfcFurnishing/i },
  { id: 'openings', label: 'Openings', pattern: /IfcOpening/i },
];
```

### Sensor Thresholds
```typescript
// core/config/sensor-config.ts
export const SENSOR_THRESHOLDS = {
  temperature: { unit: '°C', warning: { low: 18, high: 26 }, alarm: { low: 15, high: 30 } },
  humidity: { unit: '%', warning: { low: 30, high: 60 }, alarm: { low: 20, high: 80 } },
  co2: { unit: 'ppm', warning: { high: 1000 }, alarm: { high: 1500 } },
  occupancy: { unit: 'people', warning: { high: 80 }, alarm: { high: 100 } },
  energy: { unit: 'kWh', warning: { high: 400 }, alarm: { high: 500 } },
  lighting: { unit: '%', warning: { low: 20, high: 90 }, alarm: { low: 10, high: 100 } },
  airflow: { unit: 'm³/h', warning: { low: 200, high: 1800 }, alarm: { low: 100, high: 2000 } },
  pressure: { unit: 'kPa', warning: { low: 98, high: 103 }, alarm: { low: 95, high: 105 } },
};
```

---

## Testing Strategy

### Unit Tests (services, utilities)
```typescript
// services/bms/__tests__/bms-service.test.ts
describe('BMSService', () => {
  it('should return sensor data for valid GUID', async () => {
    const service = createBMSService({ mock: true });
    const data = await service.getSensorData('valid-guid');
    expect(data).toHaveProperty('value');
    expect(data).toHaveProperty('status');
  });

  it('should return null for unknown GUID', async () => {
    const service = createBMSService({ mock: true });
    const data = await service.getSensorData('unknown-guid');
    expect(data).toBeNull();
  });
});
```

### Integration Tests (features)
```typescript
// features/filtering/__tests__/filter-engine.test.ts
describe('FilterEngine', () => {
  it('should filter elements by category', () => {
    const engine = createFilterEngine(mockItemsFinder);
    engine.addCondition({ type: 'category', pattern: /IfcWall/i });
    const results = engine.execute();
    expect(results.size).toBeGreaterThan(0);
  });
});
```

---

## Error Handling

### User-Facing Errors
```typescript
// utils/error-utils.ts
export function showError(message: string, details?: string): void {
  // Display toast notification
  const toast = BUI.html`
    <div class="error-toast">
      <span class="error-message">${message}</span>
      ${details ? BUI.html`<span class="error-details">${details}</span>` : ''}
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

// Usage in features
try {
  await modelLoader.load(file);
} catch (error) {
  showError(t('error.modelLoadFailed'), error.message);
  console.error('Model load failed:', error);
}
```

---

## Performance Guidelines

1. **Debounce filter input** - Don't execute filter on every keystroke
2. **Memoize expensive queries** - Cache classifier results
3. **Lazy load panels** - Don't build panels until needed
4. **Clean up subscriptions** - Always unsubscribe when component unmounts
5. **Use Fragment format** - 10-100x faster than IFC parsing
6. **Configure LOD** - Reduce detail for distant objects
7. **Batch state updates** - Don't trigger re-renders for each change
8. **Block viewport resize during sidebar transitions** - Prevent render thrashing

---

## Resources

### Documentation
- [@thatopen/components docs](https://docs.thatopen.com/)
- [Three.js documentation](https://threejs.org/docs/)
- [BUI component examples](https://github.com/ThatOpen/engine_ui-components)

### Existing Code Reference
- Current `main.ts` - working implementation (monolithic, 5,062 lines)
- `bms-mock.ts` - BMS service mock implementation (456 lines)
- `document-store.ts` - IndexedDB document storage (758 lines)
- `i18n.ts` - internationalization system (681 lines)

### Model Files
- `public/models/OfficeBuilding_complete_2024.frag` - pre-converted (fast)
- `public/models/OfficeBuilding_complete_2024.ifc` - original IFC (fallback)

---

## Success Criteria

The rebuild is successful when:

1. **Maintainability**: No file exceeds 300 lines of code
2. **Testability**: Core services have >80% test coverage
3. **Modularity**: Features can be enabled/disabled independently
4. **Performance**: Model loads in <2 seconds (fragment format)
5. **Reliability**: Error states are handled gracefully
6. **Extensibility**: New features can be added without modifying existing code
7. **Parity**: All existing features work as before
8. **i18n**: Language switch works correctly with page reload

---

## Notes for Claude

- Start with Phase 1 (core infrastructure) before any UI work
- Each phase should be fully working before moving to the next
- Write tests alongside feature implementation
- Reference existing code for business logic, but restructure the architecture
- Ask clarifying questions if requirements are ambiguous
- Commit after each phase with clear commit messages
- Remember: language changes require page reload due to BUI component limitations
- The Selection panel uses tabs (Properties, Sensors, Documents) - not separate sections
