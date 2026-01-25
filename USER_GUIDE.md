# IFC-Viewer Digital Twin - User Guide

A comprehensive guide for using the Digital Twin IFC Viewer application.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Navigation Controls](#navigation-controls)
4. [Selecting Elements](#selecting-elements)
5. [Viewing Properties](#viewing-properties)
6. [BMS Sensor Data](#bms-sensor-data)
7. [Equipment Documents](#equipment-documents)
8. [Measurement Tools](#measurement-tools)
9. [Clipping & Sectioning](#clipping--sectioning)
10. [Visibility Controls](#visibility-controls)
11. [2D Views](#2d-views)
12. [Filtering Elements](#filtering-elements)
13. [Systems Tree](#systems-tree)
14. [Loading Your Own Models](#loading-your-own-models)
15. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Getting Started

When you open the application, the default model loads automatically. The app first tries to load a pre-converted **fragment file** (`.frag`) for faster startup. If not found, it falls back to loading the **IFC file** directly.

The sample model is a complete office building with MEP (Mechanical, Electrical, Plumbing) systems including:

- HVAC equipment (Fan Coil Units, VRF systems)
- Ventilation (Air terminals, Exhaust valves, Axial fans)
- Heating (Trench heating convectors)
- Plumbing (Roof drains)

Wait a few seconds for the model to fully load. You'll see the 3D building appear in the central viewport.

---

## Interface Overview

The interface has three main areas:

```
┌─────────────────┬──────────────────────┬─────────────────┐
│   LEFT PANEL    │    3D VIEWPORT       │   RIGHT PANEL   │
│                 │                      │                 │
│ • Load Model    │   [Building Model]   │ • Properties    │
│ • Spatial Tree  │                      │ • BMS Sensors   │
│ • Filters       │                      │ • Documents     │
│ • Systems       │                      │                 │
└─────────────────┴──────────────────────┴─────────────────┘
                           │
                  [Floating Toolbar]
```

- **Left Panel**: Model loading, spatial navigation, filters, MEP systems
- **3D Viewport**: Interactive 3D view of the building
- **Right Panel**: Properties, sensor data, and documents for selected elements
- **Floating Toolbar**: Navigation, measurement, clipping, and visibility tools

---

## Navigation Controls

### Mouse Controls

| Action | Control |
|--------|---------|
| **Rotate** | Left-click + drag |
| **Pan** | Right-click + drag (or Middle-click + drag) |
| **Zoom** | Scroll wheel |

### Camera Modes (Floating Toolbar → Navigation)

1. **Orbit Mode** (default)
   - Click the **Orbit** button
   - Rotate around the model freely
   - Best for general exploration

2. **First Person Mode**
   - Click the **First Person** button
   - Use WASD keys to move through the building
   - Mouse to look around
   - Great for interior walkthroughs

3. **Plan Mode**
   - Click the **Plan** button
   - Top-down orthographic view
   - Ideal for floor plan navigation

### Try It: Exploring the Building

1. Use the scroll wheel to **zoom out** and see the whole building
2. Hold **left-click and drag** to rotate and view from different angles
3. Click **First Person** in the toolbar, then use **W/A/S/D** to walk inside

---

## Selecting Elements

Click on any element in the 3D view to select it. Selected elements are highlighted in blue.

### Try It: Select Equipment

1. Zoom into the building's interior
2. Look for ceiling-mounted equipment (fan coil units appear as rectangular boxes)
3. **Click on a fan coil unit** to select it
4. Notice the highlight and the right panel updating

### Multi-Selection

- Elements in the same group can be selected together through the Systems tree

### Hover Preview

- Move your mouse over elements to see a **hover highlight** (semi-transparent blue glow)
- This helps identify elements before clicking

---

## Viewing Properties

When you select an element, the **Properties** panel (right side) displays:

- **Name**: Element name from the IFC file
- **GlobalId (GUID)**: Unique identifier
- **IFC Type**: Category (e.g., IFCUNITARYEQUIPMENT, IFCDUCTSEGMENT)
- **Custom Properties**: Manufacturer data, dimensions, etc.

### Try It: View Fan Coil Properties

1. Select a **ceiling fan coil unit** (rectangular equipment on the ceiling)
2. In the Properties panel, you'll see:
   - Name: "Kapmann_FanCoil_Ceiling: 1250x495_TopConnection (FCU-01)"
   - Type: IFCUNITARYEQUIPMENT
   - Various property sets with technical specifications

---

## BMS Sensor Data

The Building Management System (BMS) panel shows **real-time sensor data** for monitored equipment.

### Sensor Types Available

| Icon | Sensor Type | Unit |
|------|-------------|------|
| 🌡️ | Temperature | °C |
| 💧 | Humidity | % |
| 👥 | Occupancy | people |
| 🌬️ | CO2 | ppm |
| ⚡ | Energy | kWh |
| 💡 | Lighting | % |
| 🌀 | Airflow | m³/h |
| 📊 | Pressure | kPa |

### Status Indicators

- **Green** = Normal operation
- **Yellow/Orange** = Warning (approaching threshold)
- **Red** = Alarm (threshold exceeded)

### Try It: View Sensor Data for Equipment

**Example 1: Fan Coil Unit (FCU-01)**
1. Find and select a ceiling fan coil unit
2. The BMS panel shows:
   - Temperature sensor (current room/supply temp)
   - Airflow sensor (m³/h)
   - Energy consumption (kWh)
3. Watch values update every 5 seconds (simulated)

**Example 2: VRF Outdoor Unit**
1. Look for the large outdoor unit (usually on roof or exterior)
2. Select the **Clivet VRF** equipment
3. View sensors:
   - Temperature
   - Energy consumption
   - Pressure readings

**Example 3: Trench Heating**
1. Find the floor-level heating equipment
2. Select the **Kampmann HK320** trench heater
3. View temperature and energy data

### Viewing Historical Charts

1. Select monitored equipment
2. Click on a **sensor card** in the BMS panel
3. A chart appears showing the last 24 hours of readings
4. The chart shows time-based patterns (values vary throughout the day)

---

## Equipment Documents

Documents linked to IFC elements are displayed in the **Documents** panel.

### Document Types

- 📄 **Specifications** - Technical data sheets
- 📝 **Manuals** - Operation and installation guides
- 📊 **Reports** - Inspection and maintenance reports
- 🏆 **Certificates** - Compliance certificates
- 🔧 **Maintenance** - Service records

### Try It: View Equipment Specifications

**Example 1: Fan Coil Specification**
1. Select any **fan coil unit** (FCU-01 through FCU-06)
2. In the Documents panel, you'll see:
   - "Kampmann Fan Coil Specifikacija"
3. Click **View** to open the PDF in a modal
4. Click **Download** to save locally

**Example 2: VRF System Documentation**
1. Select the **Clivet VRF outdoor unit**
2. View the "Clivet MV6i-500 Specifikacija" document

**Example 3: Trench Heating**
1. Select the **Kampmann HK320** trench heater
2. View the "Kampmann HK320 Specifikacija" PDF

### Uploading New Documents

1. Select an element
2. In the Documents panel, click **Upload Document**
3. Fill in:
   - Display name
   - Document type (Manual, Specification, etc.)
   - Created date
   - Description (optional)
4. Choose a file (PDF, images, etc.)
5. Click **Upload**

---

## Measurement Tools

Access measurement tools from the **Floating Toolbar → Measurement** section.

### Length Measurement

1. Click the **Length** button (📏)
2. Click a **starting point** on the model
3. Click an **ending point**
4. The distance appears as a dimension line
5. Continue adding measurements as needed
6. Click **Clear** to remove all measurements

### Area Measurement

1. Click the **Area** button
2. Click points to define a polygon
3. The area is calculated and displayed
4. Click **Clear** to remove

### Try It: Measure a Room

1. Enable **Length** measurement
2. Click on one corner of a room
3. Click on the opposite corner
4. The distance is shown in meters
5. Use multiple measurements to get room dimensions

---

## Clipping & Sectioning

Create section cuts to see inside the building.

### Creating a Clipping Plane

1. Click **Create Plane** in the Clipping toolbar section
2. Click on a surface to place the clipping plane
3. The model is cut at that location
4. Drag the plane handle to adjust position

### Managing Clipping Planes

- **Toggle Visibility**: Click the eye icon to show/hide a plane
- **Delete Plane**: Click the delete button to remove a plane
- **Delete All**: Remove all clipping planes at once

### Try It: Section Through a Floor

1. Click **Create Plane**
2. Click on a floor slab
3. The building is sectioned horizontally
4. Drag the plane to move the section cut up/down
5. This reveals the MEP systems inside

---

## Visibility Controls

Control element visibility from the **Floating Toolbar → Visibility** section.

### Ghost Mode

1. Select elements you want to focus on
2. Click **Ghost** button
3. Non-selected elements become semi-transparent
4. Click again to disable ghosting

### Isolate

1. Select elements
2. Click **Isolate**
3. Only selected elements are visible
4. Everything else is hidden

### Hide

1. Select elements
2. Click **Hide**
3. Selected elements become invisible

### Show All

- Click **Show All** to restore visibility of all elements

### Try It: Isolate MEP Systems

1. Go to the **Systems** panel (left side)
2. Select all fan coil units from the tree
3. Click **Isolate**
4. Only the fan coils are visible
5. Click **Show All** to restore

---

## 2D Views

Generate floor plans and elevations from the model.

### Floor Plans

1. Click **Floor Plans** in the 2D Views toolbar section
2. Select a floor level from the dropdown
3. The view switches to a 2D plan view
4. Navigate as usual (pan, zoom)
5. Click **Exit 2D** to return to 3D

### Elevations

1. Click **Elevations**
2. Select a direction (North, South, East, West)
3. View the building elevation
4. Click **Exit 2D** to return

### Saved Views

1. Position the camera as desired
2. Click **Save View**
3. Access saved views from the dropdown
4. Click a saved view to restore that camera position

---

## Filtering Elements

Use the **Filter Panel** (left side) to find specific elements.

### Filter by Category

1. Open the Filter panel
2. Select a category filter (e.g., "IFCDUCTSEGMENT")
3. Click **Apply Filter**
4. Only matching elements are selected/highlighted

### Filter by Attribute

1. Choose "Attribute" filter type
2. Select an attribute (e.g., "Name")
3. Choose an operator:
   - **Contains**: Partial match
   - **Equals**: Exact match
   - **Regex**: Regular expression
4. Enter a value (e.g., "Kampmann")
5. Click **Apply**

### Filter Modes

- **Inclusive (OR)**: Any condition matches
- **Exclusive (AND)**: All conditions must match

### Try It: Find All Kampmann Equipment

1. Add an Attribute filter
2. Set: Name → Contains → "Kampmann"
3. Apply the filter
4. All Kampmann equipment is selected

---

## Systems Tree

The **Systems** panel (left side) shows MEP equipment grouped by system type.

### Navigating Systems

1. Expand the "Systems" tree
2. Equipment is grouped by type:
   - Fan Coil Units
   - Air Terminals
   - Exhaust Valves
   - VRF Equipment
   - Etc.
3. Click on items to select them in the 3D view

### Try It: Select All Fan Coils

1. Open the Systems tree
2. Find the "Fan Coil" group
3. Click on the group header to select all
4. All fan coil units highlight in the 3D view

---

## Loading Your Own Models

### Load IFC File

1. In the left panel, click **Load IFC**
2. Select an .ifc file from your computer
3. Wait for processing (may take time for large files)
4. The model appears in the viewport

### Load Fragment File

For faster loading of previously processed models:

1. Click **Load Fragment**
2. Select a .frag file
3. The model loads immediately

### Tips for Large Models

- **Fragment files load much faster than IFC** - convert your models for better performance
- Close other applications for better performance
- Use clipping planes to reduce visible geometry

### Converting IFC to Fragment (Recommended)

For faster loading, convert your IFC files to the optimized fragment format:

1. Open `convert-ifc-to-frag.html` in your browser (run `npm run dev` first)
2. Click **Load IFC Model** to parse the IFC file
3. Click **Export Fragment File** to download the `.frag` file
4. Move the `.frag` file to `public/models/`
5. The app will automatically use the faster fragment file on next load

**Benefits of Fragment files:**
- 5-10x faster loading times
- Pre-processed geometry (no WASM parsing needed)
- Smaller memory footprint during loading

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **W/A/S/D** | Move (First Person mode) |
| **Scroll** | Zoom in/out |
| **Escape** | Deselect / Exit current tool |

---

## Equipment Reference: Sample Model

The default **OfficeBuilding_complete_2024.ifc** includes these monitored elements:

### HVAC Equipment

| Element | GUID | Sensors | Documents |
|---------|------|---------|-----------|
| Kampmann HK320 Trench Heater | 2Z6LRLJyP8pPa$Guk37Xtu | Temperature, Energy | Specification PDF |
| Clivet VRF Outdoor Unit | 2Z6LRLJyP8pPa$Guk37Xt0 | Temperature, Energy, Pressure | Specification PDF |
| Fan Coil FCU-01 | 2Z6LRLJyP8pPa$Guk37Xt1 | Temperature, Airflow, Energy | Specification PDF |
| Fan Coil FCU-02 | 2Z6LRLJyP8pPa$Guk37Xt2 | Temperature, Airflow, Energy | Specification PDF |
| Fan Coil FCU-03 | 2Z6LRLJyP8pPa$Guk37Xt3 | Temperature, Airflow, Energy | Specification PDF |
| Fan Coil FCU-04 | 2Z6LRLJyP8pPa$Guk37XmN | Temperature, Airflow, Energy | Specification PDF |
| Fan Coil FCU-05 | 2Z6LRLJyP8pPa$Guk37XmO | Temperature, Airflow, Energy | Specification PDF |
| Fan Coil FCU-06 | 2Z6LRLJyP8pPa$Guk37Xpb | Temperature, Airflow, Energy | Specification PDF |

### Ventilation

| Element | GUID | Sensors | Documents |
|---------|------|---------|-----------|
| Exhaust Valve EXH-01 | 2Z6LRLJyP8pPa$Guk37Xp4 | Airflow | NW 100 Spec |
| Exhaust Valve EXH-02 | 2Z6LRLJyP8pPa$Guk37XCp | Airflow | NW 100 Spec |
| Exhaust Valve EXH-03 | 2Z6LRLJyP8pPa$Guk37XCC | Airflow | NW 100 Spec |
| Exhaust Valve EXH-04 | 2Z6LRLJyP8pPa$Guk37XCD | Airflow | NW 100 Spec |
| Supply Terminal SUP-01 | 2Z6LRLJyP8pPa$Guk37Xp5 | Airflow, Temperature | Klimaoprema OAH1 Spec |
| Supply Terminal SUP-02 | 2Z6LRLJyP8pPa$Guk37XDs | Airflow, Temperature | Klimaoprema OAH1 Spec |
| Axial Fan FAN-01 | 2Z6LRLJyP8pPa$Guk37Xp6 | Airflow, Energy | — |
| Axial Fan FAN-02 | 2Z6LRLJyP8pPa$Guk37XDv | Airflow, Energy | — |

### Plumbing

| Element | GUID | Sensors | Documents |
|---------|------|---------|-----------|
| Roof Drain RD-01 | 2Z6LRLJyP8pPa$Guk37XCX | Pressure | Geberit Pluvia 125 Spec |
| Roof Drain RD-02 | 2Z6LRLJyP8pPa$Guk37XCZ | Pressure | Geberit Pluvia 125 Spec |
| Roof Drain RD-03 | 2Z6LRLJyP8pPa$Guk37XCa | Pressure | Geberit Pluvia 125 Spec |

---

## Troubleshooting

### Model Not Loading

- Wait up to 30 seconds for large models
- Check browser console for errors (F12)
- Try refreshing the page

### Slow Performance

- Use clipping planes to reduce visible geometry
- Hide non-essential elements
- Close other browser tabs

### Sensors Not Showing

- Only pre-configured equipment has BMS data
- Check the Equipment Reference table above
- Custom-uploaded models won't have sensor data by default

### Documents Not Found

- Documents are stored in browser IndexedDB
- Clearing browser data removes uploaded documents
- Pre-configured documents load automatically on first use

---

## Tips & Best Practices

1. **Use Systems Tree** for quick access to MEP equipment
2. **Ghost Mode** helps focus on selected equipment while keeping context
3. **Create Clipping Planes** to see equipment inside walls/ceilings
4. **First Person Mode** is great for client presentations
5. **Save Views** for commonly accessed camera positions
6. **Check Sensor History** to understand equipment behavior over time

---

*This guide is for the IFC-Viewer Digital Twin Application v1.0.0*
