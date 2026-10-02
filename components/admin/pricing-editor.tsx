"use client";
import type { Content, Price } from "@/lib/model";
import { Fields } from "./fields";
export function PricingEditor({
  price: p,
  products,
  onChange,
}: {
  price: Price;
  products: Content["products"];
  onChange: (v: Price) => void;
}) {
  return (
    <div className="admin-panel pricing-editor">
      <h2>Pricing details</h2>
      <label>
        Price schedule name
        <input
          value={p.name}
          onChange={(e) => onChange({ ...p, name: e.target.value })}
        />
      </label>
      <fieldset>
        <legend>Applies to these products or formats</legend>
        {products.map((product) => (
          <label className="checkbox" key={product.id}>
            <input
              type="checkbox"
              checked={p.productIds.includes(product.id)}
              onChange={(e) =>
                onChange({
                  ...p,
                  productIds: e.target.checked
                    ? [...p.productIds, product.id]
                    : p.productIds.filter((id) => id !== product.id),
                })
              }
            />
            {product.name} ({product.format})
          </label>
        ))}
      </fieldset>
      <h3>Quantity ranges</h3>
      <p className="fine">
        Enter the minimum quantity for each tier. Each range ends just before
        the next tier begins, so ranges cannot overlap. The last tier has no
        upper limit.
      </p>
      <div className="tiers-list">
        {p.tiers.map((tier, i) => {
          const next = p.tiers
            .filter((t) => t.min > tier.min)
            .sort((a, b) => a.min - b.min)[0];
          return (
            <div className="tier-row" key={i}>
              <label>
                Minimum quantity
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={tier.min || ""}
                  onChange={(e) =>
                    onChange({
                      ...p,
                      tiers: p.tiers.map((t, n) =>
                        n === i ? { ...t, min: Number(e.target.value) } : t,
                      ),
                    })
                  }
                />
              </label>
              <div className="tier-range">
                <span>Range</span>
                <strong>
                  {tier.min}
                  {next ? `–${next.min - 1}` : "+"}
                </strong>
              </div>
              <label>
                Price per piece (₹)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={tier.price || ""}
                  onChange={(e) =>
                    onChange({
                      ...p,
                      tiers: p.tiers.map((t, n) =>
                        n === i ? { ...t, price: Number(e.target.value) } : t,
                      ),
                    })
                  }
                />
              </label>
              <button
                className="icon-button"
                aria-label={`Remove tier ${i + 1}`}
                disabled={p.tiers.length === 1}
                onClick={() => {
                  if (confirm("Remove this price tier from the draft?"))
                    onChange({
                      ...p,
                      tiers: p.tiers.filter((_, n) => n !== i),
                    });
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <button
        className="button outline"
        onClick={() =>
          onChange({
            ...p,
            tiers: [
              ...p.tiers,
              {
                min: Math.max(0, ...p.tiers.map((t) => t.min)) + 100,
                price: p.tiers.at(-1)?.price || 1,
              },
            ],
          })
        }
      >
        + Add price tier
      </button>
      <hr />
      <label>
        Optional packaging charge per calendar (₹)
        <input
          type="number"
          min={0}
          step="0.01"
          value={p.packagingCharge ?? ""}
          placeholder="Leave blank if quoted separately"
          onChange={(e) =>
            onChange({
              ...p,
              packagingCharge:
                e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
        />
      </label>
      <p className="fine">
        Customers can include this optional charge in their estimate. Leave it
        blank when packaging needs a separate quote.
      </p>
      <Fields
        value={p}
        onChange={onChange}
        only={["packaging", "tax", "shipping"]}
      />
    </div>
  );
}
