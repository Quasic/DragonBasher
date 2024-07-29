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


type UpperLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
type LowerLetter = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z";
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
function assertUnreachable(): never { throw new Error("Didn't expect to get here!") }
type WorldCoord = `${UpperLetter}${Digit|LowerLetter}`;
type ItemID = `${UpperLetter}${LowerLetter}`;
type MoveData = { map: WorldCoord, x: number, y: number, z: number, a1: UpperLetter, b1: Digit, a2: UpperLetter, b2: Digit };

class Stamp {
	constructor(offset: number = 0, private stamp: number = Math.floor((new Date()).getTime() / 60000)) { this.stamp += offset }
	since(t: Stamp): number { return this.stamp - t.stamp }
	after(min:number){return this.stamp+min}
	toValue() { return this.stamp }
	toString() { return "" + this.stamp }
}

class Player {
	// bots would also use this object
	// initialization is handled by server
	constructor(public name: string, public object: string = "new", public map: WorldCoord = "B2", public z: number = 88) {
		this.tz = this.z;
		this.tmap = this.map;
	}
	one: Stamp = new Stamp(-99);
	h: number = 60;
	tmap: WorldCoord;
	tz: number;
	inven: string = ""; // may be better implemented as Item[]
	token;
	ts;
	tport1:string="";
	//const level:3=3 unused
}

class Token {
	//
}

class Static {
}

class Dynamic {
	//
}

type Tile = `${UpperLetter}${LowerLetter}`;
class Tileset {
	private ts: Stamp = new Stamp();
	getStamp():readonly Stamp { return this.ts }
	private st: Static[] = [];
	constructor(private map: string, st: string = "") {
		//parse st into this.st
	}
	//type Ttileset=;
	static fill(tile: Tile = "Ua"): string {
		let tileset = "";
		for (let i = 0; i < MapSizeX1 * MapSizeY1 * 4; i++)tileset += tile;
		return tileset;
	}
	static randmap():string { return this.rand(["Gg", "Ge", "Gb", "Gd", "Og", "Re"], "Ga", 100) }
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
	loadmap(map: WorldCoord, randmap: () => Tileset = ()=>new Tileset(Tileset.randmap())): Tileset {
		//return if exists in order: cached map, saved map, default map, or generate random map
		let m = this.map.get(map);
		if (typeof m === "undefined") {
			let t: string | undefined;
			this.map.set(map, m = randmap());
		}
		return m;
	}
	static null = new World();//typescript didn't like that world could be undefined, below
	static getCookieWorld():World{ // currently only remembers last played
		let t:Map<WorldCoord, Tileset>=new Map(),map:WorldCoord,o:Set<Digit|LowerLetter>=new Set();
		// TODO: should remember EdgeX&Y, and maybe serialize the whole World into a single Cookie.set or other storage mechanism
		// The client's Cookie may not have .keys, so we need to look for them all...
		for(let i=0;i<10;i++)o.add(""+i as Digit);
		for(let i=97;i<123;i++)o.add(String.fromCharCode(i) as LowerLetter);
		for(let i=65;i<91;i++)for(let j in o.keys){
			map=String.fromCharCode(i)+j as WorldCoord;
			t.set(map,new Tileset(Cookie.get("map" + map)||Tileset.randmap(),Cookie.get("st" + map) || ""));
		}
		return new World("9","Z",t);
	}
	static worlds: Map<string, World> = new Map([["Maybe Saved",this.getCookieWorld()],["Erase Saved",new World()]]);
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
			nop=()=>{},
			saveplayer = player !== this.player ? nop: () => Cookie.set("plyr" + this.player.name, this.player.one + this.player.object + (this.player.h > 99 ? "99" : (this.player.h < 10 ? "0" : "") + this.player.h) + this.player.z + this.player.map + this.player.tmap + this.player.inven),//._-*
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
				k:"Za",
				m:"",
				q:""
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
						case"q":
						allowed = true; // TODO: checked later, but should be checked here, instead?
					break;
					case"k":
					allowed=decoded.match(/^[A-Z][a-z]$/)?true:false;
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
					let t = s.match(/^(0-9+)([FMn][0-9e][0-9w][A-Za-z]*)([0-9]{2})([0-9]+)([A-Z][^A-Z]){2}(([A-Z][a-z][0-9]{8})+)$/);//._-*
					if (!t) return q.error(form, cstamp.toString(), "Player file corrupt\n");
					player.one = new Stamp(0, +t[1]);
					player.object = t[2];
					player.h = +t[3];
					player.z = +t[4];
					player.map = t[5] as WorldCoord;
					player.tmap = t[6] as WorldCoord;
					player.inven = t[7];
					//player.token, player.ts, player.tz generated as needed
				} else {
					//reinitialize to new player, assuming old one logged out
					player.one = new Stamp(60, cstamp.toValue())
					player.object = "new";
					player.h = 60;
					player.z = player.tz = 88;
					player.map = player.tmap = "B2";
					player.inven = "";
					for (let i = 0; i < NumInven; i++)player.inven += "Za00000000";
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
				if ("new" === player.object.substr(0, 3)) print += "RChar=" + player.object + "\n";
				print += "login=" + player.name + "\npop=Note: This is a single-server single-player demo version.<BR>Browser storage is used to hold map edits and player data, which may be cleared automatically.<BR>In addition to commands listed by the /help command, you may use the following hidden commands:<BR>/key makes you a sysop so you can use the rest of these commands<BR>/debug shows secret info about your character and items in the Notices tab<BR>/share shows map changes for sharing or saving outside of browser storage in the Notices tab<BR>/delete deletes all statics on your current tile<BR>/grass destroys your current area\n";
			},
			logout: function () {
				detoken();
				player.token = false;
				print += "logout=\n";
			},
			reset: function () {
				player.inven = "";
				for (var t = 0; t < NumInven; t++)player.inven += "Za00000000";
				inv();
				print += "pop=Reset\n";
			},
			"char": function () {
				if (!form.d) form.d = "";
				var sex = form.d.substr(0, 1),
					style = form.d.substr(1, 1).replace(/[^0-9]/g, "");
				if (style && ("M" === sex || "F" === sex)) {
					var cloth = form.d.substr(2, 1).replace(/[^A-Za-z0-9]/g, "");
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
					player.ts = -1;
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
					player.object = player.object.substr(0, 3) + "L" + player.object.substr(4);
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
					player.object = player.object.substr(0, 3) + "R" + player.object.substr(4);
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
					} as { [k: ItemID]: [number, ItemID] })[slotitem[1]] || [0]
				}
				if (odds[0]) {
					slot *= 10;
					print += "pop=slot " + slotitem[0] + " -> " + slot + "\n";
					if (Math.floor(Math.random() * 100) < odds[0]) {
						player.inven = player.inven.substr(0, slot) + odds[1] + newstamp(odds[1]) + player.inven.substr(slot + 10);
					} else {
						player.inven = player.inven.substr(0, slot) + "Za00000000" + player.inven.substr(slot + 10);
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
							player.inven = player.inven.substr(0, slot) + food[1] + ("Za" === food[1] ? "00000000" : player.inven.substr(slot + 2, 8)) + player.inven.substr(slot + 10);
							inv();
							player.h = Math.max(player.h + food[0], 99);
							print += "h=" + player.h + "\ndinv=1\n";
						} else print += "pop=Not Editable!\n";
					} else print += "pop=No Food!\n";
				}
			},
			plant: function () {
				if (player.inven.indexOf("Ei") < 0) return print += "pop=Need Water!\n";
				let tileset, plant,
					slotitem = form.j.split("-"),
					slot = +slotitem[0];
				if (slot < NumInven && slotitem[1].length === 2 && player.inven.substr(slot *= 10, 2) === slotitem[1]) {
					tileset = world.loadmap(player.tmap);
					let g = tileset.substr(player.tz * 2, 1);
					if (g === "F" || g === "G") {
						if (plant = {
							Fa: ["Ia", 60, "Za"],
							Fb: ["Ia", 60, "Fa"],
							Fc: ["Ia", 60, "Fd"],
							Fd: ["Ia", 60, "Fc"]
						}[slotitem[1]]) {
							savedynamic(player.tmap, plant[0], Server.percent0_x(8, plant[1] + cstamp), player.tz);
							player.inven = player.inven.substr(0, slot) + plant[2] + ("Za" === plant[2] ? "00000000" : player.inven.substr(slot + 2, 8)) + player.inven.substr(slot + 10);
							player.inven.replace(/Ei/, "Bd");
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
					if (slotitem[1] === "Dj") player.inven = player.inven.substr(0, slot) + "Za00000000" + player.inven.substr(slot + 10);
					else if (slotitem[1] === "Dk") player.inven = player.inven.substr(0, slot) + "Dj" + player.inven.substr(slot + 2);
					else if (slotitem[1] === "Dl") player.inven = player.inven.substr(0, slot) + "Dk" + player.inven.substr(slot + 2);
					else return;
					inv();
					print += "dinv=1\n";
					savedynamic(player.tmap, "Zj", Server.percent0_x(8, cstamp.after(60)), player.tz);
				}
			},
			wear: function () {
				if (form.j.length !== 2) return;
				var Wearing = player.object.substr(4),
					Class = form.j.substr(0, 1).replace(/[^A-Z]/g, ""),
					type = form.j.substr(1, 1).replace(/[^0-9a-z]/g, "");
				if (player.inven.indexOf(Class + type) >= 0) {
					if ("" !== type) {
						if ("LMS".indexOf(Class) >= 0) {
							Wearing.replace(/[LMS]./g, "");
							Wearing += Class + type;
						}
					}
					if (player.object.length < 4) player.object += Math.random() < .5 ? "L" : "R"; // in case still new
					player.object = player.object.substr(0, 4) + Wearing;
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
					slot=+slotitem[0],
					invitem = player.inven.substr(slot * 10, 2),
					invstamp = parseInt(player.inven.substr(slot * 10 + 2, 8),16) - cstamp.toValue();
				if (invitem === slotitem[1]) {
					print += "pop=^" + slotitem[1] + " expires in " + (invstamp > 86400 ? Math.floor(invstamp / 86400) + " days" : invstamp > 3600 ? Math.floor(invstamp / 3600) + " hours" : invstamp > 60 ? Math.floor(invstamp / 60) + " minutes" : invstamp + " seconds") + "\n";
				}
			},
			get: function () {
				var filestamp = mapdynamic[player.tmap] && mapdynamic[player.tmap][player.tz] && mapdynamic[player.tmap][player.tz][form.j];
				if (filestamp) {
					var f = player.inven.indexOf("Za");
					if (f > -1) {
						if (form.j.substr(0, 1) == "F") {
							// convert food timestamp from seconds to minutes
							filestamp = Server.percent0_x(8,cstamp.after( Math.min(parseInt("0x" + filestamp), 60) * 60));
						}
						player.inven = player.inven.substr(0, f) + form.j + filestamp + player.inven.substr(f + 10);
						inv();
						print += "dinv=1\n";
						mapdynamic[player.tmap][player.tz][form.j] = undefined;
						delete mapdynamic[player.tmap][player.tz][form.j];
					} else print += "pop=no space " + f + "\n";
				} else { //just avoid glob for this db
					xf.static();
				}
			},
			drop: function () {
				var slotitem = form.j.split("-"),
					slot=+slotitem[0] * 10;
				var invitem = player.inven.substr(slot, 2),
					invstamp = player.inven.substr(slot + 2, 8);
				if (invitem == slotitem[1] && !(mapdynamic[player.tmap] && mapdynamic[player.tmap][player.tz] && mapdynamic[player.tmap][player.tz][invitem])) {
					if (invitem.substr(0, 1) == "F") {
						let istamp = Math.floor((parseInt("0x" + invstamp) - cstamp.toValue()) / 60);
						if (istamp > 60) istamp = 60;
						invstamp = Server.percent0_x(8, cstamp.after( istamp));
					}
					savedynamic(player.tmap, invitem, invstamp, player.tz);
					player.inven = player.inven.substr(0, slot) + "Za00000000" + player.inven.substr(slot + 10)
					inv();
					if (player.object.indexOf(invitem) >= 0) {
						form.j = invitem;
						remove();
					}
				}
				xf.refresh();
			},
			"static": function () {
				let f:number,
					s = loadstatics(player.tmap).split("*");
				for (let codetsz:string[], i = 0; i < s.length; i++) {
					codetsz = s[i].split(" ");
					if (player.tz == +codetsz[2]) {
						if (codetsz[0].length == 2) {
							if (codetsz[0].substr(0, 1) == "Z") {
								({ // static-
									Zf: function () {
										//sign
										print += "pop=" + codetsz[3];
										for (var i = 4; i < codetsz.length; i++)print += " " + codetsz[i];
										print += "\n";
									},
									Zg: function () {
										//fishing dock
										if (form.k.substr(0, 1).toUpperCase() + form.k.substr(1, 2).toLowerCase() != form.k) return print += "pop=Bad Bait!\n";
										var o = ({
											Ga: { odds: 10, tool: "Bj", bait: "" ,baitlossodds:0},
											Gd: { odds: 10, tool: "Bj", bait: "GaGd", baitlossodds: 10 },
											Ge: { odds: 10, tool: "Bk", bait: "GaGd", baitlossodds: 10 }
										}as{[k:ItemID]:{odds:number,tool:ItemID,bait:string,baitlossodds:number}})[codetsz[3]],
											k = player.inven.indexOf(form.k),
											f = player.inven.indexOf("Za");
										if (!o) return print += "pop=No Fish to catch!\n";
										if (f < 0) return print += "pop=Full Inventory\n"; //could lose bait if inv is full and a fish is caught, by removing this line, but a warning is generally preferable
										if (player.inven.indexOf(o.tool) >= 0) {
											if (o.bait) {
												if (k < 0 || o.bait.indexOf(form.k) < 0) return print += "pop=Need Bait\n";
												if (Math.floor(Math.random() * 100) < o.baitlossodds) {
													player.inven = player.inven.substr(0, k) + "Za00000000" + player.inven.substr(k + 10);
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
													player.inven = player.inven.substr(0, f) + codetsz[3] + newstamp(codetsz[3]) + player.inven.substr(f + 10);
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
											player.inven = player.inven.substr(0, f) + "Zj" + Server.percent0_x(8, cstamp.after(60)) + player.inven.substr(f + 10);
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
								player.inven = player.inven.substr(0, f) + codetsz[0] + estamp + player.inven.substr(f + 10);
								inv();
								print += "dinv=1v\n";
							}
						} else {
							if (codetsz[0].substr(0, 3) === "NPC") {
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
										var t = player.inven.indexOf("Bd");
										if (t > -1) {
											player.inven = player.inven.substr(0, t) + "Ei" + player.inven.substr(t + 2);
											inv();
											print += "dinv=1v\n";
										}
									},
									FOUNTAIN: function () {
										var t = player.inven.indexOf("Bd");
										if (t > -1) {
											player.inven = player.inven.substr(0, t) + "Ei" + player.inven.substr(t + 2);
											inv();
											print += "dinv=1v\n";
										}
									},
									FARMHOUSE: function () {
										var slot = player.inven.indexOf("Za")
										if (player.inven.match(/F[abcd]/) && slot > -1) {
											player.inven = player.inven.substr(0, slot) + "Fd" + Server.percent0_x(8, cstamp.after(3600)) + player.inven.substr(slot + 10);
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
					if (jdata[0].substr(0, 1) != "Z") {
						estamp = Server.percent0_x(8, +jdata[1]);
						jdata[1] = player.name;
					} else {
						if (jdata[0] === "Zf") jdata[1] = form.j.substr(2).replace(/-/g, " ");
					}
				} else {
					if (form.j.substr(0, 3) === "NPC") {
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
				let f:number,
					J:string[]=form.j.split("-"),
					j:[number,string,string];
				if (J[0].match(/^[A-Z][0-9a-z]$/)) {
					f = player.inven.indexOf("Za");
					j = [f / 10, J[0], J[1]];
				} else{
					j=[+J[0],J[1],J[2]];
					f = +j[0] * 10;
				}
				print += "pop=/newitem " + j[0] + " " + j[1] + " " + j[2] + "\n";
				if (player.inven.substr(f, 2) == 'Za') {
					if (j[1].match(/^[A-Z][0-9a-z]$/)) {
						player.inven = player.inven.substr(0, f) + j[1] + Server.percent0_x(8, cstamp.after(+j[2])) + player.inven.substr(f + 10);
						inv();
						print += "dinv=1\n";
					} else print += "pop=mismatch\n";
				} else print += "pop=no space " + f + "\n";
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
					player.inven = player.inven.substr(0, slot) + "Zd00015180" + player.inven.substr(slot + 10);
					inv();
					print += "dinv=1\n";
				} else print += "pop=no space for key\n";
			},
			tile: function () {
				if (player.inven.indexOf("Zd") < 0) return print += "pop=Need Sysop Key\n";
				if (!form.j.match(/^[A-Z][a-z]$/)) return print += "pop=" + form.j + " is not a recognized tile\n";
				var t = world.loadmap(player.tmap);
				if (player.tmap.substr(1, 1) >= 'a') {//city
					t = t.split("*");
					var z = zconv(player.z);
					z[0]--;
					while (t[z[0]].length < MapSizeX1 * MapSizeY1 * 2) t[z[0]] += "Ua";
					t[z[0]] = t[z[0]].substr(0, z[1] * 2) + form.j + t[z[0]].substr(z[1] * 2 + 2);
					t = t.join("*");
				} else t = t.substr(0, player.tz * 2) + form.j + t.substr(player.tz * 2 + 2);
				Cookie.set("map" + player.tmap, t);
				if (tilestamp(player.tmap) == cstamp) player.ts = -1;//speed up for 1player
				else mapts[player.tmap] = cstamp;
				refresh();
			},
			grass: function () {
				if (player.inven.indexOf("Zd") < 0) return print += "pop=Need Sysop Key\n";
				if ("yes" != form.j) return print += "pop=Confirm (/grass command requires a yes parameter to replace the map with random grass)\n";
				print += "pop=Terraformed\n";
				Cookie.set("map" + player.tmap, randmap());
				if (tilestamp(player.tmap) == cstamp) player.ts = -1;//speed up for 1player
				else mapts[player.tmap] = cstamp;
				refresh();
			},
			refresh: function () {
				if (cstamp > player.one) {
					//one.pl
					var i, inv = '', estamp, invitem;
					for (i = 0; i < NumInven; i++) {
						estamp = parseInt("0x" + player.inven.substr(i * 10 + 2, 8));
						invitem = player.inven.substr(i * 10, 2);
						if (estamp && cstamp > estamp) {
							print += "pop=^" + invitem + " expired\n";
							player.inven = player.inven.substring(0, i * 10) + "Za00000000" + player.inven.substr(i * 10 + 10);
							if (player.inven.indexOf(invitem) < 0) {
								form.j = invitem;
								remove();
							}
						} else inv += invitem;
					}
					player.h--;
					print += "inv=" + inv + "\nh=" + player.h + "\n";
					if (player.h < 1) {
						print += "pop=You have died\n";
						player.h = 60;//probably for debugging
					}
					player.one = new Stamp(60,cstamp.toValue());
				}
				refresh();
			}
		};
		function tileleft(): MoveData {
			var map = player.map,
				a1: UpperLetter=map.charAt(0) as UpperLetter, b1: Digit = map.charAt(1) as Digit, a2: UpperLetter=a1, b2: Digit=b1,
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
				a1:UpperLetter=map.charAt(0) as UpperLetter, b1:Digit = map.substr(1, 1) as Digit, a2:UpperLetter=a1, b2:Digit=b1,
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
				a1:UpperLetter=String.fromCharCode(map.charCodeAt(0) - 1) as UpperLetter, b1:Digit = map.substr(1, 1) as Digit, a2:UpperLetter=a1, b2:Digit=b1,
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
				a1:UpperLetter=String.fromCharCode(map.charCodeAt(0) + 1) as UpperLetter, b1:Digit = map.substr(1, 1) as Digit, a2:UpperLetter=a1, b2:Digit=b1,
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
				var s = form.m.substr(0, 1);
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
			let a1:UpperLetter = player.map.substr(0, 1) as UpperLetter,
				b1 = player.map.substr(1, 1) as Digit,
				map:WorldCoord = `${a1}${b1}`,
				i, s, t:string[], z;
			if (a1 < 'A' || a1 > world.EdgeY || b1 < '0' || (b1 > world.EdgeX && b1 < 'a')) print += "pop=Invalid map " + map + "\n";
			else if (b1 > world.EdgeX) {//city has 4 maps in one
				players(map);
				statics(map);
				items(map);
				if (player.ts != tilestamp(player.tmap)) {
					token();
					t = world.loadmap(player.tmap).split("*");
					while (t.length < 4) t[t.length] = randmap();
					print += "t0=" + t[0] + "\nt1=" + t[1] + "\nt2=" + t[2] + "\nt3=" + t[3] + "\nRMap=1\n";
					player.ts = tilestamp(player.tmap);
				}
			} else {
				var
					a2 = String.fromCharCode(a1.charCodeAt(0) + 1),
					b2 = String.fromCharCode(b1.charCodeAt(0) + 1);
				if (a2 > world.EdgeY) a2 = "A";
				if (b2 > world.EdgeX) b2 = "0";
				map = [a1 + b1, a1 + b2, a2 + b1, a2 + b2];
				for (i = 0; i < 4; i = s) {
					s = i + 1;
					players(map[i], s);
					items(map[i], s);
					statics(map[i], s);
				}
				if (player.ts != tilestamp(player.tmap)) {
					token();
					for (i = 0; i < 4; i++)print += "t" + i + "=" + world.loadmap(map[i]) + "\n";
					print += "RMap=1\n";
					player.ts = tilestamp(player.tmap);
				}
			}
			print += "RStatic=1\n";
			function players(map:WorldCoord, q?:number) {
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
			function items(map, q) {
				var i, t, z,
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
						function xform(toitem:ItemID, e:number=60, tileregex?:RegExp) {
							if (tileregex && !world.loadmap(map).substr(i * 2, 2).match(tileregex)) return;
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
									f:boolean, k, m:MoveData[] = [];
								if (Math.random() < .25) m[m.length] = tileleft();
								if (Math.random() < .25) m[m.length] = tileright();
								if (Math.random() < .25) m[m.length] = tileup();
								if (Math.random() < .25) m[m.length] = tiledown();
								for (let j = 0; j < m.length; j++) {
									f = true;
									for (k in mapdynamic[m[j].map][m[j].z]) { f = false; break }
									if (f) savedynamic(m[j].map, "F" + String.fromCharCode(Math.floor(Math.random() * 4) + 97), 60, m[j].z);
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
			function statics(map, q) {
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
		function zconv(z:number) {
			var q = 1, y = Math.floor(z / MapWide), x = z - (y * MapWide);
			if (y > MapSizeY) { q = 3; y -= MapSizeY1 }
			if (x > MapSizeX) { q++; x -= MapSizeX1 }
			return [q, y * MapSizeX1 + x];
		}
		function token():{a1:UpperLetter,b1:Digit,a2:UpperLetter,b2:Digit} {
			let z:number,
				map:WorldCoord,
				a1:UpperLetter = player.map.substr(0, 1) as UpperLetter,
				b1:Digit = player.map.substr(1, 1) as Digit,
				a2:UpperLetter=a1,
				b2:Digit=b1;
			if (b1 > world.EdgeX) {//city
				map = `${a1}${b1}`;
				//this checks y, no need to check x
				z = player.z < MapHigh * MapWide ? player.z : MapHigh * MapWide;
			} else {
				let x:number, y:number,a:UpperLetter;
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
					map=`${a}${b2}`;
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
			return Server.percent0_x(8, cstamp + (Server.newstampo[item] || 60));
		}
		function savedynamic(map, item, e, tz) {
			if (!mapdynamic[map]) mapdynamic[map] = {};
			if (!mapdynamic[map][tz]) mapdynamic[map][tz] = {};
			mapdynamic[map][tz][item] = e;
		}
		function hasFire() {
			if (mapdynamic[player.tmap] && mapdynamic[player.tmap][player.tz] && mapdynamic[player.tmap][player.tz].Zj) return true;
			var p;
			if ((p = player.inven.indexOf("Zj")) >= 0) {
				form.j = p / 10 + "-Zj"
				xf.drop();
				return true;
			} else if ((p = player.inven.indexOf("Dj")) >= 0) {
				savedynamic(player.tmap, "Zj", newstamp("Zj"), player.tz);
				player.inven = player.inven.substr(0, p) + "Za00000000" + player.inven.substr(p + 10);
				inv();
				return true;
			} else if ((p = player.inven.indexOf("Dk")) >= 0) {
				savedynamic(player.tmap, "Zj", newstamp("Zj"), player.tz);
				player.inven = player.inven.substr(0, p) + "Dj" + player.inven.substr(p + 2);
				inv();
				return true;
			} else if ((p = player.inven.indexOf("Dl")) >= 0) {
				savedynamic(player.tmap, "Zj", newstamp("Zj"), player.tz);
				player.inven = player.inven.substr(0, p) + "Dk" + player.inven.substr(p + 2);
				inv();
				return true;
			}
			return false;
		}
	}
	private static newstampo = { //default lifetimes of items, used by newstamp()
		Ga: 3600,//minnow
		Gd: 86400,//crab
		Ge: 86400,//carp
		Za: 0,//nothing
		Zj: 60//fire
	};
	static percent0_x(digitCount: number, n: number) {
		return ("00000000" + Number(n).toString(16)).substr(-digitCount);
	}
}
