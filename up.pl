## external, moves player

$ScrollUp=2;
$ScrollDown=15;
$ScrollLeft=2; #5
$ScrollRight=20; #20

$map="";
$y=int($player{'z'}/$MapWide);
$x=$player{'z'}-($y*$MapWide);

if ($y>$ScrollUp) {
  $y--; $player{'z'}=($y*$MapWide)+$x;
} else {
  $b1=substr($player{'map'},1,1);
  if($b1 gt '9'){
    $x=-1;
  }else{
  ## scroll up
  do "loadmap.pl";
  $a1=substr($player{'map'},0,1); $a1=chr(ord($a1)-1); if ($a1 lt 'A') { $a1=$MapEdgeY; }
  $b2=chr(ord($b1)+1); if ($b2 gt $MapEdgeX) { $b2='0'; }
  $a2=$a1;
  $map4="$a1$b1";
  $map5="$a2$b2";
  $tileset4=&loadmap($map4);
  $tileset5=&loadmap($map5);
  $y=$y+$MapSizeY;
  $player{'z'}=($y*$MapWide)+$x;
  $player{'map'}="$a1$b1";
  print "t4=$tileset4\n";
  print "t5=$tileset5\n";
  print "scroll=up\n";
}}
if($x>=0){
$TickObj.="u";

do "token.pl";
}
1;
