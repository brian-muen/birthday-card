"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createCard } from "@/app/actions/create-card";
import CardPreview from "@/components/card-preview";
import CoverArt from "@/components/cover-art";
import { DESIGNS, type DesignId } from "@/lib/design";
import { DEFAULT_STOCK, STOCKS, type StockId } from "@/lib/stock";

export default function CreateCardForm({
  error,
  initialName = "",
  initialStock = DEFAULT_STOCK,
  initialDesign = "cake",
}: {
  error?: string;
  initialName?: string;
  initialStock?: StockId;
  initialDesign?: DesignId;
}) {
  const [name, setName] = useState(initialName);
  const [stock, setStock] = useState<StockId>(initialStock);
  const [design, setDesign] = useState<DesignId>(initialDesign);

  return (
    <div className="create-card-layout">
      <CardPreview name={name} stock={stock} design={design} />
      <form action={createCard} className="create-card-form">
        <p className="paper-lede">Everyone writes a private note.</p>
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        <div className="form-field form-field-lead">
          <h1>
            <label htmlFor="recipientName">Whose birthday?</label>
          </h1>
          <input
            id="recipientName"
            name="recipientName"
            type="text"
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            placeholder="Their name"
            className="field"
          />
        </div>
        <fieldset className="stock-field">
          <legend>Cover</legend>
          <div className="design-options">
            {DESIGNS.map((option) => (
              <label className="design-option" key={option.id}>
                <input type="radio" name="design" value={option.id} checked={design === option.id}
                  onChange={() => setDesign(option.id)} className="sr-only" />
                <span className="design-thumbnail" aria-hidden="true">
                  {option.id === "plain" ? <span className="design-plain">Happy<br />birthday</span> : <CoverArt design={option.id} />}
                </span>
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="stock-field">
          <legend>Paper</legend>
          <div className="stock-options">
            {STOCKS.map((option) => (
              <label key={option.id} className="stock-option">
                <input
                  type="radio"
                  name="stock"
                  value={option.id}
                  checked={option.id === stock}
                  onChange={() => setStock(option.id)}
                  className="sr-only"
                />
                <span
                  className="stock-swatch"
                  style={{ backgroundColor: option.hex }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="form-field intro-field">
          <label htmlFor="intro">
            For the people signing <span>(optional)</span>
          </label>
          <textarea
            id="intro"
            name="intro"
            rows={1}
            onChange={(event) => {
              event.currentTarget.style.height = "auto";
              event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
            }}
            maxLength={500}
            className="field"
            placeholder="A little context, if you like"
          />
        </div>
        <CreateButton />
        <p className="privacy-note">
          Only you and they can read the notes.
        </p>
      </form>
    </div>
  );
}

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className="ui-button ui-button-primary create-button">
      {pending ? "Making the card…" : "Make the card"}
    </button>
  );
}
