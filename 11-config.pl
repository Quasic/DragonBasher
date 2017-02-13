
$adminkey="password"; # secure password for installing new servers

$datadir="/home/dragon/11-dragon";
$htmldir="/home/dragon/public_html";
$htmlurl=""; # http://dragonbasher.com
$gfxurl="$htmlurl/11-gfx";

##
## No more sysop editing required past this point
##

$NumInven=24;

$DirBuild=$gfxurl."/11-gfx/b";
$DirChar=$gfxurl."/11-gfx/c";
$DirItem=$gfxurl."/11-gfx/i";
$DirKeys=$gfxurl."/11-gfx/k";
$DirTile=$gfxurl."/11-gfx/t";

$MapSizeX=13;
$MapSizeY=7;
$MapEdgeX="9";
$MapEdgeY="J";
$MapHigh=20;
$MapWide=28;

$cstamp=time();
$estamp=$cstamp+60;

1;
