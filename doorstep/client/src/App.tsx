import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpRight,
  Bath,
  BedDouble,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  MoveRight,
  Phone,
  Plus,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import AuthDialog from "./components/AuthDialog";
import DashboardDialog, { DoorstepUser } from "./components/DashboardDialog";
import ListingDialog from "./components/ListingDialog";

type Purpose = "sale" | "rent" | "short_stay";
type Listing = {
  id: string;
  purpose: Purpose;
  title: string;
  neighborhood: string;
  city: string;
  county: string;
  price: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  description: string;
  agentName: string;
  agentPhone: string;
  agency: string;
  verified: boolean;
  images?: string[];
  maxGuests?: number;
  minimumNights?: number;
  stayType?: string;
  availabilityStart?: string;
  availabilityEnd?: string;
};

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const sampleListings: Listing[] = [
  {
    id: "sample-1",
    purpose: "sale",
    title: "Light-filled home with garden",
    neighborhood: "Karen",
    city: "Nairobi",
    county: "Nairobi",
    price: 48500000,
    propertyType: "House",
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85",
    description:
      "A quietly set family home with generous indoor-outdoor living, mature planting and a separate staff quarter.",
    agentName: "Njeri Wambui",
    agentPhone: "254712345678",
    agency: "Kifaru Realty",
    verified: true,
  },
  {
    id: "sample-2",
    purpose: "rent",
    title: "Calm, contemporary city apartment",
    neighborhood: "Kilimani",
    city: "Nairobi",
    county: "Nairobi",
    price: 145000,
    propertyType: "Apartment",
    bedrooms: 2,
    bathrooms: 2,
    area: 112,
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
    description:
      "An airy two-bedroom apartment close to Yaya Centre, with a balcony, lift access and secure parking.",
    agentName: "Brian Otieno",
    agentPhone: "254722345678",
    agency: "Mtaa Homes",
    verified: true,
  },
  {
    id: "sample-3",
    purpose: "sale",
    title: "Warm modern townhouse",
    neighborhood: "Lavington",
    city: "Nairobi",
    county: "Nairobi",
    price: 36700000,
    propertyType: "Townhouse",
    bedrooms: 3,
    bathrooms: 3,
    area: 206,
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85",
    description:
      "A well-proportioned townhouse in a small gated community, with a private patio and shared green space.",
    agentName: "Amina Hassan",
    agentPhone: "254733456789",
    agency: "Kifaru Realty",
    verified: true,
  },
  {
    id: "sample-4",
    purpose: "rent",
    title: "A softer pace by the coast",
    neighborhood: "Nyali",
    city: "Mombasa",
    county: "Mombasa",
    price: 95000,
    propertyType: "Apartment",
    bedrooms: 2,
    bathrooms: 2,
    area: 98,
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85",
    description:
      "A bright coastal apartment with a breezy balcony and easy access to Nyali Beach and local shops.",
    agentName: "Kevin Muli",
    agentPhone: "254744567890",
    agency: "Pwani Property Co.",
    verified: true,
  },
  {
    id: "sample-5",
    purpose: "sale",
    title: "A private retreat in the suburbs",
    neighborhood: "Runda",
    city: "Nairobi",
    county: "Nairobi",
    price: 72500000,
    propertyType: "House",
    bedrooms: 5,
    bathrooms: 4,
    area: 410,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    description:
      "A spacious home on a leafy plot, with a covered terrace, family room and room to make the garden your own.",
    agentName: "Njeri Wambui",
    agentPhone: "254712345678",
    agency: "Kifaru Realty",
    verified: true,
  },
  {
    id: "sample-6",
    purpose: "rent",
    title: "A bright home above the city",
    neighborhood: "Westlands",
    city: "Nairobi",
    county: "Nairobi",
    price: 210000,
    propertyType: "Apartment",
    bedrooms: 3,
    bathrooms: 2,
    area: 154,
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85",
    description:
      "A well-finished apartment near Sarit Centre, with open-plan living, a balcony and residents’ gym.",
    agentName: "Brian Otieno",
    agentPhone: "254722345678",
    agency: "Mtaa Homes",
    verified: true,
  },
  {
    id: "sample-7",
    purpose: "short_stay",
    title: "A calm city hideaway in Kilimani",
    neighborhood: "Kilimani",
    city: "Nairobi",
    county: "Nairobi",
    price: 8500,
    propertyType: "Apartment",
    bedrooms: 1,
    bathrooms: 1,
    area: 62,
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
    description:
      "A bright, self-contained stay near cafés and Yaya Centre. Check dates with the host before you travel.",
    agentName: "Brian Otieno",
    agentPhone: "254722345678",
    agency: "Mtaa Homes",
    verified: true,
    maxGuests: 2,
    minimumNights: 2,
    stayType: "Entire place",
  },
  {
    id: "sample-8",
    purpose: "short_stay",
    title: "Coastal mornings in a Nyali villa",
    neighborhood: "Nyali",
    city: "Mombasa",
    county: "Mombasa",
    price: 18500,
    propertyType: "House",
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    image:
      "https://images.unsplash.com/photo-1600047509782-20d39509f26d?auto=format&fit=crop&w=1200&q=85",
    description:
      "A private coastal home with a shaded outdoor space, a short drive from Nyali Beach. Dates are confirmed with the host.",
    agentName: "Kevin Muli",
    agentPhone: "254744567890",
    agency: "Pwani Property Co.",
    verified: true,
    maxGuests: 6,
    minimumNights: 2,
    stayType: "Entire place",
  },
];

const formatPrice = (price: number, purpose: Purpose) => {
  const amount = new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(price);
  if (purpose === "rent") return `KSh ${amount} / month`;
  if (purpose === "short_stay") return `KSh ${amount} / night`;
  return `KSh ${amount}`;
};

function localDateInputValue() {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function stayTypeLabel(stayType?: string) {
  if (stayType === "private_room") return "Private room";
  if (stayType === "shared_room") return "Shared room";
  return "Entire place";
}

function getMapUrl(search: string) {
  const normalized = search.toLowerCase();
  const places = [
    {
      words: ["mombasa", "nyali", "bamburi"],
      bounds: "39.55,-4.16,39.78,-3.91",
      marker: "-4.043,39.668",
    },
    {
      words: ["kisumu"],
      bounds: "34.67,-0.18,34.87,0.02",
      marker: "-0.092,34.768",
    },
    {
      words: ["nakuru"],
      bounds: "35.95,-0.40,36.22,-0.21",
      marker: "-0.303,36.08",
    },
  ];
  const place = places.find((candidate) =>
    candidate.words.some((word) => normalized.includes(word)),
  );
  const params = new URLSearchParams({
    bbox: place?.bounds || "36.66,-1.40,36.98,-1.17",
    layer: "mapnik",
    marker: place?.marker || "-1.286,36.817",
  });
  return `https://www.openstreetmap.org/export/embed.html?${params}`;
}

function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
}

function normalizeListing(value: Record<string, unknown>): Listing {
  const images = Array.isArray(value.images)
    ? value.images.filter((image): image is string => typeof image === "string")
    : [];
  return {
    id: String(value.id || value._id || crypto.randomUUID()),
    purpose:
      value.purpose === "short_stay"
        ? "short_stay"
        : value.purpose === "rent" || value.type === "rental"
          ? "rent"
          : "sale",
    title: String(value.title || "New property listing"),
    neighborhood: String(value.neighborhood || value.location || "Nairobi"),
    city: String(value.city || "Nairobi"),
    county: String(value.county || "Nairobi"),
    price: Number(value.price || 0),
    propertyType: String(value.propertyType || "Apartment"),
    bedrooms: Number(value.bedrooms || 0),
    bathrooms: Number(value.bathrooms || 0),
    area: Number(value.area || 0),
    image: String(
      Array.isArray(value.images)
        ? value.images[0]
        : value.image || sampleListings[0].image,
    ),
    images,
    description: String(value.description || ""),
    agentName: String(value.agentName || "Doorstep realtor"),
    agentPhone: String(value.agentPhone || ""),
    agency: String(value.agency || "Independent realtor"),
    verified: Boolean(value.verified),
    maxGuests: Number(value.maxGuests || 0),
    minimumNights: Number(value.minimumNights || 1),
    stayType: String(value.stayType || "Entire place"),
    availabilityStart: String(value.availabilityStart || ""),
    availabilityEnd: String(value.availabilityEnd || ""),
  };
}

function App() {
  const [purpose, setPurpose] = useState<Purpose>("sale");
  const [query, setQuery] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [propertyType, setPropertyType] = useState("Any type");
  const [bedrooms, setBedrooms] = useState("Any beds");
  const [budget, setBudget] = useState("Any price");
  const [sortBy, setSortBy] = useState("recommended");
  const [listings, setListings] = useState(sampleListings);
  const [demoMode, setDemoMode] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showListing, setShowListing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [account, setAccount] = useState<DoorstepUser | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/users/me`, { credentials: "same-origin" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (result?.user) {
          setAccount(result.user as DoorstepUser);
          return fetch(`${API_BASE}/users/saved`, {
            credentials: "same-origin",
          })
            .then((response) =>
              response.ok ? response.json() : { listings: [] },
            )
            .then((saved) =>
              setSavedIds(
                (saved.listings || []).map(
                  (listing: { _id: string }) => listing._id,
                ),
              ),
            );
        }
        return undefined;
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ purpose });
    if (query.trim()) params.set("location", query.trim());
    if (propertyType !== "Any type") params.set("propertyType", propertyType);
    if (bedrooms !== "Any beds")
      params.set("minBedrooms", bedrooms.replace("+", ""));
    if (budget !== "Any price") params.set("maxPrice", budget);
    if (purpose === "short_stay") {
      if (checkIn) params.set("checkIn", checkIn);
      if (checkOut) params.set("checkOut", checkOut);
      params.set("guests", guestCount);
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () =>
        fetch(`${API_BASE}/listings?${params}`, { signal: controller.signal })
          .then(async (response) => {
            if (!response.ok)
              throw new Error("Listings service is unavailable");
            return response.json();
          })
          .then((data: unknown) => {
            const rows = Array.isArray(data)
              ? data
              : (data as { listings?: unknown[] }).listings || [];
            setListings(
              rows.map((row) =>
                normalizeListing(row as Record<string, unknown>),
              ),
            );
            setDemoMode(false);
          })
          .catch(() => {
            if (controller.signal.aborted) return;
            setListings(
              sampleListings.filter((listing) => listing.purpose === purpose),
            );
            setDemoMode(true);
          }),
      220,
    );
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [
    purpose,
    query,
    propertyType,
    bedrooms,
    budget,
    checkIn,
    checkOut,
    guestCount,
  ]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => setSelectedPhoto(0), [selected?.id]);

  const visibleListings = useMemo(
    () =>
      listings
        .filter((listing) => {
          const text =
            `${listing.title} ${listing.neighborhood} ${listing.city} ${listing.county} ${listing.propertyType}`.toLowerCase();
          const matchesQuery =
            query.trim() === "" || text.includes(query.trim().toLowerCase());
          const matchesType =
            propertyType === "Any type" ||
            listing.propertyType === propertyType;
          const minBeds =
            bedrooms === "Any beds" ? 0 : Number(bedrooms.replace("+", ""));
          const matchesBeds = listing.bedrooms >= minBeds;
          const maxBudget =
            budget === "Any price"
              ? Infinity
              : Number(budget.replace(/[^0-9]/g, ""));
          const matchesBudget = listing.price <= maxBudget;
          const matchesGuests =
            purpose !== "short_stay" ||
            (listing.maxGuests || 0) >= Number(guestCount);
          const matchesArrival =
            !checkIn ||
            !listing.availabilityStart ||
            listing.availabilityStart <= checkIn;
          const matchesDeparture =
            !checkOut ||
            !listing.availabilityEnd ||
            listing.availabilityEnd >= checkOut;
          const requestedNights =
            checkIn && checkOut
              ? Math.ceil(
                  (new Date(`${checkOut}T00:00:00`).getTime() -
                    new Date(`${checkIn}T00:00:00`).getTime()) /
                    86400000,
                )
              : 0;
          const matchesMinimumStay =
            !checkIn ||
            !checkOut ||
            requestedNights >= (listing.minimumNights || 1);
          const matchesSaved = !savedOnly || savedIds.includes(listing.id);
          return (
            listing.purpose === purpose &&
            matchesQuery &&
            matchesType &&
            matchesBeds &&
            matchesBudget &&
            matchesGuests &&
            matchesArrival &&
            matchesDeparture &&
            matchesMinimumStay &&
            matchesSaved
          );
        })
        .sort((left, right) => {
          if (sortBy === "price-low") return left.price - right.price;
          if (sortBy === "price-high") return right.price - left.price;
          return 0;
        }),
    [
      listings,
      query,
      propertyType,
      bedrooms,
      budget,
      savedOnly,
      savedIds,
      purpose,
      sortBy,
      checkIn,
      checkOut,
      guestCount,
    ],
  );

  function toggleSaved(id: string) {
    if (!account) {
      setShowAuth(true);
      setNotice("Sign in to keep saved homes across devices.");
      return;
    }
    const saved = !savedIds.includes(id);
    setSavedIds((current) =>
      saved ? [...current, id] : current.filter((item) => item !== id),
    );
    if (!demoMode && !id.startsWith("sample-")) {
      fetch(`${API_BASE}/users/saved/${id}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved }),
      })
        .then((response) => {
          if (!response.ok) throw new Error();
        })
        .catch(() => {
          setSavedIds((current) =>
            saved ? current.filter((item) => item !== id) : [...current, id],
          );
          setNotice("Could not save this property. Please try again.");
        });
    }
  }

  function changePurpose(nextPurpose: Purpose) {
    setPurpose(nextPurpose);
    setSavedOnly(false);
    setBudget("Any price");
    setBedrooms("Any beds");
    setCheckIn("");
    setCheckOut("");
    setGuestCount("2");
  }

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API_BASE}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selected.id,
          name: form.get("name"),
          phone: form.get("phone"),
          message: form.get("message"),
        }),
      });
      if (!response.ok) throw new Error("Could not send inquiry");
      setNotice("Your inquiry has been sent to the realtor.");
      setSelected(null);
    } catch {
      const message = encodeURIComponent(
        `Hello, I am interested in ${selected.title} in ${selected.neighborhood}.${selected.purpose === "short_stay" ? ` I am looking for ${checkIn || "flexible dates"} to ${checkOut || "flexible dates"} for ${guestCount} guest(s).` : ""} Please share more details.`,
      );
      window.open(
        `https://wa.me/${whatsappNumber(selected.agentPhone)}?text=${message}`,
        "_blank",
        "noopener,noreferrer",
      );
      setNotice(
        "The inquiry service is offline. We opened WhatsApp so you can contact the realtor directly.",
      );
    }
  }

  async function submitListing(payload: Record<string, unknown>) {
    const response = await fetch(`${API_BASE}/listings`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.message || "Could not submit this property.");
    setShowListing(false);
    setShowDashboard(true);
    setNotice(
      "Property submitted. It will appear publicly after verification.",
    );
  }

  function openListingForm() {
    if (!account) {
      setShowAuth(true);
      setNotice("Sign in or create a realtor account to submit a property.");
    } else if (account.role !== "realtor") {
      setNotice(
        "Your account is a seeker account. Become a realtor from your workspace to publish.",
      );
      setShowDashboard(true);
    } else {
      setShowListing(true);
    }
  }

  async function signOut() {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => undefined);
    setAccount(null);
    setShowDashboard(false);
    setSavedIds([]);
    setNotice("You have signed out.");
  }

  const location = query.trim() || "Nairobi";
  const mapEmbed = getMapUrl(query);
  const selectedImages = selected?.images?.length
    ? selected.images
    : selected
      ? [selected.image]
      : [];

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Doorstep home">
          <span className="brand-mark">
            <Home size={17} strokeWidth={2.4} />
          </span>
          <span>doorstep</span>
          <small>KENYA</small>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <button
            className={purpose === "sale" ? "nav-link selected" : "nav-link"}
            onClick={() => {
              setPurpose("sale");
              setSavedOnly(false);
            }}
          >
            Buy
          </button>
          <button
            className={purpose === "rent" ? "nav-link selected" : "nav-link"}
            onClick={() => {
              setPurpose("rent");
              setSavedOnly(false);
            }}
          >
            Rent
          </button>
          <button className="nav-link" onClick={openListingForm}>
            For realtors
          </button>
        </nav>
        <div className="top-actions">
          <button
            className={savedOnly ? "saved-nav active" : "saved-nav"}
            onClick={() => {
              if (!account) setShowAuth(true);
              else setSavedOnly((current) => !current);
            }}
            aria-label="Show saved homes"
          >
            <Heart size={17} fill={savedOnly ? "currentColor" : "none"} />
            <span>Saved</span>
            {savedIds.length > 0 && <b>{savedIds.length}</b>}
          </button>
          {account ? (
            <button
              className="account-button"
              onClick={() => setShowDashboard(true)}
            >
              <span className="account-avatar">
                {account.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <span>
                {account.role === "admin"
                  ? "Operations"
                  : account.role === "realtor"
                    ? "My studio"
                    : account.name.split(" ")[0]}
              </span>
            </button>
          ) : (
            <button
              className="sign-in-button"
              onClick={() => setShowAuth(true)}
            >
              Sign in
            </button>
          )}
          <button className="realtor-button" onClick={openListingForm}>
            <Plus size={16} /> List a property
          </button>
          <button
            className="mobile-menu"
            aria-label="Open realtor listing form"
            onClick={openListingForm}
          >
            <Menu size={21} />
          </button>
        </div>
      </header>

      <main id="top">
        <section className="search-section" aria-label="Property search">
          <div className="search-intro">
            <div>
              <span className="eyebrow">
                <span className="live-dot" /> PROPERTY, FOUND
              </span>
              <h1>
                {purpose === "short_stay" ? (
                  <>
                    A stay that feels like <em>yours.</em>
                  </>
                ) : (
                  <>
                    A place that feels like <em>yours.</em>
                  </>
                )}
              </h1>
            </div>
            <p>
              {purpose === "short_stay"
                ? "Find a welcoming stay across Kenya,"
                : "Explore homes across Kenya,"}
              <br />
              one good find at a time.
            </p>
          </div>
          <div className="search-panel">
            <div
              className="purpose-switch"
              role="tablist"
              aria-label="What are you looking for?"
            >
              <button
                role="tab"
                aria-selected={purpose === "sale"}
                className={
                  purpose === "sale" ? "purpose-tab active" : "purpose-tab"
                }
                onClick={() => changePurpose("sale")}
              >
                For sale
              </button>
              <button
                role="tab"
                aria-selected={purpose === "rent"}
                className={
                  purpose === "rent" ? "purpose-tab active" : "purpose-tab"
                }
                onClick={() => changePurpose("rent")}
              >
                For rent
              </button>
              <button
                role="tab"
                aria-selected={purpose === "short_stay"}
                className={
                  purpose === "short_stay"
                    ? "purpose-tab active"
                    : "purpose-tab"
                }
                onClick={() => changePurpose("short_stay")}
              >
                For short stays
              </button>
            </div>
            <div
              className={`search-controls ${purpose === "short_stay" ? "short-stay-controls" : ""}`}
            >
              <label className="location-input">
                <MapPin size={19} />
                <span className="field-caption">LOCATION</span>
                <input
                  aria-label="Location"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={
                    purpose === "short_stay"
                      ? "Where are you going?"
                      : "Town, neighbourhood or county"
                  }
                />
              </label>
              <label className="select-field">
                <span className="field-caption">PROPERTY TYPE</span>
                <select
                  value={propertyType}
                  onChange={(event) => setPropertyType(event.target.value)}
                >
                  <option>Any type</option>
                  <option>Apartment</option>
                  <option>House</option>
                  <option>Townhouse</option>
                  <option>Land</option>
                </select>
                <ChevronDown size={15} />
              </label>
              {purpose === "short_stay" ? (
                <>
                  <label className="select-field date-field">
                    <span className="field-caption">CHECK IN</span>
                    <input
                      type="date"
                      aria-label="Check-in date"
                      min={localDateInputValue()}
                      value={checkIn}
                      onChange={(event) => {
                        const nextDate = event.target.value;
                        setCheckIn(nextDate);
                        if (checkOut && checkOut <= nextDate) setCheckOut("");
                      }}
                    />
                  </label>
                  <label className="select-field date-field">
                    <span className="field-caption">CHECK OUT</span>
                    <input
                      type="date"
                      aria-label="Check-out date"
                      min={checkIn || localDateInputValue()}
                      value={checkOut}
                      onChange={(event) => setCheckOut(event.target.value)}
                    />
                  </label>
                  <label className="select-field guest-field">
                    <span className="field-caption">GUESTS</span>
                    <select
                      aria-label="Number of guests"
                      value={guestCount}
                      onChange={(event) => setGuestCount(event.target.value)}
                    >
                      {Array.from({ length: 16 }, (_, index) => index + 1).map(
                        (count) => (
                          <option key={count} value={count}>
                            {count} {count === 1 ? "guest" : "guests"}
                          </option>
                        ),
                      )}
                    </select>
                    <ChevronDown size={15} />
                  </label>
                </>
              ) : (
                <label className="select-field">
                  <span className="field-caption">BEDROOMS</span>
                  <select
                    value={bedrooms}
                    onChange={(event) => setBedrooms(event.target.value)}
                  >
                    <option>Any beds</option>
                    <option>1+</option>
                    <option>2+</option>
                    <option>3+</option>
                    <option>4+</option>
                  </select>
                  <ChevronDown size={15} />
                </label>
              )}
              <label className="select-field budget-field">
                <span className="field-caption">
                  {purpose === "short_stay" ? "MAX / NIGHT" : "MAX PRICE"}
                </span>
                <select
                  aria-label={
                    purpose === "short_stay"
                      ? "Maximum nightly price"
                      : "Maximum price"
                  }
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                >
                  <option>Any price</option>
                  {purpose === "short_stay" ? (
                    <>
                      <option value="5000">KSh 5,000 / night</option>
                      <option value="10000">KSh 10,000 / night</option>
                      <option value="20000">KSh 20,000 / night</option>
                      <option value="40000">KSh 40,000 / night</option>
                    </>
                  ) : (
                    <>
                      <option value="100000">KSh 100,000</option>
                      <option value="250000">KSh 250,000</option>
                      <option value="500000">KSh 500,000</option>
                      <option value="50000000">KSh 50M</option>
                    </>
                  )}
                </select>
                <ChevronDown size={15} />
              </label>
              <button
                className="search-button"
                aria-label="Search properties"
                onClick={() =>
                  document
                    .getElementById("results")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                <Search size={19} />
                <span>
                  {purpose === "short_stay" ? "Search stays" : "Search"}
                </span>
              </button>
            </div>
          </div>
          <div className="quick-links">
            <span>
              {purpose === "short_stay" ? "POPULAR DESTINATIONS" : "POPULAR IN"}
            </span>
            {["Nairobi", "Mombasa", "Kiambu", "Nakuru"].map((place) => (
              <button key={place} onClick={() => setQuery(place)}>
                {place}
                <ArrowUpRight size={12} />
              </button>
            ))}
          </div>
        </section>

        <section
          className="discovery"
          id="results"
          aria-label="Property listings"
        >
          <div className="results-column">
            <div className="results-heading">
              <div>
                <div className="results-kicker">
                  {purpose === "sale"
                    ? "HOMES FOR SALE"
                    : purpose === "rent"
                      ? "HOMES FOR RENT"
                      : "SHORT STAYS"}{" "}
                  <span className="slash">/</span> {location.toUpperCase()}
                </div>
                <h2>
                  {savedOnly
                    ? "Your saved places"
                    : purpose === "short_stay"
                      ? `Places to stay in ${location}`
                      : `Places to ${purpose === "sale" ? "buy" : "rent"} in ${location}`}
                </h2>
                <p>
                  {visibleListings.length}{" "}
                  {purpose === "short_stay"
                    ? visibleListings.length === 1
                      ? "stay"
                      : "stays"
                    : visibleListings.length === 1
                      ? "home"
                      : "homes"}{" "}
                  to explore <span className="result-divider">·</span> Updated
                  today{" "}
                  {demoMode && (
                    <span className="demo-label">SAMPLE LISTINGS</span>
                  )}
                </p>
              </div>
              <div className="heading-actions">
                <button
                  className="map-toggle"
                  onClick={() => setShowMap((current) => !current)}
                >
                  <Map size={16} /> {showMap ? "Hide map" : "Show map"}
                </button>
                <label className="sort-button sort-select">
                  <ArrowDownWideNarrow size={15} />
                  <select
                    aria-label="Sort properties"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                  </select>
                  <ChevronDown size={14} />
                </label>
              </div>
            </div>
            <div className="listing-grid">
              {visibleListings.map((listing, index) => (
                <article
                  className="listing-card"
                  key={listing.id}
                  style={{ animationDelay: `${index * 65}ms` }}
                >
                  <button
                    className="listing-image"
                    onClick={() => setSelected(listing)}
                    aria-label={`View ${listing.title}`}
                  >
                    <img
                      src={listing.image}
                      alt={listing.title}
                      loading={index > 1 ? "lazy" : "eager"}
                    />
                    <span className="image-tag">
                      {listing.purpose === "sale"
                        ? "FOR SALE"
                        : listing.purpose === "rent"
                          ? "FOR RENT"
                          : "SHORT STAY"}
                    </span>
                    <span className="photo-count">
                      {String(listing.images?.length || 1).padStart(2, "0")}{" "}
                      <span>PHOTOS</span>
                    </span>
                  </button>
                  <button
                    className={
                      savedIds.includes(listing.id)
                        ? "heart-button is-saved"
                        : "heart-button"
                    }
                    onClick={() => toggleSaved(listing.id)}
                    aria-label={
                      savedIds.includes(listing.id)
                        ? "Remove saved property"
                        : "Save property"
                    }
                  >
                    <Heart
                      size={18}
                      fill={
                        savedIds.includes(listing.id) ? "currentColor" : "none"
                      }
                    />
                  </button>
                  <div
                    className="listing-details"
                    onClick={() => setSelected(listing)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") setSelected(listing);
                    }}
                  >
                    <div className="price-line">
                      <strong>
                        {formatPrice(listing.price, listing.purpose)}
                      </strong>
                      {listing.verified && (
                        <span
                          className="verified-mark"
                          title="Verified realtor"
                        >
                          <BadgeCheck size={15} />
                        </span>
                      )}
                    </div>
                    <h3>{listing.title}</h3>
                    <p className="listing-location">
                      <MapPin size={13} />
                      {listing.neighborhood}, {listing.city}
                    </p>
                    <div className="listing-facts">
                      <span>
                        <BedDouble size={15} />
                        {listing.bedrooms} beds
                      </span>
                      {listing.purpose === "short_stay" ? (
                        <>
                          <span>
                            <Users size={15} />
                            {listing.maxGuests} guests
                          </span>
                          <span>
                            <Moon size={15} />
                            {listing.minimumNights} night min
                          </span>
                        </>
                      ) : (
                        <span>
                          <Bath size={15} />
                          {listing.bathrooms} baths
                        </span>
                      )}
                      <span>
                        <MoveRight size={15} />
                        {listing.area} m²
                      </span>
                    </div>
                    <div className="agent-strip">
                      <span className="agent-avatar">
                        {listing.agentName
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <span>
                        <b>{listing.agency}</b>
                        <small>
                          {listing.verified
                            ? "Verified realtor"
                            : "Independent realtor"}
                        </small>
                      </span>
                      <ArrowUpRight size={15} />
                    </div>
                  </div>
                </article>
              ))}
              {visibleListings.length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon">
                    <Search size={23} />
                  </span>
                  <h3>
                    {purpose === "short_stay"
                      ? "No stays found just yet"
                      : "No homes found just yet"}
                  </h3>
                  <p>
                    Try a nearby area, change your filters or check back soon.
                  </p>
                  <button
                    onClick={() => {
                      setQuery("");
                      setPropertyType("Any type");
                      setBedrooms("Any beds");
                      setBudget("Any price");
                      setCheckIn("");
                      setCheckOut("");
                      setGuestCount("2");
                      setSavedOnly(false);
                    }}
                  >
                    Clear search <MoveRight size={15} />
                  </button>
                </div>
              )}
            </div>
            {visibleListings.length > 0 && (
              <p className="all-caught-up">
                {purpose === "short_stay"
                  ? "You’re all caught up with today’s stays"
                  : "You’re all caught up with today’s homes"}{" "}
                <Check size={14} />
              </p>
            )}
          </div>
          {showMap && (
            <aside
              className="map-panel"
              aria-label="Map of properties near Nairobi"
            >
              <div className="map-toolbar">
                <span>
                  <MapPin size={15} /> MAP VIEW <i />
                </span>
              </div>
              <iframe
                title={`Map around ${location}`}
                src={mapEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <button
                className="map-marker marker-one"
                onClick={() =>
                  visibleListings[0] && setSelected(visibleListings[0])
                }
              >
                {visibleListings[0]
                  ? formatPrice(
                      visibleListings[0].price,
                      visibleListings[0].purpose,
                    )
                  : "Explore"}
              </button>
              <button
                className="map-marker marker-two"
                onClick={() =>
                  visibleListings[1] && setSelected(visibleListings[1])
                }
              >
                {visibleListings[1]
                  ? formatPrice(
                      visibleListings[1].price,
                      visibleListings[1].purpose,
                    )
                  : "Homes"}
              </button>
              <button
                className="map-marker marker-three"
                onClick={() =>
                  visibleListings[2] && setSelected(visibleListings[2])
                }
              >
                {visibleListings[2]
                  ? formatPrice(
                      visibleListings[2].price,
                      visibleListings[2].purpose,
                    )
                  : "Nearby"}
              </button>
              <div className="map-note">
                <span className="map-note-dot" /> {visibleListings.length}{" "}
                properties in view
              </div>
            </aside>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark">
            <Home size={15} />
          </span>
          <span>doorstep</span>
          <small>KENYA</small>
        </a>
        <span>Made for finding home, wherever home is.</span>
        <span>© 2026 Doorstep Kenya</span>
      </footer>

      {selected && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <section
            className="detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
          >
            <button
              className="modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close details"
            >
              <X size={19} />
            </button>
            <div className="detail-image">
              <img
                src={selectedImages[selectedPhoto] || selected.image}
                alt={`${selected.title}, photo ${selectedPhoto + 1}`}
              />
              <span className="image-tag">
                {selected.purpose === "sale"
                  ? "FOR SALE"
                  : selected.purpose === "rent"
                    ? "FOR RENT"
                    : "SHORT STAY"}
              </span>
              {selectedImages.length > 1 && (
                <div className="gallery-controls">
                  <button
                    onClick={() =>
                      setSelectedPhoto(
                        (current) =>
                          (current - 1 + selectedImages.length) %
                          selectedImages.length,
                      )
                    }
                    aria-label="Previous property photo"
                  >
                    <ChevronLeft size={19} />
                  </button>
                  <span>
                    {String(selectedPhoto + 1).padStart(2, "0")} <i>/</i>{" "}
                    {String(selectedImages.length).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedPhoto(
                        (current) => (current + 1) % selectedImages.length,
                      )
                    }
                    aria-label="Next property photo"
                  >
                    <ChevronRight size={19} />
                  </button>
                </div>
              )}
            </div>
            <div className="detail-content">
              <div className="detail-kicker">
                {selected.purpose === "short_stay"
                  ? stayTypeLabel(selected.stayType).toUpperCase()
                  : selected.propertyType.toUpperCase()}{" "}
                <span>·</span> {selected.neighborhood.toUpperCase()},{" "}
                {selected.city.toUpperCase()}
              </div>
              <div className="detail-price">
                {formatPrice(selected.price, selected.purpose)}
              </div>
              <h2 id="detail-title">{selected.title}</h2>
              <div className="detail-facts">
                <span>
                  <BedDouble size={16} />
                  {selected.bedrooms} bedrooms
                </span>
                {selected.purpose === "short_stay" ? (
                  <>
                    <span>
                      <Users size={16} />
                      Up to {selected.maxGuests} guests
                    </span>
                    <span>
                      <Moon size={16} />
                      {selected.minimumNights} night minimum
                    </span>
                  </>
                ) : (
                  <span>
                    <Bath size={16} />
                    {selected.bathrooms} bathrooms
                  </span>
                )}
                <span>
                  <MoveRight size={16} />
                  {selected.area} m²
                </span>
              </div>
              {selected.purpose === "short_stay" && (
                <p className="stay-request-note">
                  {checkIn && checkOut
                    ? `Requesting ${checkIn} to ${checkOut} · ${guestCount} guests. The host will confirm availability.`
                    : "Choose dates and guest count above. The host will confirm availability."}
                </p>
              )}
              <p className="detail-description">{selected.description}</p>
              <div className="realtor-card">
                <span className="realtor-avatar">
                  {selected.agentName
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span>
                  <b>{selected.agentName}</b>
                  <small>
                    {selected.agency}
                    {selected.verified && " · Verified"}
                  </small>
                </span>
                <a
                  className="icon-contact"
                  href={`tel:+${selected.agentPhone}`}
                  aria-label="Call realtor"
                >
                  <Phone size={17} />
                </a>
                <a
                  className="icon-contact whatsapp"
                  href={`https://wa.me/${selected.agentPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Message realtor on WhatsApp"
                >
                  <MessageCircle size={17} />
                </a>
              </div>
              <form className="inquiry-form" onSubmit={submitInquiry}>
                <label>
                  Your name
                  <input
                    name="name"
                    required
                    placeholder="e.g. Wanjiku Mwangi"
                  />
                </label>
                <label>
                  Your phone
                  <input
                    name="phone"
                    required
                    type="tel"
                    placeholder="e.g. 07xx xxx xxx"
                  />
                </label>
                <label>
                  Message
                  <textarea
                    name="message"
                    rows={2}
                    defaultValue={`Hi, I'm interested in ${selected.title}.${selected.purpose === "short_stay" ? ` I would like to stay ${checkIn || "on these dates"} to ${checkOut || ""} with ${guestCount} guest(s). Is it available?` : " Is it still available?"}`}
                  />
                </label>
                <button type="submit">
                  <Send size={16} />{" "}
                  {selected.purpose === "short_stay"
                    ? "Contact host"
                    : "Contact realtor"}
                </button>
              </form>
            </div>
          </section>
        </div>
      )}

      {showCreate && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCreate(false);
          }}
        >
          <section
            className="create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-title"
          >
            <div className="create-heading">
              <span className="create-icon">
                <Building2 size={19} />
              </span>
              <button
                className="modal-close"
                onClick={() => setShowCreate(false)}
                aria-label="Close form"
              >
                <X size={19} />
              </button>
              <span className="eyebrow">FOR KENYAN REALTORS</span>
              <h2 id="create-title">
                Put a good home
                <br />
                on the map.
              </h2>
              <p>
                Share the essentials. Interested seekers will contact you
                directly.
              </p>
            </div>
            <form
              className="create-form"
              onSubmit={(event) => {
                event.preventDefault();
                setShowCreate(false);
                openListingForm();
              }}
            >
              <div className="form-row">
                <label>
                  Listing title
                  <input
                    name="title"
                    required
                    placeholder="e.g. Sunny 2-bed in Kilimani"
                  />
                </label>
                <label>
                  Offer type
                  <select name="purpose">
                    <option value="sale">For sale</option>
                    <option value="rent">For rent</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Price (KSh)
                  <input
                    name="price"
                    required
                    type="number"
                    min="1"
                    placeholder="145000"
                  />
                </label>
                <label>
                  Property type
                  <select name="propertyType">
                    <option>Apartment</option>
                    <option>House</option>
                    <option>Townhouse</option>
                    <option>Land</option>
                  </select>
                </label>
              </div>
              <div className="form-row three">
                <label>
                  Bedrooms
                  <input
                    name="bedrooms"
                    type="number"
                    min="0"
                    defaultValue="2"
                  />
                </label>
                <label>
                  Bathrooms
                  <input
                    name="bathrooms"
                    type="number"
                    min="0"
                    defaultValue="1"
                  />
                </label>
                <label>
                  Area (m²)
                  <input name="area" type="number" min="1" placeholder="95" />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Neighbourhood
                  <input name="neighborhood" required placeholder="Kilimani" />
                </label>
                <label>
                  Town / city
                  <input name="city" required defaultValue="Nairobi" />
                </label>
              </div>
              <label>
                Description
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Tell seekers what makes this home special."
                />
              </label>
              <div className="form-row">
                <label>
                  Realtor name
                  <input name="agentName" required placeholder="Your name" />
                </label>
                <label>
                  Agency
                  <input name="agency" placeholder="Your agency" />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Phone / WhatsApp
                  <input
                    name="agentPhone"
                    required
                    type="tel"
                    placeholder="254 7xx xxx xxx"
                  />
                </label>
                <label>
                  Photo URL
                  <input
                    name="image"
                    type="url"
                    placeholder="https://... (optional)"
                  />
                </label>
              </div>
              <button className="publish-button" type="submit">
                <Plus size={17} /> Publish property
              </button>
              <p className="form-disclaimer">
                New listings are reviewed before verification. No payment or
                transaction takes place on Doorstep.
              </p>
            </form>
          </section>
        </div>
      )}

      {showAuth && (
        <AuthDialog
          onClose={() => setShowAuth(false)}
          onComplete={(nextAccount) => {
            setAccount(nextAccount);
            setShowAuth(false);
            setShowDashboard(true);
            void fetch(`${API_BASE}/users/saved`, {
              credentials: "same-origin",
            })
              .then((response) =>
                response.ok ? response.json() : { listings: [] },
              )
              .then((saved) =>
                setSavedIds(
                  (saved.listings || []).map(
                    (listing: { _id: string }) => listing._id,
                  ),
                ),
              );
          }}
        />
      )}
      {showDashboard && account && (
        <DashboardDialog
          user={account}
          onClose={() => setShowDashboard(false)}
          onLogout={signOut}
          onAccountChange={setAccount}
        />
      )}
      {showListing && account?.role === "realtor" && (
        <ListingDialog
          onClose={() => setShowListing(false)}
          onPublish={submitListing}
        />
      )}
      {notice && (
        <div className="toast" role="status">
          <span>
            <Check size={15} />
          </span>
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss message">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
