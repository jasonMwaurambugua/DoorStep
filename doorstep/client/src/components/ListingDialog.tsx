import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  Building2,
  Check,
  ImagePlus,
  LoaderCircle,
  Plus,
  X,
} from "lucide-react";

type Props = {
  onClose: () => void;
  onPublish: (payload: Record<string, unknown>) => Promise<void>;
};
const API_BASE = import.meta.env.VITE_API_URL || "/api";

export default function ListingDialog({ onClose, onPublish }: Props) {
  const [purpose, setPurpose] = useState<"sale" | "rent" | "short_stay">(
    "sale",
  );
  const [memberships, setMemberships] = useState<
    {
      agencyId: { _id: string; name: string; status: string };
      status: string;
    }[]
  >([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  useEffect(() => {
    fetch(`${API_BASE}/agencies/mine`, { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : { memberships: [] }))
      .then((result) =>
        setMemberships(
          (result.memberships || []).filter(
            (membership: { agencyId?: { status?: string }; status: string }) =>
              membership.status === "active" &&
              membership.agencyId?.status === "active",
          ),
        ),
      )
      .catch(() => setMemberships([]));
  }, []);

  function chooseImages(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length + files.length > 10) {
      setError("Choose up to 10 property photos.");
      event.target.value = "";
      return;
    }
    if (
      selectedFiles.some(
        (file) =>
          file.size > 8 * 1024 * 1024 ||
          !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
            file.type,
          ),
      )
    ) {
      setError(
        "Each photo must be JPG, PNG, WebP or AVIF and smaller than 8 MB.",
      );
      event.target.value = "";
      return;
    }
    setError("");
    setFiles((current) => [...current, ...selectedFiles]);
    event.target.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      if (!files.length)
        throw new Error("Add at least one property photo before submitting.");
      let images: string[] = [];
      if (files.length) {
        const uploadBody = new FormData();
        files.forEach((file) => uploadBody.append("images", file));
        const uploadResponse = await fetch(`${API_BASE}/uploads/images`, {
          method: "POST",
          credentials: "same-origin",
          body: uploadBody,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok)
          throw new Error(
            uploadResult.message || "Could not upload these photos.",
          );
        images = uploadResult.images.map((image: { url: string }) => image.url);
      }
      await onPublish({
        title: form.get("title"),
        purpose,
        price: Number(form.get("price")),
        pricePeriod:
          purpose === "sale"
            ? "total"
            : purpose === "rent"
              ? "monthly"
              : "nightly",
        propertyType: form.get("propertyType"),
        bedrooms: Number(form.get("bedrooms")),
        bathrooms: Number(form.get("bathrooms")),
        area: Number(form.get("area")),
        neighborhood: form.get("neighborhood"),
        city: form.get("city"),
        county: form.get("county"),
        description: form.get("description"),
        images,
        agencyId: form.get("agencyId") || undefined,
        maxGuests:
          purpose === "short_stay" ? Number(form.get("maxGuests")) : undefined,
        minimumNights:
          purpose === "short_stay"
            ? Number(form.get("minimumNights"))
            : undefined,
        stayType: purpose === "short_stay" ? form.get("stayType") : undefined,
        availabilityStart:
          purpose === "short_stay"
            ? form.get("availabilityStart") || undefined
            : undefined,
        availabilityEnd:
          purpose === "short_stay"
            ? form.get("availabilityEnd") || undefined
            : undefined,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not publish this property.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        className="create-modal listing-create-modal"
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
            onClick={onClose}
            aria-label="Close form"
            disabled={busy}
          >
            <X size={19} />
          </button>
          <span className="eyebrow">YOUR REALTOR STUDIO</span>
          <h2 id="create-title">
            {purpose === "short_stay" ? (
              <>
                A welcoming stay,
                <br />
                thoughtfully hosted.
              </>
            ) : (
              <>
                A good home,
                <br />
                well represented.
              </>
            )}
          </h2>
          <p>
            {purpose === "short_stay"
              ? "Share your nightly rate, guest capacity, and when travellers can stay."
              : "Your verified email and realtor profile stay attached to every listing."}
          </p>
        </div>
        <form className="create-form" onSubmit={submit}>
          <div className="form-row">
            <label>
              Listing title
              <input
                name="title"
                required
                maxLength={140}
                placeholder="e.g. Sunny 2-bed in Kilimani"
              />
            </label>
            <label>
              Offer type
              <select
                name="purpose"
                value={purpose}
                onChange={(event) =>
                  setPurpose(event.target.value as typeof purpose)
                }
              >
                <option value="sale">For sale</option>
                <option value="rent">For rent</option>
                <option value="short_stay">For short stays</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              {purpose === "short_stay" ? "Nightly rate (KSh)" : "Price (KSh)"}
              <input
                name="price"
                required
                type="number"
                min="1"
                placeholder={purpose === "short_stay" ? "8500" : "145000"}
              />
            </label>
            <label>
              Property type
              <select name="propertyType">
                <option>Apartment</option>
                <option>House</option>
                <option>Townhouse</option>
                <option>Land</option>
                <option>Commercial</option>
              </select>
            </label>
          </div>
          <div className="form-row three">
            <label>
              Bedrooms
              <input name="bedrooms" type="number" min="0" defaultValue="2" />
            </label>
            <label>
              Bathrooms
              <input name="bathrooms" type="number" min="0" defaultValue="1" />
            </label>
            <label>
              Area (m²)
              <input name="area" type="number" min="0" placeholder="95" />
            </label>
          </div>
          {purpose === "short_stay" && (
            <>
              <div className="form-row three stay-form-row">
                <label>
                  Guests
                  <input
                    name="maxGuests"
                    type="number"
                    min="1"
                    max="16"
                    defaultValue="2"
                    required
                  />
                </label>
                <label>
                  Minimum nights
                  <input
                    name="minimumNights"
                    type="number"
                    min="1"
                    defaultValue="1"
                    required
                  />
                </label>
                <label>
                  Stay type
                  <select name="stayType" defaultValue="entire_place">
                    <option value="entire_place">Entire place</option>
                    <option value="private_room">Private room</option>
                    <option value="shared_room">Shared room</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Available from
                  <input name="availabilityStart" type="date" />
                </label>
                <label>
                  Available until
                  <input
                    name="availabilityEnd"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </label>
              </div>
              <p className="stay-disclaimer">
                Travellers send a request to you; dates are confirmed directly.
                Doorstep does not take bookings or payments.
              </p>
            </>
          )}
          <div className="form-row">
            <label>
              Neighbourhood
              <input name="neighborhood" required placeholder="Kilimani" />
            </label>
            <label>
              Town / city
              <input name="city" required placeholder="Nairobi" />
            </label>
          </div>
          <label>
            County
            <input name="county" required placeholder="Nairobi" />
          </label>
          {memberships.length > 0 && (
            <label>
              Agency
              <select name="agencyId">
                <option value="">Independent listing</option>
                {memberships.map((membership) => (
                  <option
                    key={membership.agencyId._id}
                    value={membership.agencyId._id}
                  >
                    {membership.agencyId.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Description
            <textarea
              name="description"
              required
              rows={3}
              maxLength={4000}
              placeholder="Tell seekers what makes this home special."
            />
          </label>
          <fieldset className="photo-fieldset">
            <legend>
              Property photos <span>UP TO 10</span>
            </legend>
            <label className="photo-picker">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                onChange={chooseImages}
              />
              <ImagePlus size={19} />
              <span>Add several photos</span>
              <small>JPG, PNG, WebP or AVIF · 8 MB each</small>
              <Plus size={16} />
            </label>
            {previews.length > 0 && (
              <div className="photo-preview-grid">
                {previews.map((url, index) => (
                  <div className="photo-preview" key={url}>
                    <img src={url} alt={`Property photo ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      <X size={14} />
                    </button>
                    {index === 0 && <span>COVER</span>}
                  </div>
                ))}
              </div>
            )}
          </fieldset>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="publish-button" type="submit" disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle className="spin" size={16} />
                Saving property…
              </>
            ) : (
              <>
                <Check size={16} />
                Submit for review
              </>
            )}
          </button>
          <p className="form-disclaimer">
            Your listing stays private until our team approves it. No payment is
            collected.
          </p>
        </form>
      </section>
    </div>
  );
}
