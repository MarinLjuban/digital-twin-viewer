/**
 * Document Storage API
 * Stores documents locally using IndexedDB, linked to IFC elements via GlobalId (GUID)
 *
 * Features:
 * - Store documents (PDF, images, etc.) as Blobs
 * - Link documents to IFC element GUIDs
 * - Retrieve documents by element GUID
 * - Delete documents
 * - List all documents for an element
 */

// Document types for categorization
export type DocumentType =
  | "manual"
  | "specification"
  | "drawing"
  | "report"
  | "warranty"
  | "certificate"
  | "maintenance"
  | "other";

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "specification", label: "Specification" },
  { value: "drawing", label: "Drawing" },
  { value: "report", label: "Report" },
  { value: "warranty", label: "Warranty" },
  { value: "certificate", label: "Certificate" },
  { value: "maintenance", label: "Maintenance Record" },
  { value: "other", label: "Other" },
];

// Document metadata
export interface StoredDocument {
  id: string;
  ifcGuid: string;
  fileName: string;        // Original file name
  displayName: string;     // User-editable display name
  documentType: DocumentType;
  fileType: string;        // MIME type
  fileSize: number;
  createdDate: Date;       // User-specified document creation date
  uploadedAt: Date;        // When it was uploaded to the system
  description?: string;
}

// Metadata for creating/updating documents
export interface DocumentMetadata {
  displayName: string;
  documentType: DocumentType;
  createdDate: Date;
  description?: string;
}

// Document with data
export interface DocumentWithData extends StoredDocument {
  data: Blob;
}

// Database configuration
const DB_NAME = "DigitalTwinDocuments";
const DB_VERSION = 1;
const DOCUMENTS_STORE = "documents";
const METADATA_STORE = "metadata";

let db: IDBDatabase | null = null;

/**
 * Mock document database entries
 * Maps IFC GUIDs to pre-configured documents
 * Documents are stored in public/documents/ folder
 */
interface MockDocumentEntry {
  ifcGuid: string;
  fileName: string;
  filePath: string;
  displayName: string;
  documentType: DocumentType;
  description: string;
}

const MOCK_DOCUMENTS_DATABASE: MockDocumentEntry[] = [
  // ============================================
  // Trench Heating
  // ============================================
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37Xtu",
    fileName: "Podni kanalni konvektor Kampmann HK320.pdf",
    filePath: "/documents/Podni kanalni konvektor Kampmann HK320.pdf",
    displayName: "Kampmann HK320 Specifikacija",
    documentType: "specification",
    description: "Tehnička specifikacija za Kampmann HK320 podni kanalni konvektor"
  },

  // ============================================
  // VRF System
  // ============================================
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37Xt0",
    fileName: "VRF sustav Clivet MV6i 500.pdf",
    filePath: "/documents/VRF sustav Clivet MV6i 500.pdf",
    displayName: "Clivet MV6i-500 Specifikacija",
    documentType: "specification",
    description: "Tehnička specifikacija za Clivet VRF vanjsku jedinicu MV6-i500WV2GN1"
  },

  // ============================================
  // Fan Coil Units - All share same specification
  // ============================================
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37Xt1",
    fileName: "Stropni fan-coil uređaj Kampmann.pdf",
    filePath: "/documents/Stropni fan-coil uređaj Kampmann.pdf",
    displayName: "Kampmann Fan Coil Specifikacija (FCU-01)",
    documentType: "specification",
    description: "Tehnička specifikacija za Kampmann stropni fan-coil uređaj"
  },
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37Xt2",
    fileName: "Stropni fan-coil uređaj Kampmann.pdf",
    filePath: "/documents/Stropni fan-coil uređaj Kampmann.pdf",
    displayName: "Kampmann Fan Coil Specifikacija (FCU-02)",
    documentType: "specification",
    description: "Tehnička specifikacija za Kampmann stropni fan-coil uređaj"
  },
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37Xt3",
    fileName: "Stropni fan-coil uređaj Kampmann.pdf",
    filePath: "/documents/Stropni fan-coil uređaj Kampmann.pdf",
    displayName: "Kampmann Fan Coil Specifikacija (FCU-03)",
    documentType: "specification",
    description: "Tehnička specifikacija za Kampmann stropni fan-coil uređaj"
  },
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37XmN",
    fileName: "Stropni fan-coil uređaj Kampmann.pdf",
    filePath: "/documents/Stropni fan-coil uređaj Kampmann.pdf",
    displayName: "Kampmann Fan Coil Specifikacija (FCU-04)",
    documentType: "specification",
    description: "Tehnička specifikacija za Kampmann stropni fan-coil uređaj"
  },
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37XmO",
    fileName: "Stropni fan-coil uređaj Kampmann.pdf",
    filePath: "/documents/Stropni fan-coil uređaj Kampmann.pdf",
    displayName: "Kampmann Fan Coil Specifikacija (FCU-05)",
    documentType: "specification",
    description: "Tehnička specifikacija za Kampmann stropni fan-coil uređaj"
  },
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37Xpb",
    fileName: "Stropni fan-coil uređaj Kampmann.pdf",
    filePath: "/documents/Stropni fan-coil uređaj Kampmann.pdf",
    displayName: "Kampmann Fan Coil Specifikacija (FCU-06)",
    documentType: "specification",
    description: "Tehnička specifikacija za Kampmann stropni fan-coil uređaj"
  },

  // ============================================
  // Exhaust Valves - All share same specification
  // ============================================
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37Xp4",
    fileName: "NW 100.pdf",
    filePath: "/documents/NW 100.pdf",
    displayName: "NW 100 Specifikacija (EXH-01)",
    documentType: "specification",
    description: "Tehnička specifikacija za NW100 ventil za odsis"
  },
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37XCp",
    fileName: "NW 100.pdf",
    filePath: "/documents/NW 100.pdf",
    displayName: "NW 100 Specifikacija (EXH-02)",
    documentType: "specification",
    description: "Tehnička specifikacija za NW100 ventil za odsis"
  },
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37XCC",
    fileName: "NW 100.pdf",
    filePath: "/documents/NW 100.pdf",
    displayName: "NW 100 Specifikacija (EXH-03)",
    documentType: "specification",
    description: "Tehnička specifikacija za NW100 ventil za odsis"
  },
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37XCD",
    fileName: "NW 100.pdf",
    filePath: "/documents/NW 100.pdf",
    displayName: "NW 100 Specifikacija (EXH-04)",
    documentType: "specification",
    description: "Tehnička specifikacija za NW100 ventil za odsis"
  },

  // ============================================
  // Air Terminals (Supply)
  // ============================================
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37Xp5",
    fileName: "Zračni terminal Klimaoprema OAH1.pdf",
    filePath: "/documents/Zračni terminal Klimaoprema OAH1.pdf",
    displayName: "Klimaoprema OAH1 Specifikacija (SUP-01)",
    documentType: "specification",
    description: "Tehnička specifikacija za Klimaoprema OAH1 zračni terminal"
  },
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37XDs",
    fileName: "Zračni terminal Klimaoprema OAH1.pdf",
    filePath: "/documents/Zračni terminal Klimaoprema OAH1.pdf",
    displayName: "Klimaoprema OAH1 Specifikacija (SUP-02)",
    documentType: "specification",
    description: "Tehnička specifikacija za Klimaoprema OAH1 zračni terminal"
  },

  // ============================================
  // Roof Drains - All share same specification
  // ============================================
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37XCX",
    fileName: "Geberit Pluvia 125.pdf",
    filePath: "/documents/Geberit Pluvia 125.pdf",
    displayName: "Geberit Pluvia 125 Specifikacija (RD-01)",
    documentType: "specification",
    description: "Tehnička specifikacija za Geberit Pluvia sifonski krovni odvod"
  },
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37XCZ",
    fileName: "Geberit Pluvia 125.pdf",
    filePath: "/documents/Geberit Pluvia 125.pdf",
    displayName: "Geberit Pluvia 125 Specifikacija (RD-02)",
    documentType: "specification",
    description: "Tehnička specifikacija za Geberit Pluvia sifonski krovni odvod"
  },
  {
    ifcGuid: "2Z6LRLJyP8pPa$Guk37XCa",
    fileName: "Geberit Pluvia 125.pdf",
    filePath: "/documents/Geberit Pluvia 125.pdf",
    displayName: "Geberit Pluvia 125 Specifikacija (RD-03)",
    documentType: "specification",
    description: "Tehnička specifikacija za Geberit Pluvia sifonski krovni odvod"
  },
];

/**
 * Initialize the IndexedDB database
 */
const initDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("[DocumentStore] Failed to open database:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log("[DocumentStore] Database initialized");
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Store for document blobs (keyed by document id)
      if (!database.objectStoreNames.contains(DOCUMENTS_STORE)) {
        database.createObjectStore(DOCUMENTS_STORE, { keyPath: "id" });
      }

      // Store for metadata (keyed by document id, indexed by ifcGuid)
      if (!database.objectStoreNames.contains(METADATA_STORE)) {
        const metadataStore = database.createObjectStore(METADATA_STORE, { keyPath: "id" });
        metadataStore.createIndex("byGuid", "ifcGuid", { unique: false });
      }

      console.log("[DocumentStore] Database schema created");
    };
  });
};

/**
 * Generate a unique document ID
 */
const generateDocumentId = (): string => {
  return `doc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Store a document linked to an IFC element GUID
 */
export const storeDocument = async (
  ifcGuid: string,
  file: File,
  metadata: DocumentMetadata
): Promise<StoredDocument> => {
  const database = await initDatabase();
  const docId = generateDocumentId();

  const document: StoredDocument = {
    id: docId,
    ifcGuid,
    fileName: file.name,
    displayName: metadata.displayName,
    documentType: metadata.documentType,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
    createdDate: metadata.createdDate,
    uploadedAt: new Date(),
    description: metadata.description,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([DOCUMENTS_STORE, METADATA_STORE], "readwrite");

    transaction.onerror = () => {
      console.error("[DocumentStore] Transaction failed:", transaction.error);
      reject(transaction.error);
    };

    transaction.oncomplete = () => {
      console.log(`[DocumentStore] Document stored: ${file.name} for GUID: ${ifcGuid}`);
      resolve(document);
    };

    // Store the blob
    const documentsStore = transaction.objectStore(DOCUMENTS_STORE);
    documentsStore.put({ id: docId, data: file });

    // Store the metadata
    const metadataStore = transaction.objectStore(METADATA_STORE);
    metadataStore.put(document);
  });
};

/**
 * Get all documents for an IFC element GUID
 */
export const getDocumentsByGuid = async (ifcGuid: string): Promise<StoredDocument[]> => {
  const database = await initDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([METADATA_STORE], "readonly");
    const store = transaction.objectStore(METADATA_STORE);
    const index = store.index("byGuid");
    const request = index.getAll(ifcGuid);

    request.onerror = () => {
      console.error("[DocumentStore] Failed to get documents:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const results = request.result.map((doc: any) => ({
        ...doc,
        displayName: doc.displayName || doc.fileName || "Unnamed Document",
        documentType: doc.documentType || "other",
        createdDate: doc.createdDate ? new Date(doc.createdDate) : new Date(doc.uploadedAt),
        uploadedAt: new Date(doc.uploadedAt),
      } as StoredDocument));
      resolve(results);
    };
  });
};

/**
 * Get documents for multiple GUIDs
 */
export const getDocumentsForMultipleGuids = async (guids: string[]): Promise<Map<string, StoredDocument[]>> => {
  const result = new Map<string, StoredDocument[]>();

  for (const guid of guids) {
    const docs = await getDocumentsByGuid(guid);
    if (docs.length > 0) {
      result.set(guid, docs);
    }
  }

  return result;
};

/**
 * Get a document with its data by ID
 */
export const getDocumentWithData = async (documentId: string): Promise<DocumentWithData | null> => {
  const database = await initDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([DOCUMENTS_STORE, METADATA_STORE], "readonly");

    const metadataStore = transaction.objectStore(METADATA_STORE);
    const metadataRequest = metadataStore.get(documentId);

    metadataRequest.onerror = () => {
      reject(metadataRequest.error);
    };

    metadataRequest.onsuccess = () => {
      if (!metadataRequest.result) {
        resolve(null);
        return;
      }

      const raw = metadataRequest.result;
      const metadata: StoredDocument = {
        ...raw,
        displayName: raw.displayName || raw.fileName || "Unnamed Document",
        documentType: raw.documentType || "other",
        createdDate: raw.createdDate ? new Date(raw.createdDate) : new Date(raw.uploadedAt),
        uploadedAt: new Date(raw.uploadedAt),
      };

      const documentsStore = transaction.objectStore(DOCUMENTS_STORE);
      const dataRequest = documentsStore.get(documentId);

      dataRequest.onerror = () => {
        reject(dataRequest.error);
      };

      dataRequest.onsuccess = () => {
        if (!dataRequest.result) {
          resolve(null);
          return;
        }

        resolve({
          ...metadata,
          data: dataRequest.result.data,
        });
      };
    };
  });
};

/**
 * Delete a document by ID
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  const database = await initDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([DOCUMENTS_STORE, METADATA_STORE], "readwrite");

    transaction.onerror = () => {
      console.error("[DocumentStore] Delete failed:", transaction.error);
      reject(transaction.error);
    };

    transaction.oncomplete = () => {
      console.log(`[DocumentStore] Document deleted: ${documentId}`);
      resolve();
    };

    const documentsStore = transaction.objectStore(DOCUMENTS_STORE);
    documentsStore.delete(documentId);

    const metadataStore = transaction.objectStore(METADATA_STORE);
    metadataStore.delete(documentId);
  });
};

/**
 * Update document metadata by ID
 */
export const updateDocument = async (
  documentId: string,
  updates: Partial<DocumentMetadata>
): Promise<StoredDocument | null> => {
  const database = await initDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([METADATA_STORE], "readwrite");
    const store = transaction.objectStore(METADATA_STORE);

    const getRequest = store.get(documentId);

    getRequest.onerror = () => {
      reject(getRequest.error);
    };

    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        resolve(null);
        return;
      }

      const existing = getRequest.result as StoredDocument;
      const updated: StoredDocument = {
        ...existing,
        displayName: updates.displayName ?? existing.displayName,
        documentType: updates.documentType ?? existing.documentType,
        createdDate: updates.createdDate ?? existing.createdDate,
        description: updates.description !== undefined ? updates.description : existing.description,
      };

      const putRequest = store.put(updated);

      putRequest.onerror = () => {
        reject(putRequest.error);
      };

      putRequest.onsuccess = () => {
        console.log(`[DocumentStore] Document updated: ${documentId}`);
        resolve({
          ...updated,
          createdDate: new Date(updated.createdDate),
          uploadedAt: new Date(updated.uploadedAt),
        });
      };
    };
  });
};

/**
 * Get document type label
 */
export const getDocumentTypeLabel = (type: DocumentType): string => {
  const found = DOCUMENT_TYPES.find(t => t.value === type);
  return found?.label ?? type;
};

/**
 * Download a document (triggers browser download)
 */
export const downloadDocument = async (documentId: string): Promise<void> => {
  const doc = await getDocumentWithData(documentId);
  if (!doc) {
    console.error("[DocumentStore] Document not found:", documentId);
    return;
  }

  const url = URL.createObjectURL(doc.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = doc.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Get a blob URL for viewing a document
 * Returns the URL and a cleanup function to revoke it when done
 */
export const getDocumentViewUrl = async (documentId: string): Promise<{ url: string; revoke: () => void } | null> => {
  const doc = await getDocumentWithData(documentId);
  if (!doc) {
    console.error("[DocumentStore] Document not found:", documentId);
    return null;
  }

  const url = URL.createObjectURL(doc.data);
  return {
    url,
    revoke: () => URL.revokeObjectURL(url),
  };
};

/**
 * Check if a document can be viewed in browser
 */
export const canViewInBrowser = (fileType: string): boolean => {
  const viewableTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "text/plain",
    "text/html",
    "text/css",
    "text/javascript",
    "application/json",
  ];
  return viewableTypes.includes(fileType) || fileType.startsWith("image/") || fileType.startsWith("text/");
};

/**
 * Get all stored documents (for debugging/management)
 */
export const getAllDocuments = async (): Promise<StoredDocument[]> => {
  const database = await initDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([METADATA_STORE], "readonly");
    const store = transaction.objectStore(METADATA_STORE);
    const request = store.getAll();

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      const results = request.result.map((doc: any) => ({
        ...doc,
        displayName: doc.displayName || doc.fileName || "Unnamed Document",
        documentType: doc.documentType || "other",
        createdDate: doc.createdDate ? new Date(doc.createdDate) : new Date(doc.uploadedAt),
        uploadedAt: new Date(doc.uploadedAt),
      } as StoredDocument));
      resolve(results);
    };
  });
};

/**
 * Check if any documents exist for a GUID
 */
export const hasDocuments = async (ifcGuid: string): Promise<boolean> => {
  const docs = await getDocumentsByGuid(ifcGuid);
  return docs.length > 0;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Get file icon based on type
 */
export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType === "application/pdf") return "📄";
  if (fileType.includes("word") || fileType.includes("document")) return "📝";
  if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊";
  if (fileType.includes("zip") || fileType.includes("compressed")) return "📦";
  return "📎";
};

/**
 * Check if mock documents have been seeded
 */
const SEEDED_KEY = "mock-documents-seeded-v2";

const hasBeenSeeded = (): boolean => {
  return localStorage.getItem(SEEDED_KEY) === "true";
};

const markAsSeeded = (): void => {
  localStorage.setItem(SEEDED_KEY, "true");
};

/**
 * Seed mock documents from the MOCK_DOCUMENTS_DATABASE
 * Fetches files from public/documents/ and stores them in IndexedDB
 */
const seedMockDocuments = async (): Promise<void> => {
  if (hasBeenSeeded()) {
    console.log("[DocumentStore] Mock documents already seeded, skipping...");
    return;
  }

  console.log("[DocumentStore] Seeding mock documents...");

  let seededCount = 0;
  const errors: string[] = [];

  for (const entry of MOCK_DOCUMENTS_DATABASE) {
    try {
      // Fetch the document file
      const response = await fetch(`${import.meta.env.BASE_URL}${entry.filePath.replace(/^\//, "")}`);
      if (!response.ok) {
        errors.push(`Failed to fetch ${entry.filePath}: ${response.status}`);
        continue;
      }

      const blob = await response.blob();
      // Detect MIME type from file extension
      const mimeType = entry.fileName.endsWith(".pdf") ? "application/pdf" : "text/plain";
      const file = new File([blob], entry.fileName, {
        type: mimeType
      });

      // Store the document
      await storeDocument(entry.ifcGuid, file, {
        displayName: entry.displayName,
        documentType: entry.documentType,
        createdDate: new Date(),
        description: entry.description,
      });

      seededCount++;
    } catch (error) {
      errors.push(`Error seeding ${entry.fileName}: ${error}`);
    }
  }

  if (errors.length > 0) {
    console.warn("[DocumentStore] Some documents failed to seed:", errors);
  }

  console.log(`[DocumentStore] Seeded ${seededCount}/${MOCK_DOCUMENTS_DATABASE.length} mock documents`);
  markAsSeeded();
};

/**
 * Clear seeded flag (for development/testing)
 */
export const resetMockDocuments = async (): Promise<void> => {
  localStorage.removeItem(SEEDED_KEY);
  // Delete all existing documents
  const allDocs = await getAllDocuments();
  for (const doc of allDocs) {
    await deleteDocument(doc.id);
  }
  console.log("[DocumentStore] Mock documents reset. Will re-seed on next initialize.");
};

/**
 * Initialize the document store
 */
export const initialize = async (): Promise<void> => {
  await initDatabase();

  // Seed mock documents if not already done
  await seedMockDocuments();

  const allDocs = await getAllDocuments();
  console.log(`[DocumentStore] Initialized with ${allDocs.length} documents`);
};

// Export as namespace-like object
export const DocumentStore = {
  initialize,
  storeDocument,
  updateDocument,
  getDocumentsByGuid,
  getDocumentsForMultipleGuids,
  getDocumentWithData,
  deleteDocument,
  downloadDocument,
  getDocumentViewUrl,
  canViewInBrowser,
  getAllDocuments,
  hasDocuments,
  formatFileSize,
  getFileIcon,
  getDocumentTypeLabel,
  resetMockDocuments,
  DOCUMENT_TYPES,
};

export default DocumentStore;
