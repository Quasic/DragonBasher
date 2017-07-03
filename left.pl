## external, moves player
$ScrollUp=2;
$ScrollDown=15;
$ScrollLeft=2; #5
$ScrollRight=20; #20
$map="";
$y=int($player{'z'}/$MapWide);
$x=$player{'z'}-($y*$MapWide);
  $b1=substr($player{'map'},1,1);
  if($b1 ge 'a'){
    if($x){$x--}else{$x=-1;}
  }else{
if ($x>$ScrollLeft) {
  $x--;
} else {
    ## scroll left
    do "loadmap.pl";
    $a1=substr($player{'map'},0,1);
    $b1=chr(ord($b1)-1); if ($b1 lt '0') { $b1=$MapEdgeX; }
    $a2=chr(ord($a1)+1); if ($a2 gt $MapEdgeY) { $a2="A"; }
    $b2=$b1;
    $map4="$a1$b1";
    $map5="$a2$b2";
    $tileset4=&loadmap($map4);
    $tileset5=&loadmap($map5);
    $x=$x+$MapSizeX;
    $player{'map'}="$a1$b2";
    print "t4=$tileset4\n";
    print "t5=$tileset5\n";
    print "scroll=left\n";
  }
}
if($x>=0){
  $player{'z'}=($y*$MapWide)+$x;
  substr($player{'object'},3,1)="L";
  $TickObj.="l";
  do "token.pl";
}
1;
