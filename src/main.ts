/* MD
  ## Showing your model tree 🌲
  ---
  Among the most common things to do with BIM models, is to show their spatial structure. This is really important, because then you can know better the model and see how elements are hierarchized between them. 🔗 Let's learn how you can use the Spatial Tree!

  ### 🖖 Importing our Libraries

  In this tutorial, we will import:

  - @thatopen/components to set up the barebone of our app.
  - @thatopen/components-front to use some frontend-oriented components.
  - @thatopen/ui to add some simple and cool UI menus.
  - @thatopen/ui-obc to add some cool pre-made UI menus for components.
*/

import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
// You have to import from "@thatopen/ui-obc"
import * as BUIC from "@thatopen/ui-obc";
import * as FRAGS from "@thatopen/fragments";
import BMSApi, { BMSDataPoint, SensorType, HistoricalReading } from "./bms-mock";
import DocumentStore, { StoredDocument, DocumentMetadata, DocumentType, DOCUMENT_TYPES } from "./document-store";
import { Chart, registerables } from 'chart.js';
import { t, getLanguage, setLanguage, toggleLanguage, onLanguageChange, getSensorTypeLabel, getDocumentTypeLabel, getDocumentTypes, getStatusLabel, Language } from "./i18n";

// Register Chart.js components
Chart.register(...registerables);

// Helper to get computed CSS variable value
const getCSSVar = (name: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

// Get status color based on current theme
const getStatusColor = (status: "normal" | "warning" | "alarm"): string => {
  return getCSSVar(`--status-${status}`) || (status === "alarm" ? "#dc2626" : status === "warning" ? "#ca8a04" : "#16a34a");
};

const getStatusBgColor = (status: "normal" | "warning" | "alarm"): string => {
  return getCSSVar(`--status-${status}-bg`) || (status === "alarm" ? "rgba(220, 38, 38, 0.12)" : status === "warning" ? "rgba(202, 138, 4, 0.15)" : "rgba(22, 163, 74, 0.12)");
};

/* MD
  ### 📋 Initializing the UI
  As always, let's first initialize the UI library. Remember you only have to do it once in your entire app.
*/

BUI.Manager.init();

/* MD
  ### 🌎 Setting up a simple scene
  ---

  We will start by creating a simple scene with a camera and a renderer. If you don't know how to set up a scene, you can check the Worlds tutorial.
*/

const components = new OBC.Components();

const worlds = components.get(OBC.Worlds);
const world = worlds.create<
  OBC.SimpleScene,
  OBC.OrthoPerspectiveCamera,
  OBC.SimpleRenderer
>();
world.name = "main";

const sceneComponent = new OBC.SimpleScene(components);
sceneComponent.setup();
world.scene = sceneComponent;

// Theme-aware scene background
const THEME_COLORS = {
  light: 0xe8e6e1, // Warm paper canvas (softer)
  dark: 0x0f1117,  // Blueprint night
};

const updateSceneBackground = () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  sceneComponent.three.background = new THREE.Color(isDark ? THEME_COLORS.dark : THEME_COLORS.light);
};

// Set initial background
updateSceneBackground();

// Listen for theme changes
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    // Small delay to let the DOM update first
    requestAnimationFrame(updateSceneBackground);
  });
}

// Language toggle handler
const langToggle = document.getElementById('lang-toggle');
const langLabel = langToggle?.querySelector('.lang-label');

// Set initial language label
if (langLabel) {
  langLabel.textContent = getLanguage().toUpperCase();
}

// Update help panel title based on language
const updateHelpPanelTitle = () => {
  const helpPanelTitle = document.getElementById('help-panel-title');
  if (helpPanelTitle) {
    helpPanelTitle.textContent = t('userGuide');
  }
};
updateHelpPanelTitle();

if (langToggle) {
  langToggle.addEventListener('click', () => {
    const newLang = toggleLanguage();
    if (langLabel) {
      langLabel.textContent = newLang.toUpperCase();
    }
    // Reload the page to apply all translations
    // This is the most reliable way to update all BUI components
    window.location.reload();
  });
}

const viewport = document.createElement("bim-viewport");
const rendererComponent = new OBC.SimpleRenderer(components, viewport);
world.renderer = rendererComponent;

const cameraComponent = new OBC.OrthoPerspectiveCamera(components);
world.camera = cameraComponent;

// Flag to prevent resize during sidebar transitions
let blockViewportResize = false;

viewport.addEventListener("resize", () => {
  if (blockViewportResize) return;
  rendererComponent.resize();
  cameraComponent.updateAspect();
});

const viewerGrids = components.get(OBC.Grids);
viewerGrids.create(world);

components.init();

/* MD

  ### Setting up the components
  First of all, we're going to get the `FragmentIfcLoader` from an existing components instance:
  */

const ifcLoader = components.get(OBC.IfcLoader);

// Configure WASM path explicitly
ifcLoader.settings.autoSetWasm = false;
ifcLoader.settings.wasm = {
  path: "https://unpkg.com/web-ifc@0.0.72/",
  absolute: false
};

// Auto-load function - called after all components are initialized
// Tries to load the faster .frag file first, falls back to .ifc if not available
const loadDefaultModel = async () => {
  // Try loading the pre-converted fragment file first (much faster)
  let fragLoaded = false;
  try {
    console.log("Attempting to load pre-converted fragment file...");
    const fragResponse = await fetch(`${import.meta.env.BASE_URL}models/OfficeBuilding_complete_2024.frag`);

    if (fragResponse.ok) {
      const contentType = fragResponse.headers.get("content-type") || "";
      // Make sure we didn't get an HTML error page
      if (!contentType.includes("text/html")) {
        console.log("Fragment file found, loading...");
        const fragBuffer = await fragResponse.arrayBuffer();
        const fragData = new Uint8Array(fragBuffer);
        console.log(`Fragment file size: ${(fragData.length / 1024 / 1024).toFixed(2)} MB`);

        const model = await fragments.core.load(fragData, { modelId: "default-model" });
        console.log("Fragment model loaded successfully", model);

        // Add to scene and setup camera
        world.scene.three.add(model.object);
        model.useCamera(world.camera.three);
        fragments.core.update(true);
        fragLoaded = true;
      }
    }
  } catch (fragError) {
    console.log("Fragment loading failed, will try IFC:", fragError);
  }

  // Fall back to IFC loading if fragment failed or not found
  if (!fragLoaded) {
    try {
      console.log("Loading IFC file...");
      const response = await fetch(`${import.meta.env.BASE_URL}models/OfficeBuilding_complete_2024.ifc`);
      if (!response.ok) throw new Error(`Failed to fetch model: ${response.status}`);
      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);
      console.log(`IFC file size: ${(data.length / 1024 / 1024).toFixed(2)} MB`);

      const model = await ifcLoader.load(data, true, world.name!);
      console.log("IFC model loaded successfully", model);

      // Add to scene and setup camera
      world.scene.three.add(model.object);
      model.useCamera(world.camera.three);
      fragments.core.update(true);
    } catch (error) {
      console.error("Failed to load default model:", error);
    }
  }
};

/* MD

  ###💡 Getting the highlighter
  Now, we will basically get the highlighter and set it up. This will create and configure 2 things:

  - Selecting: when clicking on an element.
  - Hovering: when hovering the mouse over an element.
  */

const highlighter = components.get(OBCF.Highlighter);
highlighter.setup({ world });
highlighter.zoomToSelection = false;

// Setup Hoverer for animated hover effects
const hoverer = components.get(OBCF.Hoverer);
hoverer.world = world;
hoverer.enabled = true;
hoverer.animation = true;
hoverer.duration = 150; // Animation duration in ms

// Set hover material (semi-transparent blue glow)
hoverer.material = new THREE.MeshBasicMaterial({
  color: 0x3b82f6,
  transparent: true,
  opacity: 0.3,
  depthTest: false,
});

// Setup ghosting feature - makes non-selected elements semi-transparent
let ghostingEnabled = false;

// Add a ghost style for semi-transparent rendering
highlighter.styles.set("ghost", {
  color: new THREE.Color("#888888"),
  opacity: 0.15,
  transparent: true,
  renderedFaces: FRAGS.RenderedFaces.TWO,
});

// Function to get all element IDs with geometry from all loaded models
const getAllModelIds = async (): Promise<OBC.ModelIdMap> => {
  const result: OBC.ModelIdMap = {};
  for (const [modelId, model] of fragments.list) {
    if (model.isDeltaModel) continue;
    const ids = await model.getItemsIdsWithGeometry();
    if (ids && ids.length > 0) {
      result[modelId] = new Set(ids);
    }
  }
  return result;
};

// Function to apply ghosting effect
const applyGhosting = async () => {
  if (!ghostingEnabled) {
    await highlighter.clear("ghost");
    return;
  }

  const allIds = await getAllModelIds();
  const selectionIds = currentSelection;

  // Ghost all elements except the selected ones
  const ghostIds: OBC.ModelIdMap = {};
  for (const [modelId, ids] of Object.entries(allIds)) {
    const selectedIds = selectionIds[modelId];
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

  // Apply ghost style to non-selected elements
  // Use removePrevious=true but zoomToSelection=false to avoid camera movement
  await highlighter.highlightByID("ghost", ghostIds, true, false);
};

// Toggle ghosting on/off
const toggleGhosting = async (enabled: boolean) => {
  ghostingEnabled = enabled;
  await applyGhosting();
};

/* MD
  The step above is super important as none of the existing functional components setup any tool, they just get it as they are! So, if we don't setup the `FragmentIfcLoader` then the wasm path is not going to be defined and an error will arise 🤓. Just after we have setup the loader, let's then configure the `FragmentManager` so any time a model is loaded it gets added to some world scene created before: 
  */

const fragments = components.get(OBC.FragmentsManager);
fragments.init(`${import.meta.env.BASE_URL}resources/worker.mjs`);

// Adjust LOD settings to keep elements visible from further away
// graphicsQuality: 0 = low quality (more aggressive culling), 1 = high quality (less culling)
fragments.core.settings.graphicsQuality = 1;
// Reduce update rate for more frequent LOD updates (default is higher)
fragments.core.settings.maxUpdateRate = 50; // milliseconds

// Update on camera rest
world.camera.controls.addEventListener("rest", () =>
  fragments.core.update(true),
);

// Also update more frequently during camera movement
world.camera.controls.addEventListener("update", () =>
  fragments.core.update(false),
);

fragments.list.onItemSet.add(async ({ value: model }) => {
  model.useCamera(world.camera.three);
  world.scene.three.add(model.object);
  await fragments.core.update(true);
});

// Load the default IFC model now that everything is initialized
loadDefaultModel();

// Initialize the BMS mock system (loads pre-configured database)
BMSApi.initialize();
console.log("BMS registered GUIDs:", BMSApi.getRegisteredGuids());

// Initialize the Document Store
DocumentStore.initialize().then(() => {
  console.log("[Documents] Document store initialized");
});

// Setup ItemsFinder for property-based filtering
const itemsFinder = components.get(OBC.ItemsFinder);

// ============================================
// Property Filter System
// ============================================

// Available IFC categories for filtering
const ifcCategories = [
  "IFCWALL", "IFCWALLSTANDARDCASE", "IFCSLAB", "IFCCOLUMN", "IFCBEAM",
  "IFCDOOR", "IFCWINDOW", "IFCSTAIR", "IFCRAILING", "IFCROOF",
  "IFCFURNISHINGELEMENT", "IFCBUILDINGELEMENTPROXY",
  "IFCDUCTSEGMENT", "IFCPIPESEGMENT", "IFCFLOWSEGMENT",
  "IFCAIRTERMINAL", "IFCSANITARYTERMINAL", "IFCSPACE"
];

// Filter state
interface FilterCondition {
  id: string;
  type: "category" | "attribute";
  category?: string;
  attributeName?: string;
  attributeValue?: string;
}

let filterConditions: FilterCondition[] = [];
let filterAggregation: "inclusive" | "exclusive" = "inclusive"; // OR vs AND

// Generate unique ID for filter conditions
const generateFilterId = () => `filter-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

// Execute filter and highlight/select results
const executeFilter = async () => {
  if (filterConditions.length === 0) {
    // Clear any filter-based highlighting
    await highlighter.clear("select");
    return;
  }

  const queries: FRAGS.ItemsQueryParams[] = [];

  for (const condition of filterConditions) {
    if (condition.type === "category" && condition.category) {
      queries.push({
        categories: [new RegExp(condition.category, "i")],
      });
    } else if (condition.type === "attribute" && condition.attributeName) {
      const attrQuery: FRAGS.ItemsQueryParams = {
        attributes: {
          queries: [{
            name: new RegExp(condition.attributeName, "i"),
            ...(condition.attributeValue ? { value: new RegExp(condition.attributeValue, "i") } : {}),
          }],
        },
      };
      queries.push(attrQuery);
    }
  }

  if (queries.length === 0) return;

  try {
    const result = await itemsFinder.getItems(queries, { aggregation: filterAggregation });

    // Count total items found
    const totalCount = Object.values(result).reduce((sum, ids) => sum + ids.size, 0);
    updateFilterResultCount(totalCount);

    if (totalCount > 0) {
      // Highlight the filtered elements
      await highlighter.highlightByID("select", result, true, true);
      currentSelection = result;
    } else {
      await highlighter.clear("select");
      currentSelection = {};
    }
  } catch (e) {
    console.error("Filter execution error:", e);
    updateFilterResultCount(0);
  }
};

// Update the result count display
const updateFilterResultCount = (count: number) => {
  const resultLabel = document.getElementById("filter-result-count");
  if (resultLabel) {
    resultLabel.textContent = count > 0 ? `${count} ${t('elementsFound')}` : `0 ${t('elementsFound')}`;
  }
};

// Render filter conditions UI
const renderFilterConditions = (container: HTMLElement) => {
  container.innerHTML = "";

  if (filterConditions.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.style.cssText = `
      padding: 24px 16px;
      text-align: center;
      color: var(--text-muted, rgba(255, 255, 255, 0.32));
      font-size: 13px;
    `;
    emptyState.textContent = "No filter conditions. Add a condition to start filtering.";
    container.appendChild(emptyState);
    return;
  }

  filterConditions.forEach((condition, index) => {
    const conditionEl = document.createElement("div");
    conditionEl.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px;
      background: var(--surface-base, #161922);
      border-radius: 8px;
      margin-bottom: 12px;
    `;

    // Header with type and delete button
    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const typeLabel = document.createElement("span");
    typeLabel.className = "sidebar-badge";
    typeLabel.textContent = condition.type === "category" ? "Category" : "Attribute";

    const deleteBtn = document.createElement("button");
    deleteBtn.style.cssText = `
      background: var(--surface-raised, #1c1f2a);
      border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
      color: var(--text-tertiary, rgba(255, 255, 255, 0.50));
      cursor: pointer;
      padding: 4px 8px;
      font-size: 16px;
      border-radius: 4px;
      transition: all 0.15s ease;
    `;
    deleteBtn.innerHTML = "×";
    deleteBtn.onmouseenter = () => {
      deleteBtn.style.background = "var(--status-alarm-bg, rgba(248, 113, 113, 0.18))";
      deleteBtn.style.color = "var(--status-alarm, #f87171)";
    };
    deleteBtn.onmouseleave = () => {
      deleteBtn.style.background = "var(--surface-raised, #1c1f2a)";
      deleteBtn.style.color = "var(--text-tertiary, rgba(255, 255, 255, 0.50))";
    };
    deleteBtn.onclick = () => {
      filterConditions = filterConditions.filter(c => c.id !== condition.id);
      renderFilterConditions(container);
    };

    header.appendChild(typeLabel);
    header.appendChild(deleteBtn);
    conditionEl.appendChild(header);

    if (condition.type === "category") {
      // Category dropdown
      const categorySelect = document.createElement("bim-dropdown") as BUI.Dropdown;
      categorySelect.label = t('ifcCategory');

      ifcCategories.forEach(cat => {
        const option = document.createElement("bim-option") as HTMLElement & { label: string; value: string };
        option.label = cat.replace("IFC", "");
        option.value = cat;
        if (condition.category === cat) {
          option.setAttribute("checked", "");
        }
        categorySelect.appendChild(option);
      });

      categorySelect.addEventListener("change", () => {
        condition.category = categorySelect.value[0] as string;
      });

      conditionEl.appendChild(categorySelect);
    } else {
      // Attribute name input
      const nameInput = document.createElement("bim-text-input") as BUI.TextInput;
      nameInput.label = t('attributeName');
      nameInput.placeholder = "e.g., Name, ObjectType, Description";
      nameInput.value = condition.attributeName || "";
      nameInput.addEventListener("input", () => {
        condition.attributeName = nameInput.value;
      });
      conditionEl.appendChild(nameInput);

      // Attribute value input
      const valueInput = document.createElement("bim-text-input") as BUI.TextInput;
      valueInput.label = t('valueRegex');
      valueInput.placeholder = "e.g., Wall, Basic, .*concrete.*";
      valueInput.value = condition.attributeValue || "";
      valueInput.addEventListener("input", () => {
        condition.attributeValue = valueInput.value;
      });
      conditionEl.appendChild(valueInput);
    }

    // Show AND/OR between conditions (except for last one)
    if (index < filterConditions.length - 1) {
      const operatorLabel = document.createElement("div");
      operatorLabel.style.cssText = `
        text-align: center;
        font-size: 12px;
        font-weight: 600;
        color: var(--accent, #3b82f6);
        padding: 8px 0;
        margin-top: 4px;
      `;
      operatorLabel.textContent = filterAggregation === "inclusive" ? "OR" : "AND";
      conditionEl.appendChild(operatorLabel);
    }

    container.appendChild(conditionEl);
  });
};

/* MD

  ### Creating the tree
  Doing this is extremely simple thanks to the information saved in the Fragments file and the power of the UI components from That Open Engine. To proceed with the creation, you can do the following 💪
*/

const [spatialTree] = BUIC.tables.spatialTree({
  components,
  models: [],
});

spatialTree.preserveStructureOnFilter = true;

// Create properties table for selected elements
const [propertiesTable, updatePropertiesTable] = BUIC.tables.itemsData({
  components,
  modelIdMap: {},
});

// Helper function to show copy notification
const showCopyNotification = (text: string) => {
  const notification = document.createElement("div");
  notification.textContent = `Copied: ${text.length > 40 ? text.substring(0, 40) + "..." : text}`;
  notification.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface-overlay, #232733);
    color: var(--text-primary, rgba(255, 255, 255, 0.95));
    padding: 10px 16px;
    border-radius: 6px;
    border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
    z-index: 10000;
    font-family: var(--font-sans, 'Inter', sans-serif);
    font-size: 12px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
    animation: notificationSlideIn 2s ease-out forwards;
    backdrop-filter: blur(8px);
  `;

  if (!document.getElementById("copy-notification-styles")) {
    const style = document.createElement("style");
    style.id = "copy-notification-styles";
    style.textContent = `
      @keyframes notificationSlideIn {
        0% { opacity: 0; transform: translateX(-50%) translateY(8px); }
        12% { opacity: 1; transform: translateX(-50%) translateY(0); }
        88% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-4px); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2000);
};

// Use cellcreated event to add copy functionality directly to cells
propertiesTable.addEventListener("cellcreated", (e: Event) => {
  const cell = (e as CustomEvent).detail.cell;
  if (!cell) return;

  // Double-click to copy the cell's data value
  cell.addEventListener("dblclick", async (evt: Event) => {
    evt.stopPropagation();
    // Get the data value directly from the cell
    const cellData = cell.data;
    let text = "";

    if (cellData !== null && cellData !== undefined) {
      text = String(cellData);
    }

    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        showCopyNotification(text);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  });

  // Right-click context menu to copy
  cell.addEventListener("contextmenu", async (evt: Event) => {
    evt.preventDefault();
    evt.stopPropagation();

    const cellData = cell.data;
    let text = "";

    if (cellData !== null && cellData !== undefined) {
      text = String(cellData);
    }

    if (!text) return;

    // Create custom context menu
    const existingMenu = document.getElementById("copy-context-menu");
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement("div");
    menu.id = "copy-context-menu";
    menu.style.cssText = `
      position: fixed;
      left: ${(evt as MouseEvent).clientX}px;
      top: ${(evt as MouseEvent).clientY}px;
      background: var(--surface-overlay, #232733);
      border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
      border-radius: 6px;
      padding: 4px;
      z-index: 10001;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      min-width: 140px;
    `;

    const copyBtn = document.createElement("div");
    copyBtn.textContent = `Copy "${text.length > 24 ? text.substring(0, 24) + "..." : text}"`;
    copyBtn.style.cssText = `
      padding: 8px 12px;
      cursor: pointer;
      color: var(--text-primary, rgba(255, 255, 255, 0.95));
      font-family: var(--font-sans, 'Inter', sans-serif);
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      border-radius: 4px;
      transition: background 120ms ease-out;
    `;
    copyBtn.onmouseenter = () => (copyBtn.style.background = "var(--accent-muted, rgba(59, 130, 246, 0.15))");
    copyBtn.onmouseleave = () => (copyBtn.style.background = "transparent");
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(text);
        showCopyNotification(text);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
      menu.remove();
    };

    menu.appendChild(copyBtn);
    document.body.appendChild(menu);

    // Remove menu when clicking elsewhere
    const removeMenu = () => {
      menu.remove();
      document.removeEventListener("click", removeMenu);
    };
    setTimeout(() => document.addEventListener("click", removeMenu), 0);
  });
});

// Add click-to-select functionality for element rows in the properties table
propertiesTable.addEventListener("rowcreated", (e: Event) => {
  const row = (e as CustomEvent).detail.row;
  if (!row) return;

  const rowData = row.data;
  // Only add click handler for "item" type rows (actual IFC elements, not relations/attributes)
  if (rowData?.type !== "item") return;

  const modelId = rowData.modelId;
  const localId = rowData.localId;

  if (!modelId || localId === undefined) return;

  // Style the row to indicate it's clickable
  row.style.cursor = "pointer";

  // Add click handler to select and highlight the element
  row.addEventListener("click", async (evt: Event) => {
    // Don't trigger if clicking on action buttons or if selecting text
    const target = evt.target as HTMLElement;
    if (target.closest("bim-button") || target.closest("[data-action]")) return;

    const selection: OBC.ModelIdMap = {
      [modelId]: new Set([localId]),
    };

    // Highlight the clicked element
    await highlighter.highlightByID("select", selection, true, true);
  });

  // Add hover effect
  row.addEventListener("mouseenter", () => {
    row.style.backgroundColor = "var(--accent-muted, rgba(59, 130, 246, 0.08))";
  });
  row.addEventListener("mouseleave", () => {
    row.style.backgroundColor = "";
  });
});

// Helper to update empty state visibility
const updatePropertiesEmptyState = (hasSelection: boolean) => {
  const emptyState = document.getElementById("properties-empty-state");
  if (emptyState) {
    emptyState.style.display = hasSelection ? "none" : "flex";
  }
};

// BMS Sensor Display
let currentBMSSubscriptions: (() => void)[] = [];
let currentBMSData: Map<string, BMSDataPoint> = new Map();
let guidToExpressId: Map<string, { modelId: string; expressId: number }> = new Map();

const updateBMSSensorDisplay = async (selection: OBC.ModelIdMap) => {
  console.log("=== BMS Update Start ===");
  console.log("Selection:", selection);

  const container = document.getElementById("bms-sensor-container");
  if (!container) {
    console.error("BMS container not found!");
    return;
  }

  // Unsubscribe from previous updates
  for (const unsubscribe of currentBMSSubscriptions) {
    unsubscribe();
  }
  currentBMSSubscriptions = [];
  currentBMSData = new Map();
  guidToExpressId = new Map();

  // Get selected element GUIDs
  const guids: string[] = [];
  console.log("Selection entries:", Object.entries(selection));

  for (const [modelId, ids] of Object.entries(selection)) {
    console.log(`Processing model ${modelId}`);
    console.log(`IDs type:`, typeof ids, ids);
    console.log(`IDs is Set:`, ids instanceof Set);

    // Handle both Set and array
    const idsArray = ids instanceof Set ? Array.from(ids) : (Array.isArray(ids) ? ids : []);
    console.log(`IDs array (${idsArray.length} items):`, idsArray);

    if (idsArray.length === 0) {
      console.warn("No IDs in selection for this model");
      continue;
    }

    const model = fragments.list.get(modelId);
    console.log(`Model found:`, !!model);
    if (!model) {
      console.error(`Model ${modelId} not found in fragments.list`);
      console.log("Available models:", Array.from(fragments.list.keys()));
      continue;
    }

    try {
      console.log("Calling getItemsData with IDs:", idsArray);

      const elementsData = await model.getItemsData(idsArray, {
        attributes: ["GlobalId", "Name"],
      });

      console.log("Elements data received (length):", elementsData?.length);
      console.log("Elements data:", elementsData);

      if (!elementsData || elementsData.length === 0) {
        console.warn("getItemsData returned empty array");

        // Try alternative: get all attributes to see what's available
        console.log("Trying to get all attributes...");
        const allData = await model.getItemsData(idsArray);
        console.log("All attributes data:", allData);
        if (allData && allData.length > 0) {
          console.log("First element keys:", Object.keys(allData[0]));
        }
        continue;
      }

      for (let i = 0; i < elementsData.length; i++) {
        const element = elementsData[i];
        const expressId = idsArray[i];
        // The GUID is stored in _guid, not GlobalId
        const guidAttr = element._guid || element.GlobalId;
        const nameAttr = element.Name;
        const name = nameAttr && "value" in nameAttr ? String(nameAttr.value) : "Unknown";

        if (guidAttr && "value" in guidAttr) {
          const guid = String(guidAttr.value);
          console.log(`Found element: ${name} with GUID: ${guid}`);
          guids.push(guid);
          // Store mapping from GUID to model/expressId for click-to-highlight
          guidToExpressId.set(guid, { modelId, expressId });
        } else {
          console.warn("Element has no GUID:", element);
        }
      }
    } catch (e) {
      console.error("Error fetching element GUIDs:", e);
    }
  }

  console.log("All GUIDs to query:", guids);
  console.log("BMS registered GUIDs:", BMSApi.getRegisteredGuids());

  if (guids.length === 0) {
    console.log("No GUIDs found, showing empty state");
    renderBMSEmptyState(container);
    return;
  }

  // Get BMS data for selected elements
  console.log("Querying BMS for GUIDs:", guids);
  const bmsData = await BMSApi.getMultipleData(guids);
  console.log("BMS data received:", bmsData);
  console.log("BMS data size:", bmsData.size);

  if (bmsData.size === 0) {
    console.log("No BMS data found for these GUIDs, showing no-sensor state");
    renderBMSNoSensorState(container);
    return;
  }

  // Store the current BMS data for updates
  currentBMSData = new Map(bmsData);

  // Render sensor data
  console.log("Rendering BMS sensor data");
  renderBMSSensorData(container, currentBMSData);

  // Subscribe to real-time updates for ALL elements with data
  for (const guid of bmsData.keys()) {
    const unsubscribe = BMSApi.subscribe(guid, (updatedData) => {
      // Update the stored data for this element
      currentBMSData.set(guid, updatedData);
      // Re-render with all current data
      renderBMSSensorData(container, currentBMSData);
    });
    currentBMSSubscriptions.push(unsubscribe);
  }

  console.log("=== BMS Update End ===");
};

const renderBMSEmptyState = (container: HTMLElement) => {
  container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px 16px;
      text-align: center;
      color: var(--text-muted, rgba(255, 255, 255, 0.32));
    ">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4; margin-bottom: 10px;">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      <span style="font-size: 11px; font-weight: 500;">${t('selectElementForSensors')}</span>
    </div>
  `;
};

const renderBMSNoSensorState = (container: HTMLElement) => {
  container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px 16px;
      text-align: center;
      color: var(--text-muted, rgba(255, 255, 255, 0.32));
    ">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4; margin-bottom: 10px;">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4M12 16h.01"/>
      </svg>
      <span style="font-size: 11px; font-weight: 500;">${t('noSensorsLinked')}</span>
    </div>
  `;
};

const renderBMSSensorData = (container: HTMLElement, bmsData: Map<string, BMSDataPoint>) => {
  container.innerHTML = "";

  for (const [guid, data] of bmsData) {
    const elementDiv = document.createElement("div");
    elementDiv.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 0;
      margin-bottom: 4px;
    `;

    // Element header (clickable to highlight object)
    const header = document.createElement("div");
    header.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: var(--text-primary, rgba(255, 255, 255, 0.95));
      padding-bottom: 6px;
      border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: color 0.15s ease;
    `;

    // Count sensors for badge
    const sensorCount = data.sensors.size;
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <span>${data.elementName}</span>
        <span class="sidebar-badge muted">${sensorCount}</span>
      </div>
    `;
    header.title = t('clickToHighlight');
    header.onmouseenter = () => {
      header.style.color = "var(--accent, #3b82f6)";
    };
    header.onmouseleave = () => {
      header.style.color = "var(--text-primary, rgba(255, 255, 255, 0.95))";
    };
    header.onclick = async () => {
      const mapping = guidToExpressId.get(guid);
      if (mapping) {
        const selection: OBC.ModelIdMap = {
          [mapping.modelId]: new Set([mapping.expressId])
        };
        await highlighter.highlightByID("select", selection, true, true);
        cameraComponent.fitToItems(selection);
      }
    };
    elementDiv.appendChild(header);

    // Sensor readings
    for (const [sensorType, reading] of data.sensors) {
      const statusColor = getStatusColor(reading.status);

      const sensorDiv = document.createElement("div");
      sensorDiv.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 10px;
        background: var(--surface-base, #161922);
        border-radius: 6px;
        border-left: 3px solid ${statusColor};
        cursor: pointer;
        transition: background 0.15s ease, transform 0.1s ease;
      `;

      const sensorIcon = getSensorIcon(sensorType);
      const sensorLabel = getSensorTypeLabel(sensorType);

      sensorDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 14px;">${sensorIcon}</span>
            <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary, rgba(255, 255, 255, 0.72)); text-transform: uppercase; letter-spacing: 0.3px;">${sensorLabel}</span>
          </div>
          ${reading.status !== "normal" ? `<span class="sidebar-badge ${reading.status === 'warning' ? 'warning' : 'danger'}">${getStatusLabel(reading.status)}</span>` : ""}
        </div>
        <div style="display: flex; align-items: baseline; justify-content: space-between;">
          <div style="display: flex; align-items: baseline; gap: 3px;">
            <span style="font-size: 16px; font-weight: 600; color: var(--text-primary, rgba(255, 255, 255, 0.95));">${reading.value}</span>
            <span style="font-size: 11px; color: var(--text-tertiary, rgba(255, 255, 255, 0.50));">${reading.unit}</span>
          </div>
          <span style="font-size: 12px; opacity: 0.5;" title="${t('clickToViewTrend')}">📈</span>
        </div>
      `;

      // Hover effects
      sensorDiv.onmouseenter = () => {
        sensorDiv.style.background = "var(--surface-raised, #1c1f2a)";
        sensorDiv.style.transform = "translateX(2px)";
      };
      sensorDiv.onmouseleave = () => {
        sensorDiv.style.background = "var(--surface-base, #161922)";
        sensorDiv.style.transform = "translateX(0)";
      };

      // Click to open chart
      sensorDiv.onclick = () => {
        openSensorChart(guid, data.elementName, sensorType, reading.value, reading.unit);
      };

      sensorDiv.title = t('clickToViewTrend');

      elementDiv.appendChild(sensorDiv);
    }

    // Last updated
    const lastUpdated = document.createElement("div");
    lastUpdated.style.cssText = `
      font-size: 9px;
      color: var(--text-tertiary, rgba(255, 255, 255, 0.40));
      text-align: right;
      padding-top: 4px;
    `;
    lastUpdated.textContent = `${t('lastUpdated')}: ${data.lastUpdated.toLocaleTimeString()}`;
    elementDiv.appendChild(lastUpdated);

    container.appendChild(elementDiv);
  }
};

const getSensorIcon = (type: SensorType): string => {
  const icons: Record<SensorType, string> = {
    temperature: "🌡️",
    humidity: "💧",
    occupancy: "👥",
    co2: "🌬️",
    energy: "⚡",
    lighting: "💡",
    airflow: "🌀",
    pressure: "📊",
  };
  return icons[type] || "📍";
};

// ============================================
// Sensor Historical Chart Modal
// ============================================

let currentChartInstance: Chart | null = null;

const closeSensorChart = () => {
  const overlay = document.getElementById("sensor-chart-overlay");
  if (overlay) {
    overlay.remove();
  }
  if (currentChartInstance) {
    currentChartInstance.destroy();
    currentChartInstance = null;
  }
};

const openSensorChart = async (
  guid: string,
  elementName: string,
  sensorType: SensorType,
  currentValue: number,
  unit: string
) => {
  // Close any existing chart
  closeSensorChart();

  const config = BMSApi.getSensorConfig(sensorType);
  const sensorLabel = getSensorTypeLabel(sensorType);
  const sensorIcon = getSensorIcon(sensorType);

  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "sensor-chart-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--overlay-backdrop, rgba(0, 0, 0, 0.75));
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  `;

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeSensorChart();
    }
  });

  // Create modal
  const modal = document.createElement("div");
  modal.style.cssText = `
    background: var(--surface-base, #161922);
    border-radius: 12px;
    border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  `;

  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
    background: var(--surface-raised, #1c1f2a);
  `;
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 20px;">${sensorIcon}</span>
      <div>
        <div style="font-size: 14px; font-weight: 600; color: var(--text-primary, rgba(255, 255, 255, 0.95));">
          ${sensorLabel} ${t('sensorTrend')}
        </div>
        <div style="font-size: 11px; color: var(--text-tertiary, rgba(255, 255, 255, 0.50));">
          ${elementName}
        </div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <div id="time-range-selector" style="display: flex; gap: 4px;">
        <button data-hours="24" class="time-btn active" style="padding: 6px 12px; border-radius: 4px; border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10)); background: var(--accent, #3b82f6); color: white; font-size: 11px; cursor: pointer;">${t('hours24')}</button>
        <button data-hours="168" class="time-btn" style="padding: 6px 12px; border-radius: 4px; border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10)); background: transparent; color: var(--text-secondary, rgba(255, 255, 255, 0.72)); font-size: 11px; cursor: pointer;">${t('days7')}</button>
        <button data-hours="720" class="time-btn" style="padding: 6px 12px; border-radius: 4px; border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10)); background: transparent; color: var(--text-secondary, rgba(255, 255, 255, 0.72)); font-size: 11px; cursor: pointer;">${t('days30')}</button>
      </div>
      <button id="close-chart-btn" style="width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10)); background: transparent; color: var(--text-secondary, rgba(255, 255, 255, 0.72)); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
    </div>
  `;

  // Chart container
  const chartContainer = document.createElement("div");
  chartContainer.style.cssText = `
    padding: 20px;
    height: 350px;
  `;

  const canvas = document.createElement("canvas");
  canvas.id = "sensor-history-chart";
  chartContainer.appendChild(canvas);

  // Stats footer
  const footer = document.createElement("div");
  footer.id = "chart-stats-footer";
  footer.style.cssText = `
    display: flex;
    justify-content: space-around;
    padding: 16px 20px;
    border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
    background: var(--surface-raised, #1c1f2a);
  `;
  footer.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 10px; color: var(--text-tertiary, rgba(255, 255, 255, 0.50)); text-transform: uppercase; margin-bottom: 4px;">${t('current')}</div>
      <div style="font-size: 16px; font-weight: 600; color: var(--text-primary, rgba(255, 255, 255, 0.95));">${currentValue} ${unit}</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 10px; color: var(--text-tertiary, rgba(255, 255, 255, 0.50)); text-transform: uppercase; margin-bottom: 4px;">${t('min')}</div>
      <div id="stat-min" style="font-size: 16px; font-weight: 600; color: var(--text-primary, rgba(255, 255, 255, 0.95));">--</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 10px; color: var(--text-tertiary, rgba(255, 255, 255, 0.50)); text-transform: uppercase; margin-bottom: 4px;">${t('max')}</div>
      <div id="stat-max" style="font-size: 16px; font-weight: 600; color: var(--text-primary, rgba(255, 255, 255, 0.95));">--</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 10px; color: var(--text-tertiary, rgba(255, 255, 255, 0.50)); text-transform: uppercase; margin-bottom: 4px;">${t('average')}</div>
      <div id="stat-avg" style="font-size: 16px; font-weight: 600; color: var(--text-primary, rgba(255, 255, 255, 0.95));">--</div>
    </div>
  `;

  modal.appendChild(header);
  modal.appendChild(chartContainer);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close button handler
  document.getElementById("close-chart-btn")?.addEventListener("click", closeSensorChart);

  // ESC key handler
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeSensorChart();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);

  // Time range button handlers
  const timeButtons = document.querySelectorAll(".time-btn");
  timeButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const target = e.target as HTMLButtonElement;
      const hours = parseInt(target.dataset.hours || "24");

      // Update button styles
      timeButtons.forEach((b) => {
        (b as HTMLElement).style.background = "transparent";
        (b as HTMLElement).style.color = "var(--text-secondary, rgba(255, 255, 255, 0.72))";
      });
      target.style.background = "var(--accent, #3b82f6)";
      target.style.color = "white";

      await renderHistoricalChart(canvas, guid, sensorType, hours, config, unit);
    });
  });

  // Initial chart render
  await renderHistoricalChart(canvas, guid, sensorType, 24, config, unit);
};

const renderHistoricalChart = async (
  canvas: HTMLCanvasElement,
  guid: string,
  sensorType: SensorType,
  hours: number,
  config: ReturnType<typeof BMSApi.getSensorConfig>,
  unit: string
) => {
  // Show loading state
  if (currentChartInstance) {
    currentChartInstance.destroy();
  }

  // Fetch historical data
  const historicalData = await BMSApi.getHistoricalData(guid, sensorType, hours);

  // Calculate statistics
  const values = historicalData.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  // Update stats footer
  const minEl = document.getElementById("stat-min");
  const maxEl = document.getElementById("stat-max");
  const avgEl = document.getElementById("stat-avg");
  if (minEl) minEl.textContent = `${min.toFixed(1)} ${unit}`;
  if (maxEl) maxEl.textContent = `${max.toFixed(1)} ${unit}`;
  if (avgEl) avgEl.textContent = `${avg.toFixed(1)} ${unit}`;

  // Format labels based on time range
  const formatLabel = (date: Date): string => {
    if (hours <= 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (hours <= 168) {
      return date.toLocaleDateString([], { weekday: "short", hour: "2-digit" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const labels = historicalData.map(d => formatLabel(d.timestamp));
  const data = historicalData.map(d => d.value);

  // Get theme-aware chart colors
  const chartGridColor = getCSSVar("--chart-grid") || "rgba(255, 255, 255, 0.05)";
  const chartTickColor = getCSSVar("--chart-tick") || "rgba(255, 255, 255, 0.5)";
  const chartTooltipBg = getCSSVar("--chart-tooltip-bg") || "rgba(22, 25, 34, 0.95)";
  const chartTooltipBorder = getCSSVar("--chart-tooltip-border") || "rgba(255, 255, 255, 0.1)";
  const chartTooltipTitle = getCSSVar("--chart-tooltip-title") || "rgba(255, 255, 255, 0.7)";
  const chartTooltipBody = getCSSVar("--chart-tooltip-body") || "rgba(255, 255, 255, 0.95)";
  const accentColor = getCSSVar("--accent") || "#3b82f6";

  // Create gradient
  const ctx = canvas.getContext("2d");
  let gradient: CanvasGradient | undefined;
  if (ctx) {
    gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
  }

  currentChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `${sensorType.charAt(0).toUpperCase() + sensorType.slice(1)} (${unit})`,
          data,
          borderColor: accentColor,
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: accentColor,
          pointHoverBorderColor: getCSSVar("--surface-raised") || "#fff",
          pointHoverBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: chartTooltipBg,
          titleColor: chartTooltipTitle,
          bodyColor: chartTooltipBody,
          borderColor: chartTooltipBorder,
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: (items: { dataIndex: number }[]) => {
              if (items.length > 0) {
                const idx = items[0].dataIndex;
                return historicalData[idx].timestamp.toLocaleString();
              }
              return "";
            },
            label: (item: { parsed: { y: number | null } }) => `${(item.parsed.y ?? 0).toFixed(1)} ${unit}`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: chartGridColor,
          },
          ticks: {
            color: chartTickColor,
            font: { size: 10 },
            maxTicksLimit: 8,
          },
        },
        y: {
          grid: {
            color: chartGridColor,
          },
          ticks: {
            color: chartTickColor,
            font: { size: 10 },
            callback: (value: string | number) => `${value} ${unit}`,
          },
          min: config.minValue,
          max: config.maxValue,
        },
      },
    },
  });
};

// ============================================
// Document Storage Display
// ============================================

// Store the currently selected GUID for document upload
let currentSelectedGuid: string | null = null;

const updateDocumentDisplay = async (selection: OBC.ModelIdMap) => {
  const container = document.getElementById("documents-container");
  if (!container) return;

  // Get selected element GUIDs (reuse logic from BMS)
  const guids: string[] = [];

  for (const [modelId, ids] of Object.entries(selection)) {
    const idsArray = ids instanceof Set ? Array.from(ids) : (Array.isArray(ids) ? ids : []);
    if (idsArray.length === 0) continue;

    const model = fragments.list.get(modelId);
    if (!model) continue;

    try {
      const elementsData = await model.getItemsData(idsArray, {
        attributes: ["GlobalId", "Name"],
      });

      for (const element of elementsData) {
        const guidAttr = element._guid || element.GlobalId;
        if (guidAttr && "value" in guidAttr) {
          guids.push(String(guidAttr.value));
        }
      }
    } catch (e) {
      console.error("[Documents] Error fetching element GUIDs:", e);
    }
  }

  // Store the first GUID for upload functionality
  currentSelectedGuid = guids.length > 0 ? guids[0] : null;

  if (guids.length === 0) {
    renderDocumentsEmptyState(container);
    return;
  }

  // Get documents for all selected GUIDs
  const documentsMap = await DocumentStore.getDocumentsForMultipleGuids(guids);

  if (documentsMap.size === 0) {
    renderDocumentsNoDocsState(container, currentSelectedGuid);
    return;
  }

  renderDocumentsList(container, documentsMap, currentSelectedGuid);
};

const renderDocumentsEmptyState = (container: HTMLElement) => {
  container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 20px;
      text-align: center;
      color: var(--text-muted, rgba(255, 255, 255, 0.32));
    ">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4; margin-bottom: 14px;">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
      <span style="font-size: 13px; line-height: 1.4;">${t('selectElementForDocuments')}</span>
    </div>
  `;
};

const renderDocumentsNoDocsState = (container: HTMLElement, guid: string | null) => {
  container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 20px;
      text-align: center;
      color: var(--text-muted, rgba(255, 255, 255, 0.32));
      gap: 16px;
    ">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4;">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
      <span style="font-size: 13px; line-height: 1.4;">${t('noDocumentsLinked')}</span>
      ${guid ? `
        <label style="
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--accent-muted, rgba(59, 130, 246, 0.15));
          color: var(--accent, #3b82f6);
          border-radius: 8px;
          border: 1px dashed var(--accent, #3b82f6);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 150ms ease-out;
        " onmouseover="this.style.background='rgba(59, 130, 246, 0.25)'; this.style.borderStyle='solid'" onmouseout="this.style.background='rgba(59, 130, 246, 0.15)'; this.style.borderStyle='dashed'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          ${t('uploadDocument')}
          <input type="file" id="document-upload-input" style="display: none;" multiple />
        </label>
      ` : ""}
    </div>
  `;

  // Add upload handler
  const uploadInput = container.querySelector("#document-upload-input") as HTMLInputElement;
  if (uploadInput) {
    uploadInput.addEventListener("change", handleDocumentUpload);
  }
};

const renderDocumentsList = (container: HTMLElement, documentsMap: Map<string, StoredDocument[]>, currentGuid: string | null) => {
  container.innerHTML = "";

  // Upload button at top
  if (currentGuid) {
    const uploadSection = document.createElement("div");
    uploadSection.style.cssText = `
      display: flex;
      justify-content: stretch;
      margin-bottom: 16px;
    `;

    uploadSection.innerHTML = `
      <label style="
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 12px 16px;
        background: var(--accent-muted, rgba(59, 130, 246, 0.15));
        color: var(--accent, #3b82f6);
        border-radius: 8px;
        border: 1px dashed var(--accent, #3b82f6);
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 150ms ease-out;
      " onmouseover="this.style.background='rgba(59, 130, 246, 0.25)'; this.style.borderStyle='solid'" onmouseout="this.style.background='rgba(59, 130, 246, 0.15)'; this.style.borderStyle='dashed'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17,8 12,3 7,8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        ${t('addDocument')}
        <input type="file" id="document-upload-input" style="display: none;" multiple />
      </label>
    `;
    container.appendChild(uploadSection);

    const uploadInput = uploadSection.querySelector("#document-upload-input") as HTMLInputElement;
    if (uploadInput) {
      uploadInput.addEventListener("change", handleDocumentUpload);
    }
  }

  // List documents (without GUID headers for compactness)
  for (const [, documents] of documentsMap) {
    for (const doc of documents) {
      const docItem = createDocumentItem(doc);
      container.appendChild(docItem);
    }
  }
};

const createDocumentItem = (doc: StoredDocument): HTMLElement => {
  const item = document.createElement("div");
  item.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    margin-bottom: 8px;
    background: var(--surface-base, #161922);
    border-radius: 6px;
    border-left: 3px solid var(--accent, #3b82f6);
    transition: background 0.15s ease;
  `;
  item.onmouseover = () => {
    item.style.background = "var(--surface-raised, #1c1f2a)";
  };
  item.onmouseout = () => {
    item.style.background = "var(--surface-base, #161922)";
  };

  const icon = DocumentStore.getFileIcon(doc.fileType);
  const typeLabel = getDocumentTypeLabel(doc.documentType);

  item.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px; flex-shrink: 0;">${icon}</span>
      <span style="
        font-size: 12px;
        font-weight: 500;
        color: var(--text-primary, rgba(255, 255, 255, 0.95));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      " title="${doc.displayName} (${doc.fileName})">${doc.displayName}</span>
    </div>
    ${doc.description ? `
      <div style="
        font-size: 11px;
        color: var(--text-tertiary, rgba(255, 255, 255, 0.60));
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      " title="${doc.description}">${doc.description}</div>
    ` : ""}
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <span class="sidebar-badge">${typeLabel}</span>
      <div style="display: flex; gap: 4px;">
        <button class="doc-view-btn" data-doc-id="${doc.id}" style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 4px;
          background: var(--accent-muted, rgba(59, 130, 246, 0.15));
          color: var(--accent, #3b82f6);
          cursor: pointer;
          transition: background 150ms ease-out;
        " title="${t('view')}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button class="doc-download-btn" data-doc-id="${doc.id}" style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 4px;
          background: var(--surface-raised, #1c1f2a);
          color: var(--text-secondary, rgba(255, 255, 255, 0.72));
          cursor: pointer;
          transition: background 150ms ease-out;
        " title="${t('download')}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button class="doc-delete-btn" data-doc-id="${doc.id}" style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 4px;
          background: rgba(255, 68, 68, 0.1);
          color: #ff6666;
          cursor: pointer;
          transition: background 150ms ease-out;
        " title="${t('delete')}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Add event listeners
  const viewBtn = item.querySelector(".doc-view-btn") as HTMLButtonElement;
  const downloadBtn = item.querySelector(".doc-download-btn") as HTMLButtonElement;
  const deleteBtn = item.querySelector(".doc-delete-btn") as HTMLButtonElement;

  viewBtn.onmouseover = () => viewBtn.style.background = "rgba(59, 130, 246, 0.25)";
  viewBtn.onmouseout = () => viewBtn.style.background = "rgba(59, 130, 246, 0.15)";
  viewBtn.onclick = () => showDocumentViewer(doc);

  downloadBtn.onmouseover = () => downloadBtn.style.background = "var(--surface-overlay, #232733)";
  downloadBtn.onmouseout = () => downloadBtn.style.background = "var(--surface-raised, #1c1f2a)";
  downloadBtn.onclick = async () => {
    await DocumentStore.downloadDocument(doc.id);
  };

  deleteBtn.onmouseover = () => deleteBtn.style.background = "rgba(255, 68, 68, 0.2)";
  deleteBtn.onmouseout = () => deleteBtn.style.background = "rgba(255, 68, 68, 0.1)";
  deleteBtn.onclick = async () => {
    if (confirm(`Delete "${doc.displayName}"?`)) {
      await DocumentStore.deleteDocument(doc.id);
      // Refresh the display
      await updateDocumentDisplay(currentSelection);
    }
  };

  return item;
};

// Pending file for upload (set when user selects file, used after modal submission)
let pendingUploadFile: File | null = null;

const handleDocumentUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = input.files;

  if (!files || files.length === 0 || !currentSelectedGuid) {
    return;
  }

  // For simplicity, handle one file at a time with the modal
  pendingUploadFile = files[0];

  // Show the metadata modal
  showDocumentModal({
    mode: "create",
    initialData: {
      displayName: pendingUploadFile.name.replace(/\.[^/.]+$/, ""), // Remove extension for default name
      documentType: "other",
      createdDate: new Date(),
      description: "",
    },
    onSave: async (metadata) => {
      if (!pendingUploadFile || !currentSelectedGuid) return;

      try {
        await DocumentStore.storeDocument(currentSelectedGuid, pendingUploadFile, metadata);
        console.log(`[Documents] Uploaded: ${pendingUploadFile.name} for GUID: ${currentSelectedGuid}`);
        await updateDocumentDisplay(currentSelection);
      } catch (error) {
        console.error("[Documents] Upload failed:", error);
        alert("Failed to upload document. Please try again.");
      }

      pendingUploadFile = null;
    },
    onCancel: () => {
      pendingUploadFile = null;
    },
  });

  // Reset input
  input.value = "";
};

// ============================================
// Document Metadata Modal
// ============================================

interface DocumentModalOptions {
  mode: "create" | "edit";
  initialData: DocumentMetadata;
  documentId?: string; // Required for edit mode
  onSave: (metadata: DocumentMetadata) => Promise<void>;
  onCancel?: () => void;
}

const showDocumentModal = (options: DocumentModalOptions) => {
  // Remove existing modal if any
  const existingModal = document.getElementById("document-modal-overlay");
  if (existingModal) existingModal.remove();

  const overlay = document.createElement("div");
  overlay.id = "document-modal-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  `;

  const modal = document.createElement("div");
  modal.style.cssText = `
    background: var(--surface-overlay, #232733);
    border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
    border-radius: 12px;
    padding: 24px;
    min-width: 380px;
    max-width: 480px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  `;

  const title = options.mode === "create" ? t('uploadDocument') : t('edit') + ' ' + t('documents').toLowerCase();
  const saveLabel = options.mode === "create" ? t('upload') : t('save');

  // Format date for input
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  modal.innerHTML = `
    <h3 style="
      margin: 0 0 20px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary, rgba(255, 255, 255, 0.95));
    ">${title}</h3>

    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Display Name -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 11px; font-weight: 500; color: var(--text-secondary, rgba(255, 255, 255, 0.72));">
          ${t('documentName')}
        </label>
        <input type="text" id="doc-modal-name" value="${options.initialData.displayName}" style="
          padding: 10px 12px;
          background: var(--surface-base, #161922);
          border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
          border-radius: 6px;
          color: var(--text-primary, rgba(255, 255, 255, 0.95));
          font-size: 13px;
          outline: none;
          transition: border-color 150ms ease-out;
        " placeholder="${t('enterDocumentName')}" />
      </div>

      <!-- Document Type -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 11px; font-weight: 500; color: var(--text-secondary, rgba(255, 255, 255, 0.72));">
          ${t('documentType')}
        </label>
        <select id="doc-modal-type" style="
          padding: 10px 12px;
          background: var(--surface-base, #161922);
          border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
          border-radius: 6px;
          color: var(--text-primary, rgba(255, 255, 255, 0.95));
          font-size: 13px;
          outline: none;
          cursor: pointer;
        ">
          ${getDocumentTypes().map(docType => `
            <option value="${docType.value}" ${docType.value === options.initialData.documentType ? "selected" : ""}>
              ${docType.label}
            </option>
          `).join("")}
        </select>
      </div>

      <!-- Created Date -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 11px; font-weight: 500; color: var(--text-secondary, rgba(255, 255, 255, 0.72));">
          ${t('documentDate')}
        </label>
        <input type="date" id="doc-modal-date" value="${formatDateForInput(options.initialData.createdDate)}" style="
          padding: 10px 12px;
          background: var(--surface-base, #161922);
          border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
          border-radius: 6px;
          color: var(--text-primary, rgba(255, 255, 255, 0.95));
          font-size: 13px;
          outline: none;
          cursor: pointer;
        " />
      </div>

      <!-- Description -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 11px; font-weight: 500; color: var(--text-secondary, rgba(255, 255, 255, 0.72));">
          ${t('descriptionOptional')}
        </label>
        <textarea id="doc-modal-description" rows="3" style="
          padding: 10px 12px;
          background: var(--surface-base, #161922);
          border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
          border-radius: 6px;
          color: var(--text-primary, rgba(255, 255, 255, 0.95));
          font-size: 13px;
          outline: none;
          resize: vertical;
          font-family: inherit;
        " placeholder="${t('addDescription')}">${options.initialData.description || ""}</textarea>
      </div>
    </div>

    <!-- Buttons -->
    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
      <button id="doc-modal-cancel" style="
        padding: 10px 18px;
        background: transparent;
        border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
        border-radius: 6px;
        color: var(--text-secondary, rgba(255, 255, 255, 0.72));
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 150ms ease-out;
      ">${t('cancel')}</button>
      <button id="doc-modal-save" style="
        padding: 10px 18px;
        background: var(--accent, #3b82f6);
        border: none;
        border-radius: 6px;
        color: white;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 150ms ease-out;
      ">${saveLabel}</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Focus the name input
  const nameInput = modal.querySelector("#doc-modal-name") as HTMLInputElement;
  nameInput.focus();
  nameInput.select();

  // Add hover effects
  const cancelBtn = modal.querySelector("#doc-modal-cancel") as HTMLButtonElement;
  const saveBtn = modal.querySelector("#doc-modal-save") as HTMLButtonElement;

  cancelBtn.onmouseover = () => cancelBtn.style.background = "var(--surface-raised, #1c1f2a)";
  cancelBtn.onmouseout = () => cancelBtn.style.background = "transparent";

  saveBtn.onmouseover = () => saveBtn.style.background = "#2563eb";
  saveBtn.onmouseout = () => saveBtn.style.background = "var(--accent, #3b82f6)";

  // Close modal function
  const closeModal = () => {
    overlay.remove();
  };

  // Cancel handler
  cancelBtn.onclick = () => {
    closeModal();
    options.onCancel?.();
  };

  // Click outside to close
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      closeModal();
      options.onCancel?.();
    }
  };

  // Escape key to close
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeModal();
      options.onCancel?.();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);

  // Save handler
  saveBtn.onclick = async () => {
    const displayName = (modal.querySelector("#doc-modal-name") as HTMLInputElement).value.trim();
    const documentType = (modal.querySelector("#doc-modal-type") as HTMLSelectElement).value as DocumentType;
    const dateValue = (modal.querySelector("#doc-modal-date") as HTMLInputElement).value;
    const description = (modal.querySelector("#doc-modal-description") as HTMLTextAreaElement).value.trim();

    if (!displayName) {
      alert(t('pleaseEnterDocumentName'));
      return;
    }

    const metadata: DocumentMetadata = {
      displayName,
      documentType,
      createdDate: dateValue ? new Date(dateValue) : new Date(),
      description: description || undefined,
    };

    // Disable save button while processing
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      await options.onSave(metadata);
      closeModal();
    } catch (error) {
      console.error("[Documents] Save failed:", error);
      saveBtn.disabled = false;
      saveBtn.textContent = saveLabel;
    }

    document.removeEventListener("keydown", handleEscape);
  };
};

// Edit document metadata
const handleEditDocument = async (doc: StoredDocument) => {
  showDocumentModal({
    mode: "edit",
    documentId: doc.id,
    initialData: {
      displayName: doc.displayName,
      documentType: doc.documentType,
      createdDate: doc.createdDate,
      description: doc.description,
    },
    onSave: async (metadata) => {
      await DocumentStore.updateDocument(doc.id, metadata);
      await updateDocumentDisplay(currentSelection);
    },
  });
};

// ============================================
// Document Viewer Modal (PDF/Image viewer)
// ============================================

const showDocumentViewer = async (doc: StoredDocument) => {
  const viewData = await DocumentStore.getDocumentViewUrl(doc.id);
  if (!viewData) {
    alert(t('loading'));
    return;
  }

  // Remove existing viewer if any
  const existingViewer = document.getElementById("document-viewer-overlay");
  if (existingViewer) {
    existingViewer.remove();
  }

  const overlay = document.createElement("div");
  overlay.id = "document-viewer-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    flex-direction: column;
    z-index: 10000;
    backdrop-filter: blur(8px);
  `;

  // Header bar
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: var(--surface-overlay, #232733);
    border-bottom: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
    flex-shrink: 0;
  `;

  const titleSection = document.createElement("div");
  titleSection.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  `;
  titleSection.innerHTML = `
    <span style="font-size: 24px;">${DocumentStore.getFileIcon(doc.fileType)}</span>
    <div style="min-width: 0;">
      <div style="
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary, rgba(255, 255, 255, 0.95));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">${doc.displayName}</div>
      <div style="
        font-size: 11px;
        color: var(--text-tertiary, rgba(255, 255, 255, 0.50));
      ">${doc.fileName} • ${DocumentStore.formatFileSize(doc.fileSize)}</div>
    </div>
  `;

  const buttonsSection = document.createElement("div");
  buttonsSection.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  // Download button
  const downloadBtn = document.createElement("button");
  downloadBtn.style.cssText = `
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background: var(--accent-muted, rgba(59, 130, 246, 0.15));
    color: var(--accent, #3b82f6);
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: background 150ms ease-out;
  `;
  downloadBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7,10 12,15 17,10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
    ${t('download')}
  `;
  downloadBtn.onmouseover = () => downloadBtn.style.background = "rgba(59, 130, 246, 0.25)";
  downloadBtn.onmouseout = () => downloadBtn.style.background = "rgba(59, 130, 246, 0.15)";
  downloadBtn.onclick = () => DocumentStore.downloadDocument(doc.id);

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 6px;
    background: var(--surface-raised, #1c1f2a);
    color: var(--text-secondary, rgba(255, 255, 255, 0.72));
    cursor: pointer;
    transition: background 150ms ease-out;
  `;
  closeBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;
  closeBtn.title = t('close');
  closeBtn.onmouseover = () => closeBtn.style.background = "var(--surface-overlay, #232733)";
  closeBtn.onmouseout = () => closeBtn.style.background = "var(--surface-raised, #1c1f2a)";

  buttonsSection.appendChild(downloadBtn);
  buttonsSection.appendChild(closeBtn);
  header.appendChild(titleSection);
  header.appendChild(buttonsSection);

  // Content area
  const content = document.createElement("div");
  content.style.cssText = `
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow: hidden;
  `;

  // Determine viewer type based on file type
  if (doc.fileType === "application/pdf") {
    // PDF viewer using iframe
    const iframe = document.createElement("iframe");
    iframe.src = viewData.url;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 8px;
      background: white;
    `;
    content.appendChild(iframe);
  } else if (doc.fileType.startsWith("image/")) {
    // Image viewer
    const img = document.createElement("img");
    img.src = viewData.url;
    img.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
    `;
    content.appendChild(img);
  } else if (doc.fileType.startsWith("text/") || doc.fileType === "application/json") {
    // Text viewer
    const textContainer = document.createElement("div");
    textContainer.style.cssText = `
      width: 100%;
      height: 100%;
      background: var(--surface-base, #161922);
      border-radius: 8px;
      padding: 20px;
      overflow: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--text-primary, rgba(255, 255, 255, 0.95));
      white-space: pre-wrap;
      word-break: break-word;
    `;

    // Fetch and display text content
    fetch(viewData.url)
      .then(res => res.text())
      .then(text => {
        textContainer.textContent = text;
      })
      .catch(() => {
        textContainer.textContent = "Error loading document content.";
      });

    content.appendChild(textContainer);
  } else {
    // Unsupported type - show message
    const message = document.createElement("div");
    message.style.cssText = `
      text-align: center;
      color: var(--text-secondary, rgba(255, 255, 255, 0.72));
    `;
    message.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">${DocumentStore.getFileIcon(doc.fileType)}</div>
      <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">Preview not available</div>
      <div style="font-size: 13px; opacity: 0.7;">This file type cannot be previewed in the browser.</div>
      <div style="font-size: 13px; opacity: 0.7; margin-top: 4px;">Click Download to view the file.</div>
    `;
    content.appendChild(message);
  }

  overlay.appendChild(header);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // Close handlers
  const closeViewer = () => {
    viewData.revoke(); // Clean up blob URL
    overlay.remove();
    document.removeEventListener("keydown", handleEscape);
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeViewer();
    }
  };

  closeBtn.onclick = closeViewer;
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      closeViewer();
    }
  };
  document.addEventListener("keydown", handleEscape);
};

// Update properties when selection changes
highlighter.events.select.onHighlight.add(async (selection) => {
  updatePropertiesTable({ modelIdMap: selection });
  currentSelection = selection;
  updatePropertiesEmptyState(Object.keys(selection).length > 0);
  // Update ghosting when selection changes
  await applyGhosting();
  // Update BMS sensor data display
  await updateBMSSensorDisplay(selection);
  // Update documents display
  await updateDocumentDisplay(selection);
});

highlighter.events.select.onClear.add(async () => {
  updatePropertiesTable({ modelIdMap: {} });
  currentSelection = {};
  updatePropertiesEmptyState(false);
  // Update ghosting when selection is cleared
  await applyGhosting();
  // Clear BMS display
  const bmsContainer = document.getElementById("bms-sensor-container");
  if (bmsContainer) {
    renderBMSEmptyState(bmsContainer);
  }
  for (const unsubscribe of currentBMSSubscriptions) {
    unsubscribe();
  }
  currentBMSSubscriptions = [];
  currentBMSData = new Map();
  // Clear documents display
  currentSelectedGuid = null;
  const docsContainer = document.getElementById("documents-container");
  if (docsContainer) {
    renderDocumentsEmptyState(docsContainer);
  }
});

// Setup Clipper for sectioning
const clipper = components.get(OBC.Clipper);
clipper.setup();

// Setup Hider for isolate functionality
const hider = components.get(OBC.Hider);

// Store current selection for isolate
let currentSelection: OBC.ModelIdMap = {};

// Setup Views for 2D plans and elevations
const views = components.get(OBC.Views);
views.world = world;

// Setup Measurement tools
const lengthMeasurement = components.get(OBCF.LengthMeasurement);
lengthMeasurement.world = world;

const areaMeasurement = components.get(OBCF.AreaMeasurement);
areaMeasurement.world = world;

const volumeMeasurement = components.get(OBCF.VolumeMeasurement);
volumeMeasurement.world = world;

// Setup MeasurementUtils for calculating volumes of selected elements
const measurementUtils = components.get(OBC.MeasurementUtils);

// Double-click handler for tools
viewport.ondblclick = () => {
  if (clipper.enabled) {
    clipper.create(world);
  }
  if (lengthMeasurement.enabled) {
    lengthMeasurement.endCreation();
  }
  if (areaMeasurement.enabled) {
    areaMeasurement.endCreation();
  }
};

// Click handler for measurements
viewport.onclick = () => {
  if (lengthMeasurement.enabled) {
    lengthMeasurement.create();
  }
  if (areaMeasurement.enabled) {
    areaMeasurement.create();
  }
};

// Keyboard controls
const keyState: { [key: string]: boolean } = {};

window.onkeydown = (event) => {
  // Delete clipping plane or measurement
  if (event.code === "Delete" || event.code === "Backspace") {
    if (clipper.enabled) {
      clipper.delete(world);
    }
    if (lengthMeasurement.enabled) {
      lengthMeasurement.delete();
    }
    if (areaMeasurement.enabled) {
      areaMeasurement.delete();
    }
  }
  // Escape to cancel measurement
  if (event.code === "Escape") {
    lengthMeasurement.cancelCreation();
    areaMeasurement.cancelCreation();
  }
  // Shift+F to focus on selected object
  if (event.shiftKey && event.code === "KeyF") {
    if (Object.keys(currentSelection).length > 0) {
      cameraComponent.fitToItems(currentSelection);
    }
  }
  // Shift+H to hide selected elements
  if (event.shiftKey && event.code === "KeyH") {
    if (Object.keys(currentSelection).length > 0) {
      hider.set(false, currentSelection);
    }
  }
  // Shift+A to show all elements
  if (event.shiftKey && event.code === "KeyA") {
    hider.set(true);
  }
  // Shift+I to isolate selected elements
  if (event.shiftKey && event.code === "KeyI") {
    if (Object.keys(currentSelection).length > 0) {
      hider.isolate(currentSelection);
    }
  }
  // Shift+G to toggle ghosting
  if (event.shiftKey && event.code === "KeyG") {
    const newGhostState = !ghostingEnabled;
    toggleGhosting(newGhostState);
    const ghostBtn = document.querySelector("#visibility-ghost");
    ghostBtn?.classList.toggle("active", newGhostState);
  }
  // Shift+S to toggle sectioning mode
  if (event.shiftKey && event.code === "KeyS") {
    clipper.enabled = !clipper.enabled;
    highlighter.config.selectEnabled = !clipper.enabled;
    const clipBtn = document.querySelector("#clip-toggle");
    clipBtn?.classList.toggle("active", clipper.enabled);
  }
  keyState[event.code] = true;
};

window.onkeyup = (event) => {
  keyState[event.code] = false;
};

// First-person movement loop
// Base speed (slower, default) and fast speed (Shift held)
const baseSpeed = 0.25;
const fastSpeed = 0.5;

const updateMovement = () => {
  if (cameraComponent.mode.id === "FirstPerson") {
    const controls = cameraComponent.controls;
    // Use fast speed when Shift is held, otherwise base speed
    const speed = keyState["ShiftLeft"] || keyState["ShiftRight"] ? fastSpeed : baseSpeed;

    if (keyState["KeyW"] || keyState["ArrowUp"]) {
      controls.forward(speed, false);
    }
    if (keyState["KeyS"] || keyState["ArrowDown"]) {
      controls.forward(-speed, false);
    }
    if (keyState["KeyA"] || keyState["ArrowLeft"]) {
      controls.truck(-speed, 0, false);
    }
    if (keyState["KeyD"] || keyState["ArrowRight"]) {
      controls.truck(speed, 0, false);
    }
    if (keyState["KeyQ"] || keyState["Space"]) {
      controls.truck(0, speed, false);
    }
    if (keyState["KeyE"]) {
      controls.truck(0, -speed, false);
    }
  }
  requestAnimationFrame(updateMovement);
};
updateMovement();

// ============================================
// BOX SELECTION (Ctrl + Mouse Drag)
// ============================================

// Create selection box overlay element
const selectionBox = document.createElement("div");
selectionBox.className = "selection-box";
document.body.appendChild(selectionBox);

// Box selection state
let isBoxSelecting = false;
let boxSelectStart = { x: 0, y: 0 };
let boxSelectEnd = { x: 0, y: 0 };

// Update Ctrl key state for cursor change and disable camera controls
const updateCtrlState = (isPressed: boolean) => {
  if (isPressed) {
    document.body.classList.add("ctrl-held");
    // Disable camera controls to prevent orbit/pan during box selection
    cameraComponent.controls.enabled = false;
  } else {
    document.body.classList.remove("ctrl-held");
    // Re-enable camera controls
    cameraComponent.controls.enabled = true;
    // Cancel box selection if Ctrl is released mid-drag
    if (isBoxSelecting) {
      isBoxSelecting = false;
      selectionBox.classList.remove("active");
    }
  }
};

// Track Ctrl key state globally
window.addEventListener("keydown", (e) => {
  if (e.key === "Control") updateCtrlState(true);
});

window.addEventListener("keyup", (e) => {
  if (e.key === "Control") updateCtrlState(false);
});

// Handle mouse events on viewport for box selection
viewport.addEventListener("mousedown", (e: MouseEvent) => {
  // Only start box selection if Ctrl is held and it's a left click
  if (e.ctrlKey && e.button === 0) {
    isBoxSelecting = true;
    boxSelectStart = { x: e.clientX, y: e.clientY };
    boxSelectEnd = { x: e.clientX, y: e.clientY };

    // Position and show the selection box
    selectionBox.style.left = `${e.clientX}px`;
    selectionBox.style.top = `${e.clientY}px`;
    selectionBox.style.width = "0px";
    selectionBox.style.height = "0px";
    selectionBox.classList.add("active");

    // Prevent default to avoid text selection
    e.preventDefault();
  }
});

window.addEventListener("mousemove", (e: MouseEvent) => {
  if (!isBoxSelecting) return;

  boxSelectEnd = { x: e.clientX, y: e.clientY };

  // Calculate box dimensions (handle negative drag directions)
  const left = Math.min(boxSelectStart.x, boxSelectEnd.x);
  const top = Math.min(boxSelectStart.y, boxSelectEnd.y);
  const width = Math.abs(boxSelectEnd.x - boxSelectStart.x);
  const height = Math.abs(boxSelectEnd.y - boxSelectStart.y);

  // Update selection box position and size
  selectionBox.style.left = `${left}px`;
  selectionBox.style.top = `${top}px`;
  selectionBox.style.width = `${width}px`;
  selectionBox.style.height = `${height}px`;
});

window.addEventListener("mouseup", async () => {
  if (!isBoxSelecting) return;

  isBoxSelecting = false;
  selectionBox.classList.remove("active");

  // Get the viewport bounds
  const viewportRect = viewport.getBoundingClientRect();

  // Calculate screen coordinates relative to viewport
  const left = Math.min(boxSelectStart.x, boxSelectEnd.x) - viewportRect.left;
  const top = Math.min(boxSelectStart.y, boxSelectEnd.y) - viewportRect.top;
  const right = Math.max(boxSelectStart.x, boxSelectEnd.x) - viewportRect.left;
  const bottom = Math.max(boxSelectStart.y, boxSelectEnd.y) - viewportRect.top;

  // Minimum box size threshold (avoid accidental clicks)
  const boxWidth = right - left;
  const boxHeight = bottom - top;
  if (boxWidth < 5 || boxHeight < 5) return;

  // Get the canvas element from the renderer
  const canvas = rendererComponent.three.domElement;
  const camera = world.camera.three as THREE.PerspectiveCamera | THREE.OrthographicCamera;

  // Use the built-in rectangleRaycast method from FragmentsModel
  const selectedIds: OBC.ModelIdMap = {};

  for (const [modelId, model] of fragments.list) {
    if (model.isDeltaModel) continue;

    try {
      const result = await model.rectangleRaycast({
        camera,
        dom: canvas,
        topLeft: new THREE.Vector2(left, top),
        bottomRight: new THREE.Vector2(right, bottom),
        fullyIncluded: false, // Select items that intersect the box (not just fully inside)
      });

      if (result && result.localIds.length > 0) {
        selectedIds[modelId] = new Set(result.localIds);
      }
    } catch {
      // Skip models that can't be raycasted
    }
  }

  // Apply the selection
  if (Object.keys(selectedIds).length > 0) {
    await highlighter.highlightByID("select", selectedIds, true, true);
  }
});

/* MD
  As you see, we've passed an empty models list because in the first place there are no models. However, the Spatial Tree updates it-self each time a new model comes into the scene! Which makes it really handy to work with.

  Great! As we already created the Spatial Tree instance, let's add it to the HTML page. For it, let's create simple BIM panel component where we include the tree and also a pre-made IFC load button 👇
*/

// Container to hold view buttons dynamically
let viewButtonsContainer: HTMLElement | null = null;

const updateViewButtons = () => {
  if (!viewButtonsContainer) return;

  viewButtonsContainer.innerHTML = "";

  for (const [id, view] of views.list) {
    const button = document.createElement("bim-button") as BUI.Button;
    button.label = id;
    button.icon = view.open ? "mdi:eye" : "mdi:floor-plan";
    button.onclick = () => {
      if (view.open) {
        views.close(id);
      } else {
        views.open(id);
      }
      updateViewButtons();
    };
    viewButtonsContainer.appendChild(button);
  }
};

// Left panel - Properties (swapped from right)
const createLeftPanel = () => BUI.Component.create(() => {
  return BUI.html`
   <bim-panel label="${t('properties')}" style="display: flex; flex-direction: column; height: 100%;">
    <bim-panel-section label="${t('elementProperties')}" icon="mdi:information-outline">
      <div id="properties-container" style="min-height: 100px;">
        <div id="properties-empty-state" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          text-align: center;
          color: var(--text-muted, rgba(255, 255, 255, 0.32));
        ">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4; margin-bottom: 12px;">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          <span style="font-size: 12px; font-weight: 500;">${t('noElementSelected')}</span>
          <span style="font-size: 11px; margin-top: 4px; opacity: 0.7;">${t('clickToViewProperties')}</span>
        </div>
        ${propertiesTable}
      </div>
    </bim-panel-section>
    <bim-panel-section label="${t('bmsSensors')}" icon="mdi:gauge">
      <div id="bms-sensor-container" style="min-height: 100px;"></div>
    </bim-panel-section>
    <bim-panel-section label="${t('documents')}" icon="mdi:file-document-multiple">
      <div id="documents-container" style="min-height: 100px;"></div>
    </bim-panel-section>
   </bim-panel>
  `;
});
let leftPanel = createLeftPanel();

// Right panel - Trees (swapped from left)
const createRightPanel = () => BUI.Component.create(() => {
  const onSearch = (e: Event) => {
    const input = e.target as BUI.TextInput;
    spatialTree.queryString = input.value;
  };

  // Filter panel handlers
  const onAddCategoryFilter = () => {
    filterConditions.push({
      id: generateFilterId(),
      type: "category",
      category: ifcCategories[0],
    });
    const container = document.getElementById("filter-conditions-container");
    if (container) renderFilterConditions(container);
  };

  const onAddAttributeFilter = () => {
    filterConditions.push({
      id: generateFilterId(),
      type: "attribute",
      attributeName: "",
      attributeValue: "",
    });
    const container = document.getElementById("filter-conditions-container");
    if (container) renderFilterConditions(container);
  };

  const onClearFilters = async () => {
    filterConditions = [];
    const container = document.getElementById("filter-conditions-container");
    if (container) renderFilterConditions(container);
    updateFilterResultCount(0);
    await highlighter.clear("select");
    currentSelection = {};
  };

  const onApplyFilter = async () => {
    await executeFilter();
  };

  const onAggregationChange = (e: Event) => {
    const checkbox = e.target as BUI.Checkbox;
    filterAggregation = checkbox.checked ? "exclusive" : "inclusive";
    // Update the operator labels
    const container = document.getElementById("filter-conditions-container");
    if (container) renderFilterConditions(container);
  };

  const onIsolateFiltered = async () => {
    if (Object.keys(currentSelection).length > 0) {
      await hider.isolate(currentSelection);
    }
  };

  const onHideFiltered = async () => {
    if (Object.keys(currentSelection).length > 0) {
      await hider.set(false, currentSelection);
    }
  };

  return BUI.html`
   <bim-panel label="${t('model')}">
    <bim-panel-section label="${t('spatialTree')}">
      <bim-text-input @input=${onSearch} placeholder="${t('search')}" debounce="200"></bim-text-input>
      ${spatialTree}
    </bim-panel-section>
    <bim-panel-section label="${t('propertyFilter')}" icon="mdi:filter">
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <!-- Add filter buttons -->
        <div style="display: flex; gap: 8px;">
          <bim-button @click=${onAddCategoryFilter} label="${t('addCategory')}" style="flex: 1;"></bim-button>
          <bim-button @click=${onAddAttributeFilter} label="${t('addAttribute')}" style="flex: 1;"></bim-button>
        </div>

        <!-- Aggregation toggle -->
        <bim-checkbox @change=${onAggregationChange} label="${t('matchAllConditions')}" style="font-size: 13px;"></bim-checkbox>

        <!-- Filter conditions container -->
        <div id="filter-conditions-container" style="max-height: 320px; overflow-y: auto;"></div>

        <!-- Result count -->
        <div id="filter-result-count" style="
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary, rgba(255, 255, 255, 0.72));
          text-align: center;
          padding: 8px;
          background: var(--surface-base, #161922);
          border-radius: 6px;
        "></div>

        <!-- Action buttons -->
        <div style="display: flex; gap: 8px;">
          <bim-button @click=${onApplyFilter} label="${t('apply')}" icon="mdi:check" style="flex: 1;"></bim-button>
          <bim-button @click=${onClearFilters} label="${t('clear')}" icon="mdi:close" style="flex: 1;"></bim-button>
        </div>

        <!-- Visibility actions for filtered results -->
        <div style="display: flex; gap: 8px; border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06)); padding-top: 12px; margin-top: 4px;">
          <bim-button @click=${onIsolateFiltered} label="${t('isolate')}" icon="mdi:eye-outline" style="flex: 1;"></bim-button>
          <bim-button @click=${onHideFiltered} label="${t('hide')}" icon="mdi:eye-off-outline" style="flex: 1;"></bim-button>
        </div>
      </div>
    </bim-panel-section>
   </bim-panel>
  `;
});
let rightPanel = createRightPanel();

// Create floating toolbar
const createFloatingToolbar = () => {
  const toolbar = document.createElement("div");
  toolbar.id = "floating-toolbar";
  toolbar.innerHTML = `
    <style>
      #floating-toolbar {
        position: fixed;
        bottom: 26px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 3px;
        padding: 5px;
        background: var(--surface-overlay, #232733);
        border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
        border-radius: 13px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(16px);
        z-index: 1000;
      }

      .toolbar-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
      }

      .toolbar-section-label {
        font-family: var(--font-sans, 'Inter', sans-serif);
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-tertiary, rgba(255, 255, 255, 0.40));
        white-space: nowrap;
      }

      .toolbar-group {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 3px;
        background: var(--surface-base, #161922);
        border-radius: 8px;
      }

      .toolbar-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border: none;
        border-radius: 7px;
        background: transparent;
        color: var(--text-tertiary, rgba(255, 255, 255, 0.50));
        cursor: pointer;
        transition: all 100ms ease-out;
        position: relative;
      }

      .toolbar-btn:hover {
        background: var(--surface-raised, #1c1f2a);
        color: var(--text-primary, rgba(255, 255, 255, 0.95));
      }

      .toolbar-btn.active {
        background: var(--accent-muted, rgba(59, 130, 246, 0.15));
        color: var(--accent, #3b82f6);
      }

      .toolbar-btn svg {
        width: 21px;
        height: 21px;
      }

      .toolbar-divider {
        width: 1px;
        height: 62px;
        background: var(--border-subtle, rgba(255, 255, 255, 0.06));
        margin: 0 5px;
        align-self: center;
      }

      .toolbar-btn[data-tooltip]:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        padding: 5px 10px;
        background: var(--surface-overlay, #232733);
        border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
        border-radius: 5px;
        font-family: var(--font-sans, 'Inter', sans-serif);
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary, rgba(255, 255, 255, 0.95));
        white-space: nowrap;
        z-index: 10;
        pointer-events: none;
      }

      /* Dropdown for views */
      .toolbar-dropdown {
        position: absolute;
        bottom: calc(100% + 10px);
        left: 50%;
        transform: translateX(-50%);
        background: var(--surface-overlay, #232733);
        border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
        border-radius: 10px;
        padding: 5px;
        min-width: 182px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(12px);
        display: none;
        flex-direction: column;
        gap: 3px;
      }

      .toolbar-dropdown.visible {
        display: flex;
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 13px;
        border: none;
        border-radius: 5px;
        background: transparent;
        color: var(--text-secondary, rgba(255, 255, 255, 0.72));
        font-family: var(--font-sans, 'Inter', sans-serif);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 100ms ease-out;
        text-align: left;
        white-space: nowrap;
      }

      .dropdown-item:hover {
        background: var(--surface-raised, #1c1f2a);
        color: var(--text-primary, rgba(255, 255, 255, 0.95));
      }

      .dropdown-item svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }

      /* Vertical Views Toolbar - Top Right */
      #views-toolbar {
        position: fixed;
        top: 20px;
        right: calc(320px + 12px);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        padding: 5px;
        background: var(--surface-overlay, #232733);
        border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
        border-radius: 13px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(16px);
        z-index: 1000;
        transition: right 250ms ease-out;
      }

      #views-toolbar.sidebar-collapsed {
        right: 12px !important;
      }

      #views-toolbar .toolbar-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
      }

      #views-toolbar .toolbar-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 3px;
        background: var(--surface-base, #161922);
        border-radius: 8px;
      }

      #views-toolbar .toolbar-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border: none;
        border-radius: 7px;
        background: transparent;
        color: var(--text-tertiary, rgba(255, 255, 255, 0.50));
        cursor: pointer;
        transition: all 100ms ease-out;
        position: relative;
      }

      #views-toolbar .toolbar-btn:hover {
        background: var(--surface-raised, #1c1f2a);
        color: var(--text-primary, rgba(255, 255, 255, 0.95));
      }

      #views-toolbar .toolbar-btn.active {
        background: var(--accent-muted, rgba(59, 130, 246, 0.15));
        color: var(--accent, #3b82f6);
      }

      #views-toolbar .toolbar-btn svg {
        width: 21px;
        height: 21px;
      }

      #views-toolbar .toolbar-section-label {
        font-family: var(--font-sans, 'Inter', sans-serif);
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-tertiary, rgba(255, 255, 255, 0.40));
        white-space: nowrap;
      }

      #views-toolbar .toolbar-btn[data-tooltip]:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        left: auto;
        right: calc(100% + 8px);
        top: 50%;
        transform: translateY(-50%);
        padding: 5px 10px;
        background: var(--surface-overlay, #232733);
        border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
        border-radius: 5px;
        font-family: var(--font-sans, 'Inter', sans-serif);
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary, rgba(255, 255, 255, 0.95));
        white-space: nowrap;
        z-index: 10;
        pointer-events: none;
      }

      #views-toolbar .toolbar-dropdown {
        position: absolute;
        left: auto;
        right: calc(100% + 10px);
        top: 50%;
        transform: translateY(-50%);
        background: var(--surface-overlay, #232733);
        border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
        border-radius: 10px;
        padding: 5px;
        min-width: 182px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(12px);
        display: none;
        flex-direction: column;
        gap: 3px;
      }

      #views-toolbar .toolbar-dropdown.visible {
        display: flex;
      }
    </style>

    <!-- Navigation section -->
    <div class="toolbar-section">
      <div class="toolbar-group">
        <button class="toolbar-btn active" id="nav-orbit" data-tooltip="${t('orbit')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/></svg>
        </button>
        <button class="toolbar-btn" id="nav-firstperson" data-tooltip="${t('firstPerson')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 14a3 3 0 100-5 3 3 0 000 5z"/><path d="M3 12s4-7 9-7 9 7 9 7-4 7-9 7-9-7-9-7z"/></svg>
        </button>
        <button class="toolbar-btn" id="nav-plan" data-tooltip="${t('planView')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 9h16M9 20V9"/></svg>
        </button>
      </div>
      <span class="toolbar-section-label">${t('navigate')}</span>
    </div>

    <div class="toolbar-divider"></div>

    <!-- Measurement section -->
    <div class="toolbar-section">
      <div class="toolbar-group">
        <button class="toolbar-btn" id="measure-length" data-tooltip="${t('length')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 19L19 5"/><path d="M5 19l2-4M5 19l-2 2M19 5l-2 4M19 5l2-2"/></svg>
        </button>
        <button class="toolbar-btn" id="measure-area" data-tooltip="${t('area')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16"/><path d="M4 4l16 16"/></svg>
        </button>
        <button class="toolbar-btn" id="measure-clear" data-tooltip="${t('clearMeasurements')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/></svg>
        </button>
      </div>
      <span class="toolbar-section-label">${t('measure')}</span>
    </div>

    <div class="toolbar-divider"></div>

    <!-- Section planes section -->
    <div class="toolbar-section">
      <div class="toolbar-group">
        <button class="toolbar-btn" id="clip-toggle" data-tooltip="${t('createSection')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/></svg>
        </button>
        <button class="toolbar-btn active" id="clip-visibility" data-tooltip="${t('showPlanes')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="toolbar-btn" id="clip-clear" data-tooltip="${t('deleteAll')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/></svg>
        </button>
      </div>
      <span class="toolbar-section-label">${t('section')}</span>
    </div>

    <div class="toolbar-divider"></div>

    <!-- Visibility section -->
    <div class="toolbar-section">
      <div class="toolbar-group">
        <button class="toolbar-btn" id="visibility-ghost" data-tooltip="${t('ghost')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" opacity="0.5"/><circle cx="9" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/><path d="M8 16s1.5 2 4 2 4-2 4-2"/></svg>
        </button>
        <button class="toolbar-btn" id="visibility-isolate" data-tooltip="${t('isolate')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 5v2M12 17v2M5 12h2M17 12h2"/></svg>
        </button>
        <button class="toolbar-btn" id="visibility-hide" data-tooltip="${t('hide')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        </button>
        <button class="toolbar-btn" id="visibility-show" data-tooltip="${t('showAll')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
      <span class="toolbar-section-label">${t('visibility')}</span>
    </div>

  `;

  document.body.appendChild(toolbar);

  // Create vertical Views toolbar (top right)
  const viewsToolbar = document.createElement("div");
  viewsToolbar.id = "views-toolbar";
  viewsToolbar.innerHTML = `
    <div class="toolbar-section">
      <div class="toolbar-group">
        <button class="toolbar-btn" id="views-floors" data-tooltip="${t('floorPlans')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18"/></svg>
        </button>
        <button class="toolbar-btn" id="views-elevations" data-tooltip="${t('elevations')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-5h6v5"/></svg>
        </button>
        <button class="toolbar-btn" id="views-exit" data-tooltip="${t('exit2D')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </button>
        <button class="toolbar-btn" id="btn-views-list" data-tooltip="${t('savedViews')}" style="position: relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          <div class="toolbar-dropdown" id="dropdown-views">
            <div id="view-buttons-container" style="display: flex; flex-direction: column; gap: 3px;"></div>
          </div>
        </button>
      </div>
      <span class="toolbar-section-label">${t('views')}</span>
    </div>
  `;
  document.body.appendChild(viewsToolbar);

  // Setup event handlers
  const setupToolbarEvents = () => {
    // Navigation buttons
    const navOrbit = toolbar.querySelector("#nav-orbit");
    const navFirstPerson = toolbar.querySelector("#nav-firstperson");
    const navPlan = toolbar.querySelector("#nav-plan");
    const navButtons = [navOrbit, navFirstPerson, navPlan];

    const setNavActive = (btn: Element | null) => {
      navButtons.forEach((b) => b?.classList.remove("active"));
      btn?.classList.add("active");
    };

    navOrbit?.addEventListener("click", () => {
      cameraComponent.set("Orbit");
      setNavActive(navOrbit);
    });
    navFirstPerson?.addEventListener("click", () => {
      cameraComponent.set("FirstPerson");
      setNavActive(navFirstPerson);
    });
    navPlan?.addEventListener("click", () => {
      cameraComponent.set("Plan");
      setNavActive(navPlan);
    });

    // Measurement buttons
    const measureLengthBtn = toolbar.querySelector("#measure-length");
    const measureAreaBtn = toolbar.querySelector("#measure-area");
    const measureClearBtn = toolbar.querySelector("#measure-clear");

    measureLengthBtn?.addEventListener("click", () => {
      const isActive = measureLengthBtn.classList.contains("active");
      measureLengthBtn.classList.toggle("active");
      measureAreaBtn?.classList.remove("active");
      lengthMeasurement.enabled = !isActive;
      areaMeasurement.enabled = false;
      highlighter.config.selectEnabled = isActive;
    });

    measureAreaBtn?.addEventListener("click", () => {
      const isActive = measureAreaBtn.classList.contains("active");
      measureAreaBtn.classList.toggle("active");
      measureLengthBtn?.classList.remove("active");
      areaMeasurement.enabled = !isActive;
      lengthMeasurement.enabled = false;
      highlighter.config.selectEnabled = isActive;
    });

    measureClearBtn?.addEventListener("click", () => {
      lengthMeasurement.list.clear();
      areaMeasurement.list.clear();
      measureLengthBtn?.classList.remove("active");
      measureAreaBtn?.classList.remove("active");
      lengthMeasurement.enabled = false;
      areaMeasurement.enabled = false;
      highlighter.config.selectEnabled = true;
    });

    // Clipper buttons
    const clipToggleBtn = toolbar.querySelector("#clip-toggle");
    const clipVisibilityBtn = toolbar.querySelector("#clip-visibility");
    const clipClearBtn = toolbar.querySelector("#clip-clear");

    clipToggleBtn?.addEventListener("click", () => {
      clipToggleBtn.classList.toggle("active");
      clipper.enabled = clipToggleBtn.classList.contains("active");
      highlighter.config.selectEnabled = !clipper.enabled;
    });

    clipVisibilityBtn?.addEventListener("click", () => {
      clipVisibilityBtn.classList.toggle("active");
      clipper.visible = clipVisibilityBtn.classList.contains("active");
    });

    clipClearBtn?.addEventListener("click", () => {
      clipper.deleteAll();
    });

    // 2D Views buttons (from vertical views toolbar)
    const viewsFloorsBtn = viewsToolbar.querySelector("#views-floors");
    const viewsElevationsBtn = viewsToolbar.querySelector("#views-elevations");
    const viewsExitBtn = viewsToolbar.querySelector("#views-exit");
    const viewsListBtn = viewsToolbar.querySelector("#btn-views-list");
    const viewsDropdown = viewsToolbar.querySelector("#dropdown-views");

    viewsFloorsBtn?.addEventListener("click", async () => {
      const floorPlans = await views.createFromIfcStoreys();
      console.log(`Generated ${floorPlans.length} floor plans`);
      updateViewButtons();
    });

    viewsElevationsBtn?.addEventListener("click", () => {
      const elevations = views.createElevations({ combine: true });
      console.log(`Generated ${elevations.length} elevations`);
      updateViewButtons();
    });

    viewsExitBtn?.addEventListener("click", () => {
      views.close();
      updateViewButtons();
    });

    // Views list dropdown toggle
    viewsListBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      viewsDropdown?.classList.toggle("visible");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      viewsDropdown?.classList.remove("visible");
    });

    // Visibility buttons
    const visibilityGhostBtn = toolbar.querySelector("#visibility-ghost");
    const visibilityIsolateBtn = toolbar.querySelector("#visibility-isolate");
    const visibilityHideBtn = toolbar.querySelector("#visibility-hide");
    const visibilityShowBtn = toolbar.querySelector("#visibility-show");

    visibilityGhostBtn?.addEventListener("click", async () => {
      visibilityGhostBtn.classList.toggle("active");
      const isActive = visibilityGhostBtn.classList.contains("active");
      await toggleGhosting(isActive);
    });

    visibilityIsolateBtn?.addEventListener("click", async () => {
      const hasSelection = Object.keys(currentSelection).length > 0;
      if (hasSelection) {
        await hider.isolate(currentSelection);
      }
    });

    visibilityHideBtn?.addEventListener("click", async () => {
      const hasSelection = Object.keys(currentSelection).length > 0;
      if (hasSelection) {
        await hider.set(false, currentSelection);
      }
    });

    visibilityShowBtn?.addEventListener("click", async () => {
      await hider.set(true);
    });
  };

  setupToolbarEvents();
  return toolbar;
};

/* MD
  Finally, let's append the BIM Panel to the page to see the Spatial Tree working 😉
  */

const app = document.getElementById("app") as BUI.Grid<["main"]>;
app.layouts = {
  main: {
    template: `
      "rightPanel viewport leftPanel"
      / 320px 1fr 320px
    `,
    elements: { leftPanel, viewport, rightPanel },
  },
};

app.layout = "main";

// Create floating toolbar
createFloatingToolbar();

// Sidebar collapse state
let modelPanelCollapsed = false;
let propertiesPanelCollapsed = false;
let isResizing = false;

// Panel widths (in pixels) - resizable
let leftPanelWidth = 320; // 20rem default
let rightPanelWidth = 320; // 20rem default
const MIN_PANEL_WIDTH = 240; // minimum width
const MAX_PANEL_WIDTH = 480; // maximum width

// Create sidebar toggle buttons
const createSidebarToggles = () => {
  // Add styles for sidebar toggles
  const style = document.createElement("style");
  style.textContent = `
    .sidebar-toggle {
      position: fixed;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 48px;
      background: var(--surface-overlay, #232733);
      border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10));
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 100;
      transition: left 250ms ease-out, right 250ms ease-out, background 150ms ease-out;
      color: var(--text-tertiary, rgba(255, 255, 255, 0.50));
    }

    .sidebar-toggle:hover {
      background: var(--surface-raised, #1c1f2a);
      color: var(--text-primary, rgba(255, 255, 255, 0.95));
    }

    .sidebar-toggle.left {
      left: 320px;
      border-left: none;
      border-radius: 0 6px 6px 0;
    }

    .sidebar-toggle.left.collapsed {
      left: 0 !important;
    }

    .sidebar-toggle.right {
      right: 320px;
      border-right: none;
      border-radius: 6px 0 0 6px;
    }

    .sidebar-toggle.right.collapsed {
      right: 0 !important;
    }

    .sidebar-toggle svg {
      width: 12px;
      height: 12px;
      transition: transform 250ms ease-out;
    }

    .sidebar-toggle.collapsed svg {
      transform: rotate(180deg);
    }

    /* Smooth panel transitions */
    bim-panel[label="Model"],
    bim-panel[label="Properties"] {
      transition: opacity 250ms ease-out, visibility 250ms ease-out;
    }

    bim-panel.panel-hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  // Left toggle (for Model panel - on the left side)
  const leftToggle = document.createElement("button");
  leftToggle.className = "sidebar-toggle left";
  leftToggle.id = "left-sidebar-toggle";
  leftToggle.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  `;
  leftToggle.onclick = () => {
    if (isResizing) return;
    modelPanelCollapsed = !modelPanelCollapsed;
    leftToggle.classList.toggle("collapsed", modelPanelCollapsed);
    updateGridLayout();
  };
  document.body.appendChild(leftToggle);

  // Right toggle (for Properties panel - on the right side)
  const rightToggle = document.createElement("button");
  rightToggle.className = "sidebar-toggle right";
  rightToggle.id = "right-sidebar-toggle";
  rightToggle.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  `;
  rightToggle.onclick = () => {
    if (isResizing) return;
    propertiesPanelCollapsed = !propertiesPanelCollapsed;
    rightToggle.classList.toggle("collapsed", propertiesPanelCollapsed);
    updateGridLayout();
  };
  document.body.appendChild(rightToggle);
};

// Create resize handles for panels
const createResizeHandles = () => {
  const style = document.createElement("style");
  style.textContent = `
    .panel-resize-handle {
      position: fixed;
      top: 0;
      bottom: 0;
      width: 6px;
      cursor: col-resize;
      z-index: 1000;
      background: transparent;
      transition: background 150ms ease;
    }
    .panel-resize-handle:hover,
    .panel-resize-handle.dragging {
      background: var(--accent, #3b82f6);
    }
    .panel-resize-handle::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 2px;
      height: 32px;
      background: var(--text-tertiary, rgba(255, 255, 255, 0.3));
      border-radius: 1px;
      opacity: 0;
      transition: opacity 150ms ease;
    }
    .panel-resize-handle:hover::after,
    .panel-resize-handle.dragging::after {
      opacity: 1;
    }
    .panel-resize-handle.left {
      left: ${leftPanelWidth}px;
    }
    .panel-resize-handle.right {
      right: ${rightPanelWidth}px;
    }
  `;
  document.head.appendChild(style);

  // Left panel resize handle
  const leftHandle = document.createElement("div");
  leftHandle.className = "panel-resize-handle left";
  leftHandle.id = "left-resize-handle";
  document.body.appendChild(leftHandle);

  // Right panel resize handle
  const rightHandle = document.createElement("div");
  rightHandle.className = "panel-resize-handle right";
  rightHandle.id = "right-resize-handle";
  document.body.appendChild(rightHandle);

  // Drag state
  let isDragging = false;
  let currentHandle: "left" | "right" | null = null;
  let startX = 0;
  let startWidth = 0;

  const updateHandlePositions = () => {
    // Update resize handles
    leftHandle.style.left = modelPanelCollapsed ? "-10px" : `${leftPanelWidth}px`;
    rightHandle.style.right = propertiesPanelCollapsed ? "-10px" : `${rightPanelWidth}px`;
    leftHandle.style.display = modelPanelCollapsed ? "none" : "block";
    rightHandle.style.display = propertiesPanelCollapsed ? "none" : "block";

    // Update toggle button positions
    const leftToggle = document.getElementById("left-sidebar-toggle");
    const rightToggle = document.getElementById("right-sidebar-toggle");
    if (leftToggle && !modelPanelCollapsed) {
      leftToggle.style.left = `${leftPanelWidth}px`;
    }
    if (rightToggle && !propertiesPanelCollapsed) {
      rightToggle.style.right = `${rightPanelWidth}px`;
    }

    // Update views toolbar position
    const viewsToolbar = document.getElementById("views-toolbar");
    if (viewsToolbar && !propertiesPanelCollapsed) {
      viewsToolbar.style.right = `${rightPanelWidth + 12}px`;
    }
  };

  const onMouseDown = (e: MouseEvent, handle: "left" | "right") => {
    isDragging = true;
    currentHandle = handle;
    startX = e.clientX;
    startWidth = handle === "left" ? leftPanelWidth : rightPanelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    (handle === "left" ? leftHandle : rightHandle).classList.add("dragging");
    blockViewportResize = true;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging || !currentHandle) return;

    const deltaX = e.clientX - startX;
    let newWidth: number;

    if (currentHandle === "left") {
      newWidth = startWidth + deltaX;
    } else {
      newWidth = startWidth - deltaX;
    }

    // Clamp to min/max
    newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, newWidth));

    // Update width
    if (currentHandle === "left") {
      leftPanelWidth = newWidth;
    } else {
      rightPanelWidth = newWidth;
    }

    // Update layout immediately (no animation during drag)
    const appElement = document.getElementById("app");
    if (appElement) {
      const leftW = modelPanelCollapsed ? "0" : `${leftPanelWidth}px`;
      const rightW = propertiesPanelCollapsed ? "0" : `${rightPanelWidth}px`;
      appElement.style.transition = "none";
      appElement.style.gridTemplateColumns = `${leftW} 1fr ${rightW}`;
    }

    updateHandlePositions();
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    leftHandle.classList.remove("dragging");
    rightHandle.classList.remove("dragging");
    currentHandle = null;

    // Trigger resize after drag ends
    requestAnimationFrame(() => {
      blockViewportResize = false;
      rendererComponent.resize();
      cameraComponent.updateAspect();
    });
  };

  leftHandle.addEventListener("mousedown", (e) => onMouseDown(e, "left"));
  rightHandle.addEventListener("mousedown", (e) => onMouseDown(e, "right"));
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);

  // Export updateHandlePositions for use after toggle
  (window as any).__updateResizeHandles = updateHandlePositions;

  // Initial position
  updateHandlePositions();
};

// Update grid layout based on collapsed state
const updateGridLayout = () => {
  if (isResizing) return;
  isResizing = true;
  blockViewportResize = true;

  const leftWidth = modelPanelCollapsed ? "0" : `${leftPanelWidth}px`;
  const rightWidth = propertiesPanelCollapsed ? "0" : `${rightPanelWidth}px`;

  // Get panels
  const modelPanel = document.querySelector('bim-panel[label="Model"]') as HTMLElement;
  const propertiesPanel = document.querySelector('bim-panel[label="Properties"]') as HTMLElement;
  const appElement = document.getElementById("app");

  // For expanding panels, show them first before animating
  if (modelPanel && !modelPanelCollapsed) {
    modelPanel.style.display = "";
    // Force reflow before removing hidden class for smooth animation
    modelPanel.offsetHeight;
    modelPanel.classList.remove("panel-hidden");
  }
  if (propertiesPanel && !propertiesPanelCollapsed) {
    propertiesPanel.style.display = "";
    propertiesPanel.offsetHeight;
    propertiesPanel.classList.remove("panel-hidden");
  }

  // For collapsing panels, fade out first
  if (modelPanel && modelPanelCollapsed) {
    modelPanel.classList.add("panel-hidden");
  }
  if (propertiesPanel && propertiesPanelCollapsed) {
    propertiesPanel.classList.add("panel-hidden");
  }

  // Update the grid template directly on the app element for smooth transition
  if (appElement) {
    appElement.style.display = "grid";
    appElement.style.gridTemplateColumns = `${leftWidth} 1fr ${rightWidth}`;
    appElement.style.gridTemplateAreas = '"rightPanel viewport leftPanel"';
    appElement.style.transition = "grid-template-columns 250ms ease-out";
  }

  // Update views toolbar position based on properties panel state
  const viewsToolbar = document.getElementById("views-toolbar");
  if (viewsToolbar) {
    viewsToolbar.classList.toggle("sidebar-collapsed", propertiesPanelCollapsed);
  }

  // Update resize handle positions
  if ((window as any).__updateResizeHandles) {
    (window as any).__updateResizeHandles();
  }

  // After full transition completes, hide collapsed panels and resize viewport
  setTimeout(() => {
    // Set display:none on collapsed panels after animation completes
    if (modelPanel && modelPanelCollapsed) {
      modelPanel.style.display = "none";
    }
    if (propertiesPanel && propertiesPanelCollapsed) {
      propertiesPanel.style.display = "none";
    }

    // Use requestAnimationFrame to ensure layout is settled before resize
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        blockViewportResize = false;
        rendererComponent.resize();
        cameraComponent.updateAspect();
        isResizing = false;
      });
    });
  }, 260);
};

// Initialize sidebar toggles and resize handles
createSidebarToggles();
createResizeHandles();

// Set initial grid and positions after DOM is fully ready
setTimeout(() => {
  const appElement = document.getElementById("app");
  if (appElement) {
    appElement.style.display = "grid";
    appElement.style.gridTemplateColumns = `${leftPanelWidth}px 1fr ${rightPanelWidth}px`;
    appElement.style.gridTemplateAreas = '"rightPanel viewport leftPanel"';
  }
  if ((window as any).__updateResizeHandles) {
    (window as any).__updateResizeHandles();
  }
}, 100);

// Initialize containers after layout is set
setTimeout(() => {
  viewButtonsContainer = document.getElementById("view-buttons-container");

  // Initialize filter conditions container with empty state
  const filterContainer = document.getElementById("filter-conditions-container");
  if (filterContainer) {
    renderFilterConditions(filterContainer);
  }

  // Initialize BMS sensor container with empty state
  const bmsContainer = document.getElementById("bms-sensor-container");
  if (bmsContainer) {
    renderBMSEmptyState(bmsContainer);
  }

  // Initialize documents container with empty state
  const docsContainer = document.getElementById("documents-container");
  if (docsContainer) {
    renderDocumentsEmptyState(docsContainer);
  }
}, 200);

/* MD
  Congratulations! You've now a ready to go user interface that let's you show your model tree. 🥳
  */