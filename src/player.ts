import Cookies from 'js-cookie'

export function saveplayer(player){
  Cookies.set("plyr"+player.name, player.one+player.object+(player.h>99?"99":(player.h<10?"0":"")+player.h)+player.z+player.map+player.tmap+player.inven);//._-*
}
