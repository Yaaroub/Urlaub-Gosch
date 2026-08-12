"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import HeaderWebcams from "@/components/HeaderWebcams";

import {
  ArrowRight,
  BookOpen,
  Building2,
  Compass,
  FileText,
  Heart,
  Loader2,
  MapPin,
  Menu,
  Search,
  X,
} from "lucide-react";

const NAV = [
  { href: "/offers", label: "Angebote" },
  { href: "/blog", label: "Regionen" },
  { href: "/about", label: "Über uns" },
  { href: "/contact", label: "Kontakt" },
];

function ResultIcon({ type }) {
  if (type === "property") {
    return <Building2 className="h-5 w-5" />;
  }

  if (type === "activity") {
    return <Compass className="h-5 w-5" />;
  }

  if (type === "article") {
    return <BookOpen className="h-5 w-5" />;
  }

  return <FileText className="h-5 w-5" />;
}

function ResultType({ type }) {
  if (type === "property") return "Unterkunft";
  if (type === "activity") return "Aktivität";
  if (type === "article") return "Region & Ratgeber";

  return "Seite";
}

export default function Header() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [webcamsOpen, setWebcamsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const searchInputRef = useRef(null);

  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(!isHome || window.scrollY > 32);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isHome]);

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
    setWebcamsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open && !searchOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        setOpen(false);
        setWebcamsOpen(false);
        setSearchOpen(true);

        return;
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setOpen(false);
        setWebcamsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!searchOpen || trimmedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setSearchError(false);

      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setSearchError(false);

        const response = await fetch(
          `/api/site-search?q=${encodeURIComponent(trimmedQuery)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Suche antwortet mit ${response.status}`
          );
        }

        const data = await response.json();

        setResults(
          Array.isArray(data?.items)
            ? data.items
            : []
        );
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error(
          "Globale Suche fehlgeschlagen:",
          error
        );

        setResults([]);
        setSearchError(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchOpen]);

  const compact =
    scrolled ||
    open ||
    searchOpen ||
    webcamsOpen;

  const isActive = (href) => {
    if (href.startsWith("/#")) {
      return false;
    }

    return href === "/"
      ? pathname === "/"
      : pathname?.startsWith(href);
  };

  const openGlobalSearch = () => {
    setOpen(false);
    setWebcamsOpen(false);
    setSearchOpen(true);
  };

  const closeGlobalSearch = () => {
    setSearchOpen(false);

    window.setTimeout(() => {
      setQuery("");
      setResults([]);
      setSearchError(false);
    }, 200);
  };

  const toggleMobileMenu = () => {
    setWebcamsOpen(false);

    setOpen((value) => !value);
  };

  const toggleWebcams = (value) => {
    setOpen(false);
    setSearchOpen(false);
    setWebcamsOpen(value);
  };

  const groupedCounts = results.reduce(
    (accumulator, item) => {
      accumulator[item.type] =
        (accumulator[item.type] || 0) + 1;

      return accumulator;
    },
    {}
  );

  return (
    <>
      <header
        className="
          fixed inset-x-0 top-0 z-50
          px-4 pt-4
          transition-all duration-300
          sm:px-6 sm:pt-5
          lg:px-8
        "
      >
        <div
          className={[
            `
              mx-auto flex max-w-7xl
              items-center justify-between
              transition-all duration-300
            `,
            compact
              ? `
                  h-[62px]
                  rounded-full
                  bg-white/88
                  px-4
                  shadow-[0_18px_60px_rgba(7,19,31,0.13)]
                  backdrop-blur-2xl
                  sm:h-[68px]
                  sm:px-5
                `
              : `
                  h-[76px]
                  bg-transparent
                  px-0
                  shadow-none
                  backdrop-blur-0
                  sm:h-[82px]
                `,
          ].join(" ")}
        >
          <Link
            href="/"
            aria-label="Zur Startseite"
            className="flex shrink-0 items-center"
          >
            <Image
              src="/urlaub-gosch-logo.png"
              alt="Urlaub Gosch Logo"
              width={160}
              height={90}
              sizes="(max-width: 640px) 112px, 160px"
              priority
              quality={85}
              className={[
                `
                  w-auto object-contain
                  transition-all duration-300
                `,
                compact
                  ? "h-10 sm:h-12"
                  : "h-12 sm:h-14 lg:h-16",
              ].join(" ")}
            />
          </Link>

          <nav
            aria-label="Hauptnavigation"
            className="
              hidden items-center gap-2
              lg:flex
            "
          >
            {NAV.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    `
                      rounded-full
                      px-4 py-2.5
                      text-sm font-extrabold
                      tracking-wide
                      transition
                    `,
                    active
                      ? "bg-[#07131f] text-white"
                      : `
                          text-[#07131f]/80
                          hover:bg-white/45
                          hover:text-[#07131f]
                        `,
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div
            className="
              flex shrink-0
              items-center
              gap-2
              sm:gap-3
            "
          >
            {/* Favoriten */}
            <Link
              href="/favorites"
              aria-label="Favoriten"
              onClick={() => {
                setWebcamsOpen(false);
              }}
              className={[
                `
                  grid place-items-center
                  rounded-full
                  text-[#07131f]
                  transition
                  hover:bg-white/70
                `,
                compact
                  ? `
                      h-10 w-10
                      bg-white/55
                      sm:h-11 sm:w-11
                    `
                  : `
                      h-11 w-11
                      bg-white/28
                      backdrop-blur-md
                      sm:h-12 sm:w-12
                    `,
              ].join(" ")}
            >
              <Heart className="h-5 w-5" />
            </Link>

            {/* Strand-Webcams */}
            <HeaderWebcams
              compact={compact}
              open={webcamsOpen}
              onOpenChange={toggleWebcams}
            />

            {/* Desktop-Suche */}
            <button
              type="button"
              onClick={openGlobalSearch}
              className={[
                `
                  hidden items-center gap-2
                  rounded-full
                  bg-[#e8c375]
                  text-sm font-extrabold
                  text-[#07131f]
                  shadow-[0_12px_35px_rgba(7,19,31,0.12)]
                  transition
                  hover:-translate-y-0.5
                  hover:bg-[#f2d58e]
                  md:inline-flex
                `,
                compact
                  ? "min-h-11 px-5 py-3"
                  : "min-h-12 px-6 py-3.5",
              ].join(" ")}
            >
              <Search className="h-4 w-4" />

              Suchen
            </button>

            {/* Mobile-Menü */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-label={
                open
                  ? "Menü schließen"
                  : "Menü öffnen"
              }
              aria-expanded={open}
              className={[
                `
                  grid place-items-center
                  rounded-full
                  text-[#07131f]
                  transition
                  hover:bg-white/70
                  lg:hidden
                `,
                compact
                  ? `
                      h-10 w-10
                      bg-white/55
                      sm:h-11 sm:w-11
                    `
                  : `
                      h-11 w-11
                      bg-white/28
                      backdrop-blur-md
                      sm:h-12 sm:w-12
                    `,
              ].join(" ")}
            >
              {open ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {open && (
        <div
          className="
            fixed inset-0 z-40
            bg-[#07131f]/96
            px-4 pb-6 pt-24
            text-white
            backdrop-blur-2xl
            lg:hidden
          "
        >
          <div
            className="
              mx-auto flex h-full
              max-w-md flex-col
            "
          >
            <div
              className="
                rounded-[2rem]
                border border-white/10
                bg-white/[0.08]
                p-2
                shadow-2xl
                shadow-black/30
              "
            >
              {NAV.map((item) => {
                const active =
                  isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setOpen(false);
                    }}
                    className={[
                      `
                        flex items-center
                        justify-between
                        rounded-[1.35rem]
                        px-5 py-4
                        text-lg font-semibold
                        transition
                      `,
                      active
                        ? `
                            bg-[#e8c375]
                            text-[#07131f]
                          `
                        : `
                            text-white/82
                            hover:bg-white/10
                            hover:text-white
                          `,
                    ].join(" ")}
                  >
                    {item.label}

                    <span
                      className="
                        text-sm opacity-60
                      "
                    >
                      →
                    </span>
                  </Link>
                );
              })}

              <Link
                href="/favorites"
                onClick={() => {
                  setOpen(false);
                }}
                className="
                  mt-2 flex
                  items-center
                  justify-between
                  rounded-[1.35rem]
                  px-5 py-4
                  text-lg font-semibold
                  text-white/82
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
              >
                Favoriten

                <Heart className="h-5 w-5" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);

                  window.setTimeout(() => {
                    setWebcamsOpen(true);
                  }, 120);
                }}
                className="
                  mt-2 flex w-full
                  items-center
                  justify-between
                  rounded-[1.35rem]
                  px-5 py-4
                  text-left
                  text-lg font-semibold
                  text-white/82
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
              >
                Strand-Webcams

                <span
                  className="
                    rounded-full
                    bg-[#e8c375]
                    px-2 py-0.5
                    text-[10px] font-black
                    text-[#07131f]
                  "
                >
                  2
                </span>
              </button>
            </div>

            <div
              className="
                mt-auto
                rounded-[2rem]
                border border-white/10
                bg-white/[0.08]
                p-5
                shadow-2xl
                shadow-black/20
              "
            >
              <p
                className="
                  text-sm leading-6
                  text-white/70
                "
              >
                Suche in Unterkünften, Regionen,
                Aktivitäten und Urlaubstipps.
              </p>

              <button
                type="button"
                onClick={openGlobalSearch}
                className="
                  mt-4 inline-flex
                  min-h-12 w-full
                  items-center
                  justify-center gap-2
                  rounded-full
                  bg-[#e8c375]
                  px-5 py-3.5
                  text-sm font-bold
                  text-[#07131f]
                  transition
                  hover:bg-white
                "
              >
                Gesamte Seite durchsuchen

                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Globale Suche */}
      {searchOpen && (
        <div
          className="
            fixed inset-0 z-[70]
            overflow-y-auto
            bg-[#07131f]/80
            px-3 py-5
            backdrop-blur-xl
            sm:px-6 sm:py-10
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeGlobalSearch();
            }
          }}
        >
          <div
            className="
              mx-auto w-full max-w-3xl
              overflow-hidden
              rounded-[2rem]
              border border-white/15
              bg-[#f7fafc]
              shadow-[0_30px_100px_rgba(0,0,0,0.45)]
            "
          >
            <div
              className="
                bg-[#07131f]
                p-4 sm:p-6
              "
            >
              <div
                className="
                  flex items-center
                  justify-between gap-4
                "
              >
                <div>
                  <p
                    className="
                      text-[11px]
                      font-bold uppercase
                      tracking-[0.2em]
                      text-[#e8c375]
                    "
                  >
                    Urlaub GOSCH
                  </p>

                  <h2
                    className="
                      mt-1
                      text-xl font-extrabold
                      tracking-tight text-white
                      sm:text-2xl
                    "
                  >
                    Gesamte Seite durchsuchen
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeGlobalSearch}
                  aria-label="Suche schließen"
                  className="
                    grid h-11 w-11
                    shrink-0 place-items-center
                    rounded-full
                    border border-white/10
                    bg-white/10
                    text-white
                    transition
                    hover:bg-white/20
                  "
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative mt-5">
                <Search
                  className="
                    pointer-events-none
                    absolute left-4 top-1/2
                    h-5 w-5
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  ref={searchInputRef}
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(
                      event.target.value
                    );
                  }}
                  placeholder="z. B. Laboe, Museum, Strand, Ferienwohnung …"
                  autoComplete="off"
                  aria-label="Gesamte Seite durchsuchen"
                  className="
                    h-14 w-full
                    rounded-2xl
                    border-0
                    bg-white
                    pl-12 pr-12
                    text-base font-semibold
                    text-[#07131f]
                    shadow-sm
                    outline-none
                    ring-2
                    ring-transparent
                    transition
                    placeholder:font-normal
                    placeholder:text-slate-400
                    focus:ring-[#e8c375]
                  "
                />

                {loading ? (
                  <Loader2
                    className="
                      absolute right-4 top-1/2
                      h-5 w-5
                      -translate-y-1/2
                      animate-spin
                      text-slate-400
                    "
                  />
                ) : query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                    }}
                    aria-label="Suchtext löschen"
                    className="
                      absolute right-3 top-1/2
                      grid h-8 w-8
                      -translate-y-1/2
                      place-items-center
                      rounded-full
                      text-slate-400
                      transition
                      hover:bg-slate-100
                      hover:text-slate-700
                    "
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div
                className="
                  mt-3 flex flex-wrap
                  items-center gap-2
                  text-[11px] font-semibold
                  text-white/55
                "
              >
                <span>Unterkünfte</span>
                <span>•</span>
                <span>Orte & Straßen</span>
                <span>•</span>
                <span>Aktivitäten</span>
                <span>•</span>
                <span>Regionen</span>
                <span>•</span>
                <span>Ratgeber</span>
              </div>
            </div>

            <div
              className="
                max-h-[calc(100vh-270px)]
                min-h-[260px]
                overflow-y-auto
                p-3
                sm:max-h-[560px]
                sm:p-5
              "
            >
              {query.trim().length < 2 ? (
                <div
                  className="
                    flex min-h-[240px]
                    flex-col
                    items-center
                    justify-center
                    px-6 text-center
                  "
                >
                  <div
                    className="
                      grid h-16 w-16
                      place-items-center
                      rounded-full
                      bg-sky-50
                      text-sky-700
                    "
                  >
                    <Search className="h-7 w-7" />
                  </div>

                  <h3
                    className="
                      mt-5
                      text-lg font-extrabold
                      text-[#07131f]
                    "
                  >
                    Was möchtest du finden?
                  </h3>

                  <p
                    className="
                      mt-2 max-w-sm
                      text-sm leading-6
                      text-slate-500
                    "
                  >
                    Gib mindestens zwei Zeichen ein.
                    Du kannst zum Beispiel nach einem
                    Ort, einer Unterkunft, einer Straße
                    oder einem Ausflugsziel suchen.
                  </p>
                </div>
              ) : null}

              {query.trim().length >= 2 &&
              !loading &&
              searchError ? (
                <div
                  className="
                    flex min-h-[240px]
                    items-center
                    justify-center
                    px-6 text-center
                  "
                >
                  <div>
                    <p
                      className="
                        text-lg font-extrabold
                        text-[#07131f]
                      "
                    >
                      Suche momentan nicht verfügbar
                    </p>

                    <p
                      className="
                        mt-2
                        text-sm text-slate-500
                      "
                    >
                      Bitte versuche es noch einmal.
                    </p>
                  </div>
                </div>
              ) : null}

              {query.trim().length >= 2 &&
              !loading &&
              !searchError &&
              results.length === 0 ? (
                <div
                  className="
                    flex min-h-[240px]
                    items-center
                    justify-center
                    px-6 text-center
                  "
                >
                  <div>
                    <p
                      className="
                        text-lg font-extrabold
                        text-[#07131f]
                      "
                    >
                      Keine Treffer gefunden
                    </p>

                    <p
                      className="
                        mt-2
                        text-sm text-slate-500
                      "
                    >
                      Versuche einen anderen Begriff
                      oder nur einen Teil des Namens.
                    </p>
                  </div>
                </div>
              ) : null}

              {results.length > 0 ? (
                <>
                  <div
                    className="
                      mb-3 flex flex-wrap
                      items-center
                      justify-between
                      gap-3 px-1
                    "
                  >
                    <p
                      className="
                        text-sm font-bold
                        text-[#07131f]
                      "
                    >
                      {results.length} Treffer
                    </p>

                    <div
                      className="
                        flex flex-wrap gap-1.5
                        text-[10px] font-bold
                        uppercase tracking-wide
                        text-slate-500
                      "
                    >
                      {groupedCounts.property ? (
                        <span
                          className="
                            rounded-full
                            bg-white
                            px-2.5 py-1
                            ring-1
                            ring-slate-200
                          "
                        >
                          {groupedCounts.property}{" "}
                          Unterkünfte
                        </span>
                      ) : null}

                      {groupedCounts.activity ? (
                        <span
                          className="
                            rounded-full
                            bg-white
                            px-2.5 py-1
                            ring-1
                            ring-slate-200
                          "
                        >
                          {groupedCounts.activity}{" "}
                          Aktivitäten
                        </span>
                      ) : null}

                      {groupedCounts.article ? (
                        <span
                          className="
                            rounded-full
                            bg-white
                            px-2.5 py-1
                            ring-1
                            ring-slate-200
                          "
                        >
                          {groupedCounts.article}{" "}
                          Inhalte
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {results.map((item) => (
                      <Link
                        key={`${item.type}-${item.href}`}
                        href={item.href}
                        onClick={closeGlobalSearch}
                        className="
                          group flex items-center
                          gap-4 rounded-2xl
                          border border-slate-200
                          bg-white p-4
                          transition
                          hover:-translate-y-0.5
                          hover:border-sky-200
                          hover:shadow-lg
                          hover:shadow-sky-950/5
                        "
                      >
                        <div
                          className="
                            grid h-11 w-11
                            shrink-0 place-items-center
                            rounded-xl
                            bg-[#07131f]
                            text-[#e8c375]
                          "
                        >
                          <ResultIcon
                            type={item.type}
                          />
                        </div>

                        <div
                          className="
                            min-w-0 flex-1
                          "
                        >
                          <div
                            className="
                              flex flex-wrap
                              items-center gap-2
                            "
                          >
                            <span
                              className="
                                text-[10px]
                                font-extrabold
                                uppercase
                                tracking-[0.14em]
                                text-sky-700
                              "
                            >
                              <ResultType
                                type={item.type}
                              />
                            </span>

                            {item.location ? (
                              <span
                                className="
                                  inline-flex
                                  items-center
                                  gap-1
                                  text-[11px]
                                  text-slate-400
                                "
                              >
                                <MapPin className="h-3 w-3" />

                                {item.location}
                              </span>
                            ) : null}
                          </div>

                          <p
                            className="
                              mt-1 truncate
                              font-extrabold
                              text-[#07131f]
                            "
                          >
                            {item.title}
                          </p>

                          {item.description ? (
                            <p
                              className="
                                mt-1 line-clamp-2
                                text-xs leading-5
                                text-slate-500
                              "
                            >
                              {item.description}
                            </p>
                          ) : null}
                        </div>

                        <ArrowRight
                          className="
                            h-5 w-5
                            shrink-0
                            text-slate-300
                            transition
                            group-hover:translate-x-1
                            group-hover:text-sky-600
                          "
                        />
                      </Link>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div
              className="
                flex items-center
                justify-between gap-4
                border-t border-slate-200
                bg-white
                px-4 py-3
                text-[11px]
                text-slate-400
                sm:px-6
              "
            >
              <span>
                Suche im öffentlichen Urlaub-GOSCH-Bereich
              </span>

              <span className="hidden sm:block">
                ESC zum Schließen
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}