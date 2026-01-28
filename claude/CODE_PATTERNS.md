# Code Patterns to Preserve

This document contains key code patterns from the current implementation that should be preserved or adapted in the rebuild.

---

## 1. Scene Setup Pattern

```typescript
// scene/scene-manager.ts
import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

export interface SceneManager {
  components: OBC.Components;
  world: OBC.World;
  init(container: HTMLElement): void;
  dispose(): void;
}

export function createSceneManager(): SceneManager {
  const components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);

  let world: OBC.World;

  return {
    components,
    get world() { return world; },

    init(container: HTMLElement) {
      world = worlds.create<
        OBC.SimpleScene,
        OBC.OrthoPerspectiveCamera,
        OBC.SimpleRenderer
      >();
      world.name = "main";

      // Scene
      const scene = new OBC.SimpleScene(components);
      scene.setup();
      world.scene = scene;

      // Renderer
      const viewport = document.createElement("bim-viewport");
      container.appendChild(viewport);
      world.renderer = new OBC.SimpleRenderer(components, viewport);

      // Camera
      world.camera = new OBC.OrthoPerspectiveCamera(components);

      // Grid
      const grids = components.get(OBC.Grids);
      grids.create(world);

      // Viewport resize handling with blocking flag
      let blockViewportResize = false;
      viewport.addEventListener("resize", () => {
        if (blockViewportResize) return;
        world.renderer?.resize();
        (world.camera as OBC.OrthoPerspectiveCamera).updateAspect();
      });

      components.init();
    },

    dispose() {
      components.dispose();
    }
  };
}
```

---

## 2. Theme-Aware Background

```typescript
// scene/theme-handler.ts
import * as THREE from "three";

const THEME_COLORS = {
  light: 0xe8e6e1, // Warm paper canvas (softer)
  dark: 0x0f1117,  // Blueprint night
};

export function setupThemeHandler(
  scene: THREE.Scene,
  themeToggleId = 'theme-toggle'
) {
  const updateBackground = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    scene.background = new THREE.Color(isDark ? THEME_COLORS.dark : THEME_COLORS.light);
  };

  // Initial setup
  updateBackground();

  // Listen for theme changes
  const toggle = document.getElementById(themeToggleId);
  toggle?.addEventListener('click', () => {
    requestAnimationFrame(updateBackground);
  });

  return { updateBackground };
}
```

---

## 3. Model Loading with Fragment Fallback

```typescript
// scene/model-loader.ts
import * as OBC from "@thatopen/components";

export interface ModelLoader {
  loadModel(fragPath: string, ifcPath: string): Promise<void>;
}

export function createModelLoader(
  components: OBC.Components,
  world: OBC.World
): ModelLoader {
  const fragments = components.get(OBC.FragmentsManager);
  const ifcLoader = components.get(OBC.IfcLoader);

  // Configure IFC loader
  ifcLoader.settings.autoSetWasm = false;
  ifcLoader.settings.wasm = {
    path: "https://unpkg.com/web-ifc@0.0.72/",
    absolute: false
  };

  return {
    async loadModel(fragPath: string, ifcPath: string) {
      // Try fragment first (10-100x faster)
      try {
        const response = await fetch(fragPath);
        if (response.ok) {
          const contentType = response.headers.get("content-type") || "";
          if (!contentType.includes("text/html")) {
            const buffer = await response.arrayBuffer();
            const data = new Uint8Array(buffer);
            const model = await fragments.core.load(data, { modelId: "default-model" });
            world.scene.three.add(model.object);
            model.useCamera(world.camera.three);
            fragments.core.update(true);
            console.log("Loaded fragment model");
            return;
          }
        }
      } catch (e) {
        console.log("Fragment load failed, trying IFC");
      }

      // Fallback to IFC
      const response = await fetch(ifcPath);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);
      const model = await ifcLoader.load(data, true, world.name!);
      world.scene.three.add(model.object);
      model.useCamera(world.camera.three);
      fragments.core.update(true);
      console.log("Loaded IFC model");
    }
  };
}
```

---

## 4. Highlighter & Ghosting Setup

```typescript
// features/selection/selection-manager.ts
import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as FRAGS from "@thatopen/fragments";

export interface SelectionManager {
  init(): void;
  select(items: OBC.ModelIdMap): Promise<void>;
  clearSelection(): Promise<void>;
  setGhosting(enabled: boolean): Promise<void>;
  getSelection(): OBC.ModelIdMap;
}

export function createSelectionManager(
  components: OBC.Components,
  world: OBC.World,
  onSelectionChange: (selection: OBC.ModelIdMap) => void
): SelectionManager {
  const highlighter = components.get(OBCF.Highlighter);
  const hoverer = components.get(OBCF.Hoverer);
  const fragments = components.get(OBC.FragmentsManager);

  let currentSelection: OBC.ModelIdMap = {};
  let ghostingEnabled = false;

  const getAllModelIds = async (): Promise<OBC.ModelIdMap> => {
    const result: OBC.ModelIdMap = {};
    for (const [modelId, model] of fragments.list) {
      if (model.isDeltaModel) continue;
      const ids = await model.getItemsIdsWithGeometry();
      if (ids?.length > 0) {
        result[modelId] = new Set(ids);
      }
    }
    return result;
  };

  const applyGhosting = async () => {
    if (!ghostingEnabled) {
      await highlighter.clear("ghost");
      return;
    }

    const allIds = await getAllModelIds();
    const ghostIds: OBC.ModelIdMap = {};

    for (const [modelId, ids] of Object.entries(allIds)) {
      const selectedIds = currentSelection[modelId];
      const ghostSet = new Set<number>();
      for (const id of ids) {
        if (!selectedIds || !selectedIds.has(id)) {
          ghostSet.add(id);
        }
      }
      if (ghostSet.size > 0) {
        ghostIds[modelId] = ghostSet;
      }
    }

    await highlighter.highlightByID("ghost", ghostIds, true, false);
  };

  return {
    init() {
      highlighter.setup({ world });
      highlighter.zoomToSelection = false;

      // Ghost style
      highlighter.styles.set("ghost", {
        color: new THREE.Color("#888888"),
        opacity: 0.15,
        transparent: true,
        renderedFaces: FRAGS.RenderedFaces.TWO,
      });

      // Hoverer setup
      hoverer.world = world;
      hoverer.enabled = true;
      hoverer.animation = true;
      hoverer.duration = 150;
      hoverer.material = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.3,
        depthTest: false,
      });

      // Selection event
      highlighter.onSelection.add(async (selection) => {
        currentSelection = selection;
        onSelectionChange(selection);
        if (ghostingEnabled) {
          await applyGhosting();
        }
      });
    },

    async select(items) {
      currentSelection = items;
      await highlighter.highlightByID("select", items, true, true);
      onSelectionChange(items);
      if (ghostingEnabled) {
        await applyGhosting();
      }
    },

    async clearSelection() {
      await highlighter.clear("select");
      currentSelection = {};
      onSelectionChange({});
    },

    async setGhosting(enabled) {
      ghostingEnabled = enabled;
      await applyGhosting();
    },

    getSelection() {
      return currentSelection;
    }
  };
}
```

---

## 5. Filter Engine Pattern

```typescript
// features/filtering/filter-engine.ts
import * as OBC from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";

export interface FilterCondition {
  id: string;
  type: "category" | "attribute";
  category?: string;
  attributeName?: string;
  attributeValue?: string;
}

export interface FilterEngine {
  addCondition(condition: Omit<FilterCondition, 'id'>): string;
  removeCondition(id: string): void;
  setAggregation(mode: 'inclusive' | 'exclusive'): void;
  execute(): Promise<OBC.ModelIdMap>;
  getConditions(): FilterCondition[];
  clear(): void;
}

export function createFilterEngine(
  components: OBC.Components
): FilterEngine {
  const itemsFinder = components.get(OBC.ItemsFinder);

  let conditions: FilterCondition[] = [];
  let aggregation: 'inclusive' | 'exclusive' = 'inclusive';

  const generateId = () =>
    `filter-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  return {
    addCondition(condition) {
      const id = generateId();
      conditions.push({ ...condition, id });
      return id;
    },

    removeCondition(id) {
      conditions = conditions.filter(c => c.id !== id);
    },

    setAggregation(mode) {
      aggregation = mode;
    },

    async execute(): Promise<OBC.ModelIdMap> {
      if (conditions.length === 0) return {};

      const queries: FRAGS.ItemsQueryParams[] = [];

      for (const condition of conditions) {
        if (condition.type === "category" && condition.category) {
          queries.push({
            categories: [new RegExp(condition.category, "i")],
          });
        } else if (condition.type === "attribute" && condition.attributeName) {
          queries.push({
            attributes: {
              queries: [{
                name: new RegExp(condition.attributeName, "i"),
                ...(condition.attributeValue
                  ? { value: new RegExp(condition.attributeValue, "i") }
                  : {}),
              }],
            },
          });
        }
      }

      if (queries.length === 0) return {};

      return await itemsFinder.getItems(queries, { aggregation });
    },

    getConditions() {
      return [...conditions];
    },

    clear() {
      conditions = [];
    }
  };
}
```

---

## 6. BMS Service Interface

```typescript
// services/bms/bms-types.ts
export type SensorType =
  | "temperature" | "humidity" | "occupancy" | "co2"
  | "energy" | "lighting" | "airflow" | "pressure";

export type SensorStatus = "normal" | "warning" | "alarm";

export interface SensorReading {
  value: number;
  unit: string;
  status: SensorStatus;
  timestamp: Date;
  sensorType: SensorType;
}

export interface HistoricalData {
  readings: Array<{ timestamp: Date; value: number }>;
  min: number;
  max: number;
  avg: number;
}

// services/bms/bms-service.ts
export interface BMSService {
  initialize(): void;
  getSensorData(guid: string): SensorReading | null;
  getMultipleSensorData(guids: string[]): Map<string, SensorReading>;
  getHistoricalData(guid: string, hours: number): HistoricalData | null;
  subscribe(guid: string, callback: (data: SensorReading) => void): () => void;
  startSimulation(): void;
  stopSimulation(): void;
  getRegisteredGuids(): string[];
}
```

---

## 7. Document Store Interface

```typescript
// services/documents/document-types.ts
export type DocumentType =
  | "manual" | "specification" | "drawing" | "report"
  | "warranty" | "certificate" | "maintenance" | "other";

export interface DocumentMetadata {
  id: string;
  ifcGuid: string;
  fileName: string;
  displayName: string;
  documentType: DocumentType;
  fileType: string;
  fileSize: number;
  createdDate: Date;
  uploadedAt: Date;
  description?: string;
}

// services/documents/document-service.ts
export interface DocumentService {
  initialize(): Promise<void>;
  getDocumentsByGuid(guid: string): Promise<DocumentMetadata[]>;
  getDocumentsByGuids(guids: string[]): Promise<Map<string, DocumentMetadata[]>>;
  uploadDocument(guid: string, file: File, metadata: Partial<DocumentMetadata>): Promise<string>;
  downloadDocument(id: string): Promise<Blob | null>;
  deleteDocument(id: string): Promise<boolean>;
  getDocumentCount(guid: string): Promise<number>;
}
```

---

## 8. i18n Service Pattern

```typescript
// services/i18n/i18n-service.ts
export type Language = 'en' | 'hr';

export interface I18nService {
  t(key: string): string;
  getLanguage(): Language;
  setLanguage(lang: Language): void;
  toggleLanguage(): Language;
  onLanguageChange(callback: (lang: Language) => void): () => void;

  // Typed helpers for domain terms
  getSensorTypeLabel(type: SensorType): string;
  getDocumentTypeLabel(type: DocumentType): string;
  getStatusLabel(status: SensorStatus): string;
}

// Usage - note: language change requires page reload
const i18n = createI18nService();
const label = i18n.t('properties'); // "Properties" or "Svojstva"
const sensorLabel = i18n.getSensorTypeLabel('temperature'); // "Temperature" or "Temperatura"

// Language toggle with reload
langToggle.addEventListener('click', () => {
  const newLang = i18n.toggleLanguage();
  // Reload the page to apply all translations to BUI components
  window.location.reload();
});
```

---

## 9. Tabbed Selection Panel Pattern

```typescript
// ui/panels/selection-panel/selection-panel.ts
import * as BUI from "@thatopen/ui";

export interface SelectionPanel {
  element: HTMLElement;
  updateSelection(guids: string[]): Promise<void>;
  dispose(): void;
}

export function createSelectionPanel(
  services: { bms: BMSService; documents: DocumentService; i18n: I18nService }
): SelectionPanel {
  const { bms, documents, i18n } = services;

  // Create tabbed panel structure
  const element = BUI.html`
    <bim-panel label="${i18n.t('selection')}">
      <bim-tabs>
        <bim-tab label="${i18n.t('properties')}">
          <div id="properties-content"></div>
        </bim-tab>
        <bim-tab label="${i18n.t('sensors')}">
          <div id="sensors-content"></div>
        </bim-tab>
        <bim-tab label="${i18n.t('documents')}">
          <div id="documents-content"></div>
        </bim-tab>
      </bim-tabs>
    </bim-panel>
  ` as HTMLElement;

  const subscriptions: (() => void)[] = [];

  return {
    element,

    async updateSelection(guids: string[]) {
      // Clear previous subscriptions
      subscriptions.forEach(unsub => unsub());
      subscriptions.length = 0;

      // Update properties tab
      // ...

      // Update sensors tab with subscriptions
      for (const guid of guids) {
        const unsub = bms.subscribe(guid, (data) => {
          // Update sensor display
        });
        subscriptions.push(unsub);
      }

      // Update documents tab
      const docs = await documents.getDocumentsByGuids(guids);
      // Render document list
    },

    dispose() {
      subscriptions.forEach(unsub => unsub());
    }
  };
}
```

---

## 10. Sensor Card Component

```typescript
// ui/components/sensor-card.ts
import * as BUI from "@thatopen/ui";
import { SensorReading } from "../../services/bms/bms-types";

// Helper to get computed CSS variable value
const getCSSVar = (name: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

// Get status color based on current theme
const getStatusColor = (status: "normal" | "warning" | "alarm"): string => {
  return getCSSVar(`--status-${status}`) ||
    (status === "alarm" ? "#dc2626" : status === "warning" ? "#ca8a04" : "#16a34a");
};

const getStatusBgColor = (status: "normal" | "warning" | "alarm"): string => {
  return getCSSVar(`--status-${status}-bg`) ||
    (status === "alarm" ? "rgba(220, 38, 38, 0.12)" :
     status === "warning" ? "rgba(202, 138, 4, 0.15)" :
     "rgba(22, 163, 74, 0.12)");
};

export function createSensorCard(
  reading: SensorReading,
  label: string
): HTMLElement {
  const statusColor = getStatusColor(reading.status);
  const statusBgColor = getStatusBgColor(reading.status);

  return BUI.html`
    <div class="sensor-card" style="
      background: var(--surface-raised);
      border-radius: 8px;
      padding: 12px;
      border-left: 3px solid ${statusColor};
    ">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 500; color: var(--text-secondary);">${label}</span>
        <span class="status-badge" style="
          background: ${statusBgColor};
          color: ${statusColor};
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
        ">${reading.status.toUpperCase()}</span>
      </div>
      <div style="font-size: 24px; font-weight: 600; margin: 8px 0;">
        ${reading.value.toFixed(1)}
        <span style="font-size: 14px; color: var(--text-muted);">${reading.unit}</span>
      </div>
    </div>
  ` as HTMLElement;
}
```

---

## 11. Measurement Tools Setup

```typescript
// features/measurement/measurement-manager.ts
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

export interface MeasurementManager {
  enableLengthMeasurement(): void;
  enableAreaMeasurement(): void;
  disableAll(): void;
  clearMeasurements(): void;
}

export function createMeasurementManager(
  components: OBC.Components,
  world: OBC.World
): MeasurementManager {
  const lengthMeasurement = components.get(OBCF.LengthMeasurement);
  const areaMeasurement = components.get(OBCF.AreaMeasurement);

  // Setup
  lengthMeasurement.world = world;
  areaMeasurement.world = world;

  return {
    enableLengthMeasurement() {
      areaMeasurement.enabled = false;
      lengthMeasurement.enabled = true;
    },

    enableAreaMeasurement() {
      lengthMeasurement.enabled = false;
      areaMeasurement.enabled = true;
    },

    disableAll() {
      lengthMeasurement.enabled = false;
      areaMeasurement.enabled = false;
    },

    clearMeasurements() {
      lengthMeasurement.deleteAll();
      areaMeasurement.deleteAll();
    }
  };
}
```

---

## 12. Clipping Planes Setup

```typescript
// features/sectioning/clipper-manager.ts
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

export interface ClipperManager {
  enable(): void;
  disable(): void;
  togglePlanes(visible: boolean): void;
  deleteAll(): void;
}

export function createClipperManager(
  components: OBC.Components,
  world: OBC.World
): ClipperManager {
  const clipper = components.get(OBCF.Clipper);
  clipper.setup({ world });
  clipper.enabled = false;

  return {
    enable() {
      clipper.enabled = true;
    },

    disable() {
      clipper.enabled = false;
    },

    togglePlanes(visible: boolean) {
      clipper.visible = visible;
    },

    deleteAll() {
      clipper.deleteAll();
    }
  };
}
```

---

## 13. Camera Navigation Modes

```typescript
// features/navigation/camera-controller.ts
import * as OBC from "@thatopen/components";

export type CameraMode = 'orbit' | 'firstPerson' | 'plan';

export interface CameraController {
  setMode(mode: CameraMode): void;
  getMode(): CameraMode;
  exitPlanMode(): void;
}

export function createCameraController(
  camera: OBC.OrthoPerspectiveCamera
): CameraController {
  let currentMode: CameraMode = 'orbit';

  return {
    setMode(mode: CameraMode) {
      switch (mode) {
        case 'orbit':
          camera.projection.set("Perspective");
          camera.mode.set("Orbit");
          break;
        case 'firstPerson':
          camera.projection.set("Perspective");
          camera.mode.set("FirstPerson");
          break;
        case 'plan':
          camera.projection.set("Orthographic");
          camera.mode.set("Plan");
          break;
      }
      currentMode = mode;
    },

    getMode() {
      return currentMode;
    },

    exitPlanMode() {
      if (currentMode === 'plan') {
        this.setMode('orbit');
      }
    }
  };
}
```

---

## 14. Settings Buttons Pattern

```typescript
// ui/components/settings-buttons.ts
import * as BUI from "@thatopen/ui";
import { Language } from "../../services/i18n/i18n-service";

export function createSettingsButtons(
  i18n: { getLanguage: () => Language; toggleLanguage: () => Language }
): HTMLElement {
  const currentLang = i18n.getLanguage();

  return BUI.html`
    <div style="display: flex; gap: 8px; padding: 8px 12px;">
      <!-- Theme Toggle -->
      <button id="theme-toggle" class="panel-settings-btn" style="
        width: 32px; height: 32px;
        border: 1px solid var(--border-default);
        border-radius: var(--radius-md);
        background: var(--surface-raised);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
      ">
        <svg class="icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        <svg class="icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      </button>

      <!-- Language Toggle -->
      <button id="lang-toggle" class="panel-settings-btn" style="
        min-width: 40px; height: 32px;
        border: 1px solid var(--border-default);
        border-radius: var(--radius-md);
        background: var(--surface-raised);
        cursor: pointer;
        font-size: 11px; font-weight: 600;
      ">
        <span class="lang-label">${currentLang.toUpperCase()}</span>
      </button>

      <!-- Help Toggle -->
      <button id="help-toggle" class="panel-settings-btn" style="
        width: 32px; height: 32px;
        border: 1px solid var(--border-default);
        border-radius: var(--radius-md);
        background: var(--surface-raised);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </button>
    </div>
  ` as HTMLElement;
}
```

---

## 15. Fragments Manager Setup with LOD

```typescript
// scene/lod-controller.ts
import * as OBC from "@thatopen/components";

export function setupFragmentsManager(
  components: OBC.Components,
  world: OBC.World,
  workerPath: string
) {
  const fragments = components.get(OBC.FragmentsManager);
  fragments.init(workerPath);

  // LOD settings
  fragments.core.settings.graphicsQuality = 1; // 0=aggressive, 1=high quality
  fragments.core.settings.maxUpdateRate = 50; // ms between updates

  // Update on camera movement
  world.camera.controls.addEventListener("rest", () =>
    fragments.core.update(true)
  );
  world.camera.controls.addEventListener("update", () =>
    fragments.core.update(false)
  );

  // Auto-add models to scene
  fragments.list.onItemSet.add(async ({ value: model }) => {
    model.useCamera(world.camera.three);
    world.scene.three.add(model.object);
    await fragments.core.update(true);
  });

  return fragments;
}
```

---

## 16. Help Panel Pattern (Floating, Draggable)

```typescript
// ui/components/help-panel.ts
export function setupHelpPanel(
  helpToggleId: string,
  getLanguage: () => 'en' | 'hr'
) {
  const helpPanel = document.getElementById('help-panel');
  const helpHeader = document.getElementById('help-panel-header');
  const helpIframe = document.getElementById('help-iframe') as HTMLIFrameElement;
  const helpToggle = document.getElementById(helpToggleId);
  const helpClose = document.getElementById('help-panel-close');

  if (!helpPanel || !helpToggle || !helpIframe) return;

  // Toggle visibility and load language-specific PDF
  helpToggle.addEventListener('click', () => {
    const currentLang = getLanguage();
    const pdfFile = currentLang === 'hr' ? 'USER_GUIDE_HR.pdf' : 'USER_GUIDE.pdf';
    helpIframe.src = new URL(pdfFile, window.location.href).href;
    helpPanel.classList.toggle('visible');
  });

  // Close button
  helpClose?.addEventListener('click', () => {
    helpPanel.classList.remove('visible');
  });

  // Dragging functionality
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  helpHeader?.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).closest('.help-panel-close')) return;
    isDragging = true;
    dragOffsetX = e.clientX - helpPanel.offsetLeft;
    dragOffsetY = e.clientY - helpPanel.offsetTop;
    helpPanel.style.transition = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = Math.max(0, Math.min(e.clientX - dragOffsetX, window.innerWidth - helpPanel.offsetWidth));
    const y = Math.max(0, Math.min(e.clientY - dragOffsetY, window.innerHeight - helpPanel.offsetHeight));
    helpPanel.style.left = x + 'px';
    helpPanel.style.top = y + 'px';
    helpPanel.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    helpPanel.style.transition = '';
  });
}
```

---

## Key Constants to Preserve

```typescript
// core/config/constants.ts
export const HIGHLIGHT_COLOR = 0x3b82f6; // Blueprint blue
export const GHOST_OPACITY = 0.15;
export const HOVER_DURATION = 150; // ms
export const BMS_UPDATE_INTERVAL = 5000; // ms
export const LOD_UPDATE_RATE = 50; // ms
export const WASM_PATH = "https://unpkg.com/web-ifc@0.0.72/";

// Theme colors
export const THEME_COLORS = {
  light: 0xe8e6e1, // Warm paper canvas
  dark: 0x0f1117,  // Blueprint night
};
```
