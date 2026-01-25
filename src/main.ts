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
await ifcLoader.setup();

// Auto-load function - called after all components are initialized
const loadDefaultModel = async () => {
  try {
    const response = await fetch("/models/OfficeBuilding_complete_2024.ifc");
    if (!response.ok) throw new Error(`Failed to fetch model: ${response.status}`);
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);
    await ifcLoader.load(data, true, world.name!);
    console.log("Default IFC model loaded successfully");
  } catch (error) {
    console.error("Failed to load default IFC model:", error);
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
fragments.init("/resources/worker.mjs");

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
  // Build systems classification when a model is loaded
  await buildSystemsClassification();
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

// Setup Classifier for systems tree
const classifier = components.get(OBC.Classifier);

// Setup ItemsFinder for property-based filtering
const itemsFinder = components.get(OBC.ItemsFinder);

// Build systems classification from IFC data
const buildSystemsClassification = async () => {
  // Clear previous classifications
  classifier.list.delete("Systems");

  // Get all models and find MEP elements to group by system
  for (const [modelId, model] of fragments.list) {
    if (model.isDeltaModel) continue;

    try {
      // Find all MEP (Mechanical, Electrical, Plumbing) elements
      // These are the elements that typically belong to systems
      const mepCategories = await model.getItemsOfCategories([
        /DUCT/i,           // IFCDUCTSEGMENT, IFCDUCTFITTING
        /PIPE/i,           // IFCPIPESEGMENT, IFCPIPEFITTING
        /TERMINAL/i,       // IFCAIRTERMINAL, IFCSANITARYTERMINAL, IFCWASTETERMINAL
        /FAN/i,            // IFCFAN
        /VALVE/i,          // IFCVALVE
        /UNITARYEQUIPMENT/i, // IFCUNITARYEQUIPMENT
      ]);

      const mepIds = Object.values(mepCategories).flat();
      console.log(`Found ${mepIds.length} MEP elements in model ${modelId}`);

      if (mepIds.length === 0) continue;

      // Get element data with properties that might contain system info
      // Check for "System Name", "System Type", or use ObjectType as fallback
      const elementsData = await model.getItemsData(mepIds, {
        attributes: ["Name", "ObjectType", "Description", "Tag"],
        relations: {
          // Try to get property sets that might contain system information
          IsDefinedBy: { attributes: true, relations: false },
          HasAssignments: { attributes: true, relations: false },
        }
      });

      console.log("Sample MEP element data:", elementsData[0]);

      // Group elements by their ObjectType (most reliable for system grouping)
      for (const element of elementsData) {
        let systemName = "Unclassified";

        // Try to get system name from ObjectType first (common pattern)
        if (element.ObjectType && "value" in element.ObjectType) {
          const objectType = String(element.ObjectType.value);
          if (objectType && objectType.trim() !== "") {
            systemName = objectType;
          }
        }

        // Try to find system info in HasAssignments relation
        if (Array.isArray(element.HasAssignments)) {
          for (const assignment of element.HasAssignments) {
            if (assignment.Name && "value" in assignment.Name) {
              systemName = String(assignment.Name.value);
              break;
            }
          }
        }

        // Get element's local ID
        const localIdAttr = element._localId;
        if (!localIdAttr || !("value" in localIdAttr)) continue;
        const localId = localIdAttr.value as number;

        // Add to classification
        const groupData = classifier.getGroupData("Systems", systemName);
        if (!groupData.map[modelId]) {
          groupData.map[modelId] = new Set();
        }
        groupData.map[modelId].add(localId);
      }
    } catch (e) {
      console.log("Error building systems classification:", e);
    }
  }

  // Update the systems tree UI
  updateSystemsTree();
};

// Store systems tree table reference for updates
let systemsTreeContainer: HTMLElement | null = null;

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
    resultLabel.textContent = count > 0 ? `${count} elements found` : "No elements found";
  }
};

// Render filter conditions UI
const renderFilterConditions = (container: HTMLElement) => {
  container.innerHTML = "";

  if (filterConditions.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.style.cssText = `
      padding: 16px;
      text-align: center;
      color: var(--text-muted, rgba(255, 255, 255, 0.32));
      font-size: 12px;
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
      gap: 6px;
      padding: 10px;
      background: var(--surface-base, #161922);
      border-radius: 6px;
      margin-bottom: 8px;
    `;

    // Header with type and delete button
    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const typeLabel = document.createElement("span");
    typeLabel.style.cssText = `
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--accent, #3b82f6);
    `;
    typeLabel.textContent = condition.type === "category" ? "Category" : "Attribute";

    const deleteBtn = document.createElement("button");
    deleteBtn.style.cssText = `
      background: none;
      border: none;
      color: var(--text-tertiary, rgba(255, 255, 255, 0.50));
      cursor: pointer;
      padding: 2px;
      font-size: 14px;
    `;
    deleteBtn.innerHTML = "×";
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
      categorySelect.label = "IFC Category";

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
      nameInput.label = "Attribute Name";
      nameInput.placeholder = "e.g., Name, ObjectType, Description";
      nameInput.value = condition.attributeName || "";
      nameInput.addEventListener("input", () => {
        condition.attributeName = nameInput.value;
      });
      conditionEl.appendChild(nameInput);

      // Attribute value input
      const valueInput = document.createElement("bim-text-input") as BUI.TextInput;
      valueInput.label = "Value (regex)";
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
        font-size: 10px;
        font-weight: 600;
        color: var(--text-tertiary, rgba(255, 255, 255, 0.40));
        padding: 4px 0;
      `;
      operatorLabel.textContent = filterAggregation === "inclusive" ? "OR" : "AND";
      conditionEl.appendChild(operatorLabel);
    }

    container.appendChild(conditionEl);
  });
};

// Update systems tree UI
const updateSystemsTree = () => {
  if (systemsTreeContainer) {
    // Re-render the systems tree
    renderSystemsTree(systemsTreeContainer);
  }
};

// Render systems tree into container
const renderSystemsTree = async (container: HTMLElement) => {
  container.innerHTML = "";

  const systemsClassification = classifier.list.get("Systems");
  if (!systemsClassification || systemsClassification.size === 0) {
    const noData = document.createElement("bim-label");
    noData.textContent = "No systems found in model";
    container.appendChild(noData);
    return;
  }

  for (const [systemName, groupData] of systemsClassification) {
    const items = await groupData.get();
    const count = Object.values(items).reduce((sum, ids) => sum + ids.size, 0);

    const button = document.createElement("bim-button") as BUI.Button;
    button.label = `${systemName} (${count})`;
    button.icon = "mdi:pipe";
    button.onclick = async () => {
      // Highlight all elements in this system
      await highlighter.highlightByID("select", items, true, true);
    };

    container.appendChild(button);
  }
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
      padding: 24px 16px;
      text-align: center;
      color: var(--text-muted, rgba(255, 255, 255, 0.32));
    ">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4; margin-bottom: 10px;">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      <span style="font-size: 11px;">Select an element to view sensor data</span>
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
      padding: 24px 16px;
      text-align: center;
      color: var(--text-muted, rgba(255, 255, 255, 0.32));
    ">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4; margin-bottom: 10px;">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4M12 16h.01"/>
      </svg>
      <span style="font-size: 11px;">No sensors linked to this element</span>
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
    `;

    // Element header (clickable to highlight object)
    const header = document.createElement("div");
    header.style.cssText = `
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary, rgba(255, 255, 255, 0.72));
      padding-bottom: 4px;
      border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: color 0.15s ease;
    `;
    header.innerHTML = `
      <span>${data.elementName}</span>
      <span style="font-size: 9px; opacity: 0.6;">GUID: ${guid.substring(0, 8)}...</span>
    `;
    header.title = "Click to highlight this element in the 3D view";
    header.onmouseenter = () => {
      header.style.color = "var(--bim-ui--color-accent, #3b82f6)";
    };
    header.onmouseleave = () => {
      header.style.color = "var(--text-secondary, rgba(255, 255, 255, 0.72))";
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
      const statusBgColor = getStatusBgColor(reading.status);

      const sensorDiv = document.createElement("div");
      sensorDiv.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 10px;
        background: var(--surface-base, #161922);
        border-radius: 6px;
        border-left: 3px solid ${statusColor};
        cursor: pointer;
        transition: background 0.15s ease, transform 0.1s ease;
      `;

      const sensorIcon = getSensorIcon(sensorType);
      const sensorLabel = sensorType.charAt(0).toUpperCase() + sensorType.slice(1);

      sensorDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="opacity: 0.7;">${sensorIcon}</span>
          <span style="font-size: 11px; color: var(--text-secondary, rgba(255, 255, 255, 0.72));">${sensorLabel}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 13px; font-weight: 600; color: var(--text-primary, rgba(255, 255, 255, 0.95));">${reading.value}</span>
          <span style="font-size: 10px; color: var(--text-tertiary, rgba(255, 255, 255, 0.50));">${reading.unit}</span>
          ${reading.status !== "normal" ? `<span style="font-size: 9px; padding: 2px 6px; border-radius: 3px; background: ${statusBgColor}; color: ${statusColor};">${reading.status.toUpperCase()}</span>` : ""}
          <span style="font-size: 10px; opacity: 0.4; margin-left: 4px;">📈</span>
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

      sensorDiv.title = "Click to view historical trend";

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
    lastUpdated.textContent = `Updated: ${data.lastUpdated.toLocaleTimeString()}`;
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
  const sensorLabel = sensorType.charAt(0).toUpperCase() + sensorType.slice(1);
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
          ${sensorLabel} Trend
        </div>
        <div style="font-size: 11px; color: var(--text-tertiary, rgba(255, 255, 255, 0.50));">
          ${elementName}
        </div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <div id="time-range-selector" style="display: flex; gap: 4px;">
        <button data-hours="24" class="time-btn active" style="padding: 6px 12px; border-radius: 4px; border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10)); background: var(--accent, #3b82f6); color: white; font-size: 11px; cursor: pointer;">24h</button>
        <button data-hours="168" class="time-btn" style="padding: 6px 12px; border-radius: 4px; border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10)); background: transparent; color: var(--text-secondary, rgba(255, 255, 255, 0.72)); font-size: 11px; cursor: pointer;">7d</button>
        <button data-hours="720" class="time-btn" style="padding: 6px 12px; border-radius: 4px; border: 1px solid var(--border-default, rgba(255, 255, 255, 0.10)); background: transparent; color: var(--text-secondary, rgba(255, 255, 255, 0.72)); font-size: 11px; cursor: pointer;">30d</button>
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
      <div style="font-size: 10px; color: var(--text-tertiary, rgba(255, 255, 255, 0.50)); text-transform: uppercase; margin-bottom: 4px;">Current</div>
      <div style="font-size: 16px; font-weight: 600; color: var(--text-primary, rgba(255, 255, 255, 0.95));">${currentValue} ${unit}</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 10px; color: var(--text-tertiary, rgba(255, 255, 255, 0.50)); text-transform: uppercase; margin-bottom: 4px;">Min</div>
      <div id="stat-min" style="font-size: 16px; font-weight: 600; color: var(--text-primary, rgba(255, 255, 255, 0.95));">--</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 10px; color: var(--text-tertiary, rgba(255, 255, 255, 0.50)); text-transform: uppercase; margin-bottom: 4px;">Max</div>
      <div id="stat-max" style="font-size: 16px; font-weight: 600; color: var(--text-primary, rgba(255, 255, 255, 0.95));">--</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 10px; color: var(--text-tertiary, rgba(255, 255, 255, 0.50)); text-transform: uppercase; margin-bottom: 4px;">Average</div>
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
      <span style="font-size: 13px; line-height: 1.4;">Select an element to view<br/>linked documents</span>
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
      <span style="font-size: 13px; line-height: 1.4;">No documents linked<br/>to this element</span>
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
          Upload Document
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
        Add Document
        <input type="file" id="document-upload-input" style="display: none;" multiple />
      </label>
    `;
    container.appendChild(uploadSection);

    const uploadInput = uploadSection.querySelector("#document-upload-input") as HTMLInputElement;
    if (uploadInput) {
      uploadInput.addEventListener("change", handleDocumentUpload);
    }
  }

  // List documents by GUID
  for (const [guid, documents] of documentsMap) {
    const guidSection = document.createElement("div");
    guidSection.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    `;

    // GUID header (abbreviated)
    const guidHeader = document.createElement("div");
    guidHeader.style.cssText = `
      font-size: 10px;
      font-weight: 600;
      color: var(--text-tertiary, rgba(255, 255, 255, 0.40));
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
    `;
    guidHeader.textContent = `GUID: ${guid.substring(0, 12)}...`;
    guidSection.appendChild(guidHeader);

    // Document items
    for (const doc of documents) {
      const docItem = createDocumentItem(doc);
      guidSection.appendChild(docItem);
    }

    container.appendChild(guidSection);
  }
};

const createDocumentItem = (doc: StoredDocument): HTMLElement => {
  const item = document.createElement("div");
  item.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    background: var(--surface-base, #161922);
    border-radius: 8px;
    border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
    transition: all 150ms ease-out;
  `;
  item.onmouseover = () => {
    item.style.background = "var(--surface-raised, #1c1f2a)";
    item.style.borderColor = "rgba(255, 255, 255, 0.1)";
  };
  item.onmouseout = () => {
    item.style.background = "var(--surface-base, #161922)";
    item.style.borderColor = "rgba(255, 255, 255, 0.06)";
  };

  const icon = DocumentStore.getFileIcon(doc.fileType);
  const size = DocumentStore.formatFileSize(doc.fileSize);
  const typeLabel = DocumentStore.getDocumentTypeLabel(doc.documentType);
  const createdDate = doc.createdDate.toLocaleDateString();

  item.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <span style="
        font-size: 28px;
        line-height: 1;
        flex-shrink: 0;
      ">${icon}</span>
      <div style="flex: 1; min-width: 0;">
        <div style="
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, rgba(255, 255, 255, 0.95));
          line-height: 1.3;
          word-break: break-word;
        " title="${doc.displayName} (${doc.fileName})">${doc.displayName}</div>
        <div style="
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 11px;
          color: var(--text-tertiary, rgba(255, 255, 255, 0.50));
          margin-top: 6px;
        ">
          <span style="
            padding: 3px 8px;
            background: var(--surface-overlay, #232733);
            border-radius: 4px;
            font-weight: 500;
            font-size: 10px;
          ">${typeLabel}</span>
          <span>${size}</span>
          <span style="opacity: 0.5;">•</span>
          <span>${createdDate}</span>
        </div>
      </div>
    </div>
    ${doc.description ? `
      <div style="
        font-size: 12px;
        color: var(--text-secondary, rgba(255, 255, 255, 0.65));
        line-height: 1.4;
        padding-left: 40px;
      " title="${doc.description}">${doc.description}</div>
    ` : ""}
    <div style="
      display: flex;
      gap: 8px;
      padding-top: 4px;
      border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
    ">
      <button class="doc-view-btn" data-doc-id="${doc.id}" style="
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        flex: 1;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: var(--accent-muted, rgba(59, 130, 246, 0.15));
        color: var(--accent, #3b82f6);
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: background 150ms ease-out;
      " title="View">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        View
      </button>
      <button class="doc-edit-btn" data-doc-id="${doc.id}" style="
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        flex: 1;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: var(--surface-raised, #1c1f2a);
        color: var(--text-secondary, rgba(255, 255, 255, 0.72));
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: background 150ms ease-out;
      " title="Edit">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Edit
      </button>
      <button class="doc-download-btn" data-doc-id="${doc.id}" style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: var(--surface-raised, #1c1f2a);
        color: var(--text-secondary, rgba(255, 255, 255, 0.72));
        cursor: pointer;
        flex-shrink: 0;
        transition: background 150ms ease-out;
      " title="Download">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
      <button class="doc-delete-btn" data-doc-id="${doc.id}" style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: rgba(255, 68, 68, 0.1);
        color: #ff6666;
        cursor: pointer;
        flex-shrink: 0;
        transition: background 150ms ease-out;
      " title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3,6 5,6 21,6"/>
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      </button>
    </div>
  `;

  // Add event listeners
  const viewBtn = item.querySelector(".doc-view-btn") as HTMLButtonElement;
  const editBtn = item.querySelector(".doc-edit-btn") as HTMLButtonElement;
  const downloadBtn = item.querySelector(".doc-download-btn") as HTMLButtonElement;
  const deleteBtn = item.querySelector(".doc-delete-btn") as HTMLButtonElement;

  viewBtn.onmouseover = () => viewBtn.style.background = "rgba(59, 130, 246, 0.25)";
  viewBtn.onmouseout = () => viewBtn.style.background = "rgba(59, 130, 246, 0.15)";
  viewBtn.onclick = () => showDocumentViewer(doc);

  editBtn.onmouseover = () => editBtn.style.background = "var(--surface-overlay, #232733)";
  editBtn.onmouseout = () => editBtn.style.background = "var(--surface-raised, #1c1f2a)";
  editBtn.onclick = () => handleEditDocument(doc);

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

  const title = options.mode === "create" ? "Upload Document" : "Edit Document";
  const saveLabel = options.mode === "create" ? "Upload" : "Save";

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
          Document Name *
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
        " placeholder="Enter document name" />
      </div>

      <!-- Document Type -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 11px; font-weight: 500; color: var(--text-secondary, rgba(255, 255, 255, 0.72));">
          Document Type
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
          ${DOCUMENT_TYPES.map(t => `
            <option value="${t.value}" ${t.value === options.initialData.documentType ? "selected" : ""}>
              ${t.label}
            </option>
          `).join("")}
        </select>
      </div>

      <!-- Created Date -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 11px; font-weight: 500; color: var(--text-secondary, rgba(255, 255, 255, 0.72));">
          Document Date
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
          Description (optional)
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
        " placeholder="Add a description...">${options.initialData.description || ""}</textarea>
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
      ">Cancel</button>
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
      alert("Please enter a document name.");
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
    alert("Could not load document for viewing.");
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
    Download
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
const leftPanel = BUI.Component.create(() => {
  return BUI.html`
   <bim-panel label="Properties" style="display: flex; flex-direction: column; height: 100%;">
    <bim-panel-section label="Element Properties" icon="mdi:information-outline">
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
          <span style="font-size: 12px; font-weight: 500;">No element selected</span>
          <span style="font-size: 11px; margin-top: 4px; opacity: 0.7;">Click on a model element to view its properties</span>
        </div>
        ${propertiesTable}
      </div>
    </bim-panel-section>
    <bim-panel-section label="BMS Sensors" icon="mdi:gauge">
      <div id="bms-sensor-container" style="min-height: 80px;"></div>
    </bim-panel-section>
    <bim-panel-section label="Documents" icon="mdi:file-document-multiple">
      <div id="documents-container" style="min-height: 80px;"></div>
    </bim-panel-section>
    <div style="
      padding: 20px 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
      margin-top: auto;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.15), transparent);
    ">
      <img src="/src/mi_maris_doo_logo.jpg" alt="MI Maris Logo" style="
        height: 64px;
        width: auto;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      " />
    </div>
   </bim-panel>
  `;
});

// Right panel - Trees (swapped from left)
const rightPanel = BUI.Component.create(() => {
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
   <bim-panel label="Model">
    <bim-panel-section label="Spatial Tree">
      <bim-text-input @input=${onSearch} placeholder="Search..." debounce="200"></bim-text-input>
      ${spatialTree}
    </bim-panel-section>
    <bim-panel-section label="Property Filter" icon="mdi:filter">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <!-- Add filter buttons -->
        <div style="display: flex; gap: 4px;">
          <bim-button @click=${onAddCategoryFilter} label="+ Category" style="flex: 1;"></bim-button>
          <bim-button @click=${onAddAttributeFilter} label="+ Attribute" style="flex: 1;"></bim-button>
        </div>

        <!-- Aggregation toggle -->
        <bim-checkbox @change=${onAggregationChange} label="Match ALL conditions (AND)" style="font-size: 11px;"></bim-checkbox>

        <!-- Filter conditions container -->
        <div id="filter-conditions-container" style="max-height: 300px; overflow-y: auto;"></div>

        <!-- Result count -->
        <div id="filter-result-count" style="
          font-size: 11px;
          color: var(--text-secondary, rgba(255, 255, 255, 0.72));
          text-align: center;
          padding: 4px;
        "></div>

        <!-- Action buttons -->
        <div style="display: flex; gap: 4px;">
          <bim-button @click=${onApplyFilter} label="Apply" icon="mdi:check" style="flex: 1;"></bim-button>
          <bim-button @click=${onClearFilters} label="Clear" icon="mdi:close" style="flex: 1;"></bim-button>
        </div>

        <!-- Visibility actions for filtered results -->
        <div style="display: flex; gap: 4px; border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06)); padding-top: 8px; margin-top: 4px;">
          <bim-button @click=${onIsolateFiltered} label="Isolate" icon="mdi:eye-outline" tooltip="Show only filtered elements" style="flex: 1;"></bim-button>
          <bim-button @click=${onHideFiltered} label="Hide" icon="mdi:eye-off-outline" tooltip="Hide filtered elements" style="flex: 1;"></bim-button>
        </div>
      </div>
    </bim-panel-section>
    <bim-panel-section label="Systems" icon="mdi:pipe">
      <div id="systems-tree-container" style="display: flex; flex-direction: column; gap: 4px;"></div>
    </bim-panel-section>
   </bim-panel>
  `;
});

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
        right: calc(20rem + 12px);
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
        right: 12px;
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
        <button class="toolbar-btn active" id="nav-orbit" data-tooltip="Orbit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/></svg>
        </button>
        <button class="toolbar-btn" id="nav-firstperson" data-tooltip="First Person">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 14a3 3 0 100-5 3 3 0 000 5z"/><path d="M3 12s4-7 9-7 9 7 9 7-4 7-9 7-9-7-9-7z"/></svg>
        </button>
        <button class="toolbar-btn" id="nav-plan" data-tooltip="Plan View">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 9h16M9 20V9"/></svg>
        </button>
      </div>
      <span class="toolbar-section-label">Navigate</span>
    </div>

    <div class="toolbar-divider"></div>

    <!-- Measurement section -->
    <div class="toolbar-section">
      <div class="toolbar-group">
        <button class="toolbar-btn" id="measure-length" data-tooltip="Length">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 19L19 5"/><path d="M5 19l2-4M5 19l-2 2M19 5l-2 4M19 5l2-2"/></svg>
        </button>
        <button class="toolbar-btn" id="measure-area" data-tooltip="Area">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16"/><path d="M4 4l16 16"/></svg>
        </button>
        <button class="toolbar-btn" id="measure-clear" data-tooltip="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/></svg>
        </button>
      </div>
      <span class="toolbar-section-label">Measure</span>
    </div>

    <div class="toolbar-divider"></div>

    <!-- Section planes section -->
    <div class="toolbar-section">
      <div class="toolbar-group">
        <button class="toolbar-btn" id="clip-toggle" data-tooltip="Section">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/></svg>
        </button>
        <button class="toolbar-btn active" id="clip-visibility" data-tooltip="Show Planes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="toolbar-btn" id="clip-clear" data-tooltip="Delete All">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/></svg>
        </button>
      </div>
      <span class="toolbar-section-label">Section</span>
    </div>

    <div class="toolbar-divider"></div>

    <!-- Visibility section -->
    <div class="toolbar-section">
      <div class="toolbar-group">
        <button class="toolbar-btn" id="visibility-ghost" data-tooltip="Ghost">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" opacity="0.5"/><circle cx="9" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/><path d="M8 16s1.5 2 4 2 4-2 4-2"/></svg>
        </button>
        <button class="toolbar-btn" id="visibility-isolate" data-tooltip="Isolate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 5v2M12 17v2M5 12h2M17 12h2"/></svg>
        </button>
        <button class="toolbar-btn" id="visibility-hide" data-tooltip="Hide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        </button>
        <button class="toolbar-btn" id="visibility-show" data-tooltip="Show All">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
      <span class="toolbar-section-label">Visibility</span>
    </div>

  `;

  document.body.appendChild(toolbar);

  // Create vertical Views toolbar (top right)
  const viewsToolbar = document.createElement("div");
  viewsToolbar.id = "views-toolbar";
  viewsToolbar.innerHTML = `
    <div class="toolbar-section">
      <div class="toolbar-group">
        <button class="toolbar-btn" id="views-floors" data-tooltip="Floor Plans">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18"/></svg>
        </button>
        <button class="toolbar-btn" id="views-elevations" data-tooltip="Elevations">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-5h6v5"/></svg>
        </button>
        <button class="toolbar-btn" id="views-exit" data-tooltip="Exit 2D">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </button>
        <button class="toolbar-btn" id="btn-views-list" data-tooltip="Saved Views" style="position: relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          <div class="toolbar-dropdown" id="dropdown-views">
            <div id="view-buttons-container" style="display: flex; flex-direction: column; gap: 3px;"></div>
          </div>
        </button>
      </div>
      <span class="toolbar-section-label">Views</span>
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
      / 20rem 1fr 20rem
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
      left: 20rem;
      border-left: none;
      border-radius: 0 6px 6px 0;
    }

    .sidebar-toggle.left.collapsed {
      left: 0;
    }

    .sidebar-toggle.right {
      right: 20rem;
      border-right: none;
      border-radius: 6px 0 0 6px;
    }

    .sidebar-toggle.right.collapsed {
      right: 0;
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

// Update grid layout based on collapsed state
const updateGridLayout = () => {
  if (isResizing) return;
  isResizing = true;
  blockViewportResize = true;

  const leftWidth = modelPanelCollapsed ? "0" : "20rem";
  const rightWidth = propertiesPanelCollapsed ? "0" : "20rem";

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

// Initialize sidebar toggles
createSidebarToggles();

// Initialize containers after layout is set
setTimeout(() => {
  viewButtonsContainer = document.getElementById("view-buttons-container");
  systemsTreeContainer = document.getElementById("systems-tree-container");

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