import Vector from "@cam0studios/vector-library";
import { gamepad } from "./gamepad";
import { player, mouseDown, settings, clampTime, get, set, size } from "./main";
import projectileTypes, { projectileEnums } from "./projectile-types";

/**
 * Represents a weapon.
 * @class
 */
class Weapon {
	/**
	 * Creates an instance of Weapon.
	 * @param {Object} data - The data for the weapon.
	 * @param {string} data.name - The name of the weapon.
	 * @param {number} data.id - The ID of the weapon.
	 * @param {Function} data.tick - The tick function for the weapon.
	 * @param {number} data.weight - The relative weight of the weapon when leveling up.
	 * @param {Function} [data.upgrade] - The upgrade function for the weapon.
	 * @param {string} [data.desc] - The description of the weapon.
	 * 
	 * @param {Object} data.props - The properties of the weapon.
	 * @param {number} data.props.reload - The reload time of the weapon.
	 * @param {number} data.props.fireRate - The fire rate of the weapon, 1 / reloadTime.
	 * @param {number} data.props.reloadTime - The reload time of the weapon, 1 / fireRate.
	 * @param {number} data.props.damage - The damage of the weapon.
	 * @param {number} data.props.speed - The speed of the weapon.
	 * @param {number} data.props.amount - The amount of projectiles to shoot.
	 * 
	 * @param {Object[]} data.upgrades - The upgrades available for the weapon.
	 * @param {string} data.upgrades[].name - The name of the upgrade.
	 * @param {string} data.upgrades[].desc - The description of the upgrade.
	 * @param {Function} data.upgrades[].func - Function to run on getting upgrade.
	 * @param {number} data.upgrades[].max - The maximum level of the upgrade.
	 * @param {number} data.upgrades[].weight [reload] - The weight of the upgrade.
	 */
	constructor(data) {
		this.name = data.name;
		this.id = data.id;
		this.props = data.props;
		this.tick = data.tick;
		this.upgrades = data.upgrades;
		this.weight = data.weight;
		this.upgrade = data.upgrade || (() => { });
		this.desc = data.desc || "";
	}

	givePlayer() {
		let weapon = { ...this };
		for (let prop in weapon.props) {
			weapon[prop] = weapon.props[prop];
		}

		delete weapon.props;
		weapon.upgrades.forEach(e => {
			e.times = 0;
		});
		weapon.level = 1;
		let oldUpgrade = weapon.upgrade;
		weapon.upgrade = (weapon) => {
			weapon.level++;
			oldUpgrade(weapon);
		}
		player.weapons.push(weapon);
	}
}

let bulletsFired = 0;

const weapons = [
	new Weapon({
		name: "Gun",
		id: "gun",
		weight: 0.1,
		props: {
			reload: 0,
			fireRate: 5,
			damage: 1,
			speed: 500,
			amount: 1,
			spread: 0.1,
			piercing: 0,
			ice: 10,
			fire: 10
		},
		upgrades: [
			{ name: "Damage", desc: "Increase damage dealt by bullets", func: (w) => { w.damage *= 1.5 }, max: 4, weight: 1 },
			{ name: "Fire Rate", desc: ["Fire more frequently", "Fire even more frequently"], func: (w) => { w.fireRate *= 1.35 }, max: 4, weight: 1 },
			{ name: "Projectile Speed", desc: ["Bullets travel faster", "Bullets travel even faster"], func: (w) => { w.speed *= 1.3 }, max: 3, weight: 1 },
			// { name: "Multi-shot", desc: "+1 bullet in volley", func: (w) => { w.amount++ }, max: 5, weight: 0.2 },
			{ name: "Piercing", desc: ["50% chance for bullets to pierce enemies", "100% chance for bullets to pierce enemies", "50% chance for bullets to pierce two enemies", "100% chance for bullets to pierce two enemies"], func: (w) => { w.piercing += 0.5 }, max: 4, weight: 0.4 },
			{ name: "Ice Shot", desc: ["Every 9th bullet freezes enemies", "Every 8th bullet freezes enemies", "Every 7th Bullet freezes enemies"], incompatible: ["Fire Shot"], func: (w) => w.ice--, weight: 0.6, max: 3 },
			{ name: "Fire Shot", desc: ["Every 9th bullet burns enemies", "Every 8th bullet burns enemies", "Every 7th Bullet burns enemies"], incompatible: ["Ice Shot"], func: (w) => w.fire--, weight: 0.6, max: 3 },
			// { name: "", desc: "", func: (w) => { }, max: 0, weight: 0 }
		],
		upgrade: (weapon) => {
			weapon.reload = 0;
			if (weapon.level % 5 == 0 && weapon.amount < 5) {
				weapon.amount++;
			}
		},
		tick: (weapon) => {
			let contract = get("cursorContract") || 0;
			let pow = 1 - Math.pow(1e-6, clampTime);
			if (player.isFiring) { // either but not both
				contract += (1 - contract) * pow;
				if (weapon.reload <= 0 && player.dodge.cooldown <= 0) {
					weapon.reload = 1 / weapon.fireRate;
					for (let i = 0; i < weapon.amount; i++) {
						bulletsFired++;

						const data = {
							pos: player.pos.copy,
							dir: player.dir + weapon.spread * (i - (weapon.amount - 1) / 2),
							damage: weapon.damage,
							speed: weapon.speed,
							piercing: weapon.piercing,
							ice: weapon.ice != 10 && bulletsFired % weapon.ice == 0,
							fire: weapon.fire != 10 && (bulletsFired + 1) % weapon.fire == 0
						}

						projectileTypes[projectileEnums.playerBullet].create(data);
					}
				}
			} else {
				contract -= contract * pow;
			}

			set("cursorContract", contract);
			weapon.reload -= clampTime;
		}
	}),
	new Weapon({
		name: "Guardian",
		id: "guardian",
		desc: "Spawns spinning blades that orbit you",
		weight: 0.3,
		props: {
			reload: 0,
			reloadTime: 15,
			damage: 3,
			speed: 2,
			amount: 3,
			dist: 150,
			duration: 5,
			size: 20
		},
		upgrades: [
			{ name: "Damage", desc: "Increase damage dealt by guardians", func: (w) => { w.damage *= 1.45 }, max: 3, weight: 1 },
			{ name: "Reload", desc: "Decrease time between guardian spawns", func: (w) => { w.reloadTime -= 1 }, max: 3, weight: 1 },
			{ name: "Speed", desc: "Increase guardian speed", func: (w) => { w.speed *= 1.3 }, max: 3, weight: 1 },
			{ name: "Amount", desc: "Spawn more guardians", func: (w) => { w.amount++; w.dist *= 1.2 }, max: 3, weight: 0.4 },
			{ name: "Duration", desc: "Increase duration guardians stay", func: (w) => { w.duration += 1 }, max: 3, weight: 0.6 },
			{ name: "Size", desc: "Increase guardian size", func: (w) => { w.size *= 1.5 }, max: 3, weight: 0.4 },
			// { name: "", desc: "", func: (w) => { }, max: 0, weight: 0 }
		],
		upgrade: (weapon) => {
			weapon.reload = 0;
		},
		tick: (weapon) => {
			if (weapon.reload <= 0) {
				weapon.reload = weapon.reloadTime;
				projectileTypes[projectileEnums.guardian].create({
					speed: weapon.speed,
					damage: weapon.damage,
					dist: weapon.dist,
					amount: weapon.amount,
					duration: weapon.duration,
					size: weapon.size
				});
			}
			weapon.reload -= clampTime;
		}
	})
];
export default weapons;