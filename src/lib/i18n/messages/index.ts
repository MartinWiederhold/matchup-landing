import type { Locale } from "../config";

import { common } from "./common";
import { header } from "./header";
import { footer } from "./footer";
import { landing } from "./landing";
import { findPartner } from "./findPartner";
import { shop } from "./shop";
import { beratung } from "./beratung";
import { about } from "./about";
import { events } from "./events";
import { auth } from "./auth";
import { onboarding } from "./onboarding";
import { app } from "./app";
import { discover } from "./discover";
import { mode } from "./mode";
import { matches } from "./matches";
import { games } from "./games";
import { groups } from "./groups";
import { community } from "./community";
import { services } from "./services";
import { tourCal } from "./tourCal";
import { profile } from "./profile";
import { support } from "./support";
import { waitlist } from "./waitlist";
import { seo } from "./seo";
import { tour } from "./tour";
import { catalog } from "./catalog";

type Namespace = { de: Record<string, unknown>; en: Record<string, unknown> };

const namespaces: Record<string, Namespace> = {
  common,
  header,
  footer,
  landing,
  findPartner,
  shop,
  beratung,
  about,
  events,
  auth,
  onboarding,
  app,
  discover,
  mode,
  matches,
  games,
  groups,
  community,
  services,
  tourCal,
  profile,
  support,
  waitlist,
  seo,
  tour,
  catalog,
};

function build(locale: Locale): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [ns, mod] of Object.entries(namespaces)) {
    out[ns] = mod[locale];
  }
  return out;
}

export const messages: Record<Locale, Record<string, unknown>> = {
  de: build("de"),
  en: build("en"),
};
