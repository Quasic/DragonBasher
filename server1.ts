//Server1.js
//JS port of pl scripts
//Released under DragonBasher license (see license.txt)

// Usage: new Server($,...)
// Only the last created one will be active.
// It works in a closure injected into jQuery, so you don't need to keep the returned Server object for basic functionality, only for bot players and status info.



// TODO: Working on Tileset features: merging in mapts/tilestamp and tile editing, as well as static and dynamic items



//These are objects normally provided by the client. I just put stubs here for TypeScript to verify until I figure out how to do it otherwise:
type AjaxRequest = { data: string, success: (response: string) => void, error: (xhr: object, status: string, msg: string) => void };
type jQueryStub = { ajax: (request: AjaxRequest) => void };
if (!("Cookie" in window)) var $: jQueryStub = { ajax: (q: AjaxRequest) => { } }, // our injection vector to hijack client communication that is normally for multi-player; only jQuery part we need to stub
	Cookie: Map<string, string> = new Map(), // close enough implementation, somewhat by chance
	MapSizeX = 15, MapSizeY = 11,//most likely not the right numbers! These are only for TypeScript!
	MapSizeX1 = MapSizeX + 1, MapSizeY1 = MapSizeY + 1; // These two would be correct if the above two were correct. (Only one pair is needed for construction; either can be calculated if the other is known. The client had both available, so I used both.)
//END client object stubs


type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type UpperLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
type LowerLetter = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z";
function assertUnreachable(): never { throw new Error("Didn't expect to get here!") }
type WorldCoord = `${UpperLetter}${Digit | LowerLetter}`;
type MoveData = { map: WorldCoord, x: number, y: number, z: number, a1: UpperLetter, b1: Digit, a2: UpperLetter, b2: Digit }; // Note: LowerLetter may show up in Digit place if not scrolling
type Tile = `${UpperLetter}${LowerLetter}`;
type TileFunction = () => Tile;
type ItemID = `${UpperLetter}${LowerLetter | Digit}`; // Some code may still have digit support removed. Only lower letters were used in 11-gfx.
type Sex = "M" | "F"; // |"n";
type Style = Digit;
type Cloth = UpperLetter | LowerLetter | Digit;
type Form = {
	n: string, // UserName
	c: string, // Command
	d: `${Sex}${Style}${Cloth}` | "",
	jslot: number,
	jid: ItemID, // may also be used for Tile
	jz: number, // map z if jid used for Tile
	jdata: string, // used for statics
	jraw: string, // only if can't be split into above
	k: ItemID,
	m: string, // Movement, should match /^[UDLR.]*$/ but extra characters are considered unknown movement (possibly for future use)
	q: string // Chat string
};

class Stamp {
	private stamp: number;
	constructor(offset: number = 0, stamp?: number | Stamp) {
		let t = (stamp instanceof Stamp ? stamp.toValue() : typeof stamp === "undefined" || isNaN(stamp) ? Math.floor((new Date()).getTime() / 60000) : stamp);
		if (0 === t && 0 === offset) t = Infinity; // old code used 0 stamp value for infinity due to serialization in hex
		if (!isNaN(offset)) t += offset;
		this.stamp = Math.max(1, t); // must be positive
	}
	isAfter(t: Stamp): boolean { return this.stamp > t.stamp }
	minutesSinceStamp(t: Stamp): number { return this.stamp - t.stamp }
	valueAfterMinutes(min: number) { return this.stamp + min }
	minutesUntilStamp(stamp: Stamp) { return stamp.stamp - this.stamp }
	minutesUntilStampValue(minutes: number) { return minutes - this.stamp }
	toValue() { return this.stamp }
	toString() { return "" + this.stamp }
	serialize(): string { return Infinity === this.stamp ? "!" : Number(this.stamp).toString(36).toLowerCase() } //Must be no upper case, but no longer have specific width requirement of DragonBasher database (Server.percent0_x)
	static unserialize(s: string): Stamp { let t = "!" === s ? Infinity : parseInt(s, 36); return new Stamp(0, isNaN(t) ? 0 : t) }
	static _1 = new Stamp(-1, 0);
}

class Item {
	public id: ItemID;
	constructor(id: ItemID = "Za", public expireStamp: Stamp = new Stamp()) {
		let a: UpperLetter = id.charAt(0) as UpperLetter, b: LowerLetter = id.charAt(1) as LowerLetter;
		this.id = a < "A" || a > "Z" || a != a.toUpperCase() || b < "a" || b > "z" || b != b.toLowerCase() ? "Za" : id; // verify types or corruption stops here
	}
	serialize(): string { return this.id + this.expireStamp.serialize() }
	static unserialize(s: string): Item { return new Item(s.substring(0, 2) as ItemID, Stamp.unserialize(s.substring(2))) }
	static lifetime(id: ItemID): number { return Item.newstampo[id] || 60; }
	private static newstampo: { [k: string]: number } = { //default lifetimes of items, used by newstamp()
		Ga: 3600,//minnow
		Gd: 86400,//crab
		Ge: 86400,//carp
		Za: 0,//nothing
		Zj: 60//fire
	};
	static readonly Za = new Item("Za", new Stamp(0, Infinity));
}

class Inv {
	constructor(private inv: Item[] = [], private max: number = Infinity) { }
	indexOf(item: ItemID): number {
		for (let i = 0; i < this.max; i++) {
			if (i >= this.inv.length) return "Za" === item ? i : -1;
			if (this.inv[i] instanceof Item) {
				if (this.inv[i].id === item) return i;
			} else if ("Za" === item) return i;
		}
		return -1;
	}
	search(r: RegExp): number {
		let i: number = 0;
		for (; i < this.inv.length; i++) {
			if (this.inv[i] instanceof Item && this.inv[i].id.search(r) >= 0) return i;
		}
		if (i < this.max && "Za".search(r) >= 0) return i;
		return -1;
	}
	add(item: Item, slot: number = this.indexOf("Za")): boolean {
		if ("Za" === item.id || slot < 0 || slot >= this.max || (slot < this.inv.length && this.inv[slot] instanceof Item && this.inv[slot].id !== "Za")) return false;
		this.inv[slot] = item;
		return true;
	}
	examine(id: ItemID, slot: number = this.indexOf(id)): Item {
		return slot < 0 || slot >= this.max || !(this.inv[slot] instanceof Item) || this.inv[slot].id !== id ? Item.Za : this.inv[slot];
	}
	getLength() { return this.inv.length }
	getSlotItemID(slot: number): ItemID {
		return slot < 0 || slot >= this.max || !(this.inv[slot] instanceof Item) ? "Za" : this.inv[slot].id;
	}
	getSlotItem(slot: number): Item {
		return slot < 0 || slot >= this.max || !(this.inv[slot] instanceof Item) ? Item.Za : this.inv[slot];
	}
	rm(id: ItemID, slot: number = this.indexOf(id), replaceWith: Item = Item.Za): Item {
		let inv = this.inv, item: Item;
		if (slot < 0 || slot >= this.max || slot >= inv.length || !((item = inv[slot]) instanceof Item) || item.id !== id) return Item.Za;
		inv[slot] = replaceWith;
		while (inv.length && (!((item = inv[inv.length - 1]) instanceof Item) || item.id === "Za")) inv.length--; // collect garbage @ end
		return item;
	}
	chg(from: ItemID, to: ItemID, slot: number = this.indexOf(from)): boolean {
		if (slot < 0 || slot >= this.max || slot >= this.inv.length || !(this.inv[slot] instanceof Item) || this.inv[slot].id !== from) return false;
		this.inv[slot].id = to;
		return true;
	}
	static unserialize(s: string, fallbackmax: number = 24): Inv {
		let a = s.split(/([A-Z][^A-Z]+)/g).filter(Boolean), b = a[0].charAt(0), c = "!" === b ? Infinity : b === b.toUpperCase() ? fallbackmax : parseInt(a.shift() || "NaN" as never), d: Item[] = [];
		for (let i = 0; i < s.length; i++)d[i] = Item.unserialize(a[i]);
		return new Inv(d, isNaN(c) ? fallbackmax : c);
	}
	serialize(n: number = Math.min(this.inv.length, this.max)): string {
		let i = 0, r = Infinity === this.max ? "!" : "" + this.max;
		while (i < n) r += this.inv[i++].serialize();
		if (i < n) {
			let x = Item.Za.serialize();
			for (; i < n; i++)r += x;
		}
		return r;
	}
	serializeItemIDs(min: number = 0): string { // This is lossy, one-way to client
		let i = 0, r = "";
		while (i < this.inv.length) r += this.inv[i++].id || "Za";
		for (; i < min; i++)r += "Za";
		return r;
	}
	expiration(now: Stamp, xchgf: (item: Item) => Item = (I) => Item.Za) {
		for (let item: Item, i = 0; i < this.inv.length; i++) {
			item = this.inv[i];
			if (!(item instanceof Item) || now.isAfter(item.expireStamp)) this.inv[i] = xchgf(this.inv[i]);
		}
	}
}

class Player {
	// bots would also use this object
	// initialization is handled by server
	constructor(public name: string, public object: string = "new", public map: WorldCoord = "B2", public z: number = 88, public inven: Inv = new Inv()) {
		this.tz = this.z;
		this.tmap = this.map;
	}
	one: Stamp = new Stamp(-99);
	h: number = 60;
	tmap: WorldCoord;
	tz: number;
	token: Token | null = null;
	ts: Stamp = new Stamp(0, 0);
	tport1: string = "";
}

class Token {
	level: 3 = 3; // unused, inherited from Queville
	constructor(public name: string, public z: number, public ts: Stamp = new Stamp(60), public object: string = "new", public TickObj: string = "") { }
	serialize(qzconv: (z: number) => [1 | 2 | 3 | 4, number]): string {
		return "p=" + this.name + " " + this.level + " " + this.object + "-" + this.TickObj + " " + qzconv(this.z).join("-") + "\n";
	}
	// unserialize is only needed in client, since these are volitile by nature
}

abstract class Static {
	constructor(public readonly code: string, protected z: number) { }
	isAt(z: number): boolean { return this.z === z }
	abstract activate(player: Player, form: Form, cstamp: Stamp, world: World, tport: (map: WorldCoord, z: number) => void): string; // matches /(^|\n)dinv=1/ if inv needs calling before adding this to print
	getZ() { return this.z }
	getCodeZ(): [string, number] { return [this.code, this.z] }
	abstract serialize(): string;
	static unserialize(s: string): Static {
		if (s.match(/^[A-Z][a-z0-9] /)) return "Z" === s.charAt(0) ? SpecialItem.unserialize(s) : ItemGenerator.unserialize(s);
		if (s.substring(0, 3) === "NPC") return NPC.unserialize(s);
		switch (s.substring(0, s.indexOf(" "))) {
			//case "TPORT": return TPORT.unserialize(s);
		}
		return NullStatic.unserialize(s);
	}
}
class ItemGenerator extends Static {
	constructor(item: ItemID, z: number, private lifetime: number = 60) { super(item, z) }
	serialize(): string { return this.code + " " + this.lifetime + " " + this.z }
	static unserialize(s: string) {
		let a = s.split(" ");
		return new ItemGenerator(a[0] as ItemID, +a[2], +a[1]);
	}
	activate(player: Player, form: Form, cstamp: Stamp = new Stamp()): string {
		player.inven.add(new Item(this.code as ItemID, new Stamp(this.lifetime, cstamp)));
		return "dinv=1v\n";
	}
}
abstract class SpecialItem extends Static {
	constructor(item: `Z${LowerLetter}`, z: number) { super(item, z) }
	serialize(): string {
		return this.code + " 1 " + this.z;
	}
	static unserialize(s: string) {
		switch (s.substring(0, 2)) {
			// Za is default
			//Zb CursorX
			//Zc Lock
			//Zd Key
			//Ze Teleport
			case "Zf": return Sign.unserialize(s);
			case "Zg": return Dock.unserialize(s);
			case "Zh": return City.unserialize(s);
			case "Zi": return FirePit.unserialize(s);
			case "Zj": return Fire.unserialize(s);
			//Zk MysteriousTrader
			//Zl SpecialMountain
			//Zm Blank?
			//Zn GreenHealth
			//Zo RedHealth
			default: return NullStatic.unserialize(s);
		}
		assertUnreachable();
	}
}
class NullStatic extends SpecialItem {
	private constructor(z: number) { super("Za", z) }
	serialize() { return "Za 0 " + this.z }
	static unserialize(s: string): SpecialItem {
		//not normal, but sanitizes corruption
		let a = s.split(" ");
		return new NullStatic(+a[2]);
	}
	activate(): string { return "pop=invalid static object\n"; }
}
class Sign extends SpecialItem {
	constructor(z: number, public text: string) { super("Zf", z) }
	serialize(): string {
		return "Zf 1 " + this.z + " " + this.text.replace(/\*/, "[asterisk]")
	}
	static unserialize(s: string): SpecialItem {
		let m = s.match(/^Zf [0-9]+ () (.*)$/);
		if (m) return new Sign(+m[1], m[2]);
		return NullStatic.unserialize(s);
	}
	activate(player: Player): string {
		return "pop=" + this.text + "\n";
	}
}
class Dock extends SpecialItem {
	constructor(z: number, private fish: `G${LowerLetter}`) { super("Zg", z) }
	serialize(): string {
		return this.code + " 1 " + this.z + " " + this.fish;
	}
	static unserialize(s: string): SpecialItem {
		let a = s.split(" ");
		if ("Zg" === a[0] && "G" === a[3].charAt(0) && a[3].charAt(1) === a[3].charAt(1).toLowerCase()) return new Dock(+a[2], a[3] as `G${LowerLetter}`);
		return NullStatic.unserialize(s);
	}
	activate(player: Player, form: Form, cstamp: Stamp): string {
		if (form.k.charAt(0).toUpperCase() + form.k.charAt(1).toLowerCase() != form.k) return "pop=Bad Bait!\n";
		let print = "",
			o = ({
				Ga: { odds: 10, tool: "Bj", bait: "", baitlossodds: 0 },
				Gd: { odds: 10, tool: "Bj", bait: "GaGd", baitlossodds: 10 },
				Ge: { odds: 10, tool: "Bk", bait: "GaGd", baitlossodds: 10 }
			} as {
					[K in ItemID]: { odds: number; tool: ItemID; bait: string; baitlossodds: number; };
				})[this.fish],
			k = player.inven.indexOf(form.k),
			f = player.inven.indexOf("Za");
		if (!o) return print + "pop=No Fish to catch!\n";
		if (f < 0) return print + "pop=Full Inventory\n"; //could lose bait if inv is full and a fish is caught, by removing this line, but a warning is generally preferable
		if (player.inven.indexOf(o.tool) >= 0) {
			if (o.bait) {
				if (k < 0 || o.bait.indexOf(form.k) < 0) return print + "pop=Need Bait\n";
				if (Math.floor(Math.random() * 100) < o.baitlossodds) {
					player.inven.rm(form.k, k);
					if (f < 0) f = k;
					k = - 1;
					print += "dinv=1v\npop=Lost Bait!\n";
				}
			}
			if (o.odds) {
				//catch fish
				if (Math.floor(Math.random() * 100) < o.odds) {
					if (f < 0) {
						if (k < 0) return print + "pop=Full Inventory\n";
						f = k;
						print += "pop=Lost Bait!\n";
					}
					player.inven.add(new Item(this.fish, new Stamp(Item.lifetime(this.fish), cstamp)), f);
					print += "dinv=1v\npop=You catch a Fish!\n";
				} else print += "pop=Nothing\n";
			}
		} else print += "pop=Need " + ({ Bj: "Net", Bk: "Pole" }[o.tool]) + "\n";
		return print;
	}
}
class City extends SpecialItem {
	constructor(z: number, private map: WorldCoord, private mapz: number) {
		super("Zh", z)
	}
	activate(player: Player, form: Form, cstamp: Stamp, world: World, tport: (map: WorldCoord, z: number) => void): string {
		if (!world.isCity(this.map)) return "pop=Not a City!";
		tport(this.map, this.mapz);
		return "pop=Enter City\n";
	}
	serialize(): string {
		return "Zh 1 " + this.z + " " + this.map + " " + this.mapz;
	}
	static unserialize(s: string) {
		let a = s.split(" ");
		if ("Zh" === a[0] && a[3].match(/^[A-Z][0-9a-z]$/)) return new City(+a[2], a[3] as WorldCoord, +a[4]);
		return NullStatic.unserialize(s);
	}
}
class FirePit extends SpecialItem {
	activate(player: Player, form: Form, cstamp: Stamp, world: World, tport: (map: WorldCoord, z: number) => void): string {
		return player.inven.rm("Cg", player.inven.indexOf("Cg"), new Item("Zj", new Stamp(60, cstamp))).id === "Cg" ? "dinv=1v\n" : "";
	}
	constructor(z: number) { super("Zi", z) }
	serialize(): string {
		return "Zi 0 " + this.z;
	}
	static unserialize(s: string): SpecialItem {
		let a = s.split(" ");
		if ("Zi" === a[0]) return new FirePit(+a[2]);
		return NullStatic.unserialize(s);
	}
}
class Fire extends SpecialItem {
	activate(player: Player, form: Form, cstamp: Stamp, world: World, tport: (map: WorldCoord, z: number) => void): string {
		return "pop=Fire\n";
	}
	constructor(z: number) { super("Zj", z) }
	serialize(): string {
		return "Zj 0 " + this.z;
	}
	static unserialize(s: string): SpecialItem {
		let a = s.split(" ");
		if ("Zj" === a[0]) return new Fire(+a[2]);
		return NullStatic.unserialize(s);
	}
}
class NPC extends Static {
	constructor(public name: string, z: number) { super("NPC" + name, z) }
	serialize(): string {
		return this.code + " 1 " + this.z;
	}
	static unserialize(s: string): Static {
		if (s.substring(0, 3) !== "NPC") return NullStatic.unserialize(s);
		let a = s.split(" ");
		return new NPC(a[0].substring(3), +a[2]);
	}
	activate(player: Player, form: Form, cstamp: Stamp, world: World): string {
		return "pop=" + this.name + " says Hi!\n";
	}
}
/* Building subclasses of Static to create and add to Static.unserialize switch
									TPORT: function () {
										print += "pop=tport\n";
										var mapz;
										if (codetsz[3] && (mapz = codetsz[3].split("-")).length > 1) {
											player.map = mapz[0];
											player.z = mapz[1];
											var ab = token();
											print += "t0=" + world.loadmap(`${ab.a1}${ab.b1}`) + "\nt1=" + world.loadmap(`${ab.a1}${ab.b2}`) + "\nt2=" + world.loadmap(`${ab.a2}${ab.b1}`) + "\nt3=" + world.loadmap(`${ab.a2}${ab.b2}`) + "\nRMap=1\n";
										} else if (player.name == codetsz[3]) {
											if (player.tport1) {
												print += "pop=linking this teleport to that teleport...\n";
												var dest = player.tport1.split("-");
												Cookie.set("st" + player.tmap, loadstatics(player.tmap) + "*TPORT 00000000 " + dest[1] + " " + player.tport1);
												print += "pop=linking that teleport to this teleport...\n";
												Cookie.set("st" + dest[0], loadstatics(dest[0]) + "*TPORT 00000000 " + dest[1] + " " + player.map + "-" + player.z);
												player.tport1 = "";
												print += "pop=teleport completed.\n";
											} else {
												player.tport1 = player.map + "-" + player.z;
												print += "pop=add another teleport for destination\n";
											}
										} else {
											print += "pop=player name does not matches\n";
										}
									},
									WELL: function () {
										let t = player.inven.indexOf("Bd");
										if (t > -1) {
											player.inven.chg("Bd", "Ei", t);
											inv();
											print += "dinv=1v\n";
										}
									},
									FOUNTAIN: function () {
										let t = player.inven.indexOf("Bd");
										if (t > -1) {
											player.inven.chg("Bd", "Ei", t);
											inv();
											print += "dinv=1v\n";
										}
									},
									FARMHOUSE: function () {
										let slot = player.inven.indexOf("Za");
										if (player.inven.serializeItemIDs().match(/F[abcd]/) && slot > -1) {
											player.inven.add(new Item("Fd", new Stamp(3600, cstamp)), slot);
											inv();
											print += "dinv=1v\n";
										}
									},
									CLOTHES: function () { }//static-clothes.pl basically unimplemented
 */

class Tileset {
	private ts: Stamp = new Stamp();
	getStamp(): Stamp { return this.ts }
	private token: Set<Token> = new Set();
	serializeTokens(qzconv: (z: number) => [1 | 2 | 3 | 4, number], stamp: Stamp = new Stamp()) {
		let r = "";
		this.token.forEach((t) => {
			if (stamp.isAfter(t.ts)) this.token.delete(t);
			else r += t.serialize(qzconv);
		});
		return r;
	}
	retoken(player: Player, tickObj: string = "", stamp: Stamp = new Stamp(60)) {
		this.token.add(player.token = new Token(player.name, player.tz, stamp, player.object, tickObj));
	}
	detoken(player: Player) {
		if (player.token) this.token.delete(player.token);
		player.token = null;
	}
	getInv(z: number): Inv {
		let d = this.dynamic.get(z);
		if (typeof d === "undefined") this.dynamic.set(z, d = new Inv());
		return d;
	}
	getInvKeys() { return this.dynamic.keys }
	constructor(private map: string = "", private st: Map<number, Static> = new Map(), private dynamic: Map<number, Inv> = new Map()) {
	}
	// q is only used for cities; it allows multiple maps in one
	getTileClass(z: number, q: 0 | 1 | 2 | 3 = 0): UpperLetter { return this.map.split("*")[q].charAt(2 * z) as UpperLetter }
	getTile(z: number, q: 0 | 1 | 2 | 3 = 0): Tile { return this.map.split("*")[q].substr(2 * z, 2) as Tile }
	setTile(tile: Tile, z: number, q: 0 | 1 | 2 | 3 = 0) {
		if (z < 0 || q < 0 || q > 3) return;
		let map = this.map.split("*");
		map[q] = Tileset.expand(map[q], z * 2).substring(0, 2 * z) + tile + map[q].substring(z * 2 + 2);
		this.map = map.join("*");
		this.ts = new Stamp();
	}
	private static expand(s: string, len: number, tile: Tile | TileFunction = "Ua"): string {
		if (typeof tile === "string") while (s.length < len) s += tile;
		else if (typeof tile.apply === typeof tile) while (s.length < len) s += tile();
		return s;
	}
	expand(rows: number, cols: number, isCity: boolean, tile: Tile | TileFunction = "Ua") {
		let map = this.map.split("*"), len = rows * cols * 2;
		if (isCity) {
			for (let i = 0; i < 4; i++)map[i] = Tileset.expand(map[i], len, tile);
			this.map = map.join("*");
		} else this.map = Tileset.expand(map[0], len, tile);
		this.ts = new Stamp();
	}
	truncate(rows: number, cols: number, isCity: boolean) {
		let map = this.map.split("*"), len = rows * cols * 2;
		if (isCity) {
			for (let i = 0; i < 4; i++)map[i] = map[i].substring(0, len);
			map.length = 4;
			this.map = map.join("*");
		} else this.map = map[0].substring(0, len);
		// probably don't need to stamp this, unless a too-small value was used
	}
	serializeStatics(): string {
		let a: string[] = [];
		this.st.forEach((s: Static) => { a.push(s.serialize()) });
		return a.join("*");
	}
	static unserializeStatics(s: string): Map<number, Static> {
		let a = s.split("*"), r: Map<number, Static> = new Map();
		for (let i = 1; i < a.length; i++) {
			let t = Static.unserialize(a[i]),
				z = t.getZ();
			if (z >= 0 && "Za" !== t.code) r.set(z, t);
		}
		return r;
	}
	serializeStaticZ(q: 0 | 1 | 2 | 3 | 4 = 0, zconv: (z: number) => [1 | 2 | 3 | 4, number]): string {
		let s = ["", "", "", ""],
			f = q ? (z: number) => ([q, z] as [1 | 2 | 3 | 4, number]) : zconv,
			r = "";
		this.st.forEach((s: Static, z: number) => {
			let qz = f(z);
			s[qz[0] - 1] += s.code + "=" + qz[1] + " ";
		});
		for (let i = 0; i < 4; i++)if (s[i].length || !q) r += "s" + i + "=" + s[i] + "\n";
		return r;
	}
	addStatic(s: Static) { this.st.set(s.getZ(), s) }
	getStaticAt(z: number) { return this.st.get(z) }
	hasStaticAt(z: number) { return this.st.has(z) }
	rmStatic(s: Static) { this.st.delete(s.getZ()) }
	rmStaticAt(z: number) { this.st.delete(z) }
	serializeDynamics(): string {
		let r = "", t: Inv;
		this.dynamic.forEach((inv: Inv, key: number) => { let v = inv.serialize(); r += key.toString(36).toLowerCase() + "!" + v.length.toString(36).toLowerCase() + v })
		return r;
	}
	static unserializeDynamics(s: string): Map<number, Inv> {
		let m: RegExpMatchArray | null,
			r: Map<number, Inv> = new Map(),
			x = /^([0-9a-z]+)!(0|([1-9a-z][0-9a-z]*[A-Z]))/;
		while (m = s.match(x)) {
			if ("0" !== m[2]) m[2] = m[2].substring(0, m[2].length - 1);
			let z = parseInt(m[1], 36),
				c = parseInt(m[2], 36);
			s = s.substring(m[1].length + 1 + m[2].length);
			r.set(z, Inv.unserialize(s.substring(0, c)));
			s = s.substring(c);
		}
		return r;
	}
	serialize(): string { return this.map + "*" + this.serializeStatics() + "*" + this.serializeDynamics() }
	static unserialize(s: string): Tileset {
		let m = s.match(/^([^*]*)\*(.*)\*([^*]*)$/);
		if (m) return new Tileset(m[1], Tileset.unserializeStatics(m[1]), Tileset.unserializeDynamics(m[3]));
		return new Tileset();
	}
	serializeQuarters(): string {
		let t = this.map.split("*");
		if (t.length < 4) {
			for (let i = t.length; i < 4; i++)t[i] = Tileset.randmap();
			this.map = t.join("*");
			this.ts = new Stamp();
		}
		return "t0=" + t[0] + "\nt1=" + t[1] + "\nt2=" + t[2] + "\nt3=" + t[3] + "\n";
	}
	static fill(tile: Tile = "Ua"): string {
		let tileset = "";
		for (let i = 0; i < MapSizeX1 * MapSizeY1 * 4; i++)tileset += tile;
		return tileset;
	}
	static randtile(tile: Tile[] = ["Gg", "Ge", "Gb", "Gd", "Og", "Re"], bg: Tile = "Ga", total: number = tile.length + 90): Tile { return tile[Math.floor(Math.random() * total)] || bg }
	static tileRandFactory(tile: Tile[] = ["Gg", "Ge", "Gb", "Gd", "Og", "Re"], bg: Tile = "Ga", total: number = tile.length + 90): TileFunction { return () => tile[Math.floor(Math.random() * total)] || bg }
	static tileFillFactory(tile: Tile): TileFunction { return () => tile }
	static randmap(): string { return this.rand(["Gg", "Ge", "Gb", "Gd", "Og", "Re"], "Ga", 100) }
	static rand(tiles: Tile[] = ["Gg", "Ge", "Gb", "Gd", "Og", "Re"], bg: Tile = "Ga", total: number = tiles.length + 90): string {
		let tileset = "";
		for (let i = 0; i < MapSizeX1 * MapSizeY1 * 4; i++)tileset += tiles[Math.floor(Math.random() * total)] || bg;//Ua for water
		return tileset;
	}
}

class World {
	constructor(
		readonly EdgeX: Digit = "9",
		readonly EdgeY: UpperLetter = "Z",
		private map: Map<WorldCoord, Tileset> = new Map()
	) { }
	loadmap(map: WorldCoord, randmap: () => Tileset = () => new Tileset(Tileset.randmap())): Tileset {
		//return if exists in order: cached map, saved map, default map, or generate random map
		let m = this.map.get(map);
		if (typeof m === "undefined") {
			let t: string | undefined;
			this.map.set(map, m = randmap());
		}
		return m;
	}
	savemap(map: WorldCoord, tileset: Tileset) {
		this.map.set(map, tileset);
	}
	serialize(): string {
		let r = "";
		this.map.forEach((t, k) => { let s = t.serialize(); r += k + s.length.toString(36).toLowerCase() + s });
		return r;
	}
	static unserialize(s: string) {
		let m: Map<WorldCoord, Tileset> = new Map(),
			t: RegExpMatchArray | null;
		while (t = s.match(/^([A-Z][0-9a-z])([0-9a-z]+)([A-Z]|$)/)) {
			let p = 2 + m[2].length,
				e = p + (parseInt(t[2], 36) || 0);
			m.set(m[1], Tileset.unserialize(s.substring(p, e)))
			s = s.substring(e);
		}
		return m;
	}
	static saveCookie(map: WorldCoord, tileset: Tileset) {
		Cookie.set("map" + map, tileset.serialize());
	}
	isCity(map: WorldCoord): boolean { return map.charAt(0) > this.EdgeY || map.charAt(1) > this.EdgeX }
	static null = new World();//typescript didn't like that world could be undefined, below
	static getCookieWorld(): World { // currently only remembers last played
		let t: Map<WorldCoord, Tileset> = new Map(), map: WorldCoord, o: Set<Digit | LowerLetter> = new Set();
		// TODO: should remember EdgeX&Y, and maybe serialize the whole World into a single Cookie.set or other storage mechanism
		// The client's Cookie may not have .keys, so we need to look for them all...
		for (let i = 0; i < 10; i++)o.add("" + i as Digit);
		for (let i = 97; i < 123; i++)o.add(String.fromCharCode(i) as LowerLetter);
		for (let i = 65; i < 91; i++)for (let j in o.keys) {
			map = String.fromCharCode(i) + j as WorldCoord;
			t.set(map, new Tileset(Cookie.get("map" + map) || Tileset.randmap(), Tileset.unserializeStatics(Cookie.get("st" + map) || "")));
		}
		return new World("9", "Z", t);
	}
	static worlds: Map<string, World> = new Map([["Maybe Saved", this.getCookieWorld()], ["Erase Saved", new World()]]);
}

class Server {
	readonly initstamp: Stamp = new Stamp();
	private player: Player = new Player(""); //single-player
	constructor($: jQueryStub,
		//Settings:
		//values outside of the specified range give undefined results
		private MapEdgeX: Digit = "9", // 1-9, width of world in maps-1
		private MapEdgeY: Exclude<UpperLetter, "A"> = "Z", // B-Z, height of world in maps (counting by letters A=1, Z=26)
		// [The rest can be used as cities, but it is recommended to first use the 26*26 city maps using lowercase letters in case you want to expand this setting later.]
		private scrolldist: number = 4,
		//When you get within scrolldist tiles of edge, it scrolls and pauses unless scrollpause<0; longer pause if scrollpause>0
		private scrollpause: number = 1,
		private NumInven: number = 24, // # of inventory slots, must not exceed client capacity
	) {
		$.ajax = (q: AjaxRequest) => { this.serve(q, this.player) }
	}
	// a bot could use this method 
	serve(q: AjaxRequest, player: Player) {
		let cstamp = new Stamp(),
			world: World = World.null,
			scrolldist = this.scrolldist, //probably don't need local for these two, just use this.scroll...
			scrollpause = this.scrollpause,
			NumInven = this.NumInven,
			nop = () => { },
			saveplayer = player !== this.player ? nop : () => Cookie.set("plyr" + this.player.name, this.player.one + this.player.object + (this.player.h > 99 ? "99" : (this.player.h < 10 ? "0" : "") + this.player.h) + this.player.z + this.player.map + this.player.tmap + this.player.inven.serialize(NumInven)),//._-*
			//estamp=cstamp+60
			form: Form = {
				n: "",
				c: "",
				d: "",
				jslot: -1,
				jid: "Za",
				jz: -1,
				jdata: "",
				jraw: "",
				k: "Za",
				m: "",
				q: ""
			},
			print: string = "",
			tell: (m: string) => void = (m) => { print += m },
			error: string = "",
			TickObj = "",
			MapWide = MapSizeX1 * 2,
			MapHigh = MapSizeY1 * 2,
			r = "",
			xf;
		for (let queryitem = q.data.split('&'),
			key_val: RegExpMatchArray | null,
			decoded: string,
			allowed: boolean,
			decode = window.decodeURIComponent || window.unescape,
			i = 0; i < queryitem.length; i++) {
			if (key_val = queryitem[i].match(/^([^=]*)=(.*)$/)) {
				decoded = decode(key_val[1]); // Perl checked for backticks etc. I haven't found a need for, yet: if((form.s+form.c).match(/[^A-Za-z0-9\-]/)||(form.j+form.k).match(/[^A-Za-z0-9 -]/)||form.d.match(/[^A-Za-z0-9]/)||form.m.match(/[^A-Za-z0-9\.]/)){error+="Malformed query (someone left clever debug code in?)\n")}
				allowed = false;
				switch (key_val[0]) {
					case "n":
						if (decoded.match(/[^A-Za-z0-9]/)) error += "Invalid Character In Name\n";
						if (decoded.length < 3) error += "Name must be at least 3 characters\n";
						if (decoded.length > 16) error += "Name cannot be more than 16 characters\n";
						decoded = decoded.toLowerCase();
						if (decoded.match(/^[^a-z]/)) error += "Name must start with a letter\n";
						if (decoded.match(/^npc/)) error += "Restricted player name (npc)\n";
						allowed = "" === error;
						break;
					case "p":
						if (!decoded.length) error += "Please enter a password.<BR>Any one will work. I often use *.<BR>It's not checked or used in this single-player version,<BR>but is required for the client to function properly.\n";
						break;
					case "c":
						allowed = true; // we could probably verify here, maybe putting a function in form.c, instead, but keep this for now, at least
						break;
					case "s":
						if ("" === decoded || "11-dragon" === decoded) {
							let servers = "";
							for (let s in World.worlds.keys) servers += "s=" + s + "\n";
							if ("" === servers) {
								let w = "untitled";
								World.worlds.set(w, new World(this.MapEdgeX, this.MapEdgeY));
								servers = "s=" + w + "\n";
							}
							return q.success(servers + "servers=\n");
						}
						world = World.worlds.get(decoded) || World.null;
						// not allowed because form.s is not needed, anymore
						break;
					case "d":
						allowed = decoded.match(/^[MF][0-9][A-Za-z0-9]$/) ? true : false;
						break;
					case "j":
						let jm = decoded.match(/^(([0-9]+)-|)([A-Z][a-z0-9])(-([0-9]+)|)(-.+|)$/);
						if (jm) {
							if ("" != jm[1]) form.jslot = +jm[2];
							form.jid = jm[3] as ItemID;
							if ("" != jm[4]) form.jz = +jm[5];
							if ("" != jm[6]) form.jdata = jm[6].substring(1);
						} else form.jraw = decoded;
						break;
					case "m":
					case "q":
						allowed = true; // TODO: checked later, but should be checked here, instead?
						break;
					case "k":
						allowed = decoded.match(/^[A-Z][a-z]$/) ? true : false;
				}
				if (allowed) form[key_val[0]] = decoded;
			}
		}
		console.log(cstamp, form);
		if (world === World.null) error += "Server does not exist\n";
		if ("" === form.n) error += "Please enter username\n";
		//skip server list, though it could be implemented with multiple World objects available...
		if (error) return q.error(form, "?", error);
		if ("create" === form.c) {
			//if(form.d!=form.p)return q.error(form,"?","Passwords do not match\n");
			if (Cookie.get("plyr" + form.n)) return q.error(form, "?", "Player file already exists\n");
			//actually created in loadplayer()
			form.c = "login"; //to get working for 1player
		}
		if (form.n !== player.name) {
			if (player === this.player) {
				let s = Cookie.get("plyr" + form.n);
				if (s) {
					let t = s.match(/^(0-9+)([FMn][0-9e][0-9w][A-Za-z]*)([0-9]{2})([0-9]+)([A-Z][^A-Z]){2}((!|[0-9]*)([A-Z][a-z][^A-Z]+)+)$/);//._-*
					if (!t) return q.error(form, cstamp.toString(), "Player file corrupt\n");
					player.one = new Stamp(0, +t[1]);
					player.object = t[2];
					player.h = +t[3];
					player.z = +t[4];
					player.map = t[5] as WorldCoord;
					player.tmap = t[6] as WorldCoord;
					player.inven = Inv.unserialize(t[7], NumInven);
					//player.token, player.ts, player.tz generated as needed
				} else {
					//reinitialize to new player, assuming old one logged out
					player.one = new Stamp(60, cstamp)
					player.object = "new";
					player.h = 60;
					player.z = player.tz = 88;
					player.map = player.tmap = "B2";
					player.inven = new Inv([], NumInven);
					if (player === this.player) saveplayer();
					print += "create=" + player.name + "\n";
				}
			} else return q.error(form, "!=", "player name mismatch: Player.name=" + Player.name + " but form.n=" + form.n);
		}
		xf = {
			login: function () {
				token();
				xf.refresh();
				inv();
				if ("new" === player.object.substring(0, 3)) print += "RChar=" + player.object + "\n";
				print += "login=" + player.name + "\npop=Note: This is a single-server single-player demo version.<BR>Browser storage is used to hold map edits and player data, which may be cleared automatically.<BR>In addition to commands listed by the /help command, you may use the following hidden commands:<BR>/key makes you a sysop so you can use the rest of these commands<BR>/debug shows secret info about your character and items in the Notices tab<BR>/share shows map changes for sharing or saving outside of browser storage in the Notices tab<BR>/delete deletes all statics on your current tile<BR>/grass destroys your current area\n";
			},
			logout: function () {
				world.loadmap(player.tmap).detoken(player);
				print += "logout=\n";
			},
			reset: function () {
				player.inven = new Inv([], NumInven);
				inv();
				print += "pop=Reset\n";
			},
			"char": function () {
				if (form.d) {
					player.object = form.d + (player.object.substring(3) || "R");
					token();
					xf.refresh();
					print += "hpop=\n";
				} print += "pop=char\n"
			},
			tele: function () {
				print += "pop=tele\n";
				if (form.jid !== "Za") {
					if (form.jz < 1) form.jz = (player.tz || 88);
					player.map = form.jid;
					player.z = form.jz;
					if (window.console) console.log(cstamp, "tele", form);
					token();
					player.ts = Stamp._1;
					refresh();
				} else print += "pop=bad map code" + form.jraw + "\n";
			},
			left: function () {
				let t = tileleft();
				if (t.map != player.map) {
					player.map = t.map;
					print += "t4=" + world.loadmap(`${t.a1}${t.b1}`) + "\nt5=" + world.loadmap(`${t.a2}${t.b2}`) + "\nscroll=left\n";
				}
				if (t.x >= 0) {
					player.z = t.z;
					player.object = player.object.substring(0, 3) + "L" + player.object.substr(4);
					TickObj += "l";
					token();
				}
				return !t.a1;
			},
			right: function () {
				let t = tileright();
				if (t.map != player.map) {
					player.map = t.map;
					print += "t4=" + world.loadmap(`${t.a1}${t.b1}`) + "\nt5=" + world.loadmap(`${t.a2}${t.b2}`) + "\nscroll=right\n";
				}
				if (t.x >= 0) {
					player.z = t.z;
					player.object = player.object.substring(0, 3) + "R" + player.object.substr(4);
					TickObj += "r";
					token();
				}
				return !t.a1;
			},
			up: function () {
				let t = tileup();
				if (t.map != player.map) {
					print += "t4=" + world.loadmap(player.map = t.map) + "\nt5=" + world.loadmap(`${t.a2}${t.b2}`) + "\nscroll=up\n";
				}
				if (t.x >= 0) {
					player.z = t.z;
					TickObj += "u";
					token();
				}
				return !t.a1;
			},
			down: function () {
				let t = tiledown();
				if (t.map != player.map) {
					player.map = t.map;
					print += "t4=" + world.loadmap(`${t.a2}${t.b1}`) + "\nt5=" + world.loadmap(`${t.a2}${t.b2}`) + "\nscroll=down\n";
				}
				if (t.x >= 0) {
					player.z = t.z;
					TickObj += "d";
					token();
				}
				return !t.a1;
			},
			cook: function () {
				let odds: [number, ItemID] = [0, "Za"];
				if (!hasFire()) return print += "pop=Need Fire!\n";
				if (form.jid !== "Za" && player.inven.getSlotItemID(form.jslot) === form.jid) {
					odds = ({
						Ga: [90, "Ja"],//minnows
						Gd: [90, "Jd"],//crab
						Ge: [90, "Je"]//carp
					} as { [k: string]: [number, ItemID] })[form.jid] || [0]
				}
				if (odds[0]) {
					if (Math.floor(Math.random() * 100) < odds[0]) {
						player.inven.rm(form.jid, form.jslot, new Item(odds[1], newstamp(odds[1])));
					} else {
						player.inven.rm(form.jid, form.jslot);
						print += "pop=Burnt!\n";
					}
					inv();
					print += "dinv=1\n";
				}
			},
			eat: function () {
				let food;
				if ("Za" != form.jid && -1 < form.jslot && form.jslot < NumInven) {
					if (player.inven.getSlotItemID(form.jslot) === form.jid) {
						if (food = {
							Fa: [4, "Za"],
							Fb: [4, "Fa"],
							Fc: [4, "Fb"],
							Fd: [4, "Fc"],
							Ja: [1, "Za"],
							Jd: [4, "Za"],
							Je: [8, "Za"]
						}[form.jid]) {
							if ("Za" === food[1]) player.inven.rm(form.jid, form.jslot);
							else player.inven.chg(form.jid, food[1], form.jslot);
							inv();
							player.h = Math.max(player.h + food[0], 99);
							print += "h=" + player.h + "\ndinv=1\n";
						} else print += "pop=Not Editable!\n";
					} else print += "pop=No Food!\n";
				}
			},
			plant: function () {
				if (player.inven.indexOf("Ei") < 0) return print += "pop=Need Water!\n";
				let tileset = world.loadmap(player.tmap),
					plant: [ItemID, number, ItemID];
				if (form.jid !== "Za" && player.inven.getSlotItemID(form.jslot) === form.jid) {
					let g = tileset.getTileClass(player.tz);
					if (g === "F" || g === "G") {
						if (
							(plant = {
								Fa: ["Ia", 60, "Za"],
								Fb: ["Ia", 60, "Fa"],
								Fc: ["Ia", 60, "Fd"],
								Fd: ["Ia", 60, "Fc"]
							}[form.jid]
							) && ("Za" === plant[2]
								? player.inven.rm(form.jid).id === form.jid // use last seed
								: player.inven.chg(form.jid, plant[2]) // reduce seed stack
							) && player.inven.chg("Ei", "Bd") // water from bucket
						) {
							savedynamic(player.tmap, plant[0], new Stamp(plant[1], cstamp), player.tz);
							inv();
							print += "pop=Planted\n";
						}
					} else print += "pop=Not Here\n";
				}
			},
			match: function () {
				print += "pop=light match\n";
				if ("Za" === form.jid) return;
				if (
					(form.jid === "Dj" && player.inven.rm("Dj", form.jslot).id === "Dj")
					|| (form.jid === "Dk" && player.inven.chg("Dk", "Dj", form.jslot))
					|| (form.jid === "Dl" && player.inven.chg("Dl", "Dk", form.jslot))
				) {
					inv();
					print += "dinv=1\n";
					savedynamic(player.tmap, "Zj", cstamp.valueAfterMinutes(60), player.tz);
				}
			},
			wear: function () {
				var Wearing = player.object.substring(4),
					Class = form.jid.charAt(0) as UpperLetter,
					type = form.jid.charAt(1) as LowerLetter | Digit;
				if (player.inven.indexOf(`${Class}${type}`) >= 0) {
						if ("LMS".indexOf(Class) >= 0) {
							Wearing.replace(/[LMS]./g, "");
							Wearing += Class + type;
					}
					if (player.object.length < 4) player.object += Math.random() < .5 ? "L" : "R"; // in case still new
					player.object = player.object.substring(0, 4) + Wearing;
					print += "dinv=1\n";
					token();
				}
				xf.refresh();
			},
			remove: function () {
				remove();
				print += "dinv=1\n";
				token();
				xf.refresh();
			},
			exam: function () {
				print += "pop=examine " + form.jid + "\n";
				let invitem = player.inven.examine(form.jid, form.jslot),
					invstamp = cstamp.minutesUntilStamp(invitem.expireStamp);
				if (invitem.id === form.jid) {
					print += "pop=^" + form.jid + " expires in " + (invstamp > 86400 ? Math.floor(invstamp / 86400) + " days" : invstamp > 3600 ? Math.floor(invstamp / 3600) + " hours" : invstamp > 60 ? Math.floor(invstamp / 60) + " minutes" : invstamp + " seconds") + "\n";
				}
			},
			get: function () {
				if ("Za" === form.jid) return xf.static();
				let d = world.loadmap(player.tmap).getInv(player.tz),
					i = d.indexOf(form.jid);
				if (i > -1) {
					var f = player.inven.indexOf("Za");
					if (f > -1) {
						let j = d.rm(form.jid, i);
						if (form.jid.charAt(0) === "F") {
							// convert food timestamp from seconds to minutes
							j.expireStamp = new Stamp(Math.min(j.expireStamp.minutesSinceStamp(cstamp), 60) * 60, cstamp);
						}
						player.inven.add(j, f);
						inv();
						print += "dinv=1\n";
					} else print += "pop=no space " + f + "\n";
				} else { //just avoid glob for this db
					xf.static();
				}
			},
			drop: function () {
				if (form.jslot < 0) return;
				let item = player.inven.rm(form.jid, form.jslot);
				if (item.id.charAt(0) == "F") {
					item.expireStamp = new Stamp(Math.min(item.expireStamp.minutesSinceStamp(cstamp) / 60, 60), cstamp);
				}
				world.loadmap(player.tmap).getInv(player.tz).add(item);
				inv();
				if (player.object.indexOf(item.id) >= 0) {
					form.jid = item.id;
					remove();
				}
				xf.refresh();
			},
			"static": function () {
				let s = world.loadmap(player.tmap).getStaticAt(player.tz);
				if (!s) return;
				let p = s.activate(player, form, cstamp, world, (map: WorldCoord, z: number) => {
					player.map = map;
					player.z = z;
					var ab = token();
					print += "t0=" + world.loadmap(`${ab.a1}${ab.b1}`) + "\nt1=" + world.loadmap(`${ab.a1}${ab.b2}`) + "\nt2=" + world.loadmap(`${ab.a2}${ab.b1}`) + "\nt3=" + world.loadmap(`${ab.a2}${ab.b2}`) + "\nRMap=1\n";
				});
				if (p.match(/(^|\n)dinv=1v/)) inv();
				print += p;
				xf.refresh();
			},
			"delete": function () {
				if (player.inven.indexOf("Zd") < 0) return print += "pop=Need Sysop Key\n";//perl checked for Zc
				print += "pop=delete\n";
				world.loadmap(player.tmap).rmStaticAt(player.tz);
			},
			add: function () {
				if (player.inven.indexOf("Zd") < 0) return print += "pop=Need Sysop Key\n";
				let estamp = "0",
					data = "",
					id = "";
				if ("Za" != form.jid) {
					id = form.jid;
					if (form.jid.charAt(0) != "Z") {
						estamp = "" + form.jz;
						data = " " + player.name;
					} else {
						if (form.jid === "Zf") data = form.jdata.substring(2).replace(/-/g, " ");
					}
				} else {
					if (form.jraw.substring(0, 3) === "NPC") {
						//npc
					} else {
						if (form.jraw) {
							//building
						}
					}
				}
				if (id) {
					let tileset = world.loadmap(player.tmap);
					if (tileset.hasStaticAt(player.tz)) tileset.rmStaticAt(player.tz);
					else tileset.addStatic(Static.unserialize(id + " " + estamp + " " + player.tz + data));
				}
				xf.refresh();
			},
			inventory: function () {
				if (player.inven.indexOf("Zd") < 0) return print += "pop=Need Sysop Key\n";
				if (form.jid !== "Za") {
					if (player.inven.add(new Item(form.jid, new Stamp(form.jz < 0 ? 60 : form.jz, cstamp)), form.jslot < 0 ? player.inven.indexOf("Za") : form.jslot)) {
						inv();
						print += "dinv=1\n";
					} else print += "pop=no space\n";
				} else print += "pop=mismatch\n";
			},
			chat: function () {
				if (form.q) print += "chat=" + player.name + ": " + form.q.replace(/([`\0-\x1f]|\s+$)/g, "").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "<BR>Note: There is no multiplayer or multiserver support for this version.\n";
			},
			share: function () {
				//displays Cookie stuff
				let X = "", Y = "", x, y, m, t;
				print += "pop=Maps:";
				for (x = 0; x < X.length; x++)for (y = 0; y < Y.length; y++) {
					m = X.substr(x, 1) + Y.substr(y, 1);
					if (t = Cookie.get("map" + m)) print += "<BR>map" + m + ': "' + t + '"';
					if (t = Cookie.get("st" + m)) print += "<BR>st" + m + ': "' + t + '"';
					// TODO: use the Map object caches, instead
				}
				print += "<BR>Those are the maps you have edited for sharing.\n";
			},
			debug: function () {
				if (player.inven.indexOf("Zd") < 0) return print += "pop=Need Sysop Key\n";
				//displays player, item, and token info
				print += "pop=Debug: temporary info dump:";
				for (let i in player) print += "<BR>player." + i + "=" + player[i];
				print += "\n";
			},
			key: function () {
				var slot = player.inven.indexOf("Za");
				if (slot >= 0) {
					player.inven.add(new Item("Zd", new Stamp(0x15180, 0)), slot);
					inv();
					print += "dinv=1\n";
				} else print += "pop=no space for key\n";
			},
			tile: function () {
				if (player.inven.indexOf("Zd") < 0) return print += "pop=Need Sysop Key\n";
				if (!form.jid.match(/^[A-Z][a-z]$/)) return print += "pop=" + form.jid + " is not a recognized tile\n";
				let t = world.loadmap(player.tmap),
					isCity = world.isCity(player.tmap),
					oldstamp = t.getStamp();
				t.expand(MapSizeY1, MapSizeX1, isCity);
				if (isCity) {
					var z = zconv(player.z);
					z[0]--;
					t.setTile(form.jid as Tile, z[1], z[0] as 0 | 1 | 2 | 3);
				} else t.setTile(form.jid as Tile, player.tz);
				if (player === this.player) World.saveCookie(player.tmap, t);
				if (oldstamp == cstamp) player.ts = Stamp._1;//speed up for 1player
				refresh();
			},
			/*grass: function () {
				if (player.inven.indexOf("Zd") < 0) return print += "pop=Need Sysop Key\n";
				if ("yes" != form.j) return print += "pop=Confirm (/grass command requires a yes parameter to replace the map with random grass)\n";
				print += "pop=Terraformed\n";
				let t=world.savemap(player.tmap,Tileset.randmap());
				if (player === this.player) World.saveCookie(player.tmap, t);
				if (tilestamp(player.tmap) == cstamp) player.ts = -1;//speed up for 1player
				else mapts[player.tmap] = cstamp;
				refresh();
			}, need to put this method into Tileset if wanted*/
			refresh: function () {
				if (cstamp > player.one) {
					//one.pl
					let inv = '', estamp, item: Item;
					for (let i = 0; i < NumInven; i++) {
						item = player.inven.getSlotItem(i);
						if (cstamp.isAfter(item.expireStamp) && item.id !== "Za") {
							print += "pop=^" + item + " expired\n";
							player.inven.rm(item.id, i);
							if (player.inven.indexOf(item.id) < 0) {
								form.jid = item.id;
								remove();
							}
						} else inv += item;
					}
					player.h--;
					print += "inv=" + inv + "\nh=" + player.h + "\n";
					if (player.h < 1) {
						print += "pop=You have died\n";
						player.h = 60;//probably for debugging
					}
					player.one = new Stamp(60, cstamp);
				}
				refresh();
			}
		};
		function tileleft(): MoveData {
			var map = player.map,
				a1: UpperLetter = map.charAt(0) as UpperLetter, b1: Digit = map.charAt(1) as Digit, a2: UpperLetter = a1, b2: Digit = b1,
				y = Math.floor(player.z / MapWide),
				x = player.z - y * MapWide;
			if (world.isCity(map)) {
				if (x) x--;
				else x = -1;
			} else {
				if (x > scrolldist) x--;
				//scroll within 2 spaces of edge
				else {
					b1 = String.fromCharCode(b1.charCodeAt(0) - 1) as Digit; // will be corrected next
					if (b1 < '0') b1 = world.EdgeX;
					a2 = String.fromCharCode(a1.charCodeAt(0) + 1) as UpperLetter;
					if (a2 > world.EdgeY) a2 = "A";
					b2 = b1;
					x += MapSizeX;
					map = `${a1}${b2}`;
				}
			}
			return { map: map, x: x, y: y, z: x < 0 ? player.z : y * MapWide + x, a1: a1, b1: b1, a2: a2, b2: b2 };
		}
		function tileright(): MoveData {
			var map = player.map,
				a1: UpperLetter = map.charAt(0) as UpperLetter, b1: Digit = map.charAt(1) as Digit, a2: UpperLetter = a1, b2: Digit = b1,
				y = Math.floor(player.z / MapWide),
				x = player.z - y * MapWide;
			if (world.isCity(map)) {
				if (x < MapWide - 1) x++;
				else x = -1;
			} else {
				if (x < MapWide - scrolldist - 1) x++;
				else { //scroll
					b1 = String.fromCharCode(b1.charCodeAt(0) + 1) as Digit; // will be corrected next
					if (b1 > world.EdgeX) b1 = "0";
					a2 = String.fromCharCode(a1.charCodeAt(0) + 1) as UpperLetter;
					b2 = String.fromCharCode(b1.charCodeAt(0) + 1) as Digit;
					if (b2 > world.EdgeX) b2 = "0";
					b1 = b2;
					if (a2 > world.EdgeY) a2 = "A";
					x -= MapSizeX;
					map = `${a1}${b1}`;
				}
			}
			return { map: map, x: x, y: y, z: y * MapWide + x, a1: a1, b1: b1, a2: a2, b2: b2 };
		}
		function tileup(): MoveData {
			var map = player.map,
				a1: UpperLetter = String.fromCharCode(map.charCodeAt(0) - 1) as UpperLetter, b1: Digit = map.charAt(1) as Digit, a2: UpperLetter = a1, b2: Digit = b1,
				y = Math.floor(player.z / MapWide),
				x = player.z - y * MapWide;
			if (world.isCity(map)) {
				if (y) y--;
				else x = -1;
			} else {
				if (y > scrolldist) y--;
				else {
					if (a1 < 'A') a1 = world.EdgeY;
					a2 = a1;
					b2 = String.fromCharCode(b1.charCodeAt(0) + 1) as Digit; // will be corrected next
					if (b2 > world.EdgeX) b2 = '0';
					y += MapSizeY;
					map = `${a1}${b1}`;
				}
			}
			return { map: map, x: x, y: y, z: y * MapWide + x, a1: a1, b1: b1, a2: a2, b2: b2 };
		}
		function tiledown(): MoveData {
			var map = player.map,
				a1: UpperLetter = String.fromCharCode(map.charCodeAt(0) + 1) as UpperLetter, b1: Digit = map.charAt(1) as Digit, a2: UpperLetter = a1, b2: Digit = b1,
				y = Math.floor(player.z / MapWide),
				x = player.z - y * MapWide;
			if (world.isCity(map)) {
				if (y < MapHigh - 1) y++;
				else x = -1;
			} else {
				if (y < MapHigh - scrolldist - 1) y++;
				else {
					if (a1 > world.EdgeY) a1 = "A";
					a2 = String.fromCharCode(a1.charCodeAt(0) + 1) as UpperLetter; // will be corrected next
					b2 = String.fromCharCode(b1.charCodeAt(0) + 1) as Digit;
					if (a2 > world.EdgeY) a2 = "A";
					if (b2 > world.EdgeX) b2 = "0";
					y -= MapSizeY;
					map = `${a1}${b1}`;
				}
			}
			return { map: map, x: x, y: y, z: y * MapWide + x, a1: a1, b1: b1, a2: a2, b2: b2 };
		}
		if (form.m) {
			var steps = Math.min(5, form.m.length),
				stepfs = {
					l: xf.left,
					r: xf.right,
					u: xf.up,
					d: xf.down,
					".": function () {
						TickObj += ".";
						token();
						return true;
					}
				};
			while (steps > 0) {
				var s = form.m.charAt(0);
				if (!stepfs[s] || stepfs[s]() || scrollpause < 0) {
					form.m = form.m.substr(1);
					steps--;
					if (!form.m) steps = 0;
				} else {//pause for scroll
					steps = 0;
					form.m = (scrollpause ? '.' : '') + form.m.substr(1);
				}
			}
			print += "moves=" + form.m + "\n";
		}
		if (xf[form.c]) xf[form.c]();
		saveplayer();
		if (window.console) console.log(cstamp, print);
		q.success(print);
		function refresh() {//refresh.pl, $loadmap unneeded, as functions already loaded
			let a1: UpperLetter = player.map.charAt(0) as UpperLetter,
				b1 = player.map.charAt(1) as Digit,
				map: WorldCoord = `${a1}${b1}`,
				i, s, t: Tileset = world.loadmap(player.tmap), z;
			if (a1 < 'A' || a1 > world.EdgeY || b1 < '0' || (b1 > world.EdgeX && b1 < 'a')) print += "pop=Invalid map " + map + "\n";
			else if (world.isCity(map)) {//city has 4 maps in one
				print += t.serializeTokens(zconv, cstamp) +
					t.serializeStaticZ(s, zconv);
				items(map);
				if (player.ts.minutesSinceStamp(t.getStamp()) !== 0) {
					token();
					print += t.serializeQuarters() + "RMap=1\n";
					player.ts = new Stamp(0, t.getStamp());
				}
			} else {
				let
					a2 = String.fromCharCode(a1.charCodeAt(0) + 1) as UpperLetter,
					b2 = String.fromCharCode(b1.charCodeAt(0) + 1) as Digit;
				if (a2 > world.EdgeY) a2 = "A";
				if (b2 > world.EdgeX) b2 = "0";
				let map: [WorldCoord, WorldCoord, WorldCoord, WorldCoord] = [`${a1}${b1}`, `${a1}${b2}`, `${a2}${b1}`, `${a2}${b2}`];
				for (i = 0; i < 4; i = s) {
					s = i + 1;
					print += t.serializeTokens((n: number) => [s, n], cstamp) +
						t.serializeStaticZ(s, zconv);
					items(map[i], s);
				}
				if (player.ts.minutesSinceStamp(t.getStamp()) !== 0) {
					token();
					for (i = 0; i < 4; i++)print += "t" + i + "=" + world.loadmap(map[i]) + "\n";
					print += "RMap=1\n";
					player.ts = t.getStamp();
				}
			}
			print += "RStatic=1\n";
			function items(map: WorldCoord, q: 0 | 1 | 2 | 3 | 4 = 0) {
				let j = q - 1,
					tileset = world.loadmap(map),
					zlist = tileset.getInvKeys(),
					inv: Inv,
					it = ["", "", "", ""];
				//if (window.console) console.log("items", map, q)
				//tokens 0=t (tile) 1=mapdynamic[map][i][t] (expiration) 2=i (tz)
				for (let zi = 0; zi < zlist.length; zi++)if ((inv = tileset.getInv(i = zlist[zi])) instanceof Inv) {
					inv.expiration(cstamp, (item: Item) => {
						let xform: [ItemID, number, RegExp | null] = ["Za", Infinity, null];
						({ //g-[A-Z][a-z].pl
							Dh: function () {
								if (Math.random() < .65) xform = ["Ia", 60, /^[FG]/];
							},
							Ia: function () {
								let y = Math.floor(i / MapWide),
									x = i - y * MapWide,
									f: boolean, k, m: MoveData[] = [];
								if (Math.random() < .25) m[m.length] = tileleft();
								if (Math.random() < .25) m[m.length] = tileright();
								if (Math.random() < .25) m[m.length] = tileup();
								if (Math.random() < .25) m[m.length] = tiledown();
								for (let j = 0; j < m.length; j++) {
									if (world.loadmap(m[j].map).getInv(m[j].z).getLength() < 1) savedynamic(m[j].map, ("F" + String.fromCharCode(Math.floor(Math.random() * 4) + 97)) as ItemID, 60, m[j].z);
								}
								if (Math.random() < .5) xform = ["Ia", 60, null];
								else if (Math.random() < .5) xform = [("F" + String.fromCharCode(Math.floor(Math.random() * 4) + 97)) as ItemID, 60, null];
							},
							Fa: function () {
								if (Math.random() < .45) xform = ["Ia", 60, /^[FG]/];
							},
							Fb: function () {
								if (Math.random() < .5) xform = ["Ia", 60, /^[FG]/];
							},
							Fc: function () {
								if (Math.random() < .55) xform = ["Ia", 60, /^[FG]/];
							},
							Fd: function () {
								if (Math.random() < .6) xform = ["Ia", 60, /^[FG]/];
							}
						}[item.id] || nop)();
						if (xform[2] instanceof RegExp && !world.loadmap(map).getTile(i).match(xform[2])) return Item.Za;
						return new Item(xform[0], new Stamp(xform[1], cstamp));
					});
					if (!q) {
						let z = zconv(i);
						j = z[0];
						i = z[1];
					}
					for (let item: Item, slot = 0; slot < NumInven; slot++)if ((item = inv.getSlotItem(slot)).id !== "Za") it[j] += item.id + Server.percent0_x(2, i);
				}
				for (i = 0; i < 4; i++)if (it[i] || !q) print += "i" + i + "=" + it[i] + "\n";
			}
		}
		function zconv(z: number): [1 | 2 | 3 | 4, number] {
			let q = 1, y = Math.floor(z / MapWide), x = z - (y * MapWide);
			if (y > MapSizeY) { q = 3; y -= MapSizeY1 }
			if (x > MapSizeX) { q++; x -= MapSizeX1 }
			return [q as 1 | 2 | 3 | 4, y * MapSizeX1 + x];
		}
		function token(): { a1: UpperLetter, b1: Digit, a2: UpperLetter, b2: Digit } {
			let z: number,
				map: WorldCoord,
				a1: UpperLetter = player.map.charAt(0) as UpperLetter,
				b1: Digit = player.map.charAt(1) as Digit,
				a2: UpperLetter = a1,
				b2: Digit = b1;
			if (world.isCity(player.map)) {
				map = `${a1}${b1}`;
				//this checks y, no need to check x
				z = player.z < MapHigh * MapWide ? player.z : MapHigh * MapWide;
			} else {
				let x: number, y: number, a: UpperLetter;
				a2 = String.fromCharCode(a1.charCodeAt(0) + 1) as UpperLetter, // will be corrected next
					b2 = String.fromCharCode(b1.charCodeAt(0) + 1) as Digit;
				if (a2 > world.EdgeY) a2 = "A";
				if (b2 > world.EdgeX) b2 = "0";
				y = Math.floor(player.z / MapWide);
				x = player.z - (y * MapWide);
				if (y >= MapSizeY1) {
					y -= MapSizeY1;
					a = a2;
				} else a = a1;
				if (x >= MapSizeX1) {
					x -= MapSizeX1;
					map = `${a}${b2}`;
				} else map = `${a}${b1}`;
				z = (y * MapSizeX1) + x;
				if (window.console) console.log(cstamp, "token.noncity", map, x, y, z);
			}
			world.loadmap(player.tmap).detoken(player);
			player.tmap = map;
			player.tz = z;
			world.loadmap(map).retoken(player, TickObj)
			if (window.console) console.log(cstamp, "token.out", player.token);
			return { a1: a1, b1: b1, a2: a2, b2: b2 };
		}
		function inv() {
			print += "inv=" + player.inven.serializeItemIDs(NumInven) + "\n";
		}
		function remove() {
			player.object = player.object.replace(form.jid, '');
		}
		function newstamp(item) {
			return new Stamp(Item.lifetime(item), cstamp);
		}
		function savedynamic(map: WorldCoord, item: ItemID, e: number | Stamp, tz: number) {
			world.loadmap(map).getInv(tz).add(new Item(item, new Stamp(0, e)));
		}
		function hasFire() {
			let tileinv = world.loadmap(player.tmap).getInv(player.tz);
			if (tileinv.indexOf("Zj") > -1) return true;
			let p;
			if ((p = player.inven.indexOf("Zj")) >= 0) {
				form.jslot = p;
				form.jid = "Zj";
				xf.drop();
				return true;
			} else if ((p = player.inven.indexOf("Dj")) >= 0) {
				if (player.inven.rm("Dj", p).id === "Dj") tileinv.add(new Item("Zj", newstamp("Zj")));
				inv();
				return true;
			} else if ((p = player.inven.indexOf("Dk")) >= 0) {
				if (player.inven.chg("Dk", "Dj", p)) tileinv.add(new Item("Zj", newstamp("Zj")));
				inv();
				return true;
			} else if ((p = player.inven.indexOf("Dl")) >= 0) {
				if (player.inven.chg("Dl", "Dk", p)) tileinv.add(new Item("Zj", newstamp("Zj")));
				inv();
				return true;
			}
			return false;
		}
	}
	static percent0_x(digitCount: number, n: number) {
		return ("00000000" + Number(n).toString(16)).substr(-digitCount);
	}
}
