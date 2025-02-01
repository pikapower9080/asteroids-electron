const env = __ENV__;

if (env.ALLOW_SNAPSHOT == "false") {
	document.querySelector("#snapshot").remove();
}
if (env.ENABLE_EXTERNAL_LINKS == "false") {
	document.querySelector("#startScreen span:has(a)").remove();
}
if (env.ENABLE_QUIT_BUTTON == "false") {
	document.querySelector("#quit-app").remove();
}

window.ENABLE_NETWORKING = env.ENABLE_NETWORKING == "true";
window.ENABLE_DISCORD_RPC = env.ENABLE_DISCORD_RPC == "true";

if (env.ENABLE_NETWORKING !== "true") {
	document.querySelector("#signInDiv").remove();
	document.querySelector("#score-not-submitted").remove();
	document.querySelector("#statsContainer").remove();
	document.querySelector("#scoresContainer").remove();

	// Fix styles on the game over screen
	document.querySelector("#gameOver > div > h1").style.marginBottom = 0
	document.querySelector("#gameOver > div > h1").style.marginTop = '11.5px'
	document.querySelector("#gameOver > div > h2").style.marginTop = 0
	document.querySelector("#gameOver > div > h2").style.marginBottom = '11.5px'
}

if (window.onEnvReady) {
	window.onEnvReady();
}