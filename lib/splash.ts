/**
 * The home page's intro splash (components/SplashIntro.tsx): the script that plays it.
 *
 * Runs in <head> before first paint (layout.tsx), on every full load of the home page. It is driven entirely
 * by classes on <html>, which React leaves alone:
 *   splash-on     the overlay is shown, and the hero's entrance is held back
 *   splash-go     the DOM is ready: the CSS timeline runs (the word is SVG, so there is no font to wait for)
 *   splash-out    the panel lifts away and the hero's entrance plays underneath
 *   splash-still  prefers-reduced-motion: the finished frame is shown, then removed without movement
 * A click or tap, or Esc / Enter / Space, skips to the lift. If it has not started within 3 s, the splash is dropped.
 */
export const splashBoot = `(function(){
if(!/^\\/(index\\.html)?$/.test(location.pathname))return;
var cl=document.documentElement.classList,still=matchMedia("(prefers-reduced-motion: reduce)").matches,stage=0,t,o={passive:false};
function block(e){e.preventDefault()}
function key(e){if(e.key==="Escape"||e.key==="Enter"||e.key===" "){e.preventDefault();out()}else if(/^(Arrow|Page|Home|End)/.test(e.key))e.preventDefault()}
function off(){removeEventListener("wheel",block,o);removeEventListener("touchmove",block,o);removeEventListener("keydown",key,true)}
function done(){stage=3;clearTimeout(t);off();cl.remove("splash-on","splash-go","splash-out","splash-still")}
function out(){if(stage>1)return;if(!stage)return done();stage=2;clearTimeout(t);off();cl.add("splash-out");t=setTimeout(done,still?0:800)}
function go(){if(stage)return;stage=1;clearTimeout(t);cl.add("splash-go");t=setTimeout(out,still?1800:3200)}
function dom(){
var el=document.querySelector(".splash");
if(!el)return done();
el.addEventListener("click",out);
requestAnimationFrame(go);
}
cl.add("splash-on");if(still)cl.add("splash-still");
addEventListener("wheel",block,o);addEventListener("touchmove",block,o);addEventListener("keydown",key,true);
t=setTimeout(done,3000);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",dom);else dom();
})();`;
