const env = __ENV__;

if (env.ALLOW_SNAPSHOT == "false") {
	document.querySelector("#snapshot").remove();
}
if (env.ENABLE_EXTERNAL_LINKS == "false") {
	document.querySelector("#startScreen span:has(a)").remove();
}
window.ENABLE_NETWORKING = env.ENABLE_NETWORKING == "true";

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