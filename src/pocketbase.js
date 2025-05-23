import PocketBase from "pocketbase";
import Toastify from "toastify";
import { cheated, devMode, formatTime, getRunInfo, getVersion, settings, settingsStore } from "./main";
const url = __POCKETBASE_URL__;
export const pb = new PocketBase(url);
import xssFilters from "xss-filters";

export var user, signedIn = false;

// pb.authStore.clear();

if (pb.authStore.model) {
	(async () => {
		user = await pb.collection("users").getOne(pb.authStore.model.id);
	})();
	signedIn = true;
}

export async function postScore(score, time, dev, version) {
	if (!window.ENABLE_NETWORKING) return;
	if (cheated) return;
	try {
		return (await pb.collection("scores").create({
			user: user.id,
			score,
			time,
			dev,
			version,
			runData: getRunInfo()
		}));
	} catch (err) {
		console.error(err);
	}
}

export async function updateStats({ score, level, kills, time }) {
	if (!window.ENABLE_NETWORKING) return;
	try {
		return user = await pb.collection("users").update(user.id, {
			"deaths+": 1,
			"score+": score,
			"levelups+": level,
			"kills+": kills,
			highscore: Math.max(user.highscore || 0, score),
			highestTime: Math.max(user.highestTime || 0, time)
		});
	} catch (err) {
		console.error(err);
	}
}

export async function postFeed(event) {
	if (!window.ENABLE_NETWORKING) return;
	if (!settings.sendFeedEvents) return;
	if (cheated) return;
	try {
		return await pb.collection("feed").create({
			user: user.id,
			data: event.data,
			type: event.type,
			dev: event.dev
		});
	} catch (err) {
		console.error(err);
	}
}

let feedConnected = false
Toastify.setOption("position", "bottom-left")
export async function subscribeToFeed() {
	if (!window.ENABLE_NETWORKING) return;
	if (feedConnected) return;
	pb.collection('feed').subscribe('*', function (e) {
		if (e.action == "create" && e.record.type == "death" && settings.showFeed) {
			Toastify.info(xssFilters.inHTMLData(e.record.expand.user.name) + " died", "<i class=\"fa-regular fa-clock\"></i> " + formatTime(e.record.data.time) + " / <i class=\"fa-regular fa-star\"></i> " + xssFilters.inHTMLData(e.record.data.score), 5000);
		}
	}, { expand: "user" }).then(function () {
		console.debug("Connected to live feed successfully")
		feedConnected = true
		window.ASTEROIDS_FEED_CONNECTED = true
	});
}

export async function getUsers() {
	if (!window.ENABLE_NETWORKING) return;
	return await pb.collection("users").getFullList({});
}

export async function getScores(page = 1, sort = "-score") {
	if (!window.ENABLE_NETWORKING) return;
	const scoresPerPage = 10;

	const scores = await pb.collection("scores").getList(page, scoresPerPage, { expand: "user", sort, filter: `dev=${devMode}` });

	return scores.items//.filter(e => getVersion(e.version)[1] >= 4 && getVersion(e.version)[2] >= 0);
}

export async function signIn() {
	if (!window.ENABLE_NETWORKING) return;
	let username = await getUsername("Enter a username");
	if (!username) return;
	let users = await getUsers();
	if (users.map(otherUser => otherUser.username).includes(username)) {
		let password = await getPassword("Enter your password");
		if (!password) return;
		try {
			let authData = await pb.collection('users').authWithPassword(username, password);
			user = authData.record;
			signedIn = true;
			return authData;
		} catch (err) {
			console.error(err);
			return;
		}
	} else {
		let password = await getPassword("Create a password");
		if (!password) return;
		user = await pb.collection('users').create({ username, password, name: username, passwordConfirm: password });
		try {
			let authData = await pb.collection('users').authWithPassword(username, password);
			user = authData.record;
			signedIn = true;
			return authData;
		} catch (err) {
			console.error(err);
			return;
		}
	}
}

export async function signInWithGoogle() {
	if (!window.ENABLE_NETWORKING) return;
	const authData = await pb.collection('users').authWithOAuth2({ provider: 'google' });
}

export async function getUsername(prompt) {
	let dialog = document.getElementById("username");
	dialog.showModal();
	dialog.querySelector(".prompt").innerText = prompt;
	return new Promise((res, rej) => {
		dialog.querySelector(".prompt").addEventListener("keypress", (event) => {
			if (event.key !== "Enter") return;
			let username = event.currentTarget.value.toLowerCase();
			res(username);
			dialog.close();
		});
		dialog.querySelector("button").addEventListener("click", () => {
			let username = dialog.querySelector(".prompt").value.toLowerCase();
			res(username);
			dialog.close();
		});
	});
}

export async function getPassword(prompt) {
	let dialog = document.getElementById("password");
	dialog.showModal();
	dialog.querySelector(".prompt").innerText = prompt;
	return new Promise((res, rej) => {
		dialog.querySelector(".prompt").addEventListener("keypress", (event) => {
			if (event.key !== "Enter") return;
			let password = event.currentTarget.value;
			res(password);
			dialog.close();
		});
		dialog.querySelector("button").addEventListener("click", () => {
			let password = dialog.querySelector(".prompt").value;
			res(password);
			dialog.close();
		});
	});
}

export function signOut() {
	if (!window.ENABLE_NETWORKING) return;
	pb.authStore.clear();
	signedIn = false;
	user = null;
}