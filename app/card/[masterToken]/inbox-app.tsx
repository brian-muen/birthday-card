"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";

import Computer from "@/components/os/computer";
import { AppWindow, focusDesktop } from "@/components/os/desktop";
import { DesktopIcon, PixelIcon } from "@/components/os/pixel-icon";
import { playSound } from "@/components/os/sound";
import { zoomRects } from "@/components/os/zoom-rects";
import {
  getReducedMotion,
  getServerFalse,
  subscribeToMotion,
} from "@/components/folded-card";
import { rememberCard } from "@/lib/remembered-mail";
import CardBook from "./card-book";
import InboxArrival from "./inbox-arrival";
import InboxBalloons from "./inbox-balloons";
import InboxBoot, { hasBooted, markBooted } from "./inbox-boot";
import InboxMail, { useWide, type InboxNote, type Pane } from "./inbox-mail";
import { useReadState } from "./inbox-read-state";

type Phase = "computer" | "leaving" | "card";

const ARRIVAL_DELAY = 700;
const AFTER_BOOT_MS = 150;
const RECEDE_MS = 780;
const BALLOONS_MS = 2300;

export default function InboxApp({
  token,
  masterToken,
  canManage,
  remember,
  recipientName,
  design,
  intro,
  dedication,
  stock,
  birthday,
  notes,
}: {
  token: string;
  masterToken: string;
  canManage: boolean;
  remember: boolean;
  recipientName: string;
  design: string;
  intro: string | null;
  dedication: string | null;
  stock: string;
  birthday: string | null;
  notes: InboxNote[];
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    getReducedMotion,
    getServerFalse,
  );
  const wide = useWide();
  const { readIds, setRead } = useReadState(token);

  const [phase, setPhase] = useState<Phase>("computer");
  const [returned, setReturned] = useState(false);
  const [balloons, setBalloons] = useState(0);
  const [booting, setBooting] = useState(false);
  const [arrival, setArrival] = useState<"waiting" | "shown" | "done">("waiting");
  const [mailOpen, setMailOpen] = useState(false);
  const [mailFocus, setMailFocus] = useState<"list" | "transform">("list");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pane, setPane] = useState<Pane>("list");

  const transformRef = useRef<HTMLButtonElement>(null);
  const mailIconRef = useRef<HTMLButtonElement>(null);
  const tableRef = useRef<HTMLElement>(null);
  const timers = useRef<number[]>([]);
  const zoomFrom = useRef<DOMRect | null>(null);

  const pdfHref = `/card/${token}/pdf`;
  const shareHref = `/created/${masterToken}`;
  const unreadNotes = notes.filter((note) => !readIds.has(note.id));
  const currentId = notes.some((note) => note.id === selectedId)
    ? selectedId
    : (notes[0]?.id ?? null);

  const openMail = useCallback(
    (from?: Element | null) => {
      if (!mailOpen) zoomFrom.current = from?.getBoundingClientRect() ?? null;
      setArrival("done");
      setMailFocus("list");
      setMailOpen(true);
      setSelectedId((id) =>
        notes.some((note) => note.id === id)
          ? id
          : (notes.find((note) => !readIds.has(note.id)) ?? notes[0])?.id ?? null,
      );
    },
    [mailOpen, notes, readIds],
  );

  const arrive = useCallback(() => {
    if (notes.length > 0 && unreadNotes.length === 0) {
      openMail(mailIconRef.current);
      return;
    }
    setArrival("shown");
    if (unreadNotes.length) playSound("mail");
  }, [notes.length, unreadNotes.length, openMail]);

  const latest = useRef(arrive);
  useLayoutEffect(() => {
    latest.current = arrive;
  });

  useEffect(() => {
    const boot = remember && !getReducedMotion() && !hasBooted(token);
    const timer = window.setTimeout(
      () => (boot ? setBooting(true) : latest.current()),
      boot ? 0 : ARRIVAL_DELAY,
    );
    return () => window.clearTimeout(timer);
  }, [remember, token]);

  function finishBoot() {
    markBooted(token);
    setBooting(false);
    timers.current.push(window.setTimeout(() => latest.current(), AFTER_BOOT_MS));
  }

  useLayoutEffect(() => {
    const from = zoomFrom.current;
    zoomFrom.current = null;
    if (!mailOpen || !from || phase !== "computer") return;
    const win = document.querySelector(".inbox-mail");
    zoomRects(from, win, { hide: win });
  }, [mailOpen, phase]);

  useEffect(() => {
    const title =
      phase === "card"
        ? `${recipientName}’s birthday card`
        : `${unreadNotes.length ? `(${unreadNotes.length}) ` : ""}Happy birthday, ${recipientName}`;
    const full = `${title} · Birthday Mail`;
    const apply = () => {
      if (document.title !== full) document.title = full;
    };
    apply();
    // Streamed metadata can land after hydration and reset the title.
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [phase, unreadNotes.length, recipientName]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (remember) rememberCard({ token, recipientName, notes });
  }, [remember, token, recipientName, notes]);

  useEffect(() => {
    if (phase === "card") tableRef.current?.focus({ preventScroll: true });
  }, [phase]);

  function transform() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setArrival("done");
    if (reducedMotion) {
      setPhase("card");
      return;
    }
    playSound("pop");
    setBalloons((n) => n + 1);
    setPhase("leaving");
    timers.current.push(
      window.setTimeout(() => setPhase("card"), RECEDE_MS),
      window.setTimeout(() => setBalloons(0), BALLOONS_MS),
    );
  }

  /** Closes a window back onto the desktop, zooming it into the Mail icon. */
  function toDesktop(selector: string, change: () => void) {
    const from = document.querySelector(selector)?.getBoundingClientRect();
    flushSync(change);
    zoomRects(from, mailIconRef.current);
    focusDesktop(mailIconRef.current);
  }

  function turnBack() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    flushSync(() => {
      setBalloons(0);
      setReturned(true);
      setMailFocus("transform");
      setMailOpen(true);
      setSelectedId(currentId);
      setPhase("computer");
    });
  }

  const icons = (
    <>
      <button
        ref={mailIconRef}
        type="button"
        className="os-icon"
        data-app-icon="mail"
        data-open={mailOpen || undefined}
        aria-label={unreadNotes.length ? `Mail, ${unreadNotes.length} unread` : "Mail"}
        onClick={(event) => openMail(event.currentTarget)}
      >
        <span className="inbox-icon-art">
          <PixelIcon name={unreadNotes.length ? "unread" : "mail"} />
          {unreadNotes.length ? (
            <span className="os-badge inbox-icon-badge" aria-hidden>
              {unreadNotes.length}
            </span>
          ) : null}
        </span>
        <span className="os-icon-label">Mail</span>
      </button>
      <DesktopIcon icon="card" label="Transform" onClick={transform} />
      <DesktopIcon icon="keepsake" label="Print" href={pdfHref} download />
      {canManage ? <DesktopIcon icon="folder" label="Share links" href={shareHref} /> : null}
    </>
  );

  const openToNote =
    mailOpen && currentId !== null && (wide || pane === "message") ? currentId : null;

  return (
    <>
      {phase === "card" ? (
        <main
          ref={tableRef}
          tabIndex={-1}
          className="inbox-table"
          aria-label={`${recipientName}’s birthday card`}
          data-instant={reducedMotion || undefined}
        >
          <nav className="inbox-table-bar" aria-label="Card">
            <button type="button" className="inbox-table-link" onClick={turnBack}>
              <MonitorGlyph />
              Turn it back
            </button>
            <a href={pdfHref} download className="inbox-table-link">
              Print
            </a>
          </nav>
          <div className="inbox-table-card">
            <CardBook
              masterToken={masterToken}
              canManage={canManage}
              recipientName={recipientName}
              design={design}
              intro={intro}
              dedication={dedication}
              stock={stock}
              notes={notes}
              openToNote={openToNote}
            />
          </div>
        </main>
      ) : (
        <div
          className="inbox-scene"
          data-phase={phase}
          data-returned={returned || undefined}
          inert={phase === "leaving" || undefined}
        >
          <Computer
            stock={stock}
            icons={icons}
            birthday={
              birthday
                ? {
                    day: birthday,
                    greeting: canManage
                      ? `It’s ${recipientName}’s birthday!`
                      : `Happy birthday, ${recipientName}!`,
                  }
                : null
            }
          >
            {booting ? (
              <InboxBoot
                recipientName={recipientName}
                senders={notes.map((note) => note.authorName)}
                onDone={finishBoot}
              />
            ) : null}

            <AppWindow app="mail" open={mailOpen}>
              <InboxMail
                notes={notes}
                recipientName={recipientName}
                canManage={canManage}
                masterToken={masterToken}
                shareHref={shareHref}
                selectedId={currentId}
                onSelect={setSelectedId}
                pane={pane}
                onPane={setPane}
                readIds={readIds}
                setRead={setRead}
                onTransform={transform}
                onClose={() => toDesktop(".inbox-mail", () => setMailOpen(false))}
                transformRef={transformRef}
                focusOnMount={mailFocus}
              />
            </AppWindow>

            {arrival === "shown" ? (
              <InboxArrival
                senders={unreadNotes.map((note) => note.authorName)}
                canManage={canManage}
                recipientName={recipientName}
                shareHref={shareHref}
                onOpen={() => openMail(document.querySelector(".inbox-alert"))}
                onDismiss={() => toDesktop(".inbox-alert", () => setArrival("done"))}
              />
            ) : null}
          </Computer>
        </div>
      )}
      {balloons ? <InboxBalloons key={balloons} /> : null}
    </>
  );
}

function MonitorGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="inbox-table-glyph" aria-hidden="true">
      <rect x="2.5" y="3" width="15" height="10.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 17h6M10 13.5V17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
