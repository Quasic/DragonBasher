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
type ItemID = `${UpperLetter}${LowerLetter}`;

class Stamp {
	private stamp: number;
	constructor(offset: number = 0, stamp: number | Stamp = Math.floor((new Date()).getTime() / 60000)) {
		let t=(stamp instanceof Stamp ? stamp.toValue() :stamp);
		if(0===t&&0===offset)t=Infinity; // old code used 0 stamp value for infinity due to serialization in hex
		this.stamp = Math.max(1,t); // must be positive
	}
	isAfter(t:Stamp):boolean{return this.stamp>t.stamp}
	since(t: Stamp): number { return this.stamp - t.stamp }
	after(min: number) { return this.stamp + min }
	minutesUntilStampValue(minutes: number) { return minutes - this.stamp }
	toValue() { return this.stamp }
	toString() { return "" + this.stamp }
	serialize(): string { return Infinity===this.stamp?"!":Number(this.stamp).toString(36).toLowerCase() } //Must be no upper case, but no longer have specific width requirement of DragonBasher database (Server.percent0_x)
	static unserialize(s: string): Stamp { let t = "!"===s?Infinity:parseInt(s, 36); return new Stamp(0, isNaN(t) ? 0 : t) }
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
	static newlife(id: ItemID): number { return Item.newstampo[id] || 60; }
	private static newstampo: { [k: string]: number } = { //default lifetimes of items, used by newstamp()
		Ga: 3600,//minnow
		Gd: 86400,//crab
		Ge: 86400,//carp
		Za: 0,//nothing
		Zj: 60//fire
	};
	static readonly Za=new Item("Za",new Stamp(0,Infinity));
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
		this.inv[slot] = new Item(to, this.inv[slot].expireStamp);
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
	token;
	ts: Stamp = new Stamp(0, 0);
	tport1: string = "";
	//const level:3=3 unused
}

class Token {
	//
}

class Static {
}

class Tileset {
	private ts: Stamp = new Stamp();
	getStamp(): Stamp { return this.ts }
	private st: Static[] = [];
	private dynamic: Map<number, Inv> = new Map();
	getInv(z: number): Inv {
		let d = this.dynamic.get(z);
		if (typeof d === "undefined") this.dynamic.set(z, d = new Inv());
		return d;
	}
	constructor(private map: string, st: string = "") {
		//parse st into this.st
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
	toString() { return this.map }
	serialize(): string { return this.map }
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
	//maptoken={},mapdynamic={}
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
			t.set(map, new Tileset(Cookie.get("map" + map) || Tileset.randmap(), Cookie.get("st" + map) || ""));
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
			form: {
				n: string,
				p: "*",
				c: string,
				d: string,
				j: string,
				k: ItemID,
				m: string,
				q: string
			} = {
				n: "",
				p: "*",
				c: "",
				d: "",
				j: "",
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
					case "j":
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
				detoken();
				player.token = false;
				print += "logout=\n";
			},
			reset: function () {
				player.inven = new Inv([], NumInven);
				inv();
				print += "pop=Reset\n";
			},
			"char": function () {
				if (!form.d) form.d = "";
				var sex = form.d.charAt(0),
					style = form.d.charAt(1).replace(/[^0-9]/g, "");
				if (style && ("M" === sex || "F" === sex)) {
					var cloth = form.d.charAt(2).replace(/[^A-Za-z0-9]/g, "");
					player.object = sex + style + cloth + "R";
					token();
					xf.refresh();
					print += "hpop=\n";
				} print += "pop=char\n"
			},
			tele: function () {
				print += "pop=tele\n";
				var mapz = form.j.split("-");
				if (mapz[0].match(/^[A-Z][0-9a-z]$/)) {
					if (mapz.length < 2 || +mapz[1] < 1) mapz[1] = "" + (player.tz || 88);
					player.map = mapz[0] as WorldCoord;
					player.z = +mapz[1];
					if (window.console) console.log(cstamp, "tele", mapz);
					token();
					player.ts = Stamp._1;
					refresh();
				} else print += "pop=bad map code:" + mapz[0] + "\n";
			},
			left: function () {
				var t = tileleft();
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
				var t = tileright();
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
				var t = tileup();
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
				var t = tiledown();
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
				var odds: [number, ItemID] = [0, "Za"],
					slotitem = form.j.split("-"),
					slot = +slotitem[0];
				if (!hasFire()) return print += "pop=Need Fire!\n";
				if (slot < NumInven && slotitem[1].length === 2 && player.inven.substr(slot * 10, 2) === slotitem[1]) {
					odds = ({
						Ga: [90, "Ja"],//minnows
						Gd: [90, "Jd"],//crab
						Ge: [90, "Je"]//carp
					} as { [k: string]: [number, ItemID] })[slotitem[1]] || [0]
				}
				if (odds[0]) {
					slot *= 10;
					print += "pop=slot " + slotitem[0] + " -> " + slot + "\n";
					if (Math.floor(Math.random() * 100) < odds[0]) {
						player.inven = player.inven.substring(0, slot) + odds[1] + newstamp(odds[1]) + player.inven.substr(slot + 10);
					} else {
						player.inven = player.inven.substring(0, slot) + "Za00000000" + player.inven.substr(slot + 10);
						print += "pop=Burnt!\n";
					}
					inv();
					print += "dinv=1\n";
				}
			},
			eat: function () {
				var food,
					slotitem = form.j.split("-"),
					slot = +slotitem[0];
				if (slot < NumInven && slotitem[1].length === 2) {
					if (player.inven.substr(slot * 10, 2) === slotitem[1]) {
						if (food = {
							Fa: [4, "Za"],
							Fb: [4, "Fa"],
							Fc: [4, "Fb"],
							Fd: [4, "Fc"],
							Ja: [1, "Za"],
							Jd: [4, "Za"],
							Je: [8, "Za"]
						}[slotitem[1]]) {
							slot *= 10;
							player.inven = player.inven.substring(0, slot) + food[1] + ("Za" === food[1] ? "00000000" : player.inven.substr(slot + 2, 8)) + player.inven.substr(slot + 10);
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
					plant: [ItemID, number, ItemID],
					slotitem = form.j.split("-"),
					slot = +slotitem[0];
				if (slot < NumInven && slotitem[1].length === 2 && player.inven.getSlotItemID(slot) === slotitem[1]) {
					let g = tileset.getTileClass(player.tz);
					if (g === "F" || g === "G") {
						if (
							(plant = {
								Fa: ["Ia", 60, "Za"],
								Fb: ["Ia", 60, "Fa"],
								Fc: ["Ia", 60, "Fd"],
								Fd: ["Ia", 60, "Fc"]
							}[slotitem[1]]
							) && ("Za" === plant[2]
								? player.inven.rm(slotitem[1]).id === slotitem[1] // use last seed
								: player.inven.chg(slotitem[1], plant[2]) // reduce seed stack
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
				let slotitem = form.j.split("-"),
					slot = +slotitem[0];
				if (slot < NumInven && slotitem[1].length === 2 && player.inven.substr(slot *= 10, 2) === slotitem[1]) {
					if (slotitem[1] === "Dj") player.inven = player.inven.substring(0, slot) + "Za00000000" + player.inven.substr(slot + 10);
					else if (slotitem[1] === "Dk") player.inven = player.inven.substring(0, slot) + "Dj" + player.inven.substr(slot + 2);
					else if (slotitem[1] === "Dl") player.inven = player.inven.substring(0, slot) + "Dk" + player.inven.substr(slot + 2);
					else return;
					inv();
					print += "dinv=1\n";
					savedynamic(player.tmap, "Zj", Server.percent0_x(8, cstamp.after(60)), player.tz);
				}
			},
			wear: function () {
				if (form.j.length !== 2) return;
				var Wearing = player.object.substr(4),
					Class = form.j.charAt(0).replace(/[^A-Z]/g, ""),
					type = form.j.charAt(1).replace(/[^0-9a-z]/g, "");
				if (player.inven.indexOf(Class + type) >= 0) {
					if ("" !== type) {
						if ("LMS".indexOf(Class) >= 0) {
							Wearing.replace(/[LMS]./g, "");
							Wearing += Class + type;
						}
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
				print += "pop=examine " + form.j + "\n";
				var slotitem = form.j.split("-"),
					slot = +slotitem[0],
					invitem = player.inven.substr(slot * 10, 2),
					invstamp = cstamp.minutesUntilStampValue(parseInt(player.inven.substr(slot * 10 + 2, 8), 16));
				if (invitem === slotitem[1]) {
					print += "pop=^" + slotitem[1] + " expires in " + (invstamp > 86400 ? Math.floor(invstamp / 86400) + " days" : invstamp > 3600 ? Math.floor(invstamp / 3600) + " hours" : invstamp > 60 ? Math.floor(invstamp / 60) + " minutes" : invstamp + " seconds") + "\n";
				}
			},
			get: function () {
				let d = world.loadmap(player.tmap).getInv(player.tz),
					i = d.indexOf(form.j);
				if (i > -1) {
					var f = player.inven.indexOf("Za");
					if (f > -1) {
						let j = d.rm(form.j, i);
						if (form.j.charAt(0) === "F") {
							// convert food timestamp from seconds to minutes
							j.expireStamp = new Stamp(Math.min(j.expireStamp.since(cstamp), 60) * 60, cstamp);
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
				let slotitem = form.j.split("-"),
					slot = +slotitem[0] * 10,
					item = player.inven.rm(slotitem[1], slot);
				if (item.id.charAt(0) == "F") {
					item.expireStamp = new Stamp(Math.min(item.expireStamp.since(cstamp) / 60, 60), cstamp);
				}
				world.loadmap(player.tmap).getInv(player.tz).add(item);
				inv();
				if (player.object.indexOf(item.id) >= 0) {
					form.j = item.id;
					remove();
				}
				xf.refresh();
			},
			"static": function () {
				let f: number,
					s = loadstatics(player.tmap).split("*");
				for (let codetsz: string[], i = 0; i < s.length; i++) {
					codetsz = s[i].split(" ");
					if (player.tz == +codetsz[2]) {
						if (codetsz[0].length == 2) {
							if (codetsz[0].charAt(0) == "Z") {
								({ // static-
									Zf: function () {
										//sign
										print += "pop=" + codetsz[3];
										for (var i = 4; i < codetsz.length; i++)print += " " + codetsz[i];
										print += "\n";
									},
									Zg: function () {
										//fishing dock
										if (form.k.charAt(0).toUpperCase() + form.k.charAt(1).toLowerCase() != form.k) return print += "pop=Bad Bait!\n";
										var o = ({
											Ga: { odds: 10, tool: "Bj", bait: "", baitlossodds: 0 },
											Gd: { odds: 10, tool: "Bj", bait: "GaGd", baitlossodds: 10 },
											Ge: { odds: 10, tool: "Bk", bait: "GaGd", baitlossodds: 10 }
										} as { [k: ItemID]: { odds: number, tool: ItemID, bait: string, baitlossodds: number } })[codetsz[3]],
											k = player.inven.indexOf(form.k),
											f = player.inven.indexOf("Za");
										if (!o) return print += "pop=No Fish to catch!\n";
										if (f < 0) return print += "pop=Full Inventory\n"; //could lose bait if inv is full and a fish is caught, by removing this line, but a warning is generally preferable
										if (player.inven.indexOf(o.tool) >= 0) {
											if (o.bait) {
												if (k < 0 || o.bait.indexOf(form.k) < 0) return print += "pop=Need Bait\n";
												if (Math.floor(Math.random() * 100) < o.baitlossodds) {
													player.inven = player.inven.substring(0, k) + "Za00000000" + player.inven.substring(k + 10);
													inv();
													print += "pop=Lost Bait!\n";
												}
											}
											if (o.odds) {
												//catch fish
												if (Math.floor(Math.random() * 100) < o.odds) {
													if (f < 0) {
														if (k < 0) return print += "pop=Full Inventory\n";
														f = k;
														print += "pop=Lost Bait!\n";
													}
													player.inven = player.inven.substring(0, f) + codetsz[3] + newstamp(codetsz[3]) + player.inven.substr(f + 10);
													inv();
													print += "pop=You catch a Fish!\n";
												} else print += "pop=Nothing\n";
											}
										} else print += "pop=Need " + ({ Bj: "Net", Bk: "Pole" }[o.tool]) + "\n";
									},
									Zh: function () {
										print += "pop=Enter City\n";
									},
									Zi: function () {
										var f = player.inven.indexOf("Cg")
										if (f >= 0) {
											player.inven = player.inven.substring(0, f) + "Zj" + Server.percent0_x(8, cstamp.after(60)) + player.inven.substr(f + 10);
											inv();
											print += "dinv=1v\n";
										}
									},
									Zj: function () {
										print += "pop=Fire\n";
									}
								}[codetsz[0]] || nop)();
							} else {
								f = player.inven.indexOf("Za");
								let estamp = Server.percent0_x(8, cstamp.after(parseInt("0x" + codetsz[1])));
								player.inven = player.inven.substring(0, f) + codetsz[0] + estamp + player.inven.substr(f + 10);
								inv();
								print += "dinv=1v\n";
							}
						} else {
							if (codetsz[0].substring(0, 3) === "NPC") {
								//npc
							} else {
								({
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
								}[codetsz[0]] || function () {
									print += "pop=invalid static object\n";
								})();
							}
						}
					}
				}
				xf.refresh();
			},
			"delete": function () {
				if (player.inven.indexOf("Zd") < 0) return print += "pop=Need Sysop Key\n";//perl checked for Zc
				print += "pop=delete\n";
				let s = loadstatics(player.tmap).split("*");
				for (let codetsz, i = 0; i < s.length; i++) {
					codetsz = s[i].split(" ");
					if (player.tz == codetsz[2]) {
						//removed form.j check, so deletes all items on that location
						s[i] = "";
						print += "pop=" + codetsz[0] + " deleted\n";
					}
				}
				Cookie.set("st" + player.tmap, s.join("*").replace(/^\*+/, "").replace(/\*+$/, "").replace(/\*\*+/g, "*"));
			},
			add: function () {
				if (player.inven.indexOf("Zd") < 0) return print += "pop=Need Sysop Key\n";
				let jdata = form.j.split("-"),
					estamp = "00000000";
				if (jdata[0].length === 2) {
					if (jdata[0].charAt(0) != "Z") {
						estamp = Server.percent0_x(8, +jdata[1]);
						jdata[1] = player.name;
					} else {
						if (jdata[0] === "Zf") jdata[1] = form.j.substr(2).replace(/-/g, " ");
					}
				} else {
					if (form.j.substring(0, 3) === "NPC") {
						//npc
					} else {
						if (jdata[0]) {
							//building
						}
					}
				}
				if (jdata[0]) {
					let s = loadstatics(player.tmap).split("*");
					for (var codetsz, i = 0; i < s.length; i++) {
						codetsz = s[i].split(" ");
						if (player.tz == codetsz[2]) {
							s[i] = "";
							print += "pop=" + codetsz[0] + " deleted\n";
							jdata[0] = "";
						}
					}
					if (jdata[0]) {
						s[s.length] = jdata[1];
					}
					Cookie.set("st" + player.tmap, s.join("*").replace(/^\*+/, "").replace(/\*+$/, "").replace(/\*\*+/g, "*"));
				}
				xf.refresh();
			},
			inventory: function () {
				if (player.inven.indexOf("Zd") < 0) return print += "pop=Need Sysop Key\n";
				let f: number,
					J: string[] = form.j.split("-"),
					j: [number, string, string];
				if (J[0].match(/^[A-Z][0-9a-z]$/)) {
					f = player.inven.indexOf("Za");
					j = [f, J[0], J[1]];
				} else {
					j = [+J[0], J[1], J[2]];
					f = +j[0];
				}
				print += "pop=/newitem " + j[0] + " " + j[1] + " " + j[2] + "\n";
				if (j[1].match(/^[A-Z][a-z]$/)) {
					if (player.inven.add(new Item(j[1] as ItemID, new Stamp(+j[2], cstamp)), f)) {
						inv();
						print += "dinv=1\n";
					} else print += "pop=no space " + f + "\n";
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
				if (!form.j.match(/^[A-Z][a-z]$/)) return print += "pop=" + form.j + " is not a recognized tile\n";
				let t = world.loadmap(player.tmap),
					isCity = world.isCity(player.tmap),
					oldstamp = t.getStamp();
				t.expand(MapSizeY1, MapSizeX1, isCity);
				if (isCity) {
					var z = zconv(player.z);
					z[0]--;
					t.setTile(form.j as Tile, z[1], z[0] as 0 | 1 | 2 | 3);
				} else t.setTile(form.j as Tile, player.tz);
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
								form.j = item.id;
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
			if (b1 > world.EdgeY) {
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
			if (b1 > world.EdgeY) {
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
			if (b1 > world.EdgeY) {
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
			if (b1 > world.EdgeY) {
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
				players(map);
				statics(map);
				items(map);
				if (player.ts.since(t.getStamp()) !== 0) {
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
					players(map[i], s);
					items(map[i], s);
					statics(map[i], s);
				}
				if (player.ts.since(t.getStamp()) !== 0) {
					token();
					for (i = 0; i < 4; i++)print += "t" + i + "=" + world.loadmap(map[i]) + "\n";
					print += "RMap=1\n";
					player.ts = t.getStamp();
				}
			}
			print += "RStatic=1\n";
			function players(map: WorldCoord, q?: number) {
				var i, t;
				if ("object" === typeof maptoken[map]) for (i in maptoken[map]) if (!maptoken[map].hasOwnProperty || maptoken[map].hasOwnProperty(i)) {
					t = i.split(" ");
					if (cstamp > t[4]) {
						//expired token
						maptoken[map][i] = undefined;
						delete maptoken[map][i];
					} else print += "p=" + t[0] + " " + t[1] + " " + t[2] + " " + (q ? q + "-" + t[3] : zconv(t[3]).join("-")) + "\n";
					if (window.console) console.log(cstamp, "players", map, q, t);
				}
			}
			function items(map: WorldCoord, q: 0 | 1 | 2 | 3 | 4 = 0) {
				let i, t, z,
					j = q - 1,
					//tileset=loadmap(map), //why?
					it = ["", "", "", ""];
				if (window.console) console.log("items", map, q, mapdynamic)
				//tokens 0=t (tile) 1=mapdynamic[map][i][t] (expiration) 2=i (tz)
				if ("object" === typeof mapdynamic[map]) for (i in mapdynamic[map]) if (!mapdynamic[map].hasOwnProperty || mapdynamic[map].hasOwnProperty(i)) if ("object" === typeof mapdynamic[map][i]) for (t in mapdynamic[map][i]) if (!mapdynamic[map][i].hasOwnProperty || mapdynamic[map][i].hasOwnProperty(t)) {
					if (window.console) console.log(cstamp, "item", mapdynamic[map][i][t], i, t);
					if (cstamp > mapdynamic[map][i][t]) {
						mapdynamic[map][i][t] = undefined;
						delete mapdynamic[map][i][t];
						function xform(toitem: ItemID, e: number = 60, tileregex?: RegExp) {
							if (tileregex && !world.loadmap(map).getTile(i).match(tileregex)) return;
							mapdynamic[map][i][toitem] = cstamp.after(e);
							if (q) it[j] += toitem + Server.percent0_x(2, i);
							else {
								z = zconv(i);
								it[z[0]] += toitem + Server.percent0_x(2, z[1]);
							}
						}
						({ //g-[A-Z][a-z].pl
							Dh: function () {
								if (Math.random() < .65) xform("Ia", 60, /^[FG]/);
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
									f = true;
									for (k in mapdynamic[m[j].map][m[j].z]) { f = false; break }
									if (f) savedynamic(m[j].map, ("F" + String.fromCharCode(Math.floor(Math.random() * 4) + 97)) as ItemID, 60, m[j].z);
								}
								if (Math.random() < .5) xform("Ia", 60);
								else if (Math.random() < .5) xform(("F" + String.fromCharCode(Math.floor(Math.random() * 4) + 97)) as ItemID, 60);
							},
							Fa: function () {
								if (Math.random() < .45) xform("Ia", 60, /^[FG]/);
							},
							Fb: function () {
								if (Math.random() < .5) xform("Ia", 60, /^[FG]/);
							},
							Fc: function () {
								if (Math.random() < .55) xform("Ia", 60, /^[FG]/);
							},
							Fd: function () {
								if (Math.random() < .6) xform("Ia", 60, /^[FG]/);
							}
						}[t] || nop)();
					} else if (q) it[j] += t + Server.percent0_x(2, i);
					else {
						z = zconv(i);
						it[z[0]] += t + Server.percent0_x(2, z[1]);
					}
				}
				for (i = 0; i < 4; i++)if (it[i] || !q) print += "i" + i + "=" + it[i] + "\n";
			}
			function statics(map: WorldCoord, q: 0 | 1 | 2 | 3 | 4 = 0) {
				var s, i, t, z,
					j = q - 1,
					st = ["", "", "", ""];
				//statics have default, but not generated
				if (s = loadstatics(map)) for (s = s.split("*"), i = 0; i < s.length; i++) {
					t = s[i].split(" ");
					if (q) st[j] += t[0] + "=" + t[2];
					else {
						z = zconv(t[2]);
						st[z[0]] += t[0] + "=" + z[1] + " ";
					}
				}
				for (i = 0; i < 4; i++)if (st[i] || !q) print += "s" + i + "=" + st[i] + "\n";
			}
		}
		function zconv(z: number): [1 | 2 | 3 | 4, number] {
			var q = 1, y = Math.floor(z / MapWide), x = z - (y * MapWide);
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
			if (b1 > world.EdgeX) {//city
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
			detoken();
			player.tmap = map;
			player.tz = z;
			if (!maptoken[player.tmap]) maptoken[player.tmap] = {};
			maptoken[player.tmap][player.token = player.name + " 3 " + player.object + "-" + TickObj + " " + z + " " + (cstamp.after(60))] = 1;
			if (window.console) console.log(cstamp, "token.out", player.token);
			return { a1: a1, b1: b1, a2: a2, b2: b2 };
		}
		function detoken() {
			if (player.token && maptoken[player.tmap]) {
				maptoken[player.tmap][player.token] = undefined;
				delete maptoken[player.tmap][player.token];
			}
		}
		function inv() {
			var i, v = "";
			for (i = 0; i < NumInven; i++)v += player.inven.substr(i * 10, 2);
			print += "inv=" + v + "\n";
		}
		function remove() {
			player.object = player.object.replace(form.j, '');
		}
		function newstamp(item) {
			return new Stamp(Item.newlife(item), cstamp);
		}
		function savedynamic(map: WorldCoord, item: ItemID, e: number | Stamp, tz: number) {
			world.loadmap(map).getInv(tz).add(new Item(item, new Stamp(0, e)));
		}
		function hasFire() {
			let tileinv = world.loadmap(player.tmap).getInv(player.tz);
			if (tileinv.indexOf("Zj") > -1) return true;
			let p;
			if ((p = player.inven.indexOf("Zj")) >= 0) {
				form.j = p / 10 + "-Zj"
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
