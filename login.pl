## external, login routine
$version="1.0";

do "loadmap.pl"; do "token.pl";
$map0="$a1$b1"; $map1="$a1$b2"; $map2="$a2$b1"; $map3="$a2$b2";
$tileset0=&loadmap($map0); $tileset1=&loadmap($map1); $tileset2=&loadmap($map2); $tileset3=&loadmap($map3);
print "t0=$tileset0\n"; print "t1=$tileset1\n"; print "t2=$tileset2\n"; print "t3=$tileset3\n"; print "RMap=1\n";
##
## send buildings      print "b=$tokens[0] $tokens[1] $tokens[3] $tokens[4]\n";
## send characters    print "c=$tokens[0] $tokens[1] $tokens[3] $tokens[4]\n";
## 
do 'inv.pl';#print "inv=$player{'inven'}\n";
if (substr($player{'object'},0,3) eq "new") { print "RChar=$player{'object'}\n"; }
print "login=$player{'name'}\n";
print "h=$player{'h'}\n";
#print "p=$player{'name'} $player{'level'} $player{'object'} "&($player{'tmap'}eq$map3?3:$player{'tmap'}eq$map2?2:$player{'tmap'}eq$map1?1:0)&"-$player{'tz'}\n";
1;
