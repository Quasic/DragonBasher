
$adminkey="password"; # secure password for installing new servers

$datadir="/home/dragon/11-dragon";
$htmldir="/home/dragon/public_html";
$htmlurl=""; # http://dragonbasher.com
$gfxurl="$htmlurl/11-gfx";

##
## No more sysop editing required past this point
##

$NumInven=24;

$DirBuild="$gfxurl/b";
$DirChar="$gfxurl/c";
$DirItem="$gfxurl/i";
$DirKeys="$gfxurl/k";
$DirTile="$gfxurl/t";

$MapSizeX=13;
$MapSizeY=7;
$MapEdgeX="9";
$MapEdgeY="J";
$MapHigh=($MapSizeY+1)*2;#20
$MapWide=($MapSizeX+1)*2;#28

$cstamp=time();
$estamp=$cstamp+60;

1;
