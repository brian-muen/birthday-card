"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createCard } from "@/app/actions/create-card";
import CardPreview from "@/components/card-preview";
import BoxCover from "@/components/box-cover";
import CoverArt from "@/components/cover-art";
import PaperCutCover from "@/components/paper-cut-cover";
import { isBoxDesign } from "@/lib/box-art/recipes";
import { DEFAULT_DESIGN, PICKER_DESIGNS, type DesignId } from "@/lib/design";
import { isPaperCut, paperCut } from "@/lib/paper-cut";
import { DEFAULT_STOCK, STOCKS, type StockId } from "@/lib/stock";

const PAINTING_STAGE = "#e4dcd2";

function stageFor(design: DesignId) {
  return isPaperCut(design) ? paperCut(design).stage : PAINTING_STAGE;
}

export default function CreateCardForm({
  error,
  initialName = "",
  initialStock = DEFAULT_STOCK,
  initialDesign = DEFAULT_DESIGN,
}: {
  error?: string;
  initialName?: string;
  initialStock?: StockId;
  initialDesign?: DesignId;
}) {
  const [name, setName] = useState(initialName);
  const [stock, setStock] = useState<StockId>(initialStock);
  const [design, setDesign] = useState<DesignId>(initialDesign);
  const stockColor = STOCKS.find((item) => item.id === stock)?.hex;
  const trimmed = name.trim();

  return (
    <form
      action={createCard}
      className="home"
      style={{
        ["--card-stock" as string]: stockColor,
        ["--stage" as string]: stageFor(design),
      }}
    >
      <div className="home-intro">
        <h1>
          <label htmlFor="recipientName">A card for</label>
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
          placeholder="their name"
          className="home-name"
        />
      </div>

      <section className="home-stage" aria-label="Card preview">
        <CardPreview name={name} stock={stock} design={design} />
      </section>

      <div className="home-fields">
        <fieldset className="maker-covers">
          <legend>Cover</legend>
          <div className="design-options">
            {PICKER_DESIGNS.map((option) => (
              <DesignChoice
                key={option.id}
                option={option}
                selected={design}
                onSelect={setDesign}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="maker-paper">
          <legend>Paper</legend>
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
                <span className="stock-swatch" style={{ backgroundColor: option.hex }} />
                <span className="sr-only">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="maker-submit">
          <CreateButton name={trimmed} />
          {error ? (
            <p role="alert" className="form-error">
              {error}
            </p>
          ) : (
            <p className="privacy-note">Signers can’t read each other’s notes.</p>
          )}
        </div>
        <details className="create-more">
          <summary>Add a note for people signing</summary>
          <div className="form-field intro-field">
            <label htmlFor="intro">
              Shown before they write <span>optional</span>
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
              placeholder="The party’s on Saturday, so please sign by Friday"
            />
          </div>
        </details>

      </div>
    </form>
  );
}

function DesignChoice({
  option,
  selected,
  onSelect,
}: {
  option: (typeof PICKER_DESIGNS)[number];
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
        {isPaperCut(option.id) ? (
          <PaperCutCover design={option.id} compact />
        ) : isBoxDesign(option.id) ? (
          <BoxCover design={option.id} compact />
        ) : (
          <CoverArt design={option.id} />
        )}
      </span>
      <span className="sr-only">{option.label}</span>
    </label>
  );
}

function CreateButton({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="ui-button ui-button-primary create-button"
    >
      {pending ? "Starting the card…" : name ? `Start ${name}’s card` : "Start the card"}
    </button>
  );
}
