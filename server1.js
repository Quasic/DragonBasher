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
	function remove(){
		player.object=player.object.replace(form.j,'');
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
console.log(cstamp,form);
		//if((form.s+form.c).match(/[^A-Za-z0-9\-]/)||(form.j+form.k).match(/[^A-Za-z0-9 -]/)||form.d.match(/[^A-Za-z0-9]/)||form.m.match(/[^A-Za-z0-9\.]/)){error+="Malformed query (someone left clever debug code in?)\n")}
		if(form.n.match(/[^A-Za-z0-9]/))error+="Invalid Character In Name\n";
		if(form.n.length<3)error+="Name must be at least 3 characters\n";
		if(form.n.length>16)error+="Name cannot be more than 16 characters\n";
		form.n=form.n.toLowerCase();
		if(form.n.match(/^[^a-z]/))error+="Name must start with a letter\n";
		if(form.n.match(/^npc/))error+="Restricted player name (npc)\n";
		form.p="********";//ignore form.p for now
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
				print+="login="+player.name+"\npop=Note: This is a single-server single-player demo version.<BR>Browser storage is used to hold map edits and player data, which may be cleared automatically.<BR>You may use the hidden commands:<BR>/key to become a sysop.<BR>/debug to show secret info about your character and items in the Notices tab<BR>/share to show map changes for sharing or saving outside of browser storage in the Notices tab\n";
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
console.log(cstamp,"tele",mapz);
					token();
					player.ts=-1;
					refresh();
				}else print+="pop=bad map code:"+mapz[0]+"\n";
			},
			left:function(){
				var a1,
				b1=player.map.substr(1,1),
				y=Math.floor(player.z/MapWide),
				x=player.z-y*MapWide;
				if(b1>='a'){
					if(x)x--;
					else x=-1;
				}else{
					if(x>scrolldist)x--;
					//scroll within 2 spaces of edge
					else{
						a1=player.map.substr(0,1);
						b1=String.fromCharCode(b1.charCodeAt(0)-1);
						if(b1<'0')b1=MapEdgeX;
						var a2=String.fromCharCode(a1.charCodeAt(0)+1);
						if(a2>MapEdgeY)a2="A";
						b2=b1;
						x+=MapSizeX;
						player.map=a1+b2;
						print+="t4="+loadmap(a1+b1)+"\nt5="+loadmap(a2+b2)+"\nscroll=left\n";
					}
				}
				if(x>=0){
					player.z=y*MapWide+x;
					player.object=player.object.substr(0,3)+"L";
					TickObj+="l";
					token();
				}
				return !a1;
			},
			right:function(){
				var a1,
				b1=player.map.substr(1,1),
				y=Math.floor(player.z/MapWide),
				x=player.z-y*MapWide;
				if(b1>='a'){
					if(x<MapWide-1)x++;
					else x=-1;
				}else{
					if(x<MapWide-scrolldist-1)x++;
					else{ //scroll
						a1=player.map.substr(0,1);
						b1=String.fromCharCode(b1.charCodeAt(0)+1)
						if(b1>MapEdgeX)b1="0";
						var a2=String.fromCharCode(a1.charCodeAt(0)+1),
						b2=String.fromCharCode(b1.charCodeAt(0)+1);
						if(b2>MapEdgeX)b2="0";
						b1=b2;
						if(a2>MapEdgeY)a2="A";
						x-=MapSizeX;
						player.map=a1+b1;
						print+="t4="+loadmap(a1+b2)+"\nt5="+loadmap(a2+b2)+"\nscroll=right\n";
					}
				}
				if(x>=0){
					player.z=y*MapWide+x;
					player.object=player.object.substr(0,3)+"R";
					TickObj+="r";
					token();
				}
				return !a1;
			},
			up:function(){
				var a1,
				b1=player.map.substr(1,1),
				y=Math.floor(player.z/MapWide),
				x=player.z-y*MapWide;
				if(b1>='a'){
					if(y)y--;
					else x=-1;
				}else{
					if(y>scrolldist)y--;
					else{
						a1=String.fromCharCode(player.map.charCodeAt(0)-1);
						if(a1<'A')a1=MapEdgeY;
						var a2=a1,
						b2=String.fromCharCode(b1.charCodeAt(0)+1);
						if(b2>MapEdgeX)b2='0';
						y+=MapSizeY;
						print+="t4="+loadmap(player.map=a1+b1)+"\nt5="+loadmap(a2+b2)+"\nscroll=up\n";
					}
				}
				if(x>=0){
					player.z=y*MapWide+x;
					TickObj+="u";
					token();
				}
				return !a1;
			},
			down:function(){
				var a1,
				b1=player.map.substr(1,1),
				y=Math.floor(player.z/MapWide),
				x=player.z-y*MapWide;
				if(b1>='a'){
					if(y<MapHigh-1)y++;
					else x=-1;
				}else{
					if(y<MapHigh-scrolldist-1)y++;
					else{
						a1=String.fromCharCode(player.map.charCodeAt(0)+1);
						if(a1>MapEdgeY)a1="A";
						var a2=String.fromCharCode(a1.charCodeAt(0)+1),
						b2=String.fromCharCode(b1.charCodeAt(0)+1);
						if(a2>MapEdgeY)a2="A";
						if(b2>MapEdgeX)b2="0";
						y-=MapSizeY;
						player.map=a1+b1;
						print+="t4="+loadmap(a2+b1)+"\nt5="+loadmap(a2+b2)+"\nscroll=down\n";
					}
				}
				if(x>=0){
					player.z=y*MapWide+x;
					TickObj+="d";
					token();
				}
				return !a1;
			},
			cook:function(){},
			eat:function(){},
			plant:function(){},
			match:function(){},
			wear:function(){},
			remove:function(){
				remove();
				print+="dinv=1\n";
				token();
				xf.refresh();
			},
			exam:function(){},
			get:function(){},
			drop:function(){},
			"static":function(){
				var f,
				s=loadstatics(player.tmap).split("*");
				for(var codetsz,i=0;i<s.length;i++){
					codetsz=s[i].split(" ");
					if(player.tz==codetsz[2]){
						if(codetsz[0].length==2){
							if(codetsz[0].substr(0,1)=="Z"){
								({
									Zf:function(){},//TODO static-Zf.pl
									Zg:function(){},//...
									Zh:function(){},//...
									Zi:function(){},//...
									Zj:function(){}//TODO static-Zj.pl
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
									TPORT:function(){},//TODO: static-tport.pl
									WELL:function(){},//TODO: static-well.pl
									FOUNTAIN:function(){},//TODO: static-fountain.pl
									FARMHOUSE:function(){},//TODO: static-farmhouse.pl
									CLOTHES:function(){}//TODO: static-clothes.pl
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
console.log(cstamp,print);
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
console.log(cstamp,"players",map,q,t);
				}
			}
			function items(map,q){
				var i,t,z,
				j=q-1,
				//tileset=loadmap(map), //why?
				it=[];
				if("object"===typeof mapdynamic[map])for(i in mapdynamic[map])if(!mapdynamic[map].hasOwnProperty||mapdynamic[map].hasOwnProperty(i)){
					t=i.split(" ");
					t[1]=parseInt("0x"+t[1]);
					if(cstamp>t[1]){
						({
							Ia:function(){},//TODO: g-Ia.pl
							Fa:function(){},//TODO: g-Fa.pl
							Fb:function(){},//TODO: g-Fb.pl
							Fc:function(){},//TODO: g-Fc.pl
							Fd:function(){}//TODO: g-Fd.pl
						}[t[0]]||nop)();
						mapdynamic[map][i]=undefined;
						delete mapdynamic[map][i];
					}else if(q)it[j]+=t[0]+percent0_x(2,t[2]);
					else{
						z=zconv(t[2]);
						it[z[0]]+=t[0]+percent0_x(2,t[2]);
					}
				}
				for(i=0;i<4;i++)if(it[i]||!q)print+="i"+i+"="+st[i]+"\n";
			}
			function statics(map,q){
				var s,i,t,z,
				j=q-1,
				st=[];
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
		function token(){
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
console.log(cstamp,"token.noncity",map,x,y,z);
			}
			detoken();
			player.tmap=map;
			player.tz=z;
			if(!maptoken[player.tmap])maptoken[player.tmap]={};
			maptoken[player.tmap][player.token=player.name+" 3 "+player.object+"-"+TickObj+" "+z+" "+(cstamp+60)]=1;
console.log(cstamp,"token.out",player.token);
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
	};
	function percent0_x(c,n){
		return("00000000"+Number(n).toString(16)).substr(-c);
	}
})($);
