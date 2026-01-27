# Claude Prompt: Rebuild IFC Viewer Digital Twin

Copy this entire file as context when starting a new Claude session for the rebuild.

---

## Your Task

You are rebuilding an IFC Viewer digital twin application from scratch. The current implementation works but has a monolithic architecture that's unmaintainable. Your job is to rebuild it with proper patterns while preserving all functionality.

## Important Files to Read First

Before writing any code, read these files in order:

1. `REBUILD_GUIDELINES.md` - Complete architectural guidelines and implementation plan
2. `CODE_PATTERNS.md` - Code snippets to preserve from the current implementation
3. `src/main.ts` - Current monolithic implementation (reference only, don't copy structure)
4. `src/bms-mock.ts` - BMS service (can be migrated with minor refactoring)
5. `src/document-store.ts` - Document storage (can be migrated with minor refactoring)
6. `src/i18n.ts` - Internationalization (can be migrated with minor refactoring)

## Rules

1. **No file over 300 lines** - Split into modules if approaching this limit
2. **No global state** - Use the centralized store pattern
3. **No direct DOM manipulation in features** - Features emit events, UI subscribes
4. **Every service has an interface** - Allows swapping implementations
5. **Write tests for services** - At minimum, unit tests for BMS, documents, i18n
6. **Use TypeScript strict mode** - No `any` types except when interfacing with libraries
7. **Clean up subscriptions** - Every subscribe must have a corresponding unsubscribe

## Implementation Phases

Work through these phases in order. Each phase should be fully working before moving to the next.

### Phase 1: Project Setup & Core
```
□ Initialize Vite + TypeScript project
□ Install dependencies (@thatopen/*, chart.js)
□ Create core/state/store.ts - state management
□ Create core/events/event-bus.ts - event system
□ Create core/config/ - externalized configuration
□ Verify: Store can hold state and notify subscribers
```

### Phase 2: Scene Foundation
```
□ Create scene/scene-manager.ts - Three.js world setup
□ Create scene/model-loader.ts - IFC/Fragment loading
□ Create scene/theme-handler.ts - light/dark backgrounds
□ Verify: Model loads and renders in browser
```

### Phase 3: Services Layer
```
□ Migrate services/bms/ - sensor data service
□ Migrate services/documents/ - IndexedDB storage
□ Migrate services/i18n/ - translations
□ Write unit tests for all three services
□ Verify: All tests pass
```

### Phase 4: Core Features
```
□ Create features/selection/ - highlighting, ghosting
□ Create features/filtering/ - property queries
□ Create features/visibility/ - hide, isolate, show all
□ Create features/navigation/ - camera modes
□ Verify: Can select elements, filter, toggle visibility
```

### Phase 5: Advanced Features
```
□ Create features/measurement/ - length, area tools
□ Create features/sectioning/ - clipping planes
□ Verify: Can measure distances and create sections
```

### Phase 6: UI Layer
```
□ Create ui/layout/ - grid, panels, viewport
□ Create ui/toolbar/ - floating toolbar with all tools
□ Create ui/panels/model-panel/ - file loader, tree, filters
□ Create ui/panels/properties-panel/ - properties, sensors, documents
□ Verify: Full UI matches original functionality
```

### Phase 7: Integration
```
□ Wire everything in app.ts
□ Add error handling with user notifications
□ Performance optimization
□ Final testing of all features
```

## Feature Checklist

All these features must work in the rebuild:

### Model Management
- [ ] Load .frag files (fast path)
- [ ] Load .ifc files (fallback)
- [ ] Display spatial tree hierarchy
- [ ] Show loading progress

### Selection
- [ ] Click to select element
- [ ] Blue highlight on selected (#3b82f6)
- [ ] Ghosting effect (non-selected at 15% opacity)
- [ ] Selection updates properties panel
- [ ] Selection updates sensor display
- [ ] Selection updates document list

### Filtering
- [ ] Filter by IFC category (dropdown)
- [ ] Filter by attribute name
- [ ] Filter by attribute value
- [ ] Inclusive mode (OR)
- [ ] Exclusive mode (AND)
- [ ] Show result count
- [ ] Highlight filtered elements

### BMS Sensors
- [ ] Display sensor cards for selected elements
- [ ] Show real-time values (5-second updates)
- [ ] Status indicators (normal/warning/alarm)
- [ ] Historical data chart (Chart.js)
- [ ] All sensor types: temperature, humidity, CO2, occupancy, energy, lighting, airflow, pressure

### Documents
- [ ] List documents for selected elements
- [ ] Upload new documents
- [ ] Download documents
- [ ] Delete documents
- [ ] Document type categorization
- [ ] IndexedDB persistence

### Measurement
- [ ] Length measurement (2 points)
- [ ] Area measurement (polygon)
- [ ] Display measurements in 3D
- [ ] Clear measurements button

### Sectioning
- [ ] Create clipping plane (3 points)
- [ ] Toggle plane visibility
- [ ] Delete planes

### Navigation
- [ ] Orbit camera mode
- [ ] First-person camera mode
- [ ] Plan (top-down) mode
- [ ] Floor plan views
- [ ] Elevation views
- [ ] Exit 2D view button

### Visibility
- [ ] Ghost toggle
- [ ] Isolate selected
- [ ] Hide selected
- [ ] Show all

### UI/UX
- [ ] Three-panel layout (left, viewport, right)
- [ ] Floating toolbar
- [ ] Collapsible panel sections
- [ ] Light/dark theme toggle
- [ ] Theme persisted in localStorage
- [ ] Language toggle (EN/HR)
- [ ] Language persisted in localStorage
- [ ] All strings translated

## Key Dependencies

```json
{
  "@thatopen/components": "^3.2.7",
  "@thatopen/components-front": "^3.2.17",
  "@thatopen/fragments": "^3.2.13",
  "@thatopen/ui": "^3.2.4",
  "@thatopen/ui-obc": "^3.2.3",
  "three": "^0.182.0",
  "chart.js": "^4.4.1"
}
```

## Common Pitfalls to Avoid

1. **Don't copy the monolithic structure** - The current main.ts is 3,800 lines. Break it up.

2. **Don't forget subscription cleanup** - Memory leaks from BMS subscriptions and event listeners.

3. **Don't hardcode GUIDs** - Use the sensor database and document mappings from config.

4. **Don't skip the Fragment format** - Always try .frag before .ifc for performance.

5. **Don't put business logic in UI** - UI components should only render and emit events.

6. **Don't forget error handling** - Model loading can fail, IndexedDB can be unavailable.

7. **Don't ignore TypeScript errors** - Fix them, don't use `any` to silence them.

## Questions to Ask the User

If anything is unclear, ask before implementing:

- Should the rebuild support additional languages beyond EN/HR?
- Are there plans to connect to a real BMS API? (affects service interface design)
- Should the document store support cloud sync in the future?
- Are there specific accessibility requirements (WCAG level)?
- Should measurements persist across sessions?

## Start Here

Begin with Phase 1. Create the project structure and implement the core infrastructure. Show me your progress after each phase is complete.

```bash
# Suggested first commands
npm create vite@latest ifc-viewer-v2 -- --template vanilla-ts
cd ifc-viewer-v2
npm install @thatopen/components @thatopen/components-front @thatopen/fragments @thatopen/ui @thatopen/ui-obc three chart.js
npm install -D @types/three vitest
```

Good luck!
