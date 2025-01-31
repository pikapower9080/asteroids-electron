const env = __ENV__;

document.querySelector("#start").disabled = false;

if (env.ALLOW_SNAPSHOT == "false") {
	document.querySelector("#snapshot").remove();
}
if (env.ENABLE_EXTERNAL_LINKS == "false") {
	document.querySelector("#startScreen span:has(a)").remove();
}