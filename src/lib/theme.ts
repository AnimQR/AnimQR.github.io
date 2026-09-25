export const THEME_KEY = "animqr:theme";

/** Applied before first paint by an inline script in the root layout, so there is no theme flash. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.classList.add(t)}catch(e){}`;
