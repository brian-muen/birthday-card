"use client";

import { useState } from "react";
import { createCard } from "@/app/actions/create-card";
import CardPreview from "@/components/card-preview";
import { DEFAULT_STOCK, STOCKS, type StockId } from "@/lib/stock";

export default function CreateCardForm({
  error,
  initialName = "",
  initialStock = DEFAULT_STOCK,
}: {
  error?: string;
  initialName?: string;
  initialStock?: StockId;
}) {
  const [name, setName] = useState(initialName);
  const [stock, setStock] = useState<StockId>(initialStock);

  return (
    <div className="create-card-layout">
      <CardPreview name={name} stock={stock} />
      <form action={createCard} className="create-card-form">
        <h1>Start a card</h1>
        <p className="paper-lede">
          Share one link. Each person writes their own note.
        </p>
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        <div className="form-field">
          <label htmlFor="recipientName">Whose birthday is it?</label>
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
          <p className="field-hint">Up to 80 characters</p>
        </div>
        <fieldset className="stock-field">
          <legend>Choose the paper</legend>
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
            A note for the people signing <span>(optional)</span>
          </label>
          <textarea
            id="intro"
            name="intro"
            rows={3}
            maxLength={500}
            className="field"
            placeholder="A little context, if you like"
          />
          <p className="field-hint">They&apos;ll read this before they write.</p>
        </div>
        <button type="submit" className="create-button">
          Create the card
        </button>
        <p className="privacy-note">
          Messages are private to the organizer and recipient. Other
          contributors can&apos;t read them.
        </p>
      </form>
    </div>
  );
}
