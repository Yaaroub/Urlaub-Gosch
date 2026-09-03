"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import MarkdownContent from "@/components/MarkdownContent";

import {
  Calendar,
  CalendarDays,
  Dog,
  Euro,
  Eye,
  Home,
  Heart,
  Images,
  MapPin,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

// ============================================================
// Leeres Formular
// ============================================================

const EMPTY_FORM = {
  id: null,
  title: "",
  location: "",
  maxPersons: 2,
  dogsAllowed: false,
  kuschelwochenEnabled: true,
  description: "",
  slug: "",
  amenityNames: [],
};

// ============================================================
// Verwaltungsbereiche
// ============================================================

const MANAGEMENT_ITEMS = [
  {
    key: "prices",
    title: "Preiszeiten",
    description: "Saisonpreise und Zeiträume",
    href: "/admin/prices",
    icon: Euro,
  },
  {
    key: "fees",
    title: "Nebenkosten",
    description: "Endreinigung und Zuschläge",
    href: "/admin/fees",
    icon: Settings,
  },
  {
    key: "images",
    title: "Bilder",
    description: "Upload und Reihenfolge",
    href: "/admin/images",
    icon: Images,
  },
  {
    key: "availability",
    title: "Verfügbarkeit",
    description: "Belegungen und Sperrzeiten",
    href: "/admin/availability",
    icon: CalendarDays,
  },
  {
    key: "ical",
    title: "iCal",
    description: "Import und Synchronisation",
    href: "/admin/ical",
    icon: Upload,
  },
  {
    key: "lastminute",
    title: "Last-Minute",
    description: "Rabatte und Angebote",
    href: "/admin/lastminute",
    icon: Tag,
  },
];

// ============================================================
// LocalStorage Keys
// ============================================================

const STORAGE_LOCATION =
  "admin-properties-location";

const STORAGE_PROPERTY =
  "admin-properties-property";

// ============================================================
// RegExp absichern
// ============================================================

function escapeRegExp(value) {
  return String(value || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

// ============================================================
// Kurzen Admin-Objektnamen erzeugen
//
// Beispiel:
//
// Ferienhaus Altnaharra Schönberger Strand
//
// wird:
//
// Altnaharra
//
// Der echte Titel wird NICHT verändert.
// ============================================================

function getAdminPropertyName(property) {
  const originalTitle = String(
    property?.title || ""
  ).trim();

  const location = String(
    property?.location || ""
  ).trim();

  if (!originalTitle) {
    return property?.id
      ? `Objekt ${property.id}`
      : "Objekt";
  }

  let name = originalTitle.replace(
    /^(ferienhaus|ferienwohnung|ferienappartement|ferien-apartment|ferienapartment)\s+/i,
    ""
  );

  // Ort am Ende entfernen
  if (location) {
    const locationAtEnd = new RegExp(
      `\\s+${escapeRegExp(location)}$`,
      "i"
    );

    name = name
      .replace(locationAtEnd, "")
      .trim();
  }

  return name || originalTitle;
}

// ============================================================
// Objekte sortieren
//
// 1. Ortschaft
// 2. Objektname
// ============================================================

function sortProperties(properties) {
  return [...properties].sort(
    (a, b) => {
      const locationCompare =
        String(
          a.location || ""
        ).localeCompare(
          String(b.location || ""),
          "de",
          {
            sensitivity: "base",
          }
        );

      if (locationCompare !== 0) {
        return locationCompare;
      }

      return getAdminPropertyName(
        a
      ).localeCompare(
        getAdminPropertyName(b),
        "de",
        {
          sensitivity: "base",
        }
      );
    }
  );
}

// ============================================================
// Seite
// ============================================================

export default function AdminPropertiesPage() {
  const formSectionRef =
    useRef(null);

  // ----------------------------------------------------------
  // Daten
  // ----------------------------------------------------------

  const [items, setItems] =
    useState([]);

  const [
    amenities,
    setAmenities,
  ] = useState([]);

  // ----------------------------------------------------------
  // Suche / Filter
  // ----------------------------------------------------------

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState("");

  const [
    selectedPropertyId,
    setSelectedPropertyId,
  ] = useState("");

  /**
   * Erst nach dem Laden aus localStorage dürfen
   * die Filter wieder zurückgeschrieben werden.
   */
  const [
    filtersReady,
    setFiltersReady,
  ] = useState(false);

  /**
   * Wenn man von Bilder / Preise usw. zurückkommt,
   * scrollen wir einmal zum vorherigen Objekt.
   */
  const [
    restoreScrollPending,
    setRestoreScrollPending,
  ] = useState(false);

  // ----------------------------------------------------------
  // Formular
  // ----------------------------------------------------------

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  // ----------------------------------------------------------
  // Status
  // ----------------------------------------------------------

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [busy, setBusy] =
    useState(false);

  const [msg, setMsg] =
    useState(null);

  // ----------------------------------------------------------
  // Berechtigungen
  // ----------------------------------------------------------

  const [
    canEdit,
    setCanEdit,
  ] = useState(false);

  const [
    canDelete,
    setCanDelete,
  ] = useState(false);

  // ----------------------------------------------------------
  // Löschen
  // ----------------------------------------------------------

  const [
    pendingDelete,
    setPendingDelete,
  ] = useState(null);

  // ----------------------------------------------------------
  // Ausstattung
  // ----------------------------------------------------------

  const [
    showAmenityInput,
    setShowAmenityInput,
  ] = useState(false);

  const [
    newAmenityName,
    setNewAmenityName,
  ] = useState("");

  // ==========================================================
  // Bearbeitungsmodus
  // ==========================================================

  const editing = useMemo(
    () => form.id !== null,
    [form.id]
  );

  // ==========================================================
  // Ortschaften
  // ==========================================================

  const locations = useMemo(() => {
    const values = items
      .map((item) =>
        String(
          item.location || ""
        ).trim()
      )
      .filter(Boolean);

    return [
      ...new Set(values),
    ].sort((a, b) =>
      a.localeCompare(b, "de", {
        sensitivity: "base",
      })
    );
  }, [items]);

  // ==========================================================
  // Objekte für Objekt-Dropdown
  // ==========================================================

  const availableObjectOptions =
    useMemo(() => {
      const result =
        selectedLocation
          ? items.filter(
              (item) =>
                item.location ===
                selectedLocation
            )
          : items;

      return [...result].sort(
        (a, b) =>
          getAdminPropertyName(
            a
          ).localeCompare(
            getAdminPropertyName(b),
            "de",
            {
              sensitivity: "base",
            }
          )
      );
    }, [
      items,
      selectedLocation,
    ]);

  // ==========================================================
  // Gefilterte Objekte
  // ==========================================================

  const filteredItems =
    useMemo(() => {
      const searchValue =
        searchTerm
          .trim()
          .toLocaleLowerCase(
            "de"
          );

      return items.filter(
        (item) => {
          // --------------------------------------------
          // Ortschaft
          // --------------------------------------------

          if (
            selectedLocation &&
            item.location !==
              selectedLocation
          ) {
            return false;
          }

          // --------------------------------------------
          // Einzelnes Objekt
          // --------------------------------------------

          if (
            selectedPropertyId &&
            String(item.id) !==
              String(
                selectedPropertyId
              )
          ) {
            return false;
          }

          // --------------------------------------------
          // Suche
          // --------------------------------------------

          if (!searchValue) {
            return true;
          }

          const searchableValues = [
            item.id,
            item.title,
            getAdminPropertyName(
              item
            ),
            item.location,
            item.slug,

            item.kuschelwochenEnabled !==
            false
              ? "kuschelwochen"
              : "",
          ];

          return searchableValues.some(
            (value) =>
              String(value ?? "")
                .toLocaleLowerCase(
                  "de"
                )
                .includes(
                  searchValue
                )
          );
        }
      );
    }, [
      items,
      searchTerm,
      selectedLocation,
      selectedPropertyId,
    ]);

  // ==========================================================
  // Daten laden
  // ==========================================================

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================================
  // Gespeicherte Ortschaft + Objekt wiederherstellen
  // ==========================================================

  useEffect(() => {
    if (
      filtersReady ||
      items.length === 0 ||
      typeof window ===
        "undefined"
    ) {
      return;
    }

    const storedLocation =
      window.localStorage.getItem(
        STORAGE_LOCATION
      );

    const storedPropertyId =
      window.localStorage.getItem(
        STORAGE_PROPERTY
      );

    // --------------------------------------------
    // Ortschaft wiederherstellen
    // --------------------------------------------

    let nextLocation = "";

    if (
      storedLocation &&
      locations.includes(
        storedLocation
      )
    ) {
      nextLocation =
        storedLocation;
    }

    // --------------------------------------------
    // Objekt suchen
    // --------------------------------------------

    const storedProperty =
      storedPropertyId
        ? items.find(
            (item) =>
              String(item.id) ===
              String(
                storedPropertyId
              )
          )
        : null;

    // --------------------------------------------
    // Objekt wiederherstellen
    // --------------------------------------------

    if (storedProperty) {
      /**
       * Wenn die gespeicherte Ortschaft weiterhin passt,
       * behalten wir sie.
       *
       * Wenn keine Ortschaft gespeichert war,
       * bleibt "Alle Ortschaften" bestehen.
       */
      if (
        nextLocation &&
        storedProperty.location !==
          nextLocation
      ) {
        /**
         * Falls sich z. B. der Ort des Objektes
         * zwischenzeitlich geändert hat.
         */
        nextLocation =
          storedProperty.location ||
          "";
      }

      setSelectedPropertyId(
        String(storedProperty.id)
      );

      setRestoreScrollPending(
        true
      );
    }

    setSelectedLocation(
      nextLocation
    );

    setFiltersReady(true);
  }, [
    filtersReady,
    items,
    locations,
  ]);

  // ==========================================================
  // Ortschaft speichern
  // ==========================================================

  useEffect(() => {
    if (
      !filtersReady ||
      typeof window ===
        "undefined"
    ) {
      return;
    }

    /**
     * Auch "" wird gespeichert.
     *
     * Dadurch wissen wir:
     * Der Admin hatte bewusst "Alle Ortschaften".
     */
    window.localStorage.setItem(
      STORAGE_LOCATION,
      selectedLocation
    );
  }, [
    selectedLocation,
    filtersReady,
  ]);

  // ==========================================================
  // Objekt speichern
  // ==========================================================

  useEffect(() => {
    if (
      !filtersReady ||
      typeof window ===
        "undefined"
    ) {
      return;
    }

    if (selectedPropertyId) {
      window.localStorage.setItem(
        STORAGE_PROPERTY,
        String(
          selectedPropertyId
        )
      );
    } else {
      window.localStorage.removeItem(
        STORAGE_PROPERTY
      );
    }
  }, [
    selectedPropertyId,
    filtersReady,
  ]);

  // ==========================================================
  // Nach Rückkehr zum gespeicherten Objekt scrollen
  // ==========================================================

  useEffect(() => {
    if (
      !filtersReady ||
      loading ||
      !restoreScrollPending ||
      !selectedPropertyId
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        const element =
          document.getElementById(
            `admin-property-${selectedPropertyId}`
          );

        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }

        setRestoreScrollPending(
          false
        );
      }, 150);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    filtersReady,
    loading,
    restoreScrollPending,
    selectedPropertyId,
    filteredItems.length,
  ]);

  // ==========================================================
  // Ortschaft auswählen
  // ==========================================================

  function handleLocationFilterChange(
    event
  ) {
    const nextLocation =
      event.target.value;

    setSelectedLocation(
      nextLocation
    );

    /**
     * Beim Wechsel des Ortes darf das alte
     * Objekt nicht aktiv bleiben.
     */
    setSelectedPropertyId(
      ""
    );

    setRestoreScrollPending(
      false
    );
  }

  // ==========================================================
  // Objekt auswählen
  // ==========================================================

  function handlePropertyFilterChange(
    event
  ) {
    const propertyId =
      event.target.value;

    setSelectedPropertyId(
      propertyId
    );

    setRestoreScrollPending(
      Boolean(propertyId)
    );
  }

  // ==========================================================
  // Aktuelles Objekt merken
  //
  // Wichtig vor Navigation zu:
  // - Preise
  // - Bilder
  // - Nebenkosten
  // - Verfügbarkeit
  // usw.
  // ==========================================================

  function rememberProperty(
    property
  ) {
    if (!property) {
      return;
    }

    const propertyId =
      String(property.id);

    setSelectedPropertyId(
      propertyId
    );

    if (
      typeof window !==
      "undefined"
    ) {
      /**
       * Direkt speichern.
       *
       * Wir verlassen möglicherweise sofort die Seite,
       * deshalb verlassen wir uns hier nicht nur auf
       * den useEffect.
       */
      window.localStorage.setItem(
        STORAGE_PROPERTY,
        propertyId
      );

      window.localStorage.setItem(
        STORAGE_LOCATION,
        selectedLocation
      );
    }
  }

  // ==========================================================
  // Daten laden
  // ==========================================================

  async function loadData() {
    setLoading(true);

    setMsg(null);

    try {
      const [
        propertiesResponse,
        amenitiesResponse,
      ] = await Promise.all([
        fetch(
          "/api/admin/properties",
          {
            cache: "no-store",
          }
        ),

        fetch(
          "/api/admin/amenities",
          {
            cache: "no-store",
          }
        ),
      ]);

      // --------------------------------------------
      // Nicht eingeloggt
      // --------------------------------------------

      if (
        propertiesResponse.status ===
          401 ||
        amenitiesResponse.status ===
          401
      ) {
        window.location.href =
          "/admin";

        return;
      }

      // --------------------------------------------
      // Keine Berechtigung
      // --------------------------------------------

      if (
        propertiesResponse.status ===
          403 ||
        amenitiesResponse.status ===
          403
      ) {
        window.location.href =
          "/admin";

        return;
      }

      // --------------------------------------------
      // Rechte
      // --------------------------------------------

      setCanEdit(
        propertiesResponse.headers.get(
          "x-admin-can-edit"
        ) === "1"
      );

      setCanDelete(
        propertiesResponse.headers.get(
          "x-admin-can-delete"
        ) === "1"
      );

      // --------------------------------------------
      // JSON
      // --------------------------------------------

      const propertiesData =
        await propertiesResponse
          .json()
          .catch(() => []);

      const amenitiesData =
        await amenitiesResponse
          .json()
          .catch(() => []);

      // --------------------------------------------
      // Fehler
      // --------------------------------------------

      if (
        !propertiesResponse.ok
      ) {
        throw new Error(
          propertiesData?.error ||
            "Objekte konnten nicht geladen werden."
        );
      }

      if (
        !amenitiesResponse.ok
      ) {
        throw new Error(
          amenitiesData?.error ||
            "Ausstattungen konnten nicht geladen werden."
        );
      }

      // --------------------------------------------
      // Objekte
      // --------------------------------------------

      setItems(
        Array.isArray(
          propertiesData
        )
          ? sortProperties(
              propertiesData
            )
          : []
      );

      // --------------------------------------------
      // Ausstattung
      // --------------------------------------------

      setAmenities(
        Array.isArray(
          amenitiesData
        )
          ? [
              ...amenitiesData,
            ].sort((a, b) =>
              String(
                a.name || ""
              ).localeCompare(
                String(
                  b.name || ""
                ),
                "de",
                {
                  sensitivity:
                    "base",
                }
              )
            )
          : []
      );
    } catch (error) {
      setMsg({
        t: "error",

        m:
          error?.message ||
          "Daten konnten nicht geladen werden.",
      });
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // Zum Formular scrollen
  // ==========================================================

  function scrollToForm() {
    window.setTimeout(() => {
      formSectionRef.current?.scrollIntoView(
        {
          behavior: "smooth",
          block: "start",
        }
      );
    }, 50);
  }

  // ==========================================================
  // Neues Objekt
  // ==========================================================

  function openCreateForm() {
    if (!canEdit) {
      setMsg({
        t: "error",
        m:
          "Du hast nur Leserechte für Objekte.",
      });

      return;
    }

    setMsg(null);

    setForm(EMPTY_FORM);

    setNewAmenityName("");

    setShowAmenityInput(
      false
    );

    setShowForm(true);

    scrollToForm();
  }

  // ==========================================================
  // Formular schließen
  // ==========================================================

  function closeForm() {
    if (busy) {
      return;
    }

    setForm(EMPTY_FORM);

    setNewAmenityName("");

    setShowAmenityInput(
      false
    );

    setShowForm(false);

    /**
     * Wenn ein bestehendes Objekt bearbeitet wurde,
     * zurück zu diesem Objekt scrollen.
     */
    if (
      selectedPropertyId
    ) {
      window.setTimeout(
        () => {
          const element =
            document.getElementById(
              `admin-property-${selectedPropertyId}`
            );

          element?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        },
        100
      );
    }
  }

  // ==========================================================
  // Ausstattung an/abwählen
  // ==========================================================

  function toggleAmenity(name) {
    if (!canEdit) {
      return;
    }

    setForm(
      (currentForm) => {
        const selected =
          currentForm.amenityNames.includes(
            name
          );

        return {
          ...currentForm,

          amenityNames:
            selected
              ? currentForm.amenityNames.filter(
                  (item) =>
                    item !== name
                )
              : [
                  ...currentForm.amenityNames,
                  name,
                ],
        };
      }
    );
  }

  // ==========================================================
  // Ausstattung inline hinzufügen
  // ==========================================================

  async function addAmenityInline(
    event
  ) {
    event?.preventDefault?.();

    if (!canEdit) {
      setMsg({
        t: "error",
        m:
          "Dir fehlt die Berechtigung zum Bearbeiten von Objekten.",
      });

      return;
    }

    const name =
      newAmenityName.trim();

    setMsg(null);

    if (!name) {
      setMsg({
        t: "error",
        m:
          "Bitte eine Bezeichnung für die Ausstattung eingeben.",
      });

      return;
    }

    const existingAmenity =
      amenities.find(
        (amenity) =>
          String(
            amenity.name || ""
          )
            .trim()
            .toLocaleLowerCase(
              "de"
            ) ===
          name.toLocaleLowerCase(
            "de"
          )
      );

    // --------------------------------------------
    // Bereits vorhanden
    // --------------------------------------------

    if (existingAmenity) {
      setForm(
        (currentForm) => ({
          ...currentForm,

          amenityNames:
            currentForm.amenityNames.includes(
              existingAmenity.name
            )
              ? currentForm.amenityNames
              : [
                  ...currentForm.amenityNames,
                  existingAmenity.name,
                ],
        })
      );

      setNewAmenityName("");

      setShowAmenityInput(
        false
      );

      setMsg({
        t: "ok",
        m:
          "Die vorhandene Ausstattung wurde ausgewählt.",
      });

      return;
    }

    setBusy(true);

    try {
      const response =
        await fetch(
          "/api/admin/amenities",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name,
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (
        response.status ===
        401
      ) {
        window.location.href =
          "/admin";

        return;
      }

      if (!response.ok) {
        setMsg({
          t: "error",

          m:
            data?.error ||
            "Ausstattung konnte nicht angelegt werden.",
        });

        return;
      }

      setAmenities(
        (
          currentAmenities
        ) =>
          [
            ...currentAmenities,
            data,
          ].sort((a, b) =>
            String(
              a.name || ""
            ).localeCompare(
              String(
                b.name || ""
              ),
              "de",
              {
                sensitivity:
                  "base",
              }
            )
          )
      );

      setForm(
        (currentForm) => ({
          ...currentForm,

          amenityNames:
            currentForm.amenityNames.includes(
              data.name
            )
              ? currentForm.amenityNames
              : [
                  ...currentForm.amenityNames,
                  data.name,
                ],
        })
      );

      setNewAmenityName("");

      setShowAmenityInput(
        false
      );

      setMsg({
        t: "ok",
        m:
          "Ausstattung wurde angelegt und ausgewählt.",
      });
    } catch {
      setMsg({
        t: "error",
        m:
          "Netzwerkfehler beim Anlegen der Ausstattung.",
      });
    } finally {
      setBusy(false);
    }
  }

  // ==========================================================
  // Objekt speichern
  // ==========================================================

  async function save(event) {
    event.preventDefault();

    if (!canEdit) {
      setMsg({
        t: "error",
        m:
          "Dir fehlt die Berechtigung zum Bearbeiten von Objekten.",
      });

      return;
    }

    setMsg(null);

    const payload = {
      title:
        form.title.trim(),

      location:
        form.location.trim(),

      maxPersons:
        Number(
          form.maxPersons
        ) || 2,

      dogsAllowed:
        Boolean(
          form.dogsAllowed
        ),

      kuschelwochenEnabled:
        Boolean(
          form.kuschelwochenEnabled
        ),

      description:
        form.description?.trim() ||
        "",

      slug:
        form.slug?.trim() ||
        undefined,

      amenities:
        form.amenityNames,
    };

    if (
      !payload.title ||
      !payload.location
    ) {
      setMsg({
        t: "error",
        m:
          "Titel und Ort sind erforderlich.",
      });

      return;
    }

    if (
      payload.maxPersons < 1
    ) {
      setMsg({
        t: "error",
        m:
          "Die maximale Personenzahl muss mindestens 1 sein.",
      });

      return;
    }

    setBusy(true);

    try {
      const response =
        await fetch(
          editing
            ? `/api/admin/properties/${form.id}`
            : "/api/admin/properties",
          {
            method:
              editing
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (
        response.status ===
        401
      ) {
        window.location.href =
          "/admin";

        return;
      }

      if (!response.ok) {
        setMsg({
          t: "error",

          m:
            data?.error ||
            (editing
              ? "Aktualisieren fehlgeschlagen."
              : "Anlegen fehlgeschlagen."),
        });

        return;
      }

      // --------------------------------------------
      // Bestehendes Objekt
      // --------------------------------------------

      if (editing) {
        setItems(
          (
            currentItems
          ) =>
            sortProperties(
              currentItems.map(
                (item) =>
                  item.id ===
                  data.id
                    ? {
                        ...item,
                        ...data,
                      }
                    : item
              )
            )
        );

        /**
         * Das gerade bearbeitete Objekt bleibt
         * weiterhin ausgewählt.
         */
        setSelectedPropertyId(
          String(data.id)
        );

        window.localStorage.setItem(
          STORAGE_PROPERTY,
          String(data.id)
        );

        /**
         * Falls der Ort im Formular geändert wurde,
         * passen wir auch den Ortschaftsfilter an.
         */
        if (
          selectedLocation &&
          data.location !==
            selectedLocation
        ) {
          setSelectedLocation(
            data.location
          );

          window.localStorage.setItem(
            STORAGE_LOCATION,
            data.location
          );
        }

        setMsg({
          t: "ok",
          m:
            "Objekt wurde erfolgreich aktualisiert.",
        });
      } else {
        // --------------------------------------------
        // Neues Objekt
        // --------------------------------------------

        setItems(
          (
            currentItems
          ) =>
            sortProperties([
              ...currentItems,
              data,
            ])
        );

        setMsg({
          t: "ok",
          m:
            "Objekt wurde erfolgreich angelegt.",
        });
      }

      setForm(EMPTY_FORM);

      setNewAmenityName("");

      setShowAmenityInput(
        false
      );

      setShowForm(false);

      // --------------------------------------------
      // Nach Speichern zum Objekt
      // --------------------------------------------

      if (editing) {
        window.setTimeout(
          () => {
            const element =
              document.getElementById(
                `admin-property-${data.id}`
              );

            element?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          },
          150
        );
      }
    } catch {
      setMsg({
        t: "error",
        m:
          "Netzwerkfehler beim Speichern.",
      });
    } finally {
      setBusy(false);
    }
  }

  // ==========================================================
  // Grunddaten bearbeiten
  // ==========================================================

  async function editRow(id) {
    if (!canEdit) {
      setMsg({
        t: "error",
        m:
          "Du hast nur Leserechte für Objekte.",
      });

      return;
    }

    const listProperty =
      items.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    /**
     * Wichtig:
     * Objekt bereits VOR dem Öffnen merken.
     */
    if (listProperty) {
      rememberProperty(
        listProperty
      );
    } else {
      setSelectedPropertyId(
        String(id)
      );

      window.localStorage.setItem(
        STORAGE_PROPERTY,
        String(id)
      );
    }

    setMsg(null);

    setBusy(true);

    try {
      const response =
        await fetch(
          `/api/admin/properties/${id}`,
          {
            cache: "no-store",
          }
        );

      const property =
        await response
          .json()
          .catch(() => null);

      if (
        response.status ===
        401
      ) {
        window.location.href =
          "/admin";

        return;
      }

      if (
        !response.ok ||
        !property
      ) {
        setMsg({
          t: "error",

          m:
            property?.error ||
            "Objektdaten konnten nicht geladen werden.",
        });

        return;
      }

      setForm({
        id:
          property.id,

        title:
          property.title || "",

        location:
          property.location ||
          "",

        maxPersons:
          property.maxPersons ||
          2,

        dogsAllowed:
          Boolean(
            property.dogsAllowed
          ),

        kuschelwochenEnabled:
          property.kuschelwochenEnabled !==
          false,

        description:
          property.description ||
          "",

        slug:
          property.slug || "",

        amenityNames:
          Array.isArray(
            property.amenities
          )
            ? property.amenities.map(
                (amenity) =>
                  amenity.name
              )
            : [],
      });

      setNewAmenityName("");

      setShowAmenityInput(
        false
      );

      setShowForm(true);

      scrollToForm();
    } catch {
      setMsg({
        t: "error",
        m:
          "Netzwerkfehler beim Laden des Objekts.",
      });
    } finally {
      setBusy(false);
    }
  }

  // ==========================================================
  // Löschen fragen
  // ==========================================================

  function askRemoveRow(
    property
  ) {
    if (!canDelete) {
      setMsg({
        t: "error",
        m:
          "Dir fehlt die Berechtigung zum Löschen von Objekten.",
      });

      return;
    }

    setMsg(null);

    setPendingDelete(
      property
    );
  }

  // ==========================================================
  // Objekt löschen
  // ==========================================================

  async function confirmRemove() {
    if (!pendingDelete) {
      return;
    }

    const propertyToDelete =
      pendingDelete;

    setBusy(true);

    setMsg(null);

    try {
      const response =
        await fetch(
          `/api/admin/properties/${propertyToDelete.id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (
        response.status ===
        401
      ) {
        window.location.href =
          "/admin";

        return;
      }

      if (!response.ok) {
        setMsg({
          t: "error",

          m:
            data?.error ||
            "Löschen fehlgeschlagen.",
        });

        return;
      }

      setItems(
        (
          currentItems
        ) =>
          currentItems.filter(
            (item) =>
              item.id !==
              propertyToDelete.id
          )
      );

      // --------------------------------------------
      // Gelöschtes Objekt war ausgewählt
      // --------------------------------------------

      if (
        String(
          selectedPropertyId
        ) ===
        String(
          propertyToDelete.id
        )
      ) {
        setSelectedPropertyId(
          ""
        );

        window.localStorage.removeItem(
          STORAGE_PROPERTY
        );
      }

      // --------------------------------------------
      // Gelöschtes Objekt war im Formular
      // --------------------------------------------

      if (
        form.id ===
        propertyToDelete.id
      ) {
        setForm(
          EMPTY_FORM
        );

        setShowForm(
          false
        );
      }

      setMsg({
        t: "ok",
        m:
          "Objekt wurde dauerhaft gelöscht.",
      });
    } catch {
      setMsg({
        t: "error",
        m:
          "Netzwerkfehler beim Löschen.",
      });
    } finally {
      setPendingDelete(
        null
      );

      setBusy(false);
    }
  }

  // ==========================================================
  // Alle Filter zurücksetzen
  // ==========================================================

  function resetFilters() {
    setSearchTerm("");

    setSelectedLocation("");

    setSelectedPropertyId("");

    setRestoreScrollPending(
      false
    );

    if (
      typeof window !==
      "undefined"
    ) {
      window.localStorage.setItem(
        STORAGE_LOCATION,
        ""
      );

      window.localStorage.removeItem(
        STORAGE_PROPERTY
      );
    }
  }

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <section className="mx-auto mt-24 w-full max-w-[1600px] px-4 py-8 md:px-6 md:py-10">
      {/* ======================================================
          Meldungen
      ====================================================== */}

      <div className="mb-5 space-y-2">
        {msg?.t ===
          "error" && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>
              {msg.m}
            </span>

            <button
              type="button"
              onClick={() =>
                setMsg(null)
              }
              className="shrink-0 text-xs font-medium text-rose-600 hover:text-rose-800"
            >
              Schließen
            </button>
          </div>
        )}

        {msg?.t ===
          "ok" && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span>
              {msg.m}
            </span>

            <button
              type="button"
              onClick={() =>
                setMsg(null)
              }
              className="shrink-0 text-xs font-medium text-emerald-600 hover:text-emerald-800"
            >
              Schließen
            </button>
          </div>
        )}
      </div>

      {/* ======================================================
          Kopfbereich
      ====================================================== */}

      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Admin · Objekte
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            Unterkünfte verwalten
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Lege Unterkünfte an und öffne anschließend alle
            zugehörigen Verwaltungsbereiche direkt beim jeweiligen
            Objekt.
          </p>

          {!canEdit && (
            <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              Nur Leserechte
            </div>
          )}
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={
              openCreateForm
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
          >
            <Plus
              className="h-4 w-4"
              aria-hidden="true"
            />

            Neues Objekt
          </button>
        )}
      </div>

      {/* ======================================================
          Grunddaten Formular
      ====================================================== */}

      {showForm &&
        canEdit && (
          <div
            ref={
              formSectionRef
            }
            className="scroll-mt-28"
          >
            <form
              onSubmit={save}
              className="mb-8 space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 xl:p-6"
            >
              {/* Kopf */}

              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                    {editing
                      ? "Objekt bearbeiten"
                      : "Neues Objekt"}
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-slate-950">
                    {editing
                      ? getAdminPropertyName(
                          form
                        )
                      : "Unterkunft anlegen"}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Stammdaten, Beschreibung und Ausstattung
                    festlegen.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    busy
                  }
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                  aria-label="Formular schließen"
                >
                  <X
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              </div>

              {/* Grunddaten */}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {/* Titel */}

                <label className="grid gap-1.5 xl:col-span-2">
                  <span className="text-xs font-medium text-slate-600">
                    Öffentlicher Titel *
                  </span>

                  <input
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                    value={
                      form.title
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          currentForm
                        ) => ({
                          ...currentForm,

                          title:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="z. B. Ferienhaus Düne 7"
                  />
                </label>

                {/* Ort */}

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-600">
                    Ort *
                  </span>

                  <input
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                    value={
                      form.location
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          currentForm
                        ) => ({
                          ...currentForm,

                          location:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="z. B. Holm"
                  />
                </label>

                {/* Personen */}

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-600">
                    Maximale Personenzahl
                  </span>

                  <input
                    type="number"
                    min={1}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                    value={
                      form.maxPersons
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          currentForm
                        ) => ({
                          ...currentForm,

                          maxPersons:
                            Number(
                              event
                                .target
                                .value ||
                                1
                            ),
                        })
                      )
                    }
                  />
                </label>

                {/* Slug */}

                <label className="grid gap-1.5 sm:col-span-2 xl:col-span-4">
                  <span className="text-xs font-medium text-slate-600">
                    Slug
                  </span>

                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                    value={
                      form.slug
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          currentForm
                        ) => ({
                          ...currentForm,

                          slug:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Wird ansonsten automatisch erzeugt"
                  />
                </label>
              </div>

              {/* Hunde */}

              <label className="inline-flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700 ring-1 ring-slate-100">
                <input
                  type="checkbox"
                  checked={
                    form.dogsAllowed
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        currentForm
                      ) => ({
                        ...currentForm,

                        dogsAllowed:
                          event
                            .target
                            .checked,
                      })
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />

                <Dog
                  className="h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />

                Hunde sind in dieser Unterkunft erlaubt
              </label>

              {/* ==================================================
                  Kuschelwochen
              ================================================== */}

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm ring-1 ring-amber-200"
                    aria-hidden="true"
                  >
                    <Heart className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-950">
                          Ostsee-Kuschelwochen
                        </h3>

                        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
                          Ist der Haken gesetzt, nimmt dieses Objekt
                          an den Ostsee-Kuschelwochen teil und kann
                          über den entsprechenden Suchfilter
                          gefunden werden.
                        </p>
                      </div>

                      <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm">
                        <input
                          type="checkbox"
                          checked={
                            form.kuschelwochenEnabled
                          }
                          onChange={(
                            event
                          ) =>
                            setForm(
                              (
                                currentForm
                              ) => ({
                                ...currentForm,

                                kuschelwochenEnabled:
                                  event
                                    .target
                                    .checked,
                              })
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />

                        Für Kuschelwochen freigeben
                      </label>
                    </div>

                    {!editing &&
                      form.kuschelwochenEnabled && (
                        <p className="mt-3 text-[11px] font-medium text-amber-800">
                          Bei neuen Objekten ist diese Option
                          standardmäßig aktiviert.
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* ==================================================
                  Beschreibung
              ================================================== */}

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Beschreibung
                    </h3>

                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                      Markdown wird unterstützt. Die Vorschau zeigt
                      direkt, wie der Text später auf der
                      Objektseite erscheint.
                    </p>
                  </div>

                  <span className="inline-flex w-fit rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 ring-1 ring-slate-200">
                    Markdown
                  </span>
                </div>

                {/* Markdown Hilfe */}

                <div
                  className="flex flex-wrap gap-1.5"
                  aria-label="Markdown-Kurzhilfe"
                >
                  <span className="rounded-md bg-white px-2 py-1 font-mono text-[10px] text-slate-600 ring-1 ring-slate-200">
                    **fett**
                  </span>

                  <span className="rounded-md bg-white px-2 py-1 font-mono text-[10px] text-slate-600 ring-1 ring-slate-200">
                    *kursiv*
                  </span>

                  <span className="rounded-md bg-white px-2 py-1 font-mono text-[10px] text-slate-600 ring-1 ring-slate-200">
                    ## Überschrift
                  </span>

                  <span className="rounded-md bg-white px-2 py-1 font-mono text-[10px] text-slate-600 ring-1 ring-slate-200">
                    - Liste
                  </span>

                  <span className="rounded-md bg-white px-2 py-1 font-mono text-[10px] text-slate-600 ring-1 ring-slate-200">
                    [Link](URL)
                  </span>

                  <span className="rounded-md bg-white px-2 py-1 font-mono text-[10px] text-slate-600 ring-1 ring-slate-200">
                    &gt; Hinweis
                  </span>
                </div>

                {/* Editor / Vorschau */}

                <div
                  className={[
                    "grid gap-4",

                    form.description?.trim()
                      ? "xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]"
                      : "grid-cols-1",
                  ].join(" ")}
                >
                  <label className="grid min-w-0 gap-1.5">
                    <span className="text-xs font-medium text-slate-600">
                      Markdown bearbeiten
                    </span>

                    <textarea
                      rows={18}
                      className="min-h-[34rem] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 font-mono text-xs leading-5 text-slate-900 shadow-sm outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                      value={
                        form.description
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            currentForm
                          ) => ({
                            ...currentForm,

                            description:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder={`Gemütliche Ferienwohnung **direkt an der Ostsee**.

## Das erwartet Sie

- WLAN
- Balkon
- Parkplatz

> Ideal für einen entspannten Ostseeurlaub.`}
                    />
                  </label>

                  {form.description?.trim() && (
                    <section
                      aria-labelledby="description-preview-title"
                      className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                        <div>
                          <h4
                            id="description-preview-title"
                            className="text-xs font-semibold text-slate-800"
                          >
                            Live-Vorschau
                          </h4>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Darstellung auf der öffentlichen
                            Objektseite
                          </p>
                        </div>

                        <Eye
                          className="h-4 w-4 shrink-0 text-slate-400"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="max-h-[34rem] overflow-y-auto p-4 sm:p-5">
                        <MarkdownContent
                          content={
                            form.description
                          }
                        />
                      </div>
                    </section>
                  )}
                </div>

                <p className="text-[11px] leading-5 text-slate-500">
                  Bestehende Beschreibungen ohne Markdown
                  funktionieren weiterhin als normaler Fließtext.
                  Rohes HTML wird nicht benötigt.
                </p>
              </div>

              {/* ==================================================
                  Ausstattung
              ================================================== */}

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Ausstattung
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Vorhandene Merkmale auswählen oder eine neue
                      Ausstattung ergänzen.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAmenityInput(
                        (
                          currentValue
                        ) =>
                          !currentValue
                      );

                      setNewAmenityName(
                        ""
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
                  >
                    <Plus
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />

                    Neue Ausstattung
                  </button>
                </div>

                {/* Neue Ausstattung */}

                {showAmenityInput && (
                  <div className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-sky-50 p-3 sm:flex-row">
                    <input
                      autoFocus
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                      placeholder="z. B. WLAN"
                      value={
                        newAmenityName
                      }
                      onChange={(
                        event
                      ) =>
                        setNewAmenityName(
                          event
                            .target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          event.preventDefault();

                          addAmenityInline(
                            event
                          );
                        }

                        if (
                          event.key ===
                          "Escape"
                        ) {
                          setNewAmenityName(
                            ""
                          );

                          setShowAmenityInput(
                            false
                          );
                        }
                      }}
                    />

                    <button
                      type="button"
                      disabled={
                        busy
                      }
                      onClick={
                        addAmenityInline
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:opacity-60"
                    >
                      <Save
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />

                      Hinzufügen
                    </button>
                  </div>
                )}

                {/* Ausstattungen */}

                {amenities.length ===
                0 ? (
                  <p className="text-sm text-slate-500">
                    Noch keine Ausstattung hinterlegt.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {amenities.map(
                      (
                        amenity
                      ) => {
                        const checked =
                          form.amenityNames.includes(
                            amenity.name
                          );

                        return (
                          <label
                            key={
                              amenity.id
                            }
                            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                              checked
                                ? "border-sky-300 bg-sky-50 text-sky-900"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleAmenity(
                                  amenity.name
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />

                            <span className="truncate">
                              {
                                amenity.name
                              }
                            </span>
                          </label>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* Formular Aktionen */}

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    busy
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Abbrechen
                </button>

                <button
                  type="submit"
                  disabled={
                    busy
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save
                    className="h-4 w-4"
                    aria-hidden="true"
                  />

                  {busy
                    ? "Wird gespeichert …"
                    : editing
                      ? "Änderungen speichern"
                      : "Objekt anlegen"}
                </button>
              </div>
            </form>
          </div>
        )}

      {/* ======================================================
          Objektübersicht
      ====================================================== */}

      <div className="mb-5 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Objektübersicht
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Standardmäßig werden alle Objekte angezeigt. Bei Bedarf
            kannst du nach Ortschaft und Objekt filtern.
          </p>
        </div>

        {/* ====================================================
            Filter
        ==================================================== */}

        {items.length >
          0 && (
          <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-2 xl:grid-cols-[220px_280px_minmax(300px,1fr)_auto] xl:items-end">
            {/* Ortschaft */}

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-slate-600">
                Ortschaft
              </span>

              <select
                value={
                  selectedLocation
                }
                onChange={
                  handleLocationFilterChange
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
              >
                <option value="">
                  Alle Ortschaften
                </option>

                {locations.map(
                  (
                    location
                  ) => (
                    <option
                      key={
                        location
                      }
                      value={
                        location
                      }
                    >
                      {
                        location
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            {/* Objekt */}

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-slate-600">
                Objekt
              </span>

              <select
                value={
                  selectedPropertyId
                }
                onChange={
                  handlePropertyFilterChange
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
              >
                <option value="">
                  Alle Objekte
                </option>

                {availableObjectOptions.map(
                  (item) => (
                    <option
                      key={
                        item.id
                      }
                      value={
                        item.id
                      }
                    >
                      {getAdminPropertyName(
                        item
                      )}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* Suche */}

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-slate-600">
                Suche
              </span>

              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />

                <input
                  type="search"
                  value={
                    searchTerm
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchTerm(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Objekt, Ort, Slug oder ID suchen …"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchTerm(
                        ""
                      )
                    }
                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </label>

            {/* Anzahl */}

            <span className="w-fit shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 xl:mb-2.5">
              {searchTerm.trim() ||
              selectedLocation ||
              selectedPropertyId
                ? `${filteredItems.length} von ${items.length}`
                : `${items.length} Objekt${
                    items.length ===
                    1
                      ? ""
                      : "e"
                  }`}
            </span>
          </div>
        )}
      </div>

      {/* ======================================================
          Objektliste
      ====================================================== */}

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">
            Objekte werden geladen …
          </p>
        </div>
      ) : items.length ===
        0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Home className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Noch keine Objekte vorhanden
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Lege zuerst eine Unterkunft an.
          </p>

          {canEdit && (
            <button
              type="button"
              onClick={
                openCreateForm
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
            >
              <Plus className="h-4 w-4" />

              Erstes Objekt anlegen
            </button>
          )}
        </div>
      ) : filteredItems.length ===
        0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Search className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Kein Objekt gefunden
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Für die aktuelle Auswahl wurde keine passende
            Unterkunft gefunden.
          </p>

          <button
            type="button"
            onClick={
              resetFilters
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <X className="h-4 w-4" />

            Filter zurücksetzen
          </button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredItems.map(
            (item) => (
              <article
                id={`admin-property-${item.id}`}
                key={
                  item.id
                }
                className="scroll-mt-28 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
              >
                {/* ============================================
                    Objektinformationen
                ============================================ */}

                <div className="border-b border-slate-100 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Nur kurzer Admin-Name */}

                        <h3 className="truncate text-lg font-semibold text-slate-950">
                          {getAdminPropertyName(
                            item
                          )}
                        </h3>

                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          ID{" "}
                          {
                            item.id
                          }
                        </span>
                      </div>

                      {/* Ort */}

                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPin
                          className="h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />

                        <span className="truncate">
                          {item.location ||
                            "Kein Ort hinterlegt"}
                        </span>
                      </p>
                    </div>

                    {/* Grunddaten */}

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          editRow(
                            item.id
                          )
                        }
                        disabled={
                          busy
                        }
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Pencil
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />

                        Grunddaten
                      </button>
                    )}
                  </div>

                  {/* Eigenschaften */}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      <Users
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />

                      Bis{" "}
                      {item.maxPersons ||
                        "–"}{" "}
                      Personen
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      <Dog
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />

                      Hunde{" "}
                      {item.dogsAllowed
                        ? "erlaubt"
                        : "nicht erlaubt"}
                    </span>

                    {item.kuschelwochenEnabled !==
                      false && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                        <Heart
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />

                        Kuschelwochen
                      </span>
                    )}

                    {item.slug && (
                      <span className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                        /
                        {
                          item.slug
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* ============================================
                    Verwaltungsbereiche
                ============================================ */}

                <div className="p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Objekt verwalten
                  </p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {MANAGEMENT_ITEMS.map(
                      (
                        managementItem
                      ) => {
                        const Icon =
                          managementItem.icon;

                        return (
                          <Link
                            key={
                              managementItem.key
                            }
                            href={`${managementItem.href}?propertyId=${item.id}`}
                            /**
                             * DAS IST FÜR DEINEN WUNSCH
                             * ENTSCHEIDEND:
                             *
                             * Vor dem Wechsel zur Unterseite
                             * wird das Objekt gespeichert.
                             */
                            onClick={() =>
                              rememberProperty(
                                item
                              )
                            }
                            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition hover:border-sky-200 hover:bg-sky-50"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm ring-1 ring-slate-200 transition group-hover:ring-sky-200">
                              <Icon
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </span>

                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-slate-900 group-hover:text-sky-800">
                                {
                                  managementItem.title
                                }
                              </span>

                              <span className="block truncate text-xs text-slate-500">
                                {
                                  managementItem.description
                                }
                              </span>
                            </span>
                          </Link>
                        );
                      }
                    )}
                  </div>

                  {/* ==========================================
                      Vorschau / iCal / Löschen
                  ========================================== */}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {item.slug ? (
                        <>
                          {/* Vorschau */}

                          <a
                            href={`/properties/${item.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />

                            Vorschau
                          </a>

                          {/* iCal */}

                          <a
                            href={`/api/ical/${item.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <Calendar
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />

                            iCal-Export
                          </a>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Vorschau erst nach Vergabe eines Slugs
                          verfügbar.
                        </span>
                      )}
                    </div>

                    {/* Löschen */}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() =>
                          askRemoveRow(
                            item
                          )
                        }
                        disabled={
                          busy
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        <Trash2
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />

                        Löschen
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}

      {/* ======================================================
          Löschdialog
      ====================================================== */}

      {pendingDelete &&
        canDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-property-title"
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                <Trash2
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </div>

              <h2
                id="delete-property-title"
                className="mt-4 text-lg font-semibold text-slate-950"
              >
                Objekt dauerhaft löschen?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Das Objekt und die damit verbundenen Daten können
                anschließend nicht wiederhergestellt werden.
              </p>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <p className="font-medium text-slate-900">
                  {getAdminPropertyName(
                    pendingDelete
                  )}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {
                    pendingDelete.location
                  }
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPendingDelete(
                      null
                    )
                  }
                  disabled={
                    busy
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Abbrechen
                </button>

                <button
                  type="button"
                  onClick={
                    confirmRemove
                  }
                  disabled={
                    busy
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
                >
                  <Trash2
                    className="h-4 w-4"
                    aria-hidden="true"
                  />

                  {busy
                    ? "Wird gelöscht …"
                    : "Ja, löschen"}
                </button>
              </div>
            </div>
          </div>
        )}
    </section>
  );
}