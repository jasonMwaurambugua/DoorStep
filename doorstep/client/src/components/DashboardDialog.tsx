import { FormEvent, useEffect, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Check,
  ChevronRight,
  ClipboardCheck,
  House,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

export type DoorstepUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "seeker" | "realtor" | "admin";
  emailVerified: boolean;
  realtorVerified: boolean;
};

type Props = {
  user: DoorstepUser;
  onClose: () => void;
  onLogout: () => void;
  onAccountChange: (user: DoorstepUser) => void;
};
const API_BASE = import.meta.env.VITE_API_URL || "/api";

type AdminQueue = {
  listings: Record<string, unknown>[];
  agencies: Record<string, unknown>[];
  realtors: Record<string, unknown>[];
  memberships: Record<string, unknown>[];
};

async function api(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });
  const result = response.status === 204 ? null : await response.json();
  if (!response.ok)
    throw new Error(result?.message || "That request could not be completed.");
  return result;
}

export default function DashboardDialog({
  user,
  onClose,
  onLogout,
  onAccountChange,
}: Props) {
  const [queue, setQueue] = useState<AdminQueue>({
    listings: [],
    agencies: [],
    realtors: [],
    memberships: [],
  });
  const [listings, setListings] = useState<Record<string, unknown>[]>([]);
  const [agencies, setAgencies] = useState<Record<string, unknown>[]>([]);
  const [memberships, setMemberships] = useState<Record<string, unknown>[]>([]);
  const [tab, setTab] = useState(user.role === "admin" ? "queue" : "overview");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setError("");
    try {
      if (user.role === "admin") {
        setQueue(await api("/admin/queue"));
      } else if (user.role === "realtor") {
        const [listingResult, membershipResult, agencyResult] =
          await Promise.all([
            api("/listings/mine"),
            api("/agencies/mine"),
            api("/agencies"),
          ]);
        setListings(listingResult.listings || []);
        setMemberships(membershipResult.memberships || []);
        setAgencies(agencyResult.agencies || []);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load workspace.",
      );
    }
  }

  useEffect(() => {
    void refresh();
  }, [user.role]);

  async function review(path: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      await api(path, { method: "PATCH", body: JSON.stringify(payload) });
      setMessage("Review saved.");
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not save review.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitAgency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api("/agencies", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          county: form.get("county"),
          registrationNumber: form.get("registrationNumber"),
        }),
      });
      setMessage("Agency application submitted for review.");
      event.currentTarget.reset();
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not submit agency.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function joinAgency(id: string) {
    setBusy(true);
    setError("");
    try {
      await api(`/agencies/${id}/join`, { method: "POST" });
      setMessage("Membership request sent.");
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not request membership.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function becomeRealtor() {
    setBusy(true);
    setError("");
    try {
      const result = await api("/auth/become-realtor", { method: "POST" });
      onAccountChange(result.user as DoorstepUser);
      setMessage(
        "Realtor profile created. Submit your details for verification.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not create realtor profile.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeProperty(id: string) {
    if (!window.confirm("Remove this property from your workspace?")) return;
    setBusy(true);
    setError("");
    try {
      await api(`/listings/${id}`, { method: "DELETE" });
      setMessage("Property removed.");
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not remove property.",
      );
    } finally {
      setBusy(false);
    }
  }

  const isAdmin = user.role === "admin";
  const isRealtor = user.role === "realtor";

  return (
    <div
      className="modal-backdrop dashboard-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="dashboard-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-title"
      >
        <aside className="dashboard-rail">
          <a className="brand dashboard-brand" href="#top">
            <span className="brand-mark">
              <House size={16} />
            </span>
            <span>doorstep</span>
            <small>KENYA</small>
          </a>
          <div className="workspace-user">
            <span className="workspace-avatar">
              {user.name
                .split(" ")
                .map((name) => name[0])
                .join("")
                .slice(0, 2)}
            </span>
            <span>
              <b>{user.name}</b>
              <small>
                {isAdmin
                  ? "Platform administrator"
                  : isRealtor
                    ? user.realtorVerified
                      ? "Verified realtor"
                      : "Realtor · verification pending"
                    : "Property seeker"}
              </small>
            </span>
          </div>
          <nav className="workspace-nav" aria-label="Workspace sections">
            {!isAdmin && (
              <button
                className={tab === "overview" ? "active" : ""}
                onClick={() => setTab("overview")}
              >
                <ClipboardCheck size={16} />
                Overview
              </button>
            )}
            {isAdmin && (
              <button className="active" onClick={() => setTab("queue")}>
                <ShieldCheck size={16} />
                Review queue
              </button>
            )}
            {isRealtor && (
              <button
                className={tab === "properties" ? "active" : ""}
                onClick={() => setTab("properties")}
              >
                <House size={16} />
                My properties
              </button>
            )}
            {isRealtor && (
              <button
                className={tab === "agency" ? "active" : ""}
                onClick={() => setTab("agency")}
              >
                <Building2 size={16} />
                Agencies
              </button>
            )}
          </nav>
          <button className="workspace-logout" onClick={onLogout}>
            Sign out <ChevronRight size={15} />
          </button>
        </aside>
        <main className="workspace-main">
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close workspace"
          >
            <X size={19} />
          </button>
          {isAdmin ? (
            <>
              <span className="auth-step">DOORSTEP OPERATIONS</span>
              <h1 id="workspace-title">Review workspace</h1>
              <p className="workspace-lede">
                Verify the people and properties entering the marketplace.
              </p>
              <div className="queue-summary">
                <span>
                  <b>{queue.realtors.length}</b> realtor checks
                </span>
                <span>
                  <b>{queue.listings.length}</b> property reviews
                </span>
                <span>
                  <b>{queue.agencies.length}</b> agency reviews
                </span>
                <span>
                  <b>{queue.memberships.length}</b> membership requests
                </span>
              </div>
              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="workspace-success">
                  <Check size={14} />
                  {message}
                </p>
              )}
              <section className="review-section">
                <h2>Realtor verification</h2>
                {queue.realtors.length ? (
                  queue.realtors.map((item) => (
                    <div className="review-row" key={String(item._id)}>
                      <span>
                        <b>{String(item.name)}</b>
                        <small>
                          {String(item.email)} · {String(item.phone)}
                        </small>
                      </span>
                      <button
                        disabled={busy}
                        onClick={() =>
                          review(`/admin/realtors/${item._id}/verify`, {
                            approved: true,
                          })
                        }
                      >
                        <BadgeCheck size={14} />
                        Verify
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="workspace-empty">No realtor checks waiting.</p>
                )}
              </section>
              <section className="review-section">
                <h2>Property listings</h2>
                {queue.listings.length ? (
                  queue.listings.map((item) => (
                    <div className="review-row" key={String(item._id)}>
                      <span>
                        <b>{String(item.title)}</b>
                        <small>
                          {String(item.neighborhood)}, {String(item.city)} · KSh{" "}
                          {Number(item.price).toLocaleString("en-KE")}
                        </small>
                      </span>
                      <div className="review-actions">
                        <button
                          disabled={busy}
                          onClick={() =>
                            review(`/admin/listings/${item._id}/review`, {
                              action: "approve",
                            })
                          }
                        >
                          <Check size={14} />
                          Approve
                        </button>
                        <button
                          className="reject"
                          disabled={busy}
                          onClick={() =>
                            review(`/admin/listings/${item._id}/review`, {
                              action: "reject",
                            })
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="workspace-empty">
                    No properties waiting for review.
                  </p>
                )}
              </section>
              <section className="review-section">
                <h2>Agencies and memberships</h2>
                {queue.agencies.map((item) => (
                  <div className="review-row" key={String(item._id)}>
                    <span>
                      <b>{String(item.name)}</b>
                      <small>
                        {String(item.county)} ·{" "}
                        {String(item.registrationNumber)}
                      </small>
                    </span>
                    <div className="review-actions">
                      <button
                        disabled={busy}
                        onClick={() =>
                          review(`/admin/agencies/${item._id}/review`, {
                            action: "approve",
                          })
                        }
                      >
                        <Check size={14} />
                        Approve
                      </button>
                      <button
                        className="reject"
                        disabled={busy}
                        onClick={() =>
                          review(`/admin/agencies/${item._id}/review`, {
                            action: "reject",
                          })
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {queue.memberships.map((item) => (
                  <div className="review-row" key={String(item._id)}>
                    <span>
                      <b>Membership request</b>
                      <small>
                        {String((item.userId as Record<string, unknown>)?.name)}{" "}
                        ·{" "}
                        {String(
                          (item.agencyId as Record<string, unknown>)?.name,
                        )}
                      </small>
                    </span>
                    <div className="review-actions">
                      <button
                        disabled={busy}
                        onClick={() =>
                          review(`/admin/memberships/${item._id}/review`, {
                            action: "approve",
                          })
                        }
                      >
                        <Check size={14} />
                        Approve
                      </button>
                      <button
                        className="reject"
                        disabled={busy}
                        onClick={() =>
                          review(`/admin/memberships/${item._id}/review`, {
                            action: "reject",
                          })
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {!queue.agencies.length && !queue.memberships.length && (
                  <p className="workspace-empty">No agency requests waiting.</p>
                )}
              </section>
            </>
          ) : isRealtor ? (
            <>
              <span className="auth-step">REALTOR STUDIO</span>
              <h1 id="workspace-title">Your workspace</h1>
              <p className="workspace-lede">
                Manage property listings and your agency connections.
              </p>
              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="workspace-success">
                  <Check size={14} />
                  {message}
                </p>
              )}
              <div className="realtor-status">
                <BadgeCheck size={18} />
                <span>
                  <b>
                    {user.realtorVerified
                      ? "Realtor verified"
                      : "Realtor verification pending"}
                  </b>
                  <small>
                    {user.realtorVerified
                      ? "Your profile can display the verified mark."
                      : "Your submitted listings are reviewed before appearing publicly."}
                  </small>
                </span>
              </div>
              {tab === "overview" && (
                <p className="workspace-empty">
                  Choose My properties to review your submissions, or Agencies
                  to manage your agency connections.
                </p>
              )}
              {tab === "properties" && (
                <>
                  <section className="review-section">
                    <h2>
                      My properties <span>{listings.length}</span>
                    </h2>
                    {listings.length ? (
                      listings.map((item) => (
                        <div className="review-row" key={String(item._id)}>
                          <span>
                            <b>{String(item.title)}</b>
                            <small>
                              {String(item.neighborhood)}, {String(item.city)} ·{" "}
                              {String(item.status)}
                            </small>
                          </span>
                          <div className="review-actions">
                            <span
                              className={`status-chip status-${String(item.status)}`}
                            >
                              {String(item.status)}
                            </span>
                            <button
                              className="reject icon-action"
                              disabled={busy}
                              onClick={() => removeProperty(String(item._id))}
                              aria-label={`Remove ${String(item.title)}`}
                              title="Remove property"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="workspace-empty">
                        Your property listings will appear here.
                      </p>
                    )}
                  </section>
                  <button
                    className="text-refresh"
                    onClick={() => void refresh()}
                  >
                    <LoaderCircle size={14} />
                    Refresh workspace
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <span className="auth-step">YOUR DOORSTEP</span>
              <h1 id="workspace-title">Hello, {user.name.split(" ")[0]}.</h1>
              <p className="workspace-lede">
                Your account is ready. Saved properties will stay with you when
                signed in.
              </p>
              <div className="realtor-status">
                <ShieldCheck size={18} />
                <span>
                  <b>Email verified</b>
                  <small>
                    Your sign-in is protected with a one-time email code.
                  </small>
                </span>
              </div>
              <button
                className="become-realtor"
                disabled={busy}
                onClick={becomeRealtor}
              >
                <Building2 size={16} />
                Create a realtor profile
                <ChevronRight size={15} />
              </button>
            </>
          )}

          {isRealtor && tab === "agency" && (
            <section className="agency-management">
              <div className="workspace-split-title">
                <span className="auth-step">AGENCY NETWORK</span>
                <h2>Connect with a Kenyan agency.</h2>
              </div>
              <section className="review-section">
                <h2>Your memberships</h2>
                {memberships.length ? (
                  memberships.map((item) => (
                    <div className="review-row" key={String(item._id)}>
                      <span>
                        <b>
                          {String(
                            (item.agencyId as Record<string, unknown>)?.name ||
                              "Agency application",
                          )}
                        </b>
                        <small>{String(item.role)} membership</small>
                      </span>
                      <span
                        className={`status-chip status-${String(item.status)}`}
                      >
                        {String(item.status)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="workspace-empty">No agency memberships yet.</p>
                )}
              </section>
              <form className="agency-apply-form" onSubmit={submitAgency}>
                <label>
                  Agency name
                  <input name="name" required placeholder="e.g. Mtaa Homes" />
                </label>
                <label>
                  Registration number
                  <input
                    name="registrationNumber"
                    required
                    placeholder="Estate agent registration"
                  />
                </label>
                <label>
                  County
                  <input name="county" required placeholder="Nairobi" />
                </label>
                <button className="auth-submit" disabled={busy}>
                  Submit agency for review
                  <ChevronRight size={15} />
                </button>
              </form>
              <div className="available-agencies">
                <h3>Verified agencies</h3>
                {agencies.map((agency) => (
                  <div className="review-row" key={String(agency._id)}>
                    <span>
                      <b>{String(agency.name)}</b>
                      <small>{String(agency.county)} County</small>
                    </span>
                    <button
                      disabled={busy}
                      onClick={() => joinAgency(String(agency._id))}
                    >
                      Request to join
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </section>
    </div>
  );
}
