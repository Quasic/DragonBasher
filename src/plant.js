export function plant(){
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
}
