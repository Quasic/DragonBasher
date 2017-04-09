## internal, puts player's token in maps directory

##
## $token="[name] [level] [object]-[tick obj] [z] [expires]";
##

$a1=substr($player{'map'},0,1); $a2=$a1; $a2++; if ($a2>$MapEdgeY) { $a2="A"; } 
$b1=substr($player{'map'},1,1); $b2=$b1; $b2++; if ($b2>$MapEdgeX) { $b2="0"; }

#print "pop=$player{'map'} - $a1.$b1 - $a2.$b2\n";

$map="";

$y=int($player{'z'}/$MapWide);
$x=$player{'z'}-($y*$MapWide);
if($b1 gt '9'){#city
  $map="$a1$b1";
  #no need to check $x
  if($y>$MapHigh){$y=$MapHigh;}
}else{
if ($y>$MapSizeY) {
  #print "pop=y > MapSizeY\n";
  $y=$y-($MapSizeY+1);
  $map.="$a2";
} else {
  #print "pop=$y y > $MapSizeY MapSizeY else \n";
  $map.="$a1";
}
if ($x>=$MapSizeX+1) {
  #print "pop=x > MapSizeX\n";
  $x=$x-($MapSizeX+1);
  $map.="$b2";
} else {
  #print "pop=x > MapSizeX else \n";
  $map.="$b1";
}
}
$z=($y*($MapSizeX+1))+$x;

#print "pop=tmap.$map tz.$z\n";

$player{'tmap'}=$map;
$player{'tz'}=$z;

#print "pop=$player{'map'} - $a1.$b1 - $a2.$b2\n";

if (!-d "$datadir/tokens/$map/") { mkdir "$datadir/tokens/$map"; }
if (!-w "$datadir/tokens/$map/") { chmod 0766, "$datadir/tokens/$map"; }

if ($player{'token'}) { unlink "$datadir/tokens/$player{'token'}.txt"; }
$player{'token'}="$map/$player{'name'} $player{'level'} $player{'object'}-$TickObj $z $estamp ";

open (FILE, ">$datadir/tokens/$player{'token'}.txt"); print FILE "player"; close FILE;

1;
