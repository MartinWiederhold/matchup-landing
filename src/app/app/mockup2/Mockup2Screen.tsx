"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import WimbledonWidget from "../mockup/WimbledonWidget";
import Mockup2Onboarding from "./Mockup2Onboarding";

function Icon({ path, className = "", size = 22, fill = "none" }: { path: string; className?: string; size?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  );
}

function SettingRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between px-5 py-3 text-left active:bg-black/[0.03]">
      <span className="text-sm text-neutral-800">{label}</span>
      <Icon path="M9 6l6 6-6 6" size={16} className="text-neutral-400" />
    </button>
  );
}

function SectionHead({ label, action }: { label: string; action?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{label}</span>
      {action && <span className="text-[12px] font-semibold text-matchup">{action}</span>}
    </div>
  );
}

const ME = { name: "Martin", img: "https://i.pravatar.cc/160?img=47" };

const FRIENDS = [
  { name: "Adzana", img: "https://i.pravatar.cc/160?img=5" },
  { name: "Feera", img: "https://i.pravatar.cc/160?img=9" },
  { name: "Kevin", img: "https://i.pravatar.cc/160?img=12" },
  { name: "Laila", img: "https://i.pravatar.cc/160?img=16" },
  { name: "Fernando", img: "https://i.pravatar.cc/160?img=13" },
];

const NEARBY = [
  { name: "Sofia", img: "https://i.pravatar.cc/160?img=1" },
  { name: "Jonas", img: "https://i.pravatar.cc/160?img=3" },
  { name: "Mara", img: "https://i.pravatar.cc/160?img=10" },
  { name: "Leo", img: "https://i.pravatar.cc/160?img=8" },
  { name: "Nina", img: "https://i.pravatar.cc/160?img=20" },
];

const SPORTS = [
  { key: "Tennis", color: "#10b981", imgs: ["https://i.pravatar.cc/120?img=15", "https://i.pravatar.cc/120?img=33", "https://i.pravatar.cc/120?img=51"] },
  { key: "Padel", color: "#7b6cff", imgs: ["https://i.pravatar.cc/120?img=22", "https://i.pravatar.cc/120?img=44", "https://i.pravatar.cc/120?img=6"] },
  { key: "Pickleball", color: "#f59e0b", imgs: ["https://i.pravatar.cc/120?img=27", "https://i.pravatar.cc/120?img=52", "https://i.pravatar.cc/120?img=14"] },
];

type ForYouPerson = {
  name: string; age: number; city: string; dist: string; img: string;
  online: boolean; sports: string[]; level: string; rating: string; bio: string;
  matches: number; winrate: string; score: number;
};
const FORYOU: ForYouPerson[] = [
  { name: "Elena", age: 27, city: "Zürich", dist: "1,2 km", img: "https://i.pravatar.cc/600?img=24", online: true, sports: ["Tennis", "Padel"], level: "Fortgeschritten", rating: "LK 9", bio: "Spiele seit 12 Jahren Tennis, seit einem Jahr auch Padel. Suche regelmässige Partner für Feierabend-Matches – am liebsten dienstags oder donnerstags.", matches: 38, winrate: "58 %", score: 1180 },
  { name: "Marco", age: 34, city: "Winterthur", dist: "6,8 km", img: "https://i.pravatar.cc/600?img=18", online: false, sports: ["Tennis"], level: "Turnierspieler", rating: "LK 5", bio: "Ambitionierter Turnierspieler, suche starke Gegner für Trainingsmatches. Ernst, aber immer fair und mit Spass an langen Ballwechseln.", matches: 91, winrate: "67 %", score: 1420 },
  { name: "Priya", age: 24, city: "Zürich", dist: "2,4 km", img: "https://i.pravatar.cc/600?img=45", online: true, sports: ["Padel", "Pickleball"], level: "Mittel", rating: "–", bio: "Neu in der Padel-Welt und total begeistert! Suche entspannte Leute zum gemeinsamen Lernen und für lockere Doppel am Wochenende.", matches: 14, winrate: "50 %", score: 1010 },
  { name: "Tom", age: 31, city: "Zug", dist: "12 km", img: "https://i.pravatar.cc/600?img=53", online: false, sports: ["Tennis", "Pickleball"], level: "Fortgeschritten", rating: "LK 11", bio: "Feierabend-Spieler mit viel Herzblut. Tennis im Sommer, Pickleball im Winter. Immer für ein Match und danach ein kühles Getränk zu haben.", matches: 52, winrate: "55 %", score: 1150 },
  { name: "Yuki", age: 29, city: "Luzern", dist: "9,1 km", img: "https://i.pravatar.cc/600?img=41", online: true, sports: ["Tennis"], level: "Mittel", rating: "LK 14", bio: "Spiele zum Ausgleich und um fit zu bleiben. Kein Leistungsdruck – Hauptsache Bewegung, gute Laune und nette Leute auf dem Platz.", matches: 23, winrate: "48 %", score: 1060 },
  { name: "Ben", age: 36, city: "Basel", dist: "—", img: "https://i.pravatar.cc/600?img=57", online: false, sports: ["Padel"], level: "Fortgeschritten", rating: "–", bio: "Padel-Fan der ersten Stunde. Organisiere regelmässig Doppel-Runden und freue mich immer über neue Mitspieler:innen jeden Levels.", matches: 64, winrate: "60 %", score: 1240 },
];

const CIRCLE = [
  "https://i.pravatar.cc/120?img=32",
  "https://i.pravatar.cc/120?img=45",
  "https://i.pravatar.cc/120?img=11",
  "https://i.pravatar.cc/120?img=7",
];

type ReqPerson = { id: number; name: string; age: number; img: string; sport: string; level: string };
const REQUESTS_INIT: ReqPerson[] = [
  { id: 1, name: "Clara", age: 27, img: "https://i.pravatar.cc/300?img=31", sport: "Padel", level: "Fortgeschritten" },
  { id: 2, name: "Diego", age: 31, img: "https://i.pravatar.cc/300?img=59", sport: "Tennis", level: "Mittel" },
  { id: 3, name: "Aisha", age: 24, img: "https://i.pravatar.cc/300?img=48", sport: "Pickleball", level: "Anfänger" },
  { id: 4, name: "Noah", age: 29, img: "https://i.pravatar.cc/300?img=68", sport: "Tennis", level: "Profi" },
];

type ChatItem = { id: number; name: string; img: string; last: string; time: string; unread: number; online?: boolean };
const CHATS_INIT: ChatItem[] = [
  { id: 101, name: "Adzana", img: "https://i.pravatar.cc/160?img=5", last: "Sehen wir uns Samstag um 10? 🎾", time: "jetzt", unread: 2, online: true },
  { id: 102, name: "Kevin", img: "https://i.pravatar.cc/160?img=12", last: "Guter Satz gestern! Rematch?", time: "12 Min.", unread: 0, online: true },
  { id: 103, name: "Laila", img: "https://i.pravatar.cc/160?img=16", last: "Du: Ich buche den Court 👍", time: "1 Std.", unread: 0 },
  { id: 104, name: "Fernando", img: "https://i.pravatar.cc/160?img=13", last: "Bringst du die Bälle mit?", time: "3 Std.", unread: 1 },
  { id: 105, name: "Feera", img: "https://i.pravatar.cc/160?img=9", last: "Danke fürs Spiel 🙌", time: "Gestern", unread: 0 },
];

type GroupItem = { id: number; name: string; sport: string; color: string; members: number; imgs: string[] };
const GROUPS_INIT: GroupItem[] = [
  { id: 1, name: "Padel Zürich Nord", sport: "Padel", color: "#7b6cff", members: 24, imgs: ["https://i.pravatar.cc/120?img=12", "https://i.pravatar.cc/120?img=5", "https://i.pravatar.cc/120?img=32"] },
  { id: 2, name: "Tennis Ladder Zürich", sport: "Tennis", color: "#10b981", members: 58, imgs: ["https://i.pravatar.cc/120?img=16", "https://i.pravatar.cc/120?img=45", "https://i.pravatar.cc/120?img=7"] },
  { id: 3, name: "Pickleball Beginners", sport: "Pickleball", color: "#f59e0b", members: 12, imgs: ["https://i.pravatar.cc/120?img=9", "https://i.pravatar.cc/120?img=13", "https://i.pravatar.cc/120?img=25"] },
];

type FeedItem = { id: number; name: string; img: string; time: string; text: string; likes: number; comments: number };
const FEED_INIT: FeedItem[] = [
  { id: 1, name: "Kevin", img: "https://i.pravatar.cc/120?img=12", time: "2 Std.", text: "Suche noch einen 4. für Padel morgen 18 Uhr in Zürich 🎾 Wer ist dabei?", likes: 6, comments: 3 },
  { id: 2, name: "Laila", img: "https://i.pravatar.cc/120?img=16", time: "5 Std.", text: "Die neuen Courts im TC Seefeld sind mega! Wer testet mit mir?", likes: 12, comments: 5 },
  { id: 3, name: "Sofia", img: "https://i.pravatar.cc/120?img=1", time: "Gestern", text: "Turniersieg am Wochenende 🏆 Danke an alle, die dabei waren!", likes: 28, comments: 9 },
];

type GameItem = { id: number; sport: string; type: string; date: string; loc: string; players: string[]; cap: number; bucket: "mine" | "open" | "past"; result?: string };
const GAMES_INIT: GameItem[] = [
  { id: 1, sport: "Padel", type: "Doppel", date: "Morgen · 18:00", loc: "TC Seefeld, Zürich", players: ["https://i.pravatar.cc/120?img=12", "https://i.pravatar.cc/120?img=16", "https://i.pravatar.cc/120?img=5"], cap: 4, bucket: "mine" },
  { id: 2, sport: "Tennis", type: "Einzel", date: "Do · 19:30", loc: "TC Zürich Lengg", players: ["https://i.pravatar.cc/120?img=47"], cap: 2, bucket: "mine" },
  { id: 3, sport: "Tennis", type: "Einzel", date: "Sa · 10:00", loc: "Lengg, Zürich", players: ["https://i.pravatar.cc/120?img=33"], cap: 2, bucket: "open" },
  { id: 4, sport: "Pickleball", type: "Doppel", date: "So · 14:00", loc: "Sportpark Heerenschürli", players: ["https://i.pravatar.cc/120?img=9", "https://i.pravatar.cc/120?img=13"], cap: 4, bucket: "open" },
  { id: 5, sport: "Padel", type: "Doppel", date: "Letzten Fr · 20:00", loc: "Padel City", players: ["https://i.pravatar.cc/120?img=5", "https://i.pravatar.cc/120?img=12", "https://i.pravatar.cc/120?img=7", "https://i.pravatar.cc/120?img=45"], cap: 4, bucket: "past", result: "6:3 · 4:6 · 10:7" },
];

const PROFILE_STATS = [
  { label: "Spiele", value: "42" },
  { label: "Siege", value: "27" },
  { label: "Winrate", value: "64%" },
  { label: "Serie", value: "4" },
];
const PROFILE_ACHIEVEMENTS = ["Erster Sieg", "10 Spiele", "5er-Serie", "Clubheld"];
const PROFILE_PHOTOS = [
  "https://picsum.photos/seed/mu1/300/300",
  "https://picsum.photos/seed/mu2/300/300",
  "https://picsum.photos/seed/mu3/300/300",
  "https://picsum.photos/seed/mu4/300/300",
];
const PROFILE_NOTES = [
  { workOn: "Aufschlag-Konstanz — zweiter Aufschlag mutiger", good: "Rückhand cross sehr stabil" },
  { workOn: "Kondition im dritten Satz", good: "Starkes Netzspiel im Doppel" },
];
const RATING_TREND = [1000, 1012, 1005, 1030, 1044, 1038, 1060, 1080];

type Post = { id: number; text: string; image: string | null; time: string };
type Msg = { id: number; me: boolean; text: string; time: string };
type Tab = "home" | "chat" | "earth" | "stats" | "people";
type ChatSub = "chats" | "groups" | "feed";
type GamesMode = "mine" | "open" | "past";

const TABS: { key: Tab; path: string }[] = [
  { key: "home", path: "M3 11l9-8 9 8M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" },
  { key: "chat", path: "M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z" },
  { key: "earth", path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c3 3 4 7 4 10s-1 7-4 10M12 2c-3 3-4 7-4 10s1 7 4 10" },
  { key: "stats", path: "M6 20V10M12 20V4M18 20v-7" },
  { key: "people", path: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M17 3.13a4 4 0 0 1 0 7.75" },
];

export default function Mockup2Screen() {
  const [tab, setTab] = useState<Tab>("home");
  const [chatSub, setChatSub] = useState<ChatSub>("chats");
  const [gamesMode, setGamesMode] = useState<GamesMode>("mine");
  // Profil bearbeiten / Einstellungen
  const [profileScreen, setProfileScreen] = useState<null | "edit" | "settings">(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pName, setPName] = useState("Martin");
  const [pCity, setPCity] = useState("Zürich");
  const [pBio, setPBio] = useState("Spiele seit 10 Jahren Tennis, neu auch Padel. Suche regelmässige Partner in Zürich für Feierabend-Matches. 🎾");
  const [pSports, setPSports] = useState<string[]>(["Tennis", "Padel"]);
  const [pSkill, setPSkill] = useState("Fortgeschritten");
  const [pPhotos, setPPhotos] = useState<string[]>([ME.img, ...PROFILE_PHOTOS]);
  const [pClub, setPClub] = useState("TC Seefeld");
  const [pHeight, setPHeight] = useState("183");
  const [pRating, setPRating] = useState("");
  const [pGoals, setPGoals] = useState<string[]>(["Regelmässig spielen", "Neue Leute"]);
  const photoSeed = useRef(100);
  function addPhoto() { setPPhotos((p) => [...p, `https://picsum.photos/seed/mu${photoSeed.current++}/300/300`]); }
  function removePhoto(i: number) { setPPhotos((p) => p.filter((_, idx) => idx !== i)); }
  function makeMain(i: number) { setPPhotos((p) => { const c = [...p]; const [x] = c.splice(i, 1); return [x, ...c]; }); }
  function toggleGoal(g: string) { setPGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g])); }
  const [notif, setNotif] = useState({ matches: true, messages: true, community: false, reminders: true });
  const [lang, setLang] = useState<"de" | "en">("de");
  function toggleSport(s: string) {
    setPSports((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }
  const [reqList, setReqList] = useState<ReqPerson[]>(REQUESTS_INIT);
  const [chatList, setChatList] = useState<ChatItem[]>(CHATS_INIT);
  const [profileView, setProfileView] = useState<ReqPerson | null>(null);
  const [foryouView, setForyouView] = useState<ForYouPerson | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  // Chat-Detailansicht
  const [activeChat, setActiveChat] = useState<ChatItem | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const msgId = useRef(1);
  const [chatMenu, setChatMenu] = useState(false);
  const [reportFor, setReportFor] = useState<ChatItem | null>(null);

  const REPORT_REASONS = [
    "Belästigung / Beleidigung",
    "Spam / Werbung",
    "Unangemessene Inhalte",
    "Fake-Profil",
    "Sonstiges",
  ];
  function blockChat(c: ChatItem) {
    setChatMenu(false);
    setChatList((cs) => cs.filter((x) => x.id !== c.id));
    setActiveChat(null);
    window.alert(`${c.name} wurde blockiert.`);
  }
  function submitReport(c: ChatItem, reason: string) {
    setReportFor(null);
    setActiveChat(null);
    window.alert(`Danke — deine Meldung („${reason}") wurde an unser Team übermittelt.`);
  }

  function openConversation(c: ChatItem) {
    setActiveChat(c);
    setMsgs([
      { id: msgId.current++, me: false, text: c.last, time: "09:24" },
      { id: msgId.current++, me: true, text: "Klar, passt bei mir! 🎾", time: "09:26" },
      { id: msgId.current++, me: false, text: "Perfekt, ich buche den Court.", time: "09:27" },
      { id: msgId.current++, me: true, text: "Top 💪 bis dann!", time: "09:28" },
    ]);
    setChatList((cs) => cs.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x)));
  }
  function sendMsg() {
    const text = msgInput.trim();
    if (!text) return;
    setMsgs((m) => [...m, { id: msgId.current++, me: true, text, time: "jetzt" }]);
    setMsgInput("");
  }

  function connectRequest(r: ReqPerson) {
    setReqList((l) => l.filter((x) => x.id !== r.id));
    setChatList((c) => [{ id: 1000 + r.id, name: r.name, img: r.img, last: "Ihr seid jetzt verbunden — sag Hallo 👋", time: "jetzt", unread: 0, online: true }, ...c]);
    setProfileView(null);
  }
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftImg, setDraftImg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const nextId = useRef(1);

  function openComposer(withPicker = false) {
    setComposerOpen(true);
    if (withPicker) setTimeout(() => fileRef.current?.click(), 60);
  }
  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setDraftImg(URL.createObjectURL(f));
  }
  function publish() {
    if (!draft.trim() && !draftImg) return;
    setPosts((p) => [{ id: nextId.current++, text: draft.trim(), image: draftImg, time: "gerade eben" }, ...p]);
    setDraft("");
    setDraftImg(null);
    setComposerOpen(false);
  }
  function closeComposer() {
    setComposerOpen(false);
    setDraft("");
    setDraftImg(null);
  }

  return (
    <div className="min-h-[100dvh] w-full bg-white text-black">
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-[430px] overflow-hidden bg-white">
        {tab === "earth" ? (
          // Erde-Tab → echte /map (mit Discover/Season-Toggle wie auf der Map-Seite)
          <iframe title="Matchup Map" src="/map" className="h-[100dvh] w-full border-0" />
        ) : tab === "stats" ? (
          /* Spiele (wie /app Games) */
          <div className="pb-32 pt-[max(20px,env(safe-area-inset-top))]">
            <header className="flex items-center justify-between px-5 pb-1 pt-2">
              <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-900">Spiele</h1>
              <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-matchup text-white shadow-lg">
                <Icon path="M12 5v14M5 12h14" size={20} />
              </button>
            </header>
            <div className="flex gap-2 px-5 py-3">
              {([["mine", "Meine"], ["open", "Offen"], ["past", "Gespielt"]] as const).map(([k, label]) => (
                <button key={k} type="button" onClick={() => setGamesMode(k)} className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${gamesMode === k ? "bg-matchup text-white" : "bg-neutral-100 text-neutral-500"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-3 px-5">
              {GAMES_INIT.filter((g) => g.bucket === gamesMode).map((g) => (
                <div key={g.id} className="rounded-2xl bg-black/[0.035] p-4">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 font-semibold text-neutral-900">
                      <Icon path="M8 21h8m-4-4v4M5 4h14v7a7 7 0 0 1-14 0z" size={15} className="text-matchup" /> {g.sport} · {g.type}
                    </p>
                    {g.result ? (
                      <span className="rounded-full bg-matchup/10 px-2.5 py-1 text-[11px] font-bold text-matchup">{g.result}</span>
                    ) : g.bucket === "open" ? (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600">{g.cap - g.players.length} frei</span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-600"><Icon path="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" size={14} /> {g.date}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-500"><Icon path="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" size={14} /> {g.loc}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex -space-x-2.5">
                      {g.players.map((src, i) => (
                        <img key={i} src={src} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-white" />
                      ))}
                      {g.players.length < g.cap && (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.06] text-neutral-400 ring-2 ring-white"><Icon path="M12 5v14M5 12h14" size={14} /></span>
                      )}
                    </div>
                    {g.bucket === "open" && (
                      <button type="button" className="rounded-full bg-matchup px-4 py-1.5 text-xs font-bold text-white">Beitreten</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : tab === "people" ? (
          /* Profil (wie /app Profile) */
          <div className="px-5 pb-32 pt-[max(20px,env(safe-area-inset-top))]">
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setProfileScreen("edit")} aria-label="Profil bearbeiten" className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] text-neutral-700"><Icon path="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" size={17} /></button>
              <button type="button" onClick={() => setProfileScreen("settings")} aria-label="Einstellungen" className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] text-neutral-700"><Icon path="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" size={17} /></button>
            </div>
            <div className="flex flex-col items-center pt-1 text-center">
              <img src={pPhotos[0] ?? ME.img} alt="" className="h-24 w-24 rounded-full object-cover" />
              <h1 className="mt-3 text-2xl font-extrabold text-neutral-900">{pName}, 29</h1>
              <p className="flex items-center gap-1 text-sm text-neutral-500"><Icon path="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" size={14} /> {pCity}</p>
              <button type="button" className="mt-3 inline-flex items-center gap-2 rounded-full bg-matchup px-4 py-1.5 text-white shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wide text-white/80">MatchScore</span>
                <span className="text-sm font-extrabold text-white">1080</span>
                <Icon path="M9 6l6 6-6 6" size={13} className="text-white/80" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2.5">
              {PROFILE_STATS.map((s) => (
                <div key={s.label} className="rounded-2xl bg-black/[0.035] py-3 text-center">
                  <div className="text-lg font-extrabold text-neutral-900">{s.value}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{s.label}</div>
                </div>
              ))}
            </div>

            <section className="mt-6">
              <p className="mb-2.5 px-0.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">Sportarten</p>
              <div className="flex flex-wrap gap-2">
                {pSports.map((s) => (
                  <span key={s} className="rounded-full bg-black/[0.05] px-4 py-1.5 text-sm font-medium text-neutral-700">{s}</span>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <p className="mb-2.5 px-0.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">Über mich</p>
              <p className="rounded-2xl bg-black/[0.035] p-4 text-sm leading-relaxed text-neutral-600">{pBio}</p>
            </section>

            <section className="mt-6">
              <p className="mb-2.5 px-0.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">Erfolge</p>
              <div className="flex flex-wrap gap-2">
                {PROFILE_ACHIEVEMENTS.map((a) => (
                  <span key={a} className="flex items-center gap-1.5 rounded-full bg-matchup px-3 py-1.5 text-xs font-semibold text-white">
                    <Icon path="M5 16l-2-9 5.5 4L12 5l3.5 6L21 7l-2 9zM5 20h14" size={13} fill="currentColor" /> {a}
                  </span>
                ))}
              </div>
            </section>

            {/* Rating-Verlauf */}
            <section className="mt-6">
              <p className="mb-2.5 px-0.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">MatchScore-Verlauf</p>
              <div className="rounded-2xl bg-black/[0.035] p-4">
                {(() => {
                  const min = Math.min(...RATING_TREND), max = Math.max(...RATING_TREND);
                  const W = 300, H = 70;
                  const pts = RATING_TREND.map((v, i) => {
                    const x = (i / (RATING_TREND.length - 1)) * W;
                    const y = H - ((v - min) / (max - min || 1)) * H;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  });
                  return (
                    <svg viewBox={`0 0 ${W} ${H}`} className="h-[70px] w-full" preserveAspectRatio="none">
                      <polyline points={pts.join(" ")} fill="none" stroke="#4b3bf3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx={W} cy={H - ((RATING_TREND[RATING_TREND.length - 1] - min) / (max - min || 1)) * H} r="3.5" fill="#4b3bf3" />
                    </svg>
                  );
                })()}
                <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Start {RATING_TREND[0]}</span>
                  <span className="font-bold text-matchup">Aktuell {RATING_TREND[RATING_TREND.length - 1]}</span>
                </div>
              </div>
            </section>

            {/* Fortschritts-Notizen (aus Spielen) */}
            <section className="mt-6">
              <p className="mb-2.5 px-0.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">Fortschritt</p>
              <div className="space-y-2">
                {PROFILE_NOTES.map((n, i) => (
                  <div key={i} className="rounded-2xl bg-black/[0.035] p-4">
                    <p className="text-sm text-neutral-900"><span className="font-semibold text-matchup">→ </span>{n.workOn}</p>
                    <p className="mt-1 text-xs text-neutral-500"><span className="font-semibold text-emerald-600">✓ </span>{n.good}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Fotos */}
            <section className="mt-6">
              <p className="mb-2.5 px-0.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">Fotos</p>
              <div className="grid grid-cols-4 gap-2">
                {pPhotos.map((src, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-xl bg-black/[0.05]">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </section>

            {/* Freunde einladen */}
            <section className="mt-6">
              <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-matchup to-indigo-600 p-4 text-white shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Icon path="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6" size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Freunde einladen</p>
                  <p className="text-[12px] text-white/80">Hol deine Spielpartner zu Matchup.</p>
                </div>
                <button type="button" className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-matchup">Teilen</button>
              </div>
            </section>
          </div>
        ) : tab === "chat" ? (
          <div className="pb-32 pt-[max(20px,env(safe-area-inset-top))]">
            <header className="flex items-center justify-between px-5 pb-2 pt-2">
              <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-900">Chat</h1>
              <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.04] text-black ring-1 ring-black/10">
                <Icon path="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" size={19} />
              </button>
            </header>

            {/* Reiter: Chats / Gruppen / Community */}
            <div className="flex border-b border-black/10 px-2">
              {([["chats", "Chats"], ["groups", "Gruppen"], ["feed", "Community"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setChatSub(k)}
                  className={`flex-1 border-b-2 py-3 text-sm font-semibold transition-colors ${
                    chatSub === k ? "border-matchup text-neutral-900" : "border-transparent text-neutral-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Chats */}
            {chatSub === "chats" && (
              <>
                {reqList.length > 0 && (
                  <section className="px-5 pt-4">
                    <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">Anfragen · {reqList.length}</p>
                    <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
                      {reqList.map((r) => (
                        <button key={r.id} type="button" onClick={() => setProfileView(r)} className="flex w-[64px] shrink-0 flex-col items-center gap-1.5">
                          <span className="relative block h-[64px] w-[64px] rounded-full bg-gradient-to-br from-matchup to-indigo-500 p-[2.5px]">
                            <img src={r.img} alt="" className="h-full w-full rounded-full object-cover ring-[2.5px] ring-white" />
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-matchup ring-2 ring-white">
                              <Icon path="M12 5v14M5 12h14" size={12} className="text-white" />
                            </span>
                          </span>
                          <span className="max-w-[64px] truncate text-[11px] font-medium text-neutral-600">{r.name}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                <div className="mt-3">
                  {chatList.map((c) => (
                    <button key={c.id} type="button" onClick={() => openConversation(c)} className="flex w-full items-center gap-3 px-5 py-3 text-left active:bg-black/[0.03]">
                      <span className="relative shrink-0">
                        <img src={c.img} alt="" className="h-14 w-14 rounded-full object-cover" />
                        {c.online && <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-neutral-900">{c.name}</p>
                        <p className={`truncate text-sm ${c.unread ? "font-medium text-neutral-800" : "text-neutral-400"}`}>{c.last}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[11px] text-neutral-400">{c.time}</span>
                        {c.unread > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-matchup px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Gruppen */}
            {chatSub === "groups" && (
              <div className="space-y-3 px-5 pt-4">
                {GROUPS_INIT.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 rounded-2xl bg-black/[0.035] p-4">
                    <div className="flex -space-x-2.5">
                      {g.imgs.map((src, i) => (
                        <img key={i} src={src} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-neutral-900">{g.name}</p>
                      <p className="text-xs text-neutral-500">{g.sport} · {g.members} Mitglieder</p>
                    </div>
                    <button type="button" className="shrink-0 rounded-full bg-matchup px-3.5 py-1.5 text-xs font-bold text-white">Beitreten</button>
                  </div>
                ))}
                <button type="button" className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 py-3.5 text-sm font-semibold text-matchup">
                  <Icon path="M12 5v14M5 12h14" size={16} /> Gruppe erstellen
                </button>
              </div>
            )}

            {/* Community-Feed */}
            {chatSub === "feed" && (
              <div className="divide-y divide-black/[0.06]">
                {FEED_INIT.map((p) => (
                  <article key={p.id} className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <img src={p.img} alt="" className="h-9 w-9 rounded-full object-cover" />
                      <span className="text-sm font-semibold text-neutral-900">{p.name}</span>
                      <span className="text-xs text-neutral-400">· {p.time}</span>
                    </div>
                    <p className="mt-2 text-[15px] leading-snug text-neutral-700">{p.text}</p>
                    <div className="mt-3 flex items-center gap-5 text-neutral-500">
                      <span className="flex items-center gap-1.5 text-sm"><Icon path="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" size={18} /> {p.likes}</span>
                      <span className="flex items-center gap-1.5 text-sm"><Icon path="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z" size={18} /> {p.comments}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-5 pb-32 pt-[max(20px,env(safe-area-inset-top))]">
            {/* Header */}
            <header className="flex items-center justify-between pt-2">
              <img src={ME.img} alt="" className="h-14 w-14 rounded-full object-cover" />
              <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] text-black ring-1 ring-black/10">
                <Icon path="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" size={20} />
              </button>
            </header>

            {/* Headline */}
            <h1 className="mt-6 text-[30px] font-medium leading-[1.15] tracking-tight text-black">
              Your <span className="font-extrabold">Racket Journey</span>
              <br />
              With Matchup
            </h1>

            {/* Story-Reihe */}
            <div className="no-scrollbar mt-6 flex gap-4 overflow-x-auto">
              <button type="button" onClick={() => openComposer(false)} className="flex w-[58px] shrink-0 flex-col items-center gap-2">
                <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-black text-white">
                  <Icon path="M12 5v14M5 12h14" size={22} />
                </span>
                <span className="text-[11px] text-neutral-500">Add Friend</span>
              </button>
              {FRIENDS.map((f) => (
                <div key={f.name} className="flex w-[58px] shrink-0 flex-col items-center gap-2">
                  <span className="block h-[58px] w-[58px] rounded-full bg-gradient-to-br from-matchup to-indigo-500 p-[2px]">
                    <img src={f.img} alt="" className="h-full w-full rounded-full object-cover ring-[2.5px] ring-white" />
                  </span>
                  <span className="max-w-[58px] truncate text-[11px] text-neutral-500">{f.name}</span>
                </div>
              ))}
            </div>

            {/* Start a post */}
            <div className="mt-6 rounded-[24px] bg-black/[0.035] p-5">
              <button type="button" onClick={() => openComposer(false)} className="block w-full text-left text-[17px] text-neutral-400">
                Start a post
              </button>
              <div className="mt-6 flex items-center justify-between">
                <button type="button" onClick={() => openComposer(false)} className="flex items-center gap-2 rounded-full bg-black/[0.05] py-2.5 pl-3 pr-4 text-sm font-semibold text-black">
                  <Icon path="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" size={16} className="text-matchup" fill="currentColor" />
                  Format
                </button>
                <div className="flex gap-2.5">
                  <button type="button" onClick={() => openComposer(true)} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.05] text-black">
                    <Icon path="M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6" size={19} />
                  </button>
                  <button type="button" onClick={() => openComposer(true)} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.05] text-black">
                    <Icon path="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={19} />
                  </button>
                </div>
              </div>
            </div>

            {/* Feed */}
            {posts.length > 0 && (
              <div className="mt-4 space-y-4">
                {posts.map((p) => (
                  <article key={p.id} className="overflow-hidden rounded-[24px] bg-black/[0.035]">
                    <div className="flex items-center gap-3 px-5 pt-4">
                      <img src={ME.img} alt="" className="h-10 w-10 rounded-full object-cover" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900">{ME.name}</p>
                        <p className="text-[11px] text-neutral-400">{p.time}</p>
                      </div>
                    </div>
                    {p.text && <p className="px-5 pt-3 text-[15px] leading-snug text-neutral-700">{p.text}</p>}
                    {p.image && <img src={p.image} alt="" className="mt-3 max-h-[420px] w-full object-cover" />}
                    <div className="flex items-center gap-5 px-5 py-3.5 text-neutral-400">
                      <Icon path="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" size={21} />
                      <Icon path="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z" size={21} />
                      <Icon path="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" size={21} />
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Live-Turnier (hell) */}
            <WimbledonWidget theme="light" />

            {/* Karten-Raster */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="row-span-2 flex flex-col justify-between rounded-[24px] bg-black/[0.035] p-5">
                <div className="flex items-start justify-between">
                  <span className="text-sm text-neutral-500">28 Aug 2025</span>
                  <Icon path="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" size={19} className="text-neutral-500" />
                </div>
                <div className="mt-16">
                  <h3 className="text-[22px] font-bold leading-tight tracking-tight">Padel Champs Circle</h3>
                  <div className="mt-4 flex -space-x-3">
                    {CIRCLE.map((src, i) => (
                      <img key={i} src={src} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] bg-black/[0.035] p-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-matchup to-indigo-500 p-[1.5px]">
                  <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black">
                    <Icon path="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" size={13} className="text-matchup" fill="currentColor" />
                    New Challenge
                  </span>
                </span>
                <h3 className="mt-4 text-[19px] font-bold leading-tight tracking-tight">30-Day Pushup Challenge</h3>
              </div>

              <div className="flex items-center justify-between rounded-[24px] bg-black/[0.035] p-5">
                <div className="flex -space-x-3">
                  {[
                    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20",
                    "M6 20v-6M6 8V4M12 20v-9M12 6V4M18 20v-4M18 10V4",
                    "M4 18l6-6M14 8l6-6M9 5l10 10M5 9l10 10",
                  ].map((p, i) => (
                    <span key={i} className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.06] text-neutral-500 ring-2 ring-white">
                      <Icon path={p} size={18} />
                    </span>
                  ))}
                </div>
                <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <Icon path="M12 5v14M5 12h14" size={20} />
                </button>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="relative mt-4 rounded-[24px] bg-black/[0.035] px-5 pb-14 pt-5">
              <p className="text-[17px] text-neutral-500">Leaderboard</p>
              <div className="mt-10 flex items-end justify-center gap-1">
                <div className="relative flex flex-col items-center">
                  <Icon path="M5 16l-2-9 5.5 4L12 5l3.5 6L21 7l-2 9zM5 20h14" size={26} className="text-matchup" fill="currentColor" />
                  <span className="mt-2 h-14 w-14 rounded-full bg-gradient-to-br from-matchup to-indigo-500 p-[2px]">
                    <img src="https://i.pravatar.cc/120?img=25" alt="" className="h-full w-full rounded-full object-cover" />
                  </span>
                </div>
              </div>
            </div>

            {/* ── Weitere /app-Sektionen (hell, Matchup-Akzente) ── */}

            {/* MatchScore / Your form */}
            <div className="mt-6 flex items-center gap-4 rounded-[24px] bg-black/[0.035] p-5">
              <div className="relative h-[84px] w-[84px] shrink-0">
                <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
                  <circle cx="42" cy="42" r="34" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="7" />
                  <circle cx="42" cy="42" r="34" fill="none" stroke="#4b3bf3" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 34}`} strokeDashoffset={`${2 * Math.PI * 34 * (1 - 0.25)}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[20px] font-extrabold leading-none text-neutral-900">1000</span>
                  <span className="mt-0.5 text-[7px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">Matchscore</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">Your form</div>
                <h3 className="mt-1 text-base font-extrabold tracking-tight text-neutral-900">On a roll</h3>
                <p className="mt-1 flex items-center gap-1 text-[12.5px] text-neutral-500">See leaderboard &amp; trend <Icon path="M9 6l6 6-6 6" size={13} /></p>
              </div>
            </div>

            {/* New people nearby */}
            <section className="mt-6">
              <SectionHead label="New people nearby" />
              <div className="no-scrollbar flex gap-3.5 overflow-x-auto">
                <button type="button" className="flex w-[60px] shrink-0 flex-col items-center gap-1.5">
                  <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-dashed border-black/25 text-neutral-400"><Icon path="M12 5v14M5 12h14" size={22} /></span>
                  <span className="text-[11px] text-neutral-400">Find</span>
                </button>
                {NEARBY.map((p) => (
                  <div key={p.name} className="flex w-[60px] shrink-0 flex-col items-center gap-1.5">
                    <span className="block h-[58px] w-[58px] rounded-full bg-gradient-to-br from-matchup to-indigo-500 p-[2px]">
                      <img src={p.img} alt="" className="h-full w-full rounded-full object-cover ring-[2.5px] ring-white" />
                    </span>
                    <span className="max-w-[60px] truncate text-[11px] font-medium text-neutral-600">{p.name}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* By sport */}
            <section className="mt-6">
              <SectionHead label="By sport" />
              <div className="grid grid-cols-3 gap-3">
                {SPORTS.map((s) => (
                  <button key={s.key} type="button" className="flex flex-col items-center gap-2 rounded-2xl bg-black/[0.035] py-4">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full" style={{ background: `radial-gradient(circle at 32% 28%, ${s.color}33, ${s.color}0f)` }}>
                      <div className="flex -space-x-2.5">
                        {s.imgs.map((src, i) => (
                          <img key={i} src={src} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-white" />
                        ))}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ring-2 ring-white" style={{ background: s.color }} />
                    </div>
                    <span className="text-xs font-extrabold text-neutral-900">{s.key}</span>
                    <span className="text-[10px] text-neutral-400">{s.imgs.length} players</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Your next game */}
            <section className="mt-6">
              <SectionHead label="Your next game" action="All" />
              <div className="rounded-[24px] bg-black/[0.035] p-5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-extrabold text-neutral-900">
                    <Icon path="M8 21h8m-4-4v4M5 4h14v7a7 7 0 0 1-14 0z" size={15} className="text-matchup" /> Padel
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffb020" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" /></svg>
                    22° · good
                  </span>
                </div>
                <h3 className="mt-3 text-[19px] font-bold tracking-tight text-neutral-900">Morgen · 18:00</h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                  <Icon path="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" size={13} /> TC Seefeld · 1 frei
                </div>
                <div className="mt-3 flex -space-x-2.5">
                  {["https://i.pravatar.cc/120?img=12", "https://i.pravatar.cc/120?img=16", "https://i.pravatar.cc/120?img=5"].map((src, i) => (
                    <img key={i} src={src} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-white" />
                  ))}
                </div>
              </div>
            </section>

            {/* For you */}
            <section className="mt-6">
              <SectionHead label="For you" />
              <div className="grid grid-cols-3 gap-2.5">
                {FORYOU.map((p) => (
                  <button key={p.name} type="button" onClick={() => setForyouView(p)} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-black/[0.05] text-left">
                    <img src={p.img} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <span className="text-[12px] font-bold text-white">{p.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Chat-Detailansicht (Gespräch) */}
        {activeChat && (
          <div className="absolute inset-0 z-40 flex flex-col bg-white">
            <header className="flex items-center gap-2.5 border-b border-black/10 px-2 pt-[max(12px,env(safe-area-inset-top))] pb-3">
              <button type="button" onClick={() => setActiveChat(null)} className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 active:bg-black/5">
                <Icon path="M15 18l-6-6 6-6" size={22} />
              </button>
              <span className="relative shrink-0">
                <img src={activeChat.img} alt="" className="h-10 w-10 rounded-full object-cover" />
                {activeChat.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-neutral-900">{activeChat.name}</p>
                <p className="text-[11px] font-medium text-emerald-600">{activeChat.online ? "Online" : "Zuletzt aktiv vor 2 Std."}</p>
              </div>
              <div className="relative">
                <button type="button" onClick={() => setChatMenu((v) => !v)} aria-label="Mehr" className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 active:bg-black/5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" />
                  </svg>
                </button>
                {chatMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setChatMenu(false)} />
                    <div className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl bg-white p-1 shadow-xl ring-1 ring-black/10">
                      <button type="button" onClick={() => { setChatMenu(false); setReportFor(activeChat); }} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                        Melden
                      </button>
                      <button type="button" onClick={() => blockChat(activeChat)} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                        Blockieren
                      </button>
                    </div>
                  </>
                )}
              </div>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
              <p className="mb-2 text-center text-[11px] text-neutral-400">Heute</p>
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[76%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${m.me ? "rounded-br-md bg-matchup text-white" : "rounded-bl-md bg-black/[0.05] text-neutral-800"}`}>
                    {m.text}
                    <span className={`mt-0.5 block text-right text-[9px] ${m.me ? "text-white/70" : "text-neutral-400"}`}>{m.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-black/10 px-3 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
              <input
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                placeholder="Nachricht…"
                className="flex-1 rounded-full bg-black/[0.05] px-4 py-2.5 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
              />
              <button type="button" onClick={sendMsg} disabled={!msgInput.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-matchup text-white disabled:opacity-40">
                <Icon path="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" size={19} />
              </button>
            </div>
          </div>
        )}

        {/* Profil bearbeiten */}
        {profileScreen === "edit" && (
          <div className="absolute inset-0 z-40 flex flex-col bg-white">
            <header className="flex items-center justify-between border-b border-black/10 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3">
              <button type="button" onClick={() => setProfileScreen(null)} className="text-sm font-medium text-neutral-500">Abbrechen</button>
              <span className="font-bold text-neutral-900">Profil bearbeiten</span>
              <button type="button" onClick={() => setProfileScreen(null)} className="text-sm font-bold text-matchup">Speichern</button>
            </header>
            <div className="flex-1 space-y-5 overflow-y-auto p-5 pb-10">
              {/* Fotos-Galerie */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">Fotos</label>
                <div className="grid grid-cols-3 gap-2">
                  {pPhotos.map((src, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-black/[0.05]">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-matchup px-1.5 py-0.5 text-[9px] font-bold text-white">Haupt</span>}
                      <button type="button" onClick={() => removePhoto(i)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"><Icon path="M18 6 6 18M6 6l12 12" size={12} /></button>
                      {i !== 0 && <button type="button" onClick={() => makeMain(i)} className="absolute bottom-1 left-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-neutral-700">Als Haupt</button>}
                    </div>
                  ))}
                  <button type="button" onClick={addPhoto} className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-black/15 text-neutral-400"><Icon path="M12 5v14M5 12h14" size={24} /></button>
                </div>
                <p className="mt-1.5 text-[11px] text-neutral-400">Das erste Bild ist dein Hauptfoto.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">Name</label>
                <input value={pName} onChange={(e) => setPName(e.target.value)} className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm text-neutral-900 outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">Stadt</label>
                <input value={pCity} onChange={(e) => setPCity(e.target.value)} className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm text-neutral-900 outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">Über mich</label>
                <textarea value={pBio} onChange={(e) => setPBio(e.target.value)} rows={4} className="w-full resize-none rounded-xl bg-black/[0.04] px-4 py-3 text-sm text-neutral-900 outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">Sportarten</label>
                <div className="flex flex-wrap gap-2">
                  {["Tennis", "Padel", "Pickleball"].map((s) => (
                    <button key={s} type="button" onClick={() => toggleSport(s)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${pSports.includes(s) ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-600"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">Skill-Level</label>
                <div className="flex flex-wrap gap-2">
                  {["Anfänger", "Mittel", "Fortgeschritten", "Profi"].map((s) => (
                    <button key={s} type="button" onClick={() => setPSkill(s)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${pSkill === s ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-600"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">Ziele</label>
                <div className="flex flex-wrap gap-2">
                  {["Regelmässig spielen", "Turniere", "Fitness", "Neue Leute", "Verbessern"].map((g) => (
                    <button key={g} type="button" onClick={() => toggleGoal(g)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${pGoals.includes(g) ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-600"}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">Club</label>
                <input value={pClub} onChange={(e) => setPClub(e.target.value)} className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm text-neutral-900 outline-none" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">Größe (cm)</label>
                  <input value={pHeight} onChange={(e) => setPHeight(e.target.value)} inputMode="numeric" className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm text-neutral-900 outline-none" />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">Offizielles Rating</label>
                  <input value={pRating} onChange={(e) => setPRating(e.target.value)} placeholder="z. B. R4 / NTRP 4.0" className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Einstellungen */}
        {profileScreen === "settings" && (
          <div className="absolute inset-0 z-40 flex flex-col bg-white">
            <header className="flex items-center gap-2 border-b border-black/10 px-2 pt-[max(12px,env(safe-area-inset-top))] pb-3">
              <button type="button" onClick={() => setProfileScreen(null)} className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 active:bg-black/5"><Icon path="M15 18l-6-6 6-6" size={22} /></button>
              <span className="font-bold text-neutral-900">Einstellungen</span>
            </header>
            <div className="flex-1 overflow-y-auto pb-10">
              <p className="px-5 pb-1.5 pt-4 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Konto</p>
              <SettingRow label="Konto-Infos" onClick={() => {}} />
              <SettingRow label="Onboarding ansehen" onClick={() => { setProfileScreen(null); setShowOnboarding(true); }} />
              <SettingRow label="Konto pausieren" onClick={() => {}} />

              <p className="px-5 pb-1.5 pt-5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Benachrichtigungen</p>
              {([["matches", "Neue Matches"], ["messages", "Nachrichten"], ["community", "Community"], ["reminders", "Erinnerungen"]] as const).map(([k, label]) => (
                <div key={k} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-neutral-800">{label}</span>
                  <button type="button" onClick={() => setNotif((n) => ({ ...n, [k]: !n[k] }))} className={`relative h-6 w-11 rounded-full transition-colors ${notif[k] ? "bg-matchup" : "bg-black/15"}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${notif[k] ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              ))}

              <p className="px-5 pb-1.5 pt-5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Sprache</p>
              <div className="flex gap-2 px-5">
                {(["de", "en"] as const).map((l) => (
                  <button key={l} type="button" onClick={() => setLang(l)} className={`flex-1 rounded-full py-2 text-sm font-semibold ${lang === l ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-600"}`}>{l === "de" ? "Deutsch" : "English"}</button>
                ))}
              </div>

              <p className="px-5 pb-1.5 pt-5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Privatsphäre & Support</p>
              <SettingRow label="Blockierte Nutzer" onClick={() => {}} />
              <SettingRow label="Hilfe & Support" onClick={() => {}} />
              <SettingRow label="Datenschutz" onClick={() => {}} />
              <SettingRow label="AGB" onClick={() => {}} />

              <div className="mt-5 px-5">
                <button type="button" className="w-full rounded-xl bg-black/[0.05] py-3 text-sm font-semibold text-neutral-700">Abmelden</button>
                <button type="button" className="mt-2 w-full rounded-xl py-3 text-sm font-semibold text-red-600">Konto löschen</button>
              </div>
            </div>
          </div>
        )}

        {/* Onboarding (12 Schritte, mockup2-Design) */}
        {showOnboarding && <Mockup2Onboarding onClose={() => setShowOnboarding(false)} />}

        {/* Tab-Bar (schwebend) — im Gespräch/Overlay ausgeblendet */}
        {!activeChat && !profileScreen && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[430px] justify-center px-5 pb-[max(16px,env(safe-area-inset-bottom))]">
          <nav className="pointer-events-auto flex w-full items-center justify-between rounded-full bg-white px-3 py-2.5 shadow-[0_10px_40px_-8px_rgba(0,0,0,0.25)] ring-1 ring-black/10">
            {TABS.map((tb) => {
              const active = tab === tb.key;
              return active ? (
                <button key={tb.key} type="button" onClick={() => setTab(tb.key)} className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-matchup to-indigo-500 text-white shadow-lg">
                  <Icon path={tb.path} size={22} />
                </button>
              ) : (
                <button key={tb.key} type="button" onClick={() => setTab(tb.key)} className="flex h-12 w-12 items-center justify-center rounded-full text-neutral-500">
                  <Icon path={tb.path} size={23} />
                </button>
              );
            })}
          </nav>
        </div>
        )}

        {/* Melde-Grund auswählen */}
        {reportFor && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setReportFor(null)}>
            <div className="mx-auto w-full max-w-[430px]" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-t-[28px] bg-white p-5 pb-8">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-bold text-neutral-900">{reportFor.name} melden</span>
                  <button type="button" onClick={() => setReportFor(null)} className="text-sm font-medium text-neutral-500">Abbrechen</button>
                </div>
                <p className="mb-3 text-[13px] text-neutral-500">Wähle einen Grund. Die Meldung geht an unser Team.</p>
                <div className="space-y-1.5">
                  {REPORT_REASONS.map((r) => (
                    <button key={r} type="button" onClick={() => submitReport(reportFor, r)} className="flex w-full items-center justify-between rounded-xl bg-black/[0.04] px-4 py-3 text-left text-sm font-medium text-neutral-800 hover:bg-black/[0.06]">
                      {r} <Icon path="M9 6l6 6-6 6" size={15} className="text-neutral-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profil-Overlay (grösser) mit Verbinden */}
        {profileView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm" onClick={() => setProfileView(null)}>
            <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[28px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <img src={profileView.img} alt="" className="h-72 w-full object-cover" />
                <button type="button" onClick={() => setProfileView(null)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
                  <Icon path="M18 6 6 18M6 6l12 12" size={17} />
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h3 className="text-[22px] font-extrabold text-white">{profileView.name}, {profileView.age}</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-semibold text-neutral-700">{profileView.sport}</span>
                  <span className="rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-semibold text-neutral-700">{profileView.level}</span>
                  <span className="flex items-center gap-1 rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-semibold text-neutral-700">
                    <Icon path="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" size={13} /> 3 km
                  </span>
                </div>
                <p className="mt-4 text-sm leading-snug text-neutral-500">Möchte mit dir spielen und hat dich angefragt. Verbinde dich, um direkt zu chatten.</p>
                <button
                  type="button"
                  onClick={() => connectRequest(profileView)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-matchup py-3.5 text-sm font-bold text-white"
                >
                  <Icon path="M20 6 9 17l-5-5" size={18} /> Verbinden
                </button>
              </div>
            </div>
          </div>
        )}

        {/* For-You-Detailansicht (Vollbild) */}
        {foryouView && (
          <div className="absolute inset-0 z-50 flex flex-col bg-white">
            <div className="flex-1 overflow-y-auto pb-32">
              {/* Foto-Header */}
              <div className="relative">
                <img src={foryouView.img} alt="" className="h-[420px] w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
                <button
                  type="button"
                  onClick={() => setForyouView(null)}
                  className="absolute left-4 top-[max(16px,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
                >
                  <Icon path="M15 18l-6-6 6-6" size={22} />
                </button>
                <button
                  type="button"
                  className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
                  aria-label="Mehr"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg>
                </button>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[28px] font-extrabold leading-none text-white">{foryouView.name}, {foryouView.age}</h2>
                    {foryouView.online && <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white/60" />}
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-[14px] font-medium text-white/85">
                    <Icon path="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" size={15} />
                    {foryouView.city} · {foryouView.dist}
                  </p>
                </div>
              </div>

              <div className="space-y-6 p-5">
                {/* Sportarten / Level / Rating */}
                <div className="flex flex-wrap gap-2">
                  {foryouView.sports.map((sp) => (
                    <span key={sp} className="rounded-full bg-matchup/10 px-3.5 py-1.5 text-[13px] font-semibold text-matchup">{sp}</span>
                  ))}
                  <span className="rounded-full bg-black/[0.05] px-3.5 py-1.5 text-[13px] font-semibold text-neutral-700">{foryouView.level}</span>
                  {foryouView.rating !== "–" && (
                    <span className="rounded-full bg-black/[0.05] px-3.5 py-1.5 text-[13px] font-semibold text-neutral-700">{foryouView.rating}</span>
                  )}
                </div>

                {/* Statistik */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { v: String(foryouView.matches), l: "Matches" },
                    { v: foryouView.winrate, l: "Siegquote" },
                    { v: String(foryouView.score), l: "MatchScore" },
                  ].map((st) => (
                    <div key={st.l} className="rounded-2xl bg-black/[0.035] px-3 py-4 text-center">
                      <div className="text-[20px] font-extrabold tracking-tight text-neutral-900">{st.v}</div>
                      <div className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-neutral-400">{st.l}</div>
                    </div>
                  ))}
                </div>

                {/* Über */}
                <div>
                  <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">Über {foryouView.name}</p>
                  <p className="text-[15px] leading-relaxed text-neutral-700">{foryouView.bio}</p>
                </div>

                {/* Gemeinsam */}
                <div className="flex items-center gap-3 rounded-2xl bg-black/[0.035] p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-matchup">
                    <Icon path="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" size={20} />
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-neutral-900">3 gemeinsame Kontakte</p>
                    <p className="text-[12.5px] text-neutral-500">Ihr kennt euch vielleicht schon vom Platz.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aktionsleiste */}
            <div className="absolute inset-x-0 bottom-0 flex gap-3 border-t border-black/10 bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
              <button
                type="button"
                onClick={() => setForyouView(null)}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-black/10 text-sm font-bold text-neutral-700"
              >
                <Icon path="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z" size={18} /> Nachricht
              </button>
              <button
                type="button"
                onClick={() => setForyouView(null)}
                className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-matchup text-sm font-bold text-white"
              >
                <Icon path="M20 6 9 17l-5-5" size={18} /> Verbinden
              </button>
            </div>
          </div>
        )}

        {/* Composer */}
        {composerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={closeComposer}>
            <div className="mx-auto w-full max-w-[430px]" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-t-[28px] border-t border-black/10 bg-white p-5 pb-8">
                <div className="mb-4 flex items-center justify-between">
                  <button type="button" onClick={closeComposer} className="text-sm font-medium text-neutral-500">Abbrechen</button>
                  <span className="text-sm font-bold text-neutral-900">Neuer Post</span>
                  <button type="button" onClick={publish} disabled={!draft.trim() && !draftImg} className="rounded-full bg-matchup px-4 py-1.5 text-sm font-bold text-white disabled:opacity-40">Teilen</button>
                </div>
                <div className="flex items-start gap-3">
                  <img src={ME.img} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Was gibt's Neues?" rows={3} className="min-h-[80px] flex-1 resize-none bg-transparent text-[16px] text-neutral-900 outline-none placeholder:text-neutral-400" />
                </div>
                {draftImg && (
                  <div className="relative mt-3">
                    <img src={draftImg} alt="" className="max-h-[300px] w-full rounded-2xl object-cover" />
                    <button type="button" onClick={() => setDraftImg(null)} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"><Icon path="M18 6 6 18M6 6l12 12" size={16} /></button>
                  </div>
                )}
                <div className="mt-4 flex items-center gap-3 border-t border-black/10 pt-4">
                  <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-full bg-black/[0.05] px-3.5 py-2 text-sm font-semibold text-black">
                    <Icon path="M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6" size={18} className="text-matchup" /> Foto
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
