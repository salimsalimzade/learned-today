// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import { readPrefs, readTimeZone, themeBootScript, timeZoneBootScript } from "./lib/prefs";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => {
      // An explicit light/dark choice is rendered straight away; "system" is settled by the boot script.
      const prefs = readPrefs();
      return (
        <html lang="en" data-theme={prefs.theme === "system" ? undefined : prefs.theme}>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="color-scheme" content="light dark" />
            <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
            <link rel="alternate" type="application/rss+xml" title="what-did-i-learn-today" href="/rss.xml" />
            <script innerHTML={themeBootScript} />
            <script innerHTML={timeZoneBootScript(readTimeZone())} />
            {/* Layer order before any stylesheet loads: base element rules, then ui-kit. Unlayered
                component and page modules beat both. Repeated at the top of tokens.css. */}
            <style innerHTML="@layer base, ui;" />
            {assets}
          </head>
          <body>
            <div id="app">{children}</div>
            {scripts}
          </body>
        </html>
      );
    }}
  />
));
