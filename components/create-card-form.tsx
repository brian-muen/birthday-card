"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createCard } from "@/app/actions/create-card";
import CardPreview from "@/components/card-preview";
import BoxCover from "@/components/box-cover";
import CoverArt from "@/components/cover-art";
import { isBoxDesign } from "@/lib/box-art/recipes";
import { DESIGNS, type DesignId } from "@/lib/design";
import { DEFAULT_STOCK, STOCKS, type StockId } from "@/lib/stock";

const COVER_KINDS = [
  { id: "classic", label: "Birthday" },
  { id: "window", label: "Paintings" },
  { id: "stickers", label: "Stickers" },
] as const;

type CoverKind = (typeof COVER_KINDS)[number]["id"];

function kindOf(id: DesignId): CoverKind {
  const group = DESIGNS.find((design) => design.id === id)?.group;
  return group ?? "classic";
}

function firstOfKind(kind: CoverKind): DesignId {
  return DESIGNS.find((design) => design.group === kind)?.id ?? "cake";
}

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
  const [kind, setKind] = useState<CoverKind>(kindOf(initialDesign));
  const covers = DESIGNS.filter((option) => option.group === kind);

  function chooseKind(next: CoverKind) {
    setKind(next);
    if (kindOf(design) !== next) setDesign(firstOfKind(next));
  }

  return (
    <form action={createCard} className="create-card-form">
      <div className="create-name">
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
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}

      <CardPreview name={name} stock={stock} design={design} />

      <div className="cover-kinds" role="group" aria-label="Cover style">
        {COVER_KINDS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="cover-kind"
            aria-pressed={kind === option.id}
            onClick={() => chooseKind(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="cover-slot">
        <fieldset className="cover-field">
          <legend className="sr-only">Cover</legend>
          <div className="design-options" data-count={covers.length}>
            {covers.map((option) => (
              <DesignChoice
                key={option.id}
                option={option}
                selected={design}
                onSelect={setDesign}
              />
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset className="stock-field">
        <legend className="sr-only">Paper</legend>
        <div className="stock-options">
          {STOCKS.map((option) => (
            <label key={option.id} className="stock-option" title={option.label}>
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
              <span className="sr-only">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <CreateButton />
      <p className="privacy-note">Notes stay between you and them.</p>

      <details className="create-more">
        <summary>A note for people signing</summary>
        <div className="form-field intro-field">
          <label htmlFor="intro">
            For people signing <span>optional</span>
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
      </details>
    </form>
  );
}

function DesignChoice({
  option,
  selected,
  onSelect,
}: {
  option: (typeof DESIGNS)[number];
  selected: DesignId;
  onSelect: (id: DesignId) => void;
}) {
  return (
    <label className="design-option" title={option.label}>
      <input
        type="radio"
        name="design"
        value={option.id}
        checked={selected === option.id}
        onChange={() => onSelect(option.id)}
        className="sr-only"
      />
      <span className="design-thumbnail" aria-hidden="true">
        {isBoxDesign(option.id) ? (
          <BoxCover design={option.id} compact />
        ) : (
          <CoverArt design={option.id} />
        )}
      </span>
      <span className="sr-only">{option.label}</span>
    </label>
  );
}

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="ui-button ui-button-primary create-button"
    >
      {pending ? "Making the card…" : "Make the card"}
    </button>
  );
}
