# external, telerpots player
$version="1.0";

print "pop=tele\n";
($map,$z)=split(/-/, $form{'j'});
#if (-e "$datadir/maps/$map") {
if($map=~/^[A-Z][0-9a-z]$/){
  if ($z<1) { $z=$player{'tz'}; }
  $player{'map'}=$map; $player{'z'}=$z;
  do 'refresh.pl';
  #do "loadmap.pl"; do "token.pl";
  #$map0="$a1$b1"; $map1="$a1$b2"; $map2="$a2$b1"; $map3="$a2$b2";
  #$tileset0=&loadmap($map0); $tileset1=&loadmap($map1); $tileset2=&loadmap($map2); $tileset3=&loadmap($map3);
  #print "t0=$tileset0\n"; print "t1=$tileset1\n"; print "t2=$tileset2\n"; print "t3=$tileset3\n"; print "RMap=1\n";
} else {
  print "pop=bad map code\n";
}

1;
