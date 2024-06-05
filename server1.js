//Server1.js
//JS port of pl scripts
//Released under DragonBasher license (see license.txt)

//When you get within scrolldist tiles of edge, it scrolls and pauses unless scrollpause<0; longer pause if scrollpause>0
(function($){
	var MapEdgeY='Z',
	MapEdgeX='9',
	scrolldist=4,
	scrollpause=1,
	NumInven=24,
	newstampo={
		Ga:3600,//minnow
		Gd:86400,//crab
		Ge:86400,//carp
		Za:0,//nothing
		Zj:60//fire
	},
	player={},maptoken={},mapts={},mapdynamic={},initstamp=Math.floor(new Date/60000)-1,nop=function(){};
	function loadmap(map){
		//no validity check for 1 player
		//return if exists in order: saved map, default map, or generate random map
		return Cookie.get("map"+map)||{
			
		}[map]||randmap();
	}
	function loadstatics(map){
		return Cookie.get("st"+map)||{
			
		}[map]||"";
	}
	function tilestamp(map){
		return mapts[map]||initstamp;
	}
	function randmap(){
		var i,
		tileset="",
		tiles=["Gg","Ge","Gb","Gd","Og","Re"];
		for(i=0;i<MapSizeX1*MapSizeY1*4;i++)tileset+=tiles[Math.floor(Math.random()*100)]||"Ga";//Ua for water
		return tileset;
	}
	$.ajax=function(q){
		var t=q.data.split('&'),
		cstamp=Math.floor(new Date/60000),
		//estamp=cstamp+60
		form={},
		print="",
		error="",
		TickObj="",
		MapWide=MapSizeX1*2,
		MapHigh=MapSizeY1*2,
		r="",
		xf,i,v;
		for(i=0;i<t.length;i++){
			v=t[i].split('=');
			form[v[0]]=(window.decodeURIcomponent||window.unescape)(v[1]);
		}
if(window.console)console.log(cstamp,form);
		//if((form.s+form.c).match(/[^A-Za-z0-9\-]/)||(form.j+form.k).match(/[^A-Za-z0-9 -]/)||form.d.match(/[^A-Za-z0-9]/)||form.m.match(/[^A-Za-z0-9\.]/)){error+="Malformed query (someone left clever debug code in?)\n")}
		if(form.n.match(/[^A-Za-z0-9]/))error+="Invalid Character In Name\n";
		if(form.n.length<3)error+="Name must be at least 3 characters\n";
		if(form.n.length>16)error+="Name cannot be more than 16 characters\n";
		form.n=form.n.toLowerCase();
		if(form.n.match(/^[^a-z]/))error+="Name must start with a letter\n";
		if(form.n.match(/^npc/))error+="Restricted player name (npc)\n";
		if(!form.p.length)error+="Please enter a password.<BR>Any one will work. I often use *.<BR>It's not checked or used in this single-player version,<BR>but is required for the client to function properly.\n";
		form.p="********";//clear any password given
		if(!form.n)error+="Please enter username\n"
		//skip server list
		if(error)return q.error(form,"?",error);
		if("create"==form.c){
			//if(form.d!=form.p)return q.error(form,"?","Passwords do not match\n");
			if(Cookie.get("plyr"+form.n))return q.error(form,"?","Player file already exists\n");
			//actually created in loadplayer()
			form.c="login"; //to get working for 1player
		}
		function saveplayer(){
			Cookie.set("plyr"+player.name,player.one+player.object+(player.h>99?"99":(player.h<10?"0":"")+player.h)+player.z+player.map+player.tmap+player.inven);//._-*
		}
		function loadplayer(n){
			var t;
			if(t=Cookie.get("plyr"+n)){
				if(!(t=t.match(/^(0-9+)([FMn][0-9e][0-9w][A-Za-z]*)([0-9]{2})([0-9]+)([A-Z][^A-Z]){2}(([A-Z][a-z][0-9]{8})+)$/)))return q.error(cstamp,form,"?","Player file corrupt\n");//._-*
				player={name:n,one:t[1],object:t[2],h:t[3],z:t[4],map:t[5],tmap:t[6],inven:t[7]};
				//player.token, player.ts, player.tz generated as needed
			}else{
				//level:3, but unused
				player={name:n,one:cstamp+60,object:"new",h:60,z:88,map:"B2",tmap:"B2",tz:88,inven:""};
				for(t=0;t<NumInven;t++)player.inven+="Za00000000";
				print+="create="+player.name+"\n";
				saveplayer();
			}
		}
		if(form.n!==player.name)loadplayer(form.n);
		xf={
			login:function(){
				token();
				xf.refresh();
				inv();
				if("new"===player.object.substr(0,3))print+="RChar="+player.object+"\n";
				print+="login="+player.name+"\npop=Note: This is a single-server single-player demo version.<BR>Browser storage is used to hold map edits and player data, which may be cleared automatically.<BR>In addition to commands listed by the /help command, you may use the following hidden commands:<BR>/key makes you a sysop so you can use the rest of these commands<BR>/debug shows secret info about your character and items in the Notices tab<BR>/share shows map changes for sharing or saving outside of browser storage in the Notices tab<BR>/delete deletes all statics on your current tile<BR>/grass destroys your current area\n";
			},
			logout:function(){
				detoken();
				player.token=false;
				print+="logout=\n";
			},
			reset:function(){
				player.inven="";
				for(var t=0;t<NumInven;t++)player.inven+="Za00000000";
				inv();
				print+="pop=Reset\n";
			},
			"char":function(){
				if(!form.d)form.d="";
				var sex=form.d.substr(0,1),
				style=form.d.substr(1,1).replace(/[^0-9]/g,"");
				if(style&&("M"===sex||"F"===sex)){
					var cloth=form.d.substr(2,1).replace(/[^A-Za-z0-9]/g,"");
					player.object=sex+style+cloth+"R";
					token();
					xf.refresh();
					print+="hpop=\n";
				}print+="pop=char\n"
			},
			tele:function(){
				print+="pop=tele\n";
				var mapz=form.j.split("-");
				if(mapz[0].match(/^[A-Z][0-9a-z]$/)){
					if(mapz.length<2||mapz[1]<1)mapz[1]=player.tz||88;
					player.map=mapz[0];
					player.z=mapz[1];
if(window.console)console.log(cstamp,"tele",mapz);
					token();
					player.ts=-1;
					refresh();
				}else print+="pop=bad map code:"+mapz[0]+"\n";
			},
			left:function(){
				var t=tileleft();
				if(t.map!=player.map){
					player.map=t.map;
					print+="t4="+loadmap(t.a1+t.b1)+"\nt5="+loadmap(t.a2+t.b2)+"\nscroll=left\n";
				}
				if(t.x>=0){
					player.z=t.z;
					player.object=player.object.substr(0,3)+"L"+player.object.substr(4);
					TickObj+="l";
					token();
				}
				return !t.a1;
			},
			right:function(){
				var t=tileright();
				if(t.map!=player.map){
					player.map=t.map;
					print+="t4="+loadmap(t.a1+t.b2)+"\nt5="+loadmap(t.a2+t.b2)+"\nscroll=right\n";
				}
				if(t.x>=0){
					player.z=t.z;
					player.object=player.object.substr(0,3)+"R"+player.object.substr(4);
					TickObj+="r";
					token();
				}
				return !t.a1;
			},
			up:function(){
				var t=tileup();
				if(t.map!=player.map){
					print+="t4="+loadmap(player.map=t.map)+"\nt5="+loadmap(t.a2+t.b2)+"\nscroll=up\n";
				}
				if(t.x>=0){
					player.z=t.z;
					TickObj+="u";
					token();
				}
				return !t.a1;
			},
			down:function(){
				var t=tiledown();
				if(t.map!=player.map){
					player.map=t.map;
					print+="t4="+loadmap(t.a2+t.b1)+"\nt5="+loadmap(t.a2+t.b2)+"\nscroll=down\n";
				}
				if(t.x>=0){
					player.z=t.z;
					TickObj+="d";
					token();
				}
				return !t.a1;
			},
			cook:function(){
				var odds=[0],
				slotitem=form.j.split("-");
				if(!hasFire())return print+="pop=Need Fire!\n";
				if(slotitem[0]<NumInven&&slotitem[1].length===2&&player.inven.substr(slotitem[0]*10,2)===slotitem[1]){
					odds={
						Ga:[90,"Ja"],//minnows
						Gd:[90,"Jd"],//crab
						Ge:[90,"Je"]//carp
					}[slotitem[1]]||[0]
				}
				if(odds[0]){
					slotitem[0]*=10;
					print+="pop=slot "+slotitem[0]+"\n";
					if(Math.floor(Math.random()*100)<odds[0]){
						player.inven=player.inven.substr(0,slotitem[0])+odds[1]+newstamp(odds[1])+player.inven.substr(slotitem[0]+10);
					}else{
						player.inven=player.inven.substr(0,slotitem[0])+"Za00000000"+player.inven.substr(slotitem[0]+10);
						print+="pop=Burnt!\n";
					}
					inv();
					print+="dinv=1\n";
				}
			},
			eat:function(){
				var food,
				slotitem=form.j.split("-");
				if(slotitem[0]<NumInven&&slotitem[1].length===2){
					if(player.inven.substr(slotitem[0]*10,2)===slotitem[1]){
						if(food={
							Fa:[4,"Za"],
							Fb:[4,"Fa"],
							Fc:[4,"Fb"],
							Fd:[4,"Fc"],
							Ja:[1,"Za"],
							Jd:[4,"Za"],
							Je:[8,"Za"]
						}[slotitem[1]]){
							slotitem[0]*=10;
							player.inven=player.inven.substr(0,slotitem[0])+food[1]+("Za"===food[1]?"00000000":player.inven.substr(slotitem[0]+2,8))+player.inven.substr(slotitem[0]+10);
							inv();
							player.h=Math.max(player.h+food[0],99);
							print+="h="+player.h+"\ndinv=1\n";
						}else print+="pop=Not Editable!\n";
					}else print+="pop=No Food!\n";
				}
			},
			plant:function(){
				if(player.inven.indexOf("Ei")<0)return print+="pop=Need Water!\n";
				var tileset,plant,
				slotitem=form.j.split("-");
				if(slotitem[0]<NumInven&&slotitem[1].length===2&&player.inven.substr(slotitem[0]*=10,2)===slotitem[1]){
					tileset=loadmap(player.tmap),
					g=tileset.substr(player.tz*2,1);
					if(g==="F"||g==="G"){
						if(plant={
							Fa:["Ia",60,"Za"],
							Fb:["Ia",60,"Fa"],
							Fc:["Ia",60,"Fd"],
							Fd:["Ia",60,"Fc"]
						}[slotitem[1]]){
							savedynamic(player.tmap,plant[0],percent0_x(8,plant[1]+cstamp),player.tz);
							player.inven=player.inven.substr(0,slotitem[0])+plant[2]+("Za"===plant[2]?"00000000":player.inven.substr(slotitem[0]+2,8))+player.inven.substr(slotitem[0]+10);
							player.inven.replace(/Ei/,"Bd");
							inv();
							print+="pop=Planted\n";
						}
					}else print+="pop=Not Here\n";
				}
			},
			match:function(){
				print+="pop=light match\n";
				var slotitem=form.j.split("-");
				if(slotitem[0]<NumInven&&slotitem[1].length===2&&player.inven.substr(slotitem[0]*=10,2)===slotitem[1]){
					if(slotitem[1]==="Dj")player.inven=player.inven.substr(0,slotitem[0])+"Za00000000"+player.inven.substr(slotitem[0]+10);
					else if(slotitem[1]==="Dk")player.inven=player.inven.substr(0,slotitem[0])+"Dj"+player.inven.substr(slotitem[0]+2);
					else if(slotitem[1]==="Dl")player.inven=player.inven.substr(0,slotitem[0])+"Dk"+player.inven.substr(slotitem[0]+2);
					else return;
					inv();
					print+="dinv=1\n";
					savedynamic(player.tmap,"Zj",percent0_x(8,cstamp+60),player.tz);
				}
			},
			wear:function(){
				if(form.j.length!==2)return;
				var Wearing=player.object.substr(4),
				Class=form.j.substr(0,1).replace(/[^A-Z]/g,""),
				type=form.j.substr(1,1).replace(/[^0-9a-z]/g,"");
				if(player.inven.indexOf(Class+type)>=0){
					if(""!==type){
						if("LMS".indexOf(Class)>=0){
							Wearing.replace(/[LMS]./g,"");
							Wearing+=Class+type;
						}
					}
					if(player.object.length<4)player.object+=Math.random()<.5?"L":"R"; // in case still new
					player.object=player.object.substr(0,4)+Wearing;
					print+="dinv=1\n";
					token();
				}
				xf.refresh();
			},
			remove:function(){
				remove();
				print+="dinv=1\n";
				token();
				xf.refresh();
			},
			exam:function(){
				print+="pop=examine "+form.j+"\n";
				var slotitem=form.j.split("-"),
				invitem=player.inven.substr(slotitem[0]*10,2),
				invstamp=player.inven.substr(slotitem[0]*10+2,8);
				if(invitem===slotitem[1]){
					invstamp=parseInt("0x"+invstamp)-cstamp;
					print+="pop=^"+slotitem[1]+" expires in "+(invstamp>86400?Math.floor(invstamp/86400)+" days":invstamp>3600?Math.floor(invstamp/3600)+" hours":invstamp>60?Math.floor(invstamp/60)+" minutes":invstamp+" seconds")+"\n";
				}
			},
			get:function(){
				var filestamp=mapdynamic[player.tmap]&&mapdynamic[player.tmap][player.tz]&&mapdynamic[player.tmap][player.tz][form.j];
				if(filestamp){
					var f=player.inven.indexOf("Za");
					if(f>-1){
						if(form.j.substr(0,1)=="F"){
							// convert food timestamp from seconds to minutes
							filestamp=percent0_x(8,Math.min(parseInt("0x"+filestamp),60)*60+cstamp);
						}
						player.inven=player.inven.substr(0,f)+form.j+filestamp+player.inven.substr(f+10);
						inv();
						print+="dinv=1\n";
						mapdynamic[player.tmap][player.tz][form.j]=undefined;
						delete mapdynamic[player.tmap][player.tz][form.j];
					}else print+="pop=no space "+f+"\n";
				}else{ //just avoid glob for this db
					xf.static();
				}
			},
			drop:function(){
				var slotitem=form.j.split("-");
				slotitem[0]*=10;
				var invitem=player.inven.substr(slotitem[0],2),
				invstamp=player.inven.substr(slotitem[0]+2,8);
				if(invitem==slotitem[1]&&!(mapdynamic[player.tmap]&&mapdynamic[player.tmap][player.tz]&&mapdynamic[player.tmap][player.tz][invitem])){
					if(invitem.substr(0,1)=="F"){
						invstamp=Math.floor((parseInt("0x"+invstamp)-cstamp)/60);
						if(invstamp>60)invstamp=60;
						invstamp=percent0_x(8,cstamp+invstamp);
					}
					savedynamic(player.tmap,invitem,invstamp,player.tz);
					player.inven=player.inven.substr(0,slotitem[0])+"Za00000000"+player.inven.substr(slotitem[0]+10)
					inv();
					if(player.object.indexOf(invitem)>=0){
						form.j=invitem;
						remove();
					}
				}
				xf.refresh();
			},
			"static":function(){
				var f,
				s=loadstatics(player.tmap).split("*");
				for(var codetsz,i=0;i<s.length;i++){
					codetsz=s[i].split(" ");
					if(player.tz==codetsz[2]){
						if(codetsz[0].length==2){
							if(codetsz[0].substr(0,1)=="Z"){
								({ // static-
									Zf:function(){
										//sign
										print+="pop="+codetsz[3];
										for(var i=4;i<codetsz.length;i++)print+=" "+codetsz[i];
										print+="\n";
									},
									Zg:function(){
										//fishing dock
										if(form.k.substr(0,1).toUpperCase()+form.k.substr(1,2).toLowerCase()!=form.k)return print+="pop=Bad Bait!\n";
										var o={
											Ga:{odds:10,tool:"Bj",bait:0},
											Gd:{odds:10,tool:"Bj",bait:"GaGd",baitlossodds:10},
											Ge:{odds:10,tool:"Bk",bait:"GaGd",baitlossodds:10}
										}[codetsz[3]],
										k=player.inven.indexOf(form.k),
										f=player.inven.indexOf("Za");
										if(!o)return print+="pop=No Fish to catch!\n";
										if(f<0)return print+="pop=Full Inventory\n"; //could lose bait if inv is full and a fish is caught, by removing this line, but a warning is generally preferable
										if(player.inven.indexOf(o.tool)>=0){
											if(o.bait){
												if(k<0||bait.indexOf(form.k)<0)return print+="pop=Need Bait\n";
												if(Math.floor(Math.random()*100)<o.baitlossodds){
													player.inven=player.inven.substr(0,k)+"Za00000000"+player.inven.substr(k+10);
													inv();
													print+="pop=Lost Bait!\n";
												}
											}
											if(o.odds){
												//catch fish
												if(Math.floor(Math.random()*100)<o.odds){
													if(f<0){
														if(k<0)return print+="pop=Full Inventory\n";
														f=k;
														print+="pop=Lost Bait!\n";
													}
													player.inven=player.inven.substr(0,f)+codetsz[3]+newstamp(codetsz[3])+player.inven.substr(f+10);
													inv();
													print+="pop=You catch a Fish!\n";
												}else print+="pop=Nothing\n";
											}
										}else print+="pop=Need "+({Bj:"Net",Bk:"Pole"}[o.tool])+"\n";
									},
									Zh:function(){
										print+="pop=Enter City\n";
									},
									Zi:function(){
										var f=player.inven.indexOf("Cg")
										if(f>=0){
											player.inven=player.inven.substr(0,f)+"Zj"+percent0_x(8,cstamp+60)+player.inven.substr(f+10);
											inv();
											print+="dinv=1v\n";
										}
									},
									Zj:function(){
										print+="pop=Fire\n";
									}
								}[codetsz[0]]||nop)();
							}else{
								f=player.inven.indexOf("Za");
								estamp=percent0_x(8,cstamp+parseInt("0x"+codetsz[1]));
								player.inven=player.inven.substr(0,f)+codetsz[0]+estamp+player.inven.substr(f+10);
								inv();
								print+="dinv=1v\n";
							}
						}else{
							if(codetsz[0].substr(0,3)==="NPC"){
								//npc
							}else{
								({
									TPORT:function(){
										print+="pop=tport\n";
										var mapz;
										if(codetsz[3]&&(mapz=codetsz[3].split("-")).length>1){
											player.map=mapz[0];
											player.z=mapz[1];
											var ab=token(1);
											print+="t0="+loadmap(ab.a1+ab.b1)+"\nt1="+loadmap(ab.a1+ab.b2)+"\nt2="+loadmap(ab.a2+ab.b1)+"\nt3="+loadmap(ab.a2+ab.b2)+"\nRMap=1\n";
										}else if(player.name==codetsz[3]){
											if(player.tport1){
												print+="pop=linking this teleport to that teleport...\n";
												var dest=player.tport1.split("-");
												Cookie.set("st"+player.tmap,loadstatics(player.tmap)+"*TPORT 00000000 "+dest[1]+" "+player.tport1);
												print+="pop=linking that teleport to this teleport...\n";
												Cookie.set("st"+dest[0],loadstatics(dest[0])+"*TPORT 00000000 "+dest[1]+" "+player.map+"-"+player.z);
												player.tport1=false;
												delete player.tport1;
												print+="pop=teleport completed.\n";
											}else{
												player.tport1=player.map+"-"+player.z;
												print+="pop=add another teleport for destination\n";
											}
										}else{
											print+="pop=player name does not matches\n";
										}
									},
									WELL:function(){
										var t=player.inven.indexOf("Bd");
										if(t>-1){
											player.inven=player.inven.substr(0,t)+"Ei"+player.inven.substr(t+2);
											inv();
											print+="dinv=1v\n";
										}
									},
									FOUNTAIN:function(){
										var t=player.inven.indexOf("Bd");
										if(t>-1){
											player.inven=player.inven.substr(0,t)+"Ei"+player.inven.substr(t+2);
											inv();
											print+="dinv=1v\n";
										}
									},
									FARMHOUSE:function(){
										var slot=player.inven.indexOf("Za")
										if(player.inven.match(/F[abcd]/)&&slot>-1){
											player.inven=player.inven.substr(0,slot)+"Fd"+percent0_x(8,cstamp+3600)+player.inven.substr(slot+10);
											inv();
											print+="dinv=1v\n";
										}
									},
									CLOTHES:function(){}//static-clothes.pl basically unimplemented
								}[codetsz[0]]||function(){
									print+="pop=invalid static object\n";
									})();
							}
						}
					}
				}
				xf.refresh();
			},
			"delete":function(){
				if(player.inven.indexOf("Zd")<0)return print+="pop=Need Sysop Key\n";//perl checked for Zc
				print+="pop=delete\n";
				var s=loadstatics(player.tmap).split("*");
				for(var codetsz,i=0;i<s.length;i++){
					codetsz=s[i].split(" ");
					if(player.tz==codetsz[2]){
						//removed form.j check, so deletes all items on that location
						s[i]="";
						print+="pop="+codetsz[0]+" deleted\n";
					}
				}
				Cookie.set("st"+player.tmap,s.join("*").replace(/^\*+/,"").replace(/\*+$/,"").replace(/\*\*+/g,"*"));
			},
			add:function(){
				if(player.inven.indexOf("Zd")<0)return print+="pop=Need Sysop Key\n";
				var jdata=form.j.split("-"),
				estamp="00000000";
				if(jdata[0].length===2){
					if(jdata[0].substr(0,1)!="Z"){
						estamp=percent0_x(8,jdata[1]);
						jdata[1]=player.name;
					}else{
						if(jdata[0]==="Zf")jdata[1]=form.j.substr(2).replace(/-/g," ");
					}
				}else{
					if(form.j.substr(0,3)==="NPC"){
						//npc
					}else{
						if(jdata[0]){
							//building
						}
					}
				}
				if(jdata[0]){
					var s=loadstatics(player.tmap).split("*");
					for(var codetsz,i=0;i<s.length;i++){
						codetsz=s[i].split(" ");
						if(player.tz==codetsz[2]){
							s[i]="";
							print+="pop="+codetsz[0]+" deleted\n";
							jdata[0]="";
						}
					}
					if(jdata[0]){
						s[s.length]=jdata[1];
					}
					Cookie.set("st"+player.tmap,s.join("*").replace(/^\*+/,"").replace(/\*+$/,"").replace(/\*\*+/g,"*"));
				}
				xf.refresh();
			},
			inventory:function(){
				if(player.inven.indexOf("Zd")<0)return print+="pop=Need Sysop Key\n";
				var f,
				j=form.j.split("-");
				if(j[0].match(/^[A-Z][0-9a-z]$/)){
					f=player.inven.indexOf("Za");
					j=[f/10,j[0],j[1]];
				}else f=j[0]*10;
				print+="pop=/newitem "+j[0]+" "+j[1]+" "+j[2]+"\n";
				if(player.inven.substr(f,2)=='Za'){
					if(j[1].match(/^[A-Z][0-9a-z]$/)){
						player.inven=player.inven.substr(0,f)+j[1]+percent0_x(8,+cstamp+j[2])+player.inven.substr(f+10);
						inv();
						print+="dinv=1\n";
					}else print+="pop=mismatch\n";
				}else print+="pop=no space "+f+"\n";
			},
			chat:function(){
				if(form.q)print+="chat="+player.name+": "+form.q.replace(/([`\0-\x1f]|\s+$)/g,"").replace(/</g,"&lt;").replace(/>/g,"&gt;")+"<BR>Note: There is no multiplayer or multiserver support for this version.\n";
			},
			share:function(){
				//displays Cookie stuff
				var X="",Y="",x,y,m,t;
				print+="pop=Maps:";
				for(x=0;x<X.length;x++)for(y=0;y<Y.length;y++){
					m=X.substr(x,1)+Y.substr(y,1);
					if(t=Cookie.get("map"+m))print+="<BR>map"+m+': "'+t+'"';
					if(t=Cookie.get("st"+m))print+="<BR>st"+m+': "'+t+'"';
				}
				print+="<BR>Those are the maps you have edited for sharing.\n";
			},
			debug:function(){
				if(player.inven.indexOf("Zd")<0)return print+="pop=Need Sysop Key\n";
				var i;
				//displays player, item, and token info
				print+="pop=Debug: temporary info dump:";
				for(i in player)print+="<BR>player."+i+"="+player[i];
				print+="\n";
			},
			key:function(){
				var slot=player.inven.indexOf("Za");
				if(slot>=0){
					player.inven=player.inven.substr(0,slot)+"Zd00015180"+player.inven.substr(slot+10);
					inv();
					print+="dinv=1\n";
				}else print+="pop=no space for key\n";
			},
			tile:function(){
				if(player.inven.indexOf("Zd")<0)return print+="pop=Need Sysop Key\n";
				if(!form.j.match(/^[A-Z][a-z]$/))return print+="pop="+form.j+" is not a recognized tile\n";
				var t=loadmap(player.tmap);
				if(player.tmap.substr(1,1)>='a'){//city
					t=t.split("*");
					var z=zconv(player.z);
					z[0]--;
					while(t[z[0]].length<MapSizeX1*MapSizeY1*2)t[z[0]]+="Ua";
					t[z[0]]=t[z[0]].substr(0,z[1]*2)+form.j+t[z[0]].substr(z[1]*2+2);
					t=t.join("*");
				}else t=t.substr(0,player.tz*2)+form.j+t.substr(player.tz*2+2);
				Cookie.set("map"+player.tmap,t);
				if(tilestamp(player.tmap)==cstamp)player.ts=-1;//speed up for 1player
				else mapts[player.tmap]=cstamp;
				refresh();
			},
			grass:function(){
				if(player.inven.indexOf("Zd")<0)return print+="pop=Need Sysop Key\n";
				if("yes"!=form.j)return print+="pop=Confirm (/grass command requires a yes parameter to replace the map with random grass)\n";
				print+="pop=Terraformed\n";
				cookie.set("map"+player.tmap,randmap());
				if(tilestamp(player.tmap)==cstamp)player.ts=-1;//speed up for 1player
				else mapts[player.tmap]=cstamp;
				refresh();
			},
			refresh:function(){
				if(cstamp>player.one){
					//one.pl
					var i,inv='',estamp,invitem;
					for (i=0;i<NumInven;i++){
						estamp=parseInt("0x"+player.inven.substr(i*10+2,8));
						invitem=player.inven.substr(i*10,2);
						if(estamp&&cstamp>estamp){
							print+="pop=^"+invitem+" expired\n";
							player.inven=player.inven.substring(0,i*10)+"Za00000000"+player.inven.substr(i*10+10);
							if(player.inven.indexOf()<0){
								form.j=invitem;
								remove();
							}
						}else inv+=invitem;
					}
					player.h--;
					print+="inv="+inv+"\nh="+player.h+"\n";
					if(player.h<1){
						print+="pop=You have died\n";
						player.h=60;//probably for debugging
					}
					player.one=cstamp+60;
				}
				refresh();
			}
		};
		function tileleft(){
			var map=player.map,
			a1,b1=map.substr(1,1),a2,b2,
			y=Math.floor(player.z/MapWide),
			x=player.z-y*MapWide;
			if(b1>MapEdgeY){
				if(x)x--;
				else x=-1;
			}else{
				if(x>scrolldist)x--;
				//scroll within 2 spaces of edge
				else{
					a1=player.map.substr(0,1);
					b1=String.fromCharCode(b1.charCodeAt(0)-1);
					if(b1<'0')b1=MapEdgeX;
					a2=String.fromCharCode(a1.charCodeAt(0)+1);
					if(a2>MapEdgeY)a2="A";
					b2=b1;
					x+=MapSizeX;
					map=a1+b2;
				}
			}
			return{map:map,x:x,y:y,z:x<0?player.z:y*MapWide+x,a1:a1,b1:b1,a2:a2,b2:b2};
		}
		function tileright(){
			var map=player.map,
			a1,b1=map.substr(1,1),a2,b2,
			y=Math.floor(player.z/MapWide),
			x=player.z-y*MapWide;
			if(b1>MapEdgeY){
				if(x<MapWide-1)x++;
				else x=-1;
			}else{
				if(x<MapWide-scrolldist-1)x++;
				else{ //scroll
					a1=player.map.substr(0,1);
					b1=String.fromCharCode(b1.charCodeAt(0)+1)
					if(b1>MapEdgeX)b1="0";
					a2=String.fromCharCode(a1.charCodeAt(0)+1);
					b2=String.fromCharCode(b1.charCodeAt(0)+1);
					if(b2>MapEdgeX)b2="0";
					b1=b2;
					if(a2>MapEdgeY)a2="A";
					x-=MapSizeX;
					map=a1+b1;
				}
			}
			return{map:map,x:x,y:y,z:y*MapWide+x,a1:a1,b1:b1,a2:a2,b2:b2};
		}
		function tileup(){
			var map=player.map,
			a1,b1=map.substr(1,1),a2,b2,
			y=Math.floor(player.z/MapWide),
			x=player.z-y*MapWide;
			if(b1>MapEdgeY){
				if(y)y--;
				else x=-1;
			}else{
				if(y>scrolldist)y--;
				else{
					a1=String.fromCharCode(player.map.charCodeAt(0)-1);
					if(a1<'A')a1=MapEdgeY;
					a2=a1;
					b2=String.fromCharCode(b1.charCodeAt(0)+1);
					if(b2>MapEdgeX)b2='0';
					y+=MapSizeY;
					map=a1+b1;
				}
			}
			return{map:map,x:x,y:y,z:y*MapWide+x,a1:a1,b1:b1,a2:a2,b2:b2};
		}
		function tiledown(){
			var map=player.map,
			a1,b1=map.substr(1,1),a2,b2,
			y=Math.floor(player.z/MapWide),
			x=player.z-y*MapWide;
			if(b1>MapEdgeY){
				if(y<MapHigh-1)y++;
				else x=-1;
			}else{
				if(y<MapHigh-scrolldist-1)y++;
				else{
					a1=String.fromCharCode(player.map.charCodeAt(0)+1);
					if(a1>MapEdgeY)a1="A";
					a2=String.fromCharCode(a1.charCodeAt(0)+1);
					b2=String.fromCharCode(b1.charCodeAt(0)+1);
					if(a2>MapEdgeY)a2="A";
					if(b2>MapEdgeX)b2="0";
					y-=MapSizeY;
					map=a1+b1;
				}
			}
			return{map:map,x:x,y:y,z:y*MapWide+x,a1:a1,b1:b1,a2:a2,b2:b2};
		}
		if(form.m){
			var steps=Math.min(5,form.m.length),
			stepfs={
				l:xf.left,
				r:xf.right,
				u:xf.up,
				d:xf.down,
				".":function(){
					TickObj+=".";
					token();
					return true;
				}
			};
			while(steps>0){
				var s=form.m.substr(0,1);
				if(!stepfs[s]||stepfs[s]()||scrollpause<0){
					form.m=form.m.substr(1);
					steps--;
					if(!form.m)steps=0;
				}else{//pause for scroll
					steps=0;
					form.m=(scrollpause?'.':'')+form.m.substr(1);
				}
			}
			print+="moves="+form.m+"\n";
		}
		if(xf[form.c])xf[form.c]();
		saveplayer();
if(window.console)console.log(cstamp,print);
		q.success(print);
		function refresh(){//refresh.pl, $loadmap unneeded, as functions already loaded
			var a1=player.map.substr(0,1),
			b1=player.map.substr(1,1),
			map=a1+b1,
			i,s,t,z;
			if(a1<'A'||a1>MapEdgeY||b1<'0'||(b1>MapEdgeX&&b1<'a'))print+="pop=Invalid map "+map+"\n";
			else if(b1>MapEdgeX){//city has 4 maps in one
				players(map);
				statics(map);
				items(map);
				if(player.ts!=tilestamp(player.tmap)){
					token();
					t=loadmap(player.tmap).split("*");
					while(t.length<4)t[t.length]=randmap();
					print+="t0="+t[0]+"\nt1="+t[1]+"\nt2="+t[2]+"\nt3="+t[3]+"\nRMap=1\n";
					player.ts=tilestamp(player.tmap);
				}
			}else{
				var
				a2=String.fromCharCode(a1.charCodeAt(0)+1),
				b2=String.fromCharCode(b1.charCodeAt(0)+1);
				if(a2>MapEdgeY)a2="A";
				if(b2>MapEdgeX)b2="0";
				map=[a1+b1,a1+b2,a2+b1,a2+b2];
				for(i=0;i<4;i=s){
					s=i+1;
					players(map[i],s);
					items(map[i],s);
					statics(map[i],s);
				}
				if(player.ts!=tilestamp(player.tmap)){
					token();
					for(i=0;i<4;i++)print+="t"+i+"="+loadmap(map[i])+"\n";
					print+="RMap=1\n";
					player.ts=tilestamp(player.tmap);
				}
			}
			print+="RStatic=1\n";
			function players(map,q){
				var i,t;
				if("object"===typeof maptoken[map])for(i in maptoken[map])if(!maptoken[map].hasOwnProperty||maptoken[map].hasOwnProperty(i)){
					t=i.split(" ");
					if(cstamp>t[4]){
						//expired token
						maptoken[map][i]=undefined;
						delete maptoken[map][i];
					}else print+="p="+t[0]+" "+t[1]+" "+t[2]+" "+(q?q+"-"+t[3]:zconv(t[3]).join("-"))+"\n";
if(window.console)console.log(cstamp,"players",map,q,t);
				}
			}
			function items(map,q){
				var i,t,z,
				j=q-1,
				//tileset=loadmap(map), //why?
				it=["","","",""];
if(window.console)console.log("items",map,q,mapdynamic)
				//tokens 0=t (tile) 1=mapdynamic[map][i][t] (expiration) 2=i (tz)
				if("object"===typeof mapdynamic[map])for(i in mapdynamic[map])if(!mapdynamic[map].hasOwnProperty||mapdynamic[map].hasOwnProperty(i))if("object"===typeof mapdynamic[map][i])for(t in mapdynamic[map][i])if(!mapdynamic[map][i].hasOwnProperty||mapdynamic[map][i].hasOwnProperty(t)){
if(window.console)console.log(cstamp,"item",mapdynamic[map][i][t],i,t);
					if(cstamp>mapdynamic[map][i][t]){
						mapdynamic[map][i][t]=undefined;
						delete mapdynamic[map][i][t];
						function xform(toitem,e,tileregex){
							if(tileregex&&!loadmap(map).substr(i*2,2).match(tileregex))return;
							mapdynamic[map][i][toitem]=cstamp+(e||60);
							if(q)it[j]+=toitem+percent0_x(2,i);
							else{
								z=zconv(i);
								it[z[0]]+=toitem+percent0_x(2,z[1]);
							}
						}
						({ //g-[A-Z][a-z].pl
							Dh:function(){
								if(Math.random()<.65)xform("Ia",60,/^[FG]/);
							},
							Ia:function(){
								var y=Math.floor(i/MapWide),
								x=i-y*MapWide,
								f,j,k,m=[];
								if(Math.random()<.25)m[m.length]=tileleft();
								if(Math.random()<.25)m[m.length]=tileright();
								if(Math.random()<.25)m[m.length]=tileup();
								if(Math.random()<.25)m[m.length]=tiledown();
								for(j=0;j<m.length;j++){
									f=1;
									for(k in mapdynamic[m[j].map][m[j].z]){f=0;break}
									if(f)savedynamic(m[j].map,"F"+String.fromCharCode(Math.floor(Math.random()*4)+97),60,m[j].z);
								}
								if(Math.random()<.5)xform("Ia",60);
								else if(Math.random()<.5)xform("F"+String.fromCharCode(Math.floor(Math.random()*4)+97),60);
							},
							Fa:function(){
								if(Math.random()<.45)xform("Ia",60,/^[FG]/);
							},
							Fb:function(){
								if(Math.random()<.5)xform("Ia",60,/^[FG]/);
							},
							Fc:function(){
								if(Math.random()<.55)xform("Ia",60,/^[FG]/);
							},
							Fd:function(){
								if(Math.random()<.6)xform("Ia",60,/^[FG]/);
							}
						}[t]||nop)();
					}else if(q)it[j]+=t+percent0_x(2,i);
					else{
						z=zconv(i);
						it[z[0]]+=t+percent0_x(2,z[1]);
					}
				}
				for(i=0;i<4;i++)if(it[i]||!q)print+="i"+i+"="+it[i]+"\n";
			}
			function statics(map,q){
				var s,i,t,z,
				j=q-1,
				st=["","","",""];
				//statics have default, but not generated
				if(s=loadstatics(map))for(s=s.split("*"),i=0;i<s.length;i++){
					t=s[i].split(" ");
					if(q)st[j]+=t[0]+"="+t[2];
					else{
						z=zconv(t[2]);
						st[z[0]]+=t[0]+"="+z[1]+" ";
					}
				}
				for(i=0;i<4;i++)if(st[i]||!q)print+="s"+i+"="+st[i]+"\n";
			}
		}
		function zconv(z){
			var q=1,y=Math.floor(z/MapWide),x=z-(y*MapWide);
			if(y>MapSizeY){q=3;y-=MapSizeY1}
			if(x>MapSizeX){q++;x-=MapSizeX1}
			return[q,y*MapSizeX1+x];
		}
		function token(r){
			var z,map,
				a1=player.map.substr(0,1),
				b1=player.map.substr(1,1);
			if(b1>MapEdgeX){//city
				map=a1+b1;
				//this checks y, no need to check x
				z=player.z<MapHigh*MapWide?player.z:MapHigh*MapWide;
			}else{
				var x,y,
				a2=String.fromCharCode(a1.charCodeAt(0)+1),
				b2=String.fromCharCode(b1.charCodeAt(0)+1);
				if(a2>MapEdgeY)a2="A";
				if(b2>MapEdgeX)b2="0";
				map="";
				y=Math.floor(player.z/MapWide);
				x=player.z-(y*MapWide);
				if(y>=MapSizeY1){
					y-=MapSizeY1;
					map+=a2;
				}else map+=a1;
				if(x>=MapSizeX1){
					x-=MapSizeX1;
					map+=b2;
				}else map+=b1;
				z=(y*MapSizeX1)+x;
if(window.console)console.log(cstamp,"token.noncity",map,x,y,z);
			}
			detoken();
			player.tmap=map;
			player.tz=z;
			if(!maptoken[player.tmap])maptoken[player.tmap]={};
			maptoken[player.tmap][player.token=player.name+" 3 "+player.object+"-"+TickObj+" "+z+" "+(cstamp+60)]=1;
if(window.console)console.log(cstamp,"token.out",player.token);
			if(r)return{a1:a1,b1:b1,a2:a2,b2:b2};
		}
		function detoken(){
			if(player.token&&maptoken[player.tmap]){
				maptoken[player.tmap][player.token]=undefined;
				delete maptoken[player.tmap][player.token];
			}
		}
		function inv(){
			var i,v="";
			for(i=0;i<NumInven;i++)v+=player.inven.substr(i*10,2);
			print+="inv="+v+"\n";
		}
		function remove(){
			player.object=player.object.replace(form.j,'');
		}
		function newstamp(item){
			return percent0_x(8,cstamp+(newstampo[item]||60));
		}
		function savedynamic(map,item,e,tz){
			if(!mapdynamic[map])mapdynamic[map]={};
			if(!mapdynamic[map][tz])mapdynamic[map][tz]={};
			mapdynamic[map][tz][item]=e;
		}
		function hasFire(){
			if(mapdynamic[player.tmap]&&mapdynamic[player.tmap][player.tz]&&mapdynamic[player.tmap][player.tz].Zj)return true;
			var p;
			if((p=player.inven.indexOf("Zj"))>=0){
				form.j=p/10+"-Zj"
				xf.drop();
				return true;
			}else if((p=player.inven.indexOf("Dj"))>=0){
				savedynamic(player.tmap,"Zj",newstamp("Zj"),player.tz);
				player.inven=player.inven.substr(0,p)+"Za00000000"+player.inven.substr(p+10);
				inv();
				return true;
			}else if((p=player.inven.indexOf("Dk"))>=0){
				savedynamic(player.tmap,"Zj",newstamp("Zj"),player.tz);
				player.inven=player.inven.substr(0,p)+"Dj"+player.inven.substr(p+2);
				inv();
				return true;
			}else if((p=player.inven.indexOf("Dl"))>=0){
				savedynamic(player.tmap,"Zj",newstamp("Zj"),player.tz);
				player.inven=player.inven.substr(0,p)+"Dk"+player.inven.substr(p+2);
				inv();
				return true;
			}
			return false;
		}
	};
	function percent0_x(c,n){
		return("00000000"+Number(n).toString(16)).substr(-c);
	}
})($);
