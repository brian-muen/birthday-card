"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { createCard } from "@/app/actions/create-card";
import CardPreview from "@/components/card-preview";
import { organizerMenus } from "@/components/mail/compose-menus";
import ComposeStationery from "@/components/mail/compose-stationery";
import { MailIcon } from "@/components/mail/outbox-icons";
import Computer from "@/components/os/computer";
import OsWindow from "@/components/os/os-window";
import { DesktopIcon, PixelIcon } from "@/components/os/pixel-icon";
import type { DesignId } from "@/lib/design";
import { isPaperCut, paperCut } from "@/lib/paper-cut";
import { stockHex, type StockId } from "@/lib/stock";
import "@/app/compose.css";

const NAME_MAX = 80;
const INTRO_MAX = 500;
const MISSING_NAME = "Whose birthday is it? Add their name.";
const PAINTING_STAGE = "#e4dcd2";

export default function ComposeDesktop({
  signedIn,
  error,
  initialName,
  initialStock,
  initialDesign,
}: {
  signedIn: boolean;
  error?: string;
  initialName: string;
  initialStock: StockId;
  initialDesign: DesignId;
}) {
  const [name, setName] = useState(initialName);
  const [stock, setStock] = useState(initialStock);
  const [design, setDesign] = useState(initialDesign);
  const [intro, setIntro] = useState("");
  const [alert, setAlert] = useState(error ?? null);
  const [shownError, setShownError] = useState(error);
  const nameRef = useRef<HTMLInputElement>(null);

  if (error !== shownError) {
    setShownError(error);
    setAlert(error ?? null);
  }

  const trimmed = name.trim();
  const stage = isPaperCut(design) ? paperCut(design).stage : PAINTING_STAGE;

  const dismissAlert = useCallback(() => {
    setAlert(null);
    nameRef.current?.focus();
  }, []);

  return (
    <div className="compose-screen" style={{ ["--wallpaper" as string]: stockHex(stock) }}>
      <Computer menus={organizerMenus({ signedIn })}>
        <h1 className="sr-only">Start a birthday card</h1>
        <form
          action={createCard}
          noValidate
          className="compose"
          onSubmit={(event) => {
            if (trimmed) {
              setAlert(null);
              return;
            }
            event.preventDefault();
            setAlert(MISSING_NAME);
          }}
        >
          <OsWindow
            title="New message"
            width="38rem"
            draggable
            className="compose-window"
            toolbar={<ComposeToolbar introLength={intro.length} />}
          >
            <div className="compose-headers">
              <label htmlFor="recipientName" className="compose-label">
                For
              </label>
              <input
                ref={nameRef}
                id="recipientName"
                name="recipientName"
                type="text"
                required
                maxLength={NAME_MAX}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="off"
                placeholder="Whose birthday is it?"
                aria-invalid={alert === MISSING_NAME || undefined}
                className="os-header-field compose-name"
              />
              <span className="compose-label" aria-hidden="true">
                Subject
              </span>
              <p className="compose-subject" data-empty={trimmed ? undefined : true}>
                <span className="sr-only">Subject: </span>
                {trimmed ? `Sign ${trimmed}’s birthday card` : "Sign their birthday card"}
              </p>
            </div>
            <label htmlFor="intro" className="sr-only">
              Note to everyone signing, optional
            </label>
            <textarea
              id="intro"
              name="intro"
              rows={5}
              maxLength={INTRO_MAX}
              value={intro}
              onChange={(event) => setIntro(event.target.value)}
              className="compose-body"
              placeholder={
                "Add a note for everyone signing, if you like.\nThe party’s on Saturday, so please sign by Friday."
              }
            />
            <ComposeStationery
              design={design}
              stock={stock}
              onDesign={setDesign}
              onStock={setStock}
            />
          </OsWindow>

          <OsWindow
            title={trimmed ? `${trimmed}’s card` : "The card"}
            width="19rem"
            className="compose-preview"
            draggable
          >
            <div className="compose-preview-stage" style={{ ["--stage" as string]: stage }}>
              <CardPreview name={name} stock={stock} design={design} compact />
            </div>
          </OsWindow>
        </form>

        {alert ? <ComposeAlert message={alert} onDismiss={dismissAlert} /> : null}

        <div className="os-icons">
          {signedIn ? (
            <DesktopIcon icon="folder" label="Sent" href="/cards" />
          ) : (
            <DesktopIcon icon="person" label="Account" href="/account" />
          )}
        </div>
      </Computer>
    </div>
  );
}

function ComposeToolbar({ introLength }: { introLength: number }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="submit"
        className="os-button compose-send"
        data-variant="accent"
        disabled={pending}
        aria-busy={pending}
      >
        <PixelIcon name="mail" />
        {pending ? "Sending…" : "Send"}
      </button>
      {pending ? (
        <span className="compose-progress" aria-hidden="true">
          <span />
        </span>
      ) : (
        <p className="compose-toolbar-note">Sending gives you the links to share.</p>
      )}
      {introLength > INTRO_MAX - 100 ? (
        <span className="compose-count">
          {introLength}/{INTRO_MAX}
        </span>
      ) : null}
    </>
  );
}

function ComposeAlert({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    okRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  return (
    <OsWindow
      title="Can’t send yet"
      width="23rem"
      className="compose-alert"
      onClose={onDismiss}
      closeLabel="Close the message"
    >
      <div className="compose-alert-body">
        <MailIcon name="alert" className="compose-alert-icon" />
        <p role="alert">{message}</p>
        <button ref={okRef} type="button" className="os-button" onClick={onDismiss}>
          OK
        </button>
      </div>
    </OsWindow>
  );
}
