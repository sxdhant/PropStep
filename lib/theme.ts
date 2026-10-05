/** Day / night theme: <html data-theme="night"> (absent = day), remembered in localStorage. See ThemeToggle.tsx. */
export type Theme = "day" | "night";
export const THEME_KEY = "ps-theme";
/** <meta name="theme-color"> per theme: the page background */
export const THEME_COLOR: Record<Theme, string> = { day: "#ffffff", night: "#0b1322" };

/** Runs in <head> before first paint (layout.tsx): restores a saved night theme. Day is the default. */
export const themeBoot = `try{if(localStorage.getItem("${THEME_KEY}")==="night"){document.documentElement.dataset.theme="night";var m=document.querySelector('meta[name="theme-color"]');if(m)m.content="${THEME_COLOR.night}"}}catch(e){}`;
