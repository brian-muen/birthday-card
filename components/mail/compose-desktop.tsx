"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { createCard } from "@/app/actions/create-card";
import CardPreview from "@/components/card-preview";
import {
  saveComposeDraft,
  takeComposeDraft,
  type ComposeDraft,
} from "@/components/mail/compose-draft";
import { HomeMailIcon, HomeMailWindow } from "@/components/mail/home-mail";
import { OrganizerIcons } from "@/components/mail/organizer-icons";
import ComposeSignIn from "@/components/mail/compose-signin";
import ComposeStationery from "@/components/mail/compose-stationery";
import { MailIcon } from "@/components/mail/outbox-icons";
import BlinkDots from "@/components/os/blink-dots";
import Computer from "@/components/os/computer";
import { AppIcon, AppWindow } from "@/components/os/desktop";
import OsWindow from "@/components/os/os-window";
import { PixelIcon } from "@/components/os/pixel-icon";
import { playSound } from "@/components/os/sound";
import { signByDay } from "@/lib/birthday";
import type { DesignId } from "@/lib/design";
import { isPaperCut, paperCut } from "@/lib/paper-cut";
import type { StockId } from "@/lib/stock";
import "@/app/compose.css";

const NAME_MAX = 80;
const INTRO_MAX = 500;
const MISSING_NAME = "Whose birthday is it? Add their name.";
const PAINTING_STAGE = "#e4dcd2";

export default function ComposeDesktop({
  signedIn,
  error,
  initialName,
  initialBirthday,
  initialStock,
  initialDesign,
}: {
  signedIn: boolean;
  error?: string;
  initialName: string;
  initialBirthday: string;
  initialStock: StockId;
  initialDesign: DesignId;
}) {
  const [name, setName] = useState(initialName);
  const [birthday, setBirthday] = useState(initialBirthday);
  const [stock, setStock] = useState(initialStock);
  const [design, setDesign] = useState(initialDesign);
  const [intro, setIntro] = useState("");
  const [alert, setAlert] = useState(error ?? null);
  const [shownError, setShownError] = useState(error);
  const [signInOpen, setSignInOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const savedDraft = useRef<ComposeDraft | null | undefined>(undefined);

  if (error !== shownError) {
    setShownError(error);
    setAlert(error ?? null);
  }

  const trimmed = name.trim();
  const signBy = birthday ? signByDay(birthday) : "";
  const stage = isPaperCut(design) ? paperCut(design).stage : PAINTING_STAGE;

  const dismissAlert = useCallback(() => {
    setAlert(null);
    nameRef.current?.focus();
  }, []);

  const dismissSignIn = useCallback(() => {
    setSignInOpen(false);
    nameRef.current?.focus();
  }, []);

  // The ref keeps the draft through Strict Mode's second effect run, after
  // the save effect below has already cleared storage.
  useEffect(() => {
    if (savedDraft.current === undefined) savedDraft.current = takeComposeDraft();
    const draft = savedDraft.current;
    if (!draft) return;
    const restore = window.setTimeout(() => {
      setName(draft.name);
      setBirthday(draft.birthday);
      setIntro(draft.intro);
      setStock(draft.stock);
      setDesign(draft.design);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    if (!signedIn) saveComposeDraft({ name, birthday, intro, stock, design });
  }, [signedIn, name, birthday, intro, stock, design]);

  return (
    <div className="compose-screen">
      <Computer
        stock={stock}
        icons={
          <OrganizerIcons signedIn={signedIn} next="/" current="new">
            <AppIcon app="compose" icon="compose" label="New card" />
            <AppIcon app="preview" icon="card" label="Preview" />
            <HomeMailIcon />
          </OrganizerIcons>
        }
      >
        <h1 className="sr-only">Start a birthday card</h1>
        <form
          action={createCard}
          noValidate
          className="compose"
          onSubmit={(event) => {
            if (!signedIn) {
              event.preventDefault();
              setAlert(null);
              setSignInOpen(true);
              return;
            }
            if (trimmed) {
              setAlert(null);
              playSound("sent");
              return;
            }
            event.preventDefault();
            setAlert(MISSING_NAME);
          }}
        >
          <AppWindow app="compose">
            <OsWindow
              title="New message"
              width="38rem"
              draggable
              className="compose-window"
              closeLabel="Close New message and keep the draft"
              toolbar={<ComposeToolbar signedIn={signedIn} introLength={intro.length} />}
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
                <label htmlFor="birthday" className="compose-label">
                  Birthday
                </label>
                <div className="compose-birthday">
                  <input
                    id="birthday"
                    name="birthday"
                    type="date"
                    value={birthday}
                    onChange={(event) => setBirthday(event.target.value)}
                    aria-describedby="birthday-hint"
                    data-empty={birthday ? undefined : true}
                    className="os-header-field compose-date"
                  />
                  <span id="birthday-hint" className="compose-date-hint">
                    {signBy ? `Signers are asked to sign by ${signBy}.` : "Optional. Signers get a sign-by date."}
                  </span>
                </div>
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
                  "Add a note for everyone signing, if you like.\nIt’s a surprise, so keep it quiet!"
                }
              />
              <ComposeStationery
                design={design}
                stock={stock}
                onDesign={setDesign}
                onStock={setStock}
              />
            </OsWindow>
          </AppWindow>

          <AppWindow app="preview">
            <OsWindow
              title={trimmed ? `${trimmed}’s card` : "The card"}
              width="19rem"
              className="compose-preview"
              draggable
              closeLabel="Close the card preview"
            >
              <div className="compose-preview-stage" style={{ ["--stage" as string]: stage }}>
                <CardPreview name={name} stock={stock} design={design} compact />
              </div>
            </OsWindow>
          </AppWindow>
        </form>

        <HomeMailWindow />
        {alert ? <ComposeAlert message={alert} onDismiss={dismissAlert} /> : null}
        {signInOpen ? (
          <ComposeSignIn hasDraft={Boolean(trimmed || birthday || intro.trim())} onDismiss={dismissSignIn} />
        ) : null}
      </Computer>
    </div>
  );
}

function ComposeToolbar({ signedIn, introLength }: { signedIn: boolean; introLength: number }) {
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
        <PixelIcon name={signedIn ? "mail" : "person"} />
        {pending ? <BlinkDots label="Sending" /> : signedIn ? "Send" : "Sign in to send"}
      </button>
      {pending ? (
        <span className="compose-progress" aria-hidden="true">
          <span />
        </span>
      ) : (
        <p className="compose-toolbar-note">
          {signedIn
            ? "Sending gives you the links to share."
            : "Organizers sign in with Google first."}
        </p>
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
