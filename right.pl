## external, moves player

$ScrollUp=2;
$ScrollDown=15;
$ScrollLeft=2; #5
$ScrollRight=20; #20

$map="";
$y=int($player{'z'}/$MapWide);
$x=$player{'z'}-($y*$MapWide);

  $b1=substr($player{'map'},1,1);
  if($b1 gt '9'){
    if($x<$MapWide){$x++;}else{$x=-1;}
  }else{
if ($x<$ScrollRight) {
  $x++;
} else {
    do "loadmap.pl";
    $a1=substr($player{'map'},0,1);
    $b1=chr(ord($b1)+1); if ($b1 gt $MapEdgeX) { $b1="0"; }
    $b2=chr(ord($b1)+1); if ($b2 gt $MapEdgeX) { $b2="0"; }
    $a2=chr(ord($a1)+1); if ($a2 gt $MapEdgeY) { $a2="A"; }
    $x=$x-$MapSizeX;
    $player{'map'}="$a1$b1";
    $map4="$a1$b2";
    $map5="$a2$b2";
    $tileset4=&loadmap($map4);
    $tileset5=&loadmap($map5);
    print "t4=$tileset4\n";
    print "t5=$tileset5\n";
    print "scroll=right\n";
    $steps=1;
    $form{'m'}=substr($form{'m'},0,1).".".substr($form{'m'},1);
} }
if($x>=0){
$player{'z'}=($y*$MapWide)+$x;
substr($player{'object'},3,1)="R";
$TickObj.="r";

do "token.pl";
}
1;
