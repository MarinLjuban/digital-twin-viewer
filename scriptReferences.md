# IFC-Viewer Script References

This document provides a quick reference for all scripts in the ifc-viewer project, including their namespaces, descriptions, and file locations. It also includes comprehensive documentation of the @thatopen packages for implementing new functionality.

---

## Table of Contents

1. [Scripts](#scripts)
2. [Assets](#assets)
3. [Configuration Files](#configuration-files)
4. [Package Reference](#package-reference)
   - [OBC - @thatopen/components](#obc---thatopencomponents)
   - [OBCF - @thatopen/components-front](#obcf---thatopencomponents-front)
   - [BUI - @thatopen/ui](#bui---thatopenui)
   - [BUIC - @thatopen/ui-obc](#buic---thatopenui-obc)
   - [FRAGS - @thatopen/fragments](#frags---thatopenfragments)
5. [Quick Navigation](#quick-navigation)

---

## Scripts

### main.ts

| Property | Value |
|----------|-------|
| **Name** | main.ts |
| **Namespace/Modules** | `THREE`, `OBC`, `OBCF`, `BUI`, `BUIC`, `FRAGS` |
| **Description** | Main application entry point. Implements a complete BIM viewer with 3D viewport setup, IFC model loading, element highlighting/selection with ghosting effects, MEP systems classification, measurement tools (length, area, volume), clipping planes/sectioning, visibility controls, 2D floor plan and elevation generation, multiple camera modes (orbit, first-person, plan), and a floating toolbar UI. |
| **File Location** | `C:\Users\marin\git\github\engine_components\ifc-viewer\src\main.ts` |

### bms-mock.ts

| Property | Value |
|----------|-------|
| **Name** | bms-mock.ts |
| **Namespace/Modules** | `BMSApi` (exported namespace object) |
| **Description** | Mock Building Management System (BMS) API for digital twin integration. Simulates sensor data coupled to IFC elements via GlobalId (GUID). Supports multiple sensor types (temperature, humidity, occupancy, CO2, energy, lighting, airflow, pressure) with real-time simulation, historical data generation, subscription-based updates, and alert monitoring. |
| **File Location** | `C:\Users\marin\git\github\engine_components\ifc-viewer\src\bms-mock.ts` |

#### Exported Types

| Type | Description |
|------|-------------|
| `SensorType` | Union type: "temperature" \| "humidity" \| "occupancy" \| "co2" \| "energy" \| "lighting" \| "airflow" \| "pressure" |
| `SensorReading` | Interface with value, unit, timestamp, and status ("normal" \| "warning" \| "alarm") |
| `SensorConfig` | Sensor configuration with id, type, name, min/max values, unit, and thresholds |
| `BMSDataPoint` | BMS data linked to IFC element: ifcGuid, elementName, sensors Map, lastUpdated |
| `HistoricalReading` | Historical data point with timestamp and value |

#### BMSApi Functions

| Function | Description |
|----------|-------------|
| `initialize()` | Initialize the mock BMS database and start simulation |
| `addElement(ifcGuid, elementName, sensorTypes)` | Dynamically register an IFC element with sensors |
| `registerElement(ifcGuid, elementName, sensorTypes)` | Register an element (internal) |
| `hasData(ifcGuid)` | Check if element has BMS data |
| `getData(ifcGuid)` | Get current sensor data for an element (async) |
| `getMultipleData(ifcGuids)` | Get sensor data for multiple elements (async) |
| `getHistoricalData(ifcGuid, sensorType, hours)` | Get historical readings (async) |
| `getRegisteredGuids()` | Get all registered IFC GUIDs |
| `getAllMonitoredElements()` | Get all elements with sensor data |
| `getAlertsElements()` | Get elements with warnings or alarms |
| `subscribe(ifcGuid, callback)` | Subscribe to real-time updates (returns unsubscribe function) |
| `startSimulation(intervalMs)` | Start real-time sensor simulation |
| `stopSimulation()` | Stop real-time simulation |
| `getSensorConfig(type)` | Get configuration for a sensor type |
| `formatSensorValue(reading)` | Format sensor value with unit |
| `getStatusColor(status)` | Get hex color for status visualization |

---

## Assets

### mi_maris_doo_logo.jpg

| Property | Value |
|----------|-------|
| **Name** | mi_maris_doo_logo.jpg |
| **Type** | Image (JPEG) |
| **Description** | Company logo image asset. |
| **File Location** | `C:\Users\marin\git\github\engine_components\ifc-viewer\src\mi_maris_doo_logo.jpg` |

---

## Configuration Files

### package.json

| Property | Value |
|----------|-------|
| **Name** | package.json |
| **Namespace/Modules** | N/A |
| **Description** | NPM package configuration. Defines project dependencies (@thatopen/components, @thatopen/components-front, @thatopen/ui, @thatopen/ui-obc, @thatopen/fragments, three ^0.182.0) and dev dependencies (@types/three ^0.182.0, typescript ^5.9.3, vite ^6.4.1). |
| **File Location** | `C:\Users\marin\git\github\engine_components\ifc-viewer\package.json` |

### tsconfig.json

| Property | Value |
|----------|-------|
| **Name** | tsconfig.json |
| **Namespace/Modules** | N/A |
| **Description** | TypeScript compiler configuration. Targets ES2020 with ESNext modules, strict mode enabled, bundler module resolution. |
| **File Location** | `C:\Users\marin\git\github\engine_components\ifc-viewer\tsconfig.json` |

### index.html

| Property | Value |
|----------|-------|
| **Name** | index.html |
| **Namespace/Modules** | N/A |
| **Description** | HTML entry point for the application. Contains dark theme CSS variables, Google Fonts imports (Inter, JetBrains Mono), BUI component styling overrides, and the main script module reference. |
| **File Location** | `C:\Users\marin\git\github\engine_components\ifc-viewer\index.html` |

---

## Package Reference

### OBC - @thatopen/components

| Property | Value |
|----------|-------|
| **Version** | 3.2.7 |
| **Import** | `import * as OBC from '@thatopen/components'` |
| **Description** | Core BIM components library providing the foundation for 3D world management, cameras, renderers, IFC loading, and component architecture. |
| **File Location** | `C:\Users\marin\git\github\engine_components\ifc-viewer\node_modules\@thatopen\components\dist\index.d.ts` |

#### Core Classes

| Class | Description |
|-------|-------------|
| `Components` | Main component manager/container - the central hub for all OBC functionality |
| `SimpleWorld<T, U, S>` | 3D world container managing scene, camera, and renderer |
| `Worlds` | Manager for multiple world instances |
| `SimpleScene` | Basic Three.js scene implementation |
| `ShadowedScene` | Scene with shadow support |
| `SimpleCamera` | Basic camera implementation |
| `OrthoPerspectiveCamera` | Perspective/orthographic switchable camera |
| `SimpleRenderer` | Basic WebGL renderer |
| `SimpleGrid` | Grid visualization helper |
| `Grids` | Grid visualization component manager |

#### IFC & Fragments

| Class | Description |
|-------|-------------|
| `IfcLoader` | IFC file loader - converts IFC to fragments |
| `IfcFragmentSettings` | IFC import configuration settings |
| `FragmentsManager` | 3D model/fragment management |
| `Disposer` | Resource disposal management |

#### Navigation & Camera

| Class | Description |
|-------|-------------|
| `OrbitMode` | Orbit camera navigation (rotate around model) |
| `FirstPersonMode` | First-person camera navigation (WASD movement) |
| `PlanMode` | Plan view navigation (top-down 2D) |
| `ProjectionManager` | Camera projection management |

#### Selection & Visibility

| Class | Description |
|-------|-------------|
| `Raycasters` | Raycasting for object picking |
| `SimpleRaycaster` | Basic raycaster implementation |
| `Hider` | Object visibility management |
| `Classifier` | Object classification by properties |
| `BoundingBoxer` | Bounding box calculations |

#### Clipping & Sectioning

| Class | Description |
|-------|-------------|
| `Clipper` | Clipping plane management |
| `SimplePlane` | Plane helper geometry |

#### Views & Viewpoints

| Class | Description |
|-------|-------------|
| `Views` | Views manager |
| `View` | Camera/view definition |
| `Viewpoints` | Viewpoints manager |
| `Viewpoint` | Viewpoint with camera & visibility info |

#### BCF (BIM Collaboration Format)

| Class | Description |
|-------|-------------|
| `BCFTopics` | BCF topics/issues management |
| `Topic` | Single BCF topic/issue |
| `BCFTopicsConfigManager` | BCF configuration manager |

#### IDS (Information Delivery Specification)

| Class | Description |
|-------|-------------|
| `IDSSpecifications` | IDS specifications manager |
| `IDSSpecification` | Single IDS specification |
| `IDSEntity` | IDS entity facet |
| `IDSAttribute` | IDS attribute facet |
| `IDSClassification` | IDS classification facet |
| `IDSMaterial` | IDS material facet |
| `IDSProperty` | IDS property facet |
| `IDSPartOf` | IDS part-of relation facet |

#### Utilities

| Class | Description |
|-------|-------------|
| `MeasurementUtils` | Measurement calculation utilities |
| `VertexPicker` | Vertex selection tool |
| `Mouse` | Mouse interaction handler |
| `EventManager` | Event handling system |
| `AsyncEvent<T>` | Async event handler |
| `DataMap<K, V>` | Extended Map with utilities |
| `DataSet<T>` | Extended Set with utilities |
| `UUID` | UUID generation |
| `XML` | XML parsing/generation |
| `ItemsFinder` | Item search/query component |
| `FinderQuery` | Query building for item finder |

#### Key Interfaces

| Interface | Description |
|-----------|-------------|
| `World` | World interface definition |
| `NavigationMode` | Navigation mode interface |
| `Configurable<T, U>` | Configurable component interface |
| `Createable` | Component that can create objects |
| `Disposable` | Component that can be disposed |
| `Hideable` | Component that can be hidden |
| `Updateable` | Component that updates each frame |
| `Resizeable` | Component that can be resized |

#### Type Aliases

| Type | Description |
|------|-------------|
| `CameraProjection` | "Perspective" \| "Orthographic" |
| `NavModeID` | "Orbit" \| "FirstPerson" \| "Plan" |
| `IfcVersion` | "IFC2X3" \| "IFC4" \| "IFC4X3_ADD2" |
| `BCFVersion` | "2.1" \| "3" |
| `ModelIdMap` | Record<string, Set<number>> |

---

### OBCF - @thatopen/components-front

| Property | Value |
|----------|-------|
| **Version** | 3.2.17 |
| **Import** | `import * as OBCF from '@thatopen/components-front'` |
| **Description** | Frontend-specific BIM components for rendering, measurement, highlighting, and user interaction. |
| **File Location** | `C:\Users\marin\git\github\engine_components\ifc-viewer\node_modules\@thatopen\components-front\dist\index.d.ts` |

#### Highlighting & Selection

| Class | Description |
|-------|-------------|
| `Highlighter` | Object highlighting with configurable styles |
| `Hoverer` | Hover interaction highlighting |
| `Outliner` | Object outlining effect |

#### Measurement Tools

| Class | Description |
|-------|-------------|
| `LengthMeasurement` | Length/distance measurement tool |
| `AreaMeasurement` | Area measurement tool |
| `VolumeMeasurement` | Volume measurement tool |
| `DimensionLine` | Dimension display line |
| `MeasureMark` | Measurement label/mark |
| `MeasureFill` | Measurement area fill visualization |

#### Geometry Classes

| Class | Description |
|-------|-------------|
| `Line` | Line geometry (extends THREE.Line3) |
| `Area` | Area geometry and calculations |
| `Volume` | Volume geometry |
| `Mark` | Mark/annotation point |
| `Marker` | Marker/point visualization |

#### Clipping & Sectioning

| Class | Description |
|-------|-------------|
| `ClipEdges` | Clipping edge rendering |
| `ClipStyler` | Clipping plane styling |

#### Rendering

| Class | Description |
|-------|-------------|
| `PostproductionRenderer` | Post-processing renderer with effects |
| `RendererWith2D` | 2D renderer extension |
| `GlossPass` | Gloss rendering pass |

#### Civil Engineering

| Class | Description |
|-------|-------------|
| `CivilNavigators` | Civil navigation tools |
| `CivilCrossSectionNavigator` | Cross-section visualization |
| `CivilRaycaster` | Civil-specific raycasting |
| `CivilUtils` | Civil engineering utilities |

#### Utilities

| Class | Description |
|-------|-------------|
| `GraphicVertexPicker` | Vertex selection with graphics |
| `Mesher` | Mesh generation/processing |
| `PlatformComponents` | Platform-specific components |

#### Enums

| Enum | Values |
|------|--------|
| `CivilMarkerType` | SELECT, HOVER |
| `EdgeDetectionPassMode` | Edge detection modes |
| `PostproductionAspect` | Post-processing aspects |

---

### BUI - @thatopen/ui

| Property | Value |
|----------|-------|
| **Version** | 3.2.4 |
| **Import** | `import * as BUI from '@thatopen/ui'` |
| **Description** | UI component library built on LitElement for creating responsive web interfaces. |
| **File Location** | `C:\Users\marin\git\github\engine_components\ifc-viewer\node_modules\@thatopen\ui\dist\index.d.ts` |

#### Layout Components

| Component | Description |
|-----------|-------------|
| `Grid<L, E>` | Grid layout component with named areas |
| `Panel` | Panel container |
| `PanelSection` | Panel section divider |
| `Viewport` | 3D viewport container |

#### Toolbar Components

| Component | Description |
|-----------|-------------|
| `Toolbar` | Toolbar container |
| `ToolbarGroup` | Toolbar button group |
| `ToolbarSection` | Toolbar section divider |
| `Tooltip` | Tooltip overlay |

#### Input Components

| Component | Description |
|-----------|-------------|
| `Button` | Basic button |
| `Checkbox` | Checkbox input |
| `Input` | Text input field |
| `TextInput` | Text input (alias) |
| `NumberInput` | Number input field |
| `ColorInput` | Color picker input |
| `Dropdown` | Dropdown selector |
| `Selector` | Item selector |

#### Table Components

| Component | Description |
|-----------|-------------|
| `Table<T>` | Data table component |
| `TableRow<T>` | Table row |
| `TableCell<T>` | Table cell |
| `TableGroup<T>` | Table group |
| `TableChildren<T>` | Table children/expansion |

#### Tab Components

| Component | Description |
|-----------|-------------|
| `Tabs` | Tab container |
| `Tab` | Single tab |

#### Other Components

| Component | Description |
|-----------|-------------|
| `Label` | Text label |
| `Icon` | Icon display |
| `ContextMenu` | Context menu/popup |
| `Manager` | UI manager singleton |
| `Component` | Base UI component |

#### Key Interfaces

| Interface | Description |
|-----------|-------------|
| `ColumnData<T>` | Table column definition |
| `TableRowData<T>` | Table row data |
| `TableGroupData<T>` | Table group data |
| `GridLayoutsDefinition<L, E>` | Grid layout definition |
| `Query` | Query definition for filtering |
| `QueryCondition` | Query condition operator |

#### Type Aliases

| Type | Description |
|------|-------------|
| `TableCellValue` | string \| number \| boolean |
| `StatefullComponent<S>` | Component with state |
| `StatelessComponent` | Component without state |
| `TableLoadFunction<T>` | Async data loader function |

---

### BUIC - @thatopen/ui-obc

| Property | Value |
|----------|-------|
| **Version** | 3.2.3 |
| **Import** | `import * as BUIC from '@thatopen/ui-obc'` |
| **Description** | Pre-built UI components and state management specifically for OBC applications. Provides ready-to-use tables, trees, and forms. |
| **File Location** | `C:\Users\marin\git\github\engine_components\ifc-viewer\node_modules\@thatopen\ui-obc\dist\index.d.ts` |

#### Components

| Component | Description |
|-----------|-------------|
| `Manager` | UI-OBC manager |
| `ViewCube` | 3D view cube navigation widget |
| `World` | 3D world viewer component |
| `World2D` | 2D world viewer component |

#### Tables (via `tables` export)

| Table | Description |
|-------|-------------|
| `modelsList` | Models list table |
| `spatialTree` | Spatial structure tree |
| `itemsData` | Element properties table |
| `topicsList` | BCF topics list |
| `commentsList` | BCF comments list |
| `viewpointsList` | Viewpoints list |

#### Forms (via `forms` export)

| Form | Description |
|------|-------------|
| `topicForm` | BCF topic creation/edit form |

#### Sections (via `sections` export)

| Section | Description |
|---------|-------------|
| `topicInformation` | Topic information section |
| `topicComments` | Topic comments section |
| `topicRelations` | Topic relations section |
| `topicViewpoints` | Topic viewpoints section |

#### Buttons (via `buttons` export)

| Button | Description |
|--------|-------------|
| `loadIfc` | Load IFC file button |
| `loadFrag` | Load fragment file button |

#### State Interfaces

| Interface | Description |
|-----------|-------------|
| `ModelsListState` | Models list state |
| `SpatialTreeState` | Spatial tree state |
| `ItemsDataState` | Items data state |
| `TopicsListState` | Topics list state |
| `CommentsListState` | Comments list state |
| `ViewpointsListState` | Viewpoints list state |
| `LoadIfcState` | IFC loading state |
| `LoadFragState` | Fragment loading state |

#### Utility Functions

| Function | Description |
|----------|-------------|
| `createAuthorTag(email, styles)` | Create author tag element |
| `topicFormTemplate(state)` | Topic form template |

---

### FRAGS - @thatopen/fragments

| Property | Value |
|----------|-------|
| **Version** | 3.2.13 |
| **Import** | `import * as FRAGS from '@thatopen/fragments'` |
| **Description** | Fragment rendering and management system for efficient 3D geometry representation. |
| **File Location** | `C:\Users\marin\git\github\engine_components\ifc-viewer\node_modules\@thatopen\fragments\dist\index.d.ts` |

#### Core Classes

| Class | Description |
|-------|-------------|
| `FragmentsModel` | Single model representation |
| `FragmentsModels` | Multiple models manager |
| `IfcImporter` | IFC file importer to fragments |
| `GeometryEngine` | Geometry computation engine |
| `Editor` | Geometry/model editor |
| `EditUtils` | Edit operation utilities |

#### Geometry Classes

| Class | Description |
|-------|-------------|
| `Extrusion` | Extrusion geometry |
| `Revolve` | Revolution geometry |
| `Sweep` | Sweep geometry |
| `CircularSweep` | Circular sweep geometry |
| `CylindricalRevolve` | Cylindrical revolve |
| `CircleExtrusion` | Circle-based extrusion |
| `BooleanOperation` | Boolean geometry operations |

#### Curve Classes

| Class | Description |
|-------|-------------|
| `Arc` | Arc geometry curve |
| `Axis` | Axis geometry representation |
| `CircleCurve` | Circle curve |
| `Clothoid` | Clothoid curve (civil engineering) |
| `Parabola` | Parabola curve |
| `Wire` | Wire/curve geometry |
| `WireSet` | Wire collection |

#### Shell & Profile Classes

| Class | Description |
|-------|-------------|
| `Shell` | Shell/surface geometry |
| `ShellHole` | Shell hole definition |
| `ShellProfile` | Shell profile |
| `BigShellHole` | Large shell hole |
| `BigShellProfile` | Large shell profile |
| `Profile` | Geometric profile |
| `Wall` | Wall geometry |

#### Data Classes

| Class | Description |
|-------|-------------|
| `Material` | Material definition |
| `Meshes` | Mesh collection management |
| `Model` | Base model class |
| `Representation` | Geometric representation |
| `Sample` | Geometry sample/instance |
| `Transform` | Transformation matrix |
| `Relation` | Data relationship/reference |
| `SpatialStructure` | Spatial hierarchy structure |
| `BoundingBox` | Bounding box calculations |

#### Utility Classes

| Class | Description |
|-------|-------------|
| `AsyncEvent<T>` | Async event handler |
| `DataMap<K, V>` | Extended Map with utilities |
| `DataSet<T>` | Extended Set with utilities |
| `FragmentsIfcUtils` | IFC utilities for fragments |
| `GeomsFbUtils` | FlatBuffers geometry utilities |

#### Enums

| Enum | Description |
|------|-------------|
| `LodMode` | Level of detail modes |
| `ObjectClass` | Object classification |
| `ProfileType` | Profile type classifications |
| `RepresentationClass` | Representation types |
| `ShellType` | Shell type classifications |
| `SnappingClass` | Snapping behavior types |
| `Stroke` | Stroke styling |
| `EditRequestType` | Edit request types |
| `AlignmentCurveType` | Alignment curve types |

#### Key Interfaces

| Interface | Description |
|-----------|-------------|
| `ItemData` | Item information |
| `MaterialData` | Material information |
| `MeshData` | Mesh information |
| `RaycastResult` | Raycast hit result |
| `SpatialTreeItem` | Spatial tree node |
| `CreateItemRequest` | Item creation request |
| `UpdateItemRequest` | Item update request |
| `DeleteItemRequest` | Item deletion request |

#### Constants

| Constant | Description |
|----------|-------------|
| `ifcCategoryMap` | IFC category mapping |
| `ifcClasses` | IFC class definitions |
| `ifcGeometriesMap` | IFC geometry type mapping |
| `ifcRelationsMap` | IFC relations mapping |

---

## Quick Navigation

### Project Files
- **Main Application Logic**: [main.ts](C:\Users\marin\git\github\engine_components\ifc-viewer\src\main.ts)
- **BMS Mock API**: [bms-mock.ts](C:\Users\marin\git\github\engine_components\ifc-viewer\src\bms-mock.ts)
- **Project Configuration**: [package.json](C:\Users\marin\git\github\engine_components\ifc-viewer\package.json)
- **TypeScript Config**: [tsconfig.json](C:\Users\marin\git\github\engine_components\ifc-viewer\tsconfig.json)
- **HTML Entry Point**: [index.html](C:\Users\marin\git\github\engine_components\ifc-viewer\index.html)

### Package Type Definitions
- **OBC Types**: [index.d.ts](C:\Users\marin\git\github\engine_components\ifc-viewer\node_modules\@thatopen\components\dist\index.d.ts)
- **OBCF Types**: [index.d.ts](C:\Users\marin\git\github\engine_components\ifc-viewer\node_modules\@thatopen\components-front\dist\index.d.ts)
- **BUI Types**: [index.d.ts](C:\Users\marin\git\github\engine_components\ifc-viewer\node_modules\@thatopen\ui\dist\index.d.ts)
- **BUIC Types**: [index.d.ts](C:\Users\marin\git\github\engine_components\ifc-viewer\node_modules\@thatopen\ui-obc\dist\index.d.ts)
- **FRAGS Types**: [index.d.ts](C:\Users\marin\git\github\engine_components\ifc-viewer\node_modules\@thatopen\fragments\dist\index.d.ts)

---

## Namespace Summary

| Namespace | Package | Version | Primary Use |
|-----------|---------|---------|-------------|
| `THREE` | three | 0.182.0 | 3D rendering (Three.js) |
| `OBC` | @thatopen/components | 3.2.7 | Core BIM components |
| `OBCF` | @thatopen/components-front | 3.2.17 | Frontend tools (highlighting, measurements) |
| `BUI` | @thatopen/ui | 3.2.4 | UI components (buttons, tables, panels) |
| `BUIC` | @thatopen/ui-obc | 3.2.3 | Pre-built OBC UI (spatial tree, properties) |
| `FRAGS` | @thatopen/fragments | 3.2.13 | Fragment/geometry management |
| `BMSApi` | ./bms-mock | local | Mock BMS sensor data for digital twin |

---

## Architecture Overview

```
                    main.ts (Application Entry)
                           ↓ uses
    ┌──────────────────────┼──────────────────────┐
    ↓                      ↓                      ↓
BMSApi (BMS Mock)    BUIC (UI-OBC)           BUI (UI)
    ↓ coupled via         ↓ uses                  ↓ uses
    IFC GUIDs        OBCF (Components-Front)      │
                          ↓ uses                  │
                     OBC (Components) ←───────────┘
                          ↓ uses
                    FRAGS (Fragments)
                          ↓ uses
                    THREE.js + Web-IFC
```
