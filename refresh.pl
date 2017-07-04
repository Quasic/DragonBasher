## external, refresh all data (main loop)
$version="1.0";

## if called with $player{'ts'}<0 will bypass the cache, used by login.pl

do "loadmap.pl";

## get maps player is on
$a1=substr($player{'map'},0,1); $b1=substr($player{'map'},1,1);
if($a1 lt 'A'||$a1 gt $MapEdgeY||$b1 lt '0'||($b1 gt $MapEdgeX&&$b1 lt 'a')){
  print "pop=Invalid map $a1$b1";
}elsif($b1 gt $MapEdgeX){#city
  $map="$a1$b1";
  $x1=$MapSizeX+1;
  $y1=$MapSizeY+1;
  opendir(DIR,"$datadir/tokens/$map/"); @data=readdir(DIR); closedir(DIR);
  foreach $line (@data) {
    chomp($line);
    if (length($line)<3) { next; }
    @tokens = split(/ /, $line);  
    if ($cstamp>$tokens[4]) {
      #expired token
      unlink "$datadir/tokens/$map/$line";
    } else {
	  $q=1;
	  $z=$tokens[3];
      $y=int($z/$MapWide);
      $x=$z-($y*$MapWide);
	  if($y>$MapSizeY){$q=3;$y-=$y1;}
	  if($x>$MapSizeX){$q++;$x-=$x1;}
	  $z=$y*$x1+$x;
#      ($q,$z)=&zconv($tokens[3]);
      print "p=$tokens[0] $tokens[1] $tokens[2] $q-$z\n";
    }
  }
#  opendir(DIR,"$datadir/static/$map/"); @data=readdir(DIR); closedir(DIR);
#  @static=('','','','')
#  foreach $line (@data){
#    chomp($line);
#    if (length($line)<3) { next; }
#    $line =~ s/.txt//;
#    @tokens = split(/ /, $line);
#    ($q,$z)=&zconv($tokens[2]);
#    $static[$q].="$tokens[0]=$z ";
#  }
#  print "s0=$static[0]\ns1=$static[1]\ns2=$static[2]\ns3=$static[3]\n";
  #opendir(DIR,"$datadir/dynamic/$map/"); @data=readdir(DIR); closedir(DIR); &items(1);
  ##need to split to 4 client screens
  #if ($items) { print "i0=$items[0]\n"; $items=""; }
  #if ($items) { print "i1=$items[1]\n"; $items=""; }
  #if ($items) { print "i2=$items[2]\n"; $items=""; }
  #if ($items) { print "i3=$items[3]\n"; $items=""; }
  @tileset=();
  if (-e "$datadir/maps/$player{'tmap'}/s.txt") {
    open (FILE, "$datadir/maps/$player{'tmap'}/s.txt"); $tilestamp=<FILE>; close FILE;
    chomp($tilestamp);
    if ($tilestamp) {
      if ($player{'ts'} ne $tilestamp) {
        do "token.pl";
	    if (!-e "$datadir/maps/$map/t.txt") {
          $tileset="";
          for ($i=0; $i<(14*10)*4; $i++) {
            $tile="Ua"; #default tile for city
            $tileset.="$tile";
          }
          #if (!-d "$datadir/maps/$map") { mkdir "$datadir/maps/$map"; }
          #if (!-w "$datadir/maps/$map") { chmod 0755, "$datadir/maps/$map"; }
          #open (FILE, ">$datadir/maps/$map/t.txt"); print FILE "$tileset\n"; close FILE;
          #open (FILE, ">$datadir/maps/$map/s.txt"); print FILE "$cstamp\n"; close FILE;
        } else {
          open (FILE, "$datadir/maps/$map/t.txt"); @tileset=<FILE>; close (FILE);
        }
      }
    } 
  }
  if(!$tilestamp&&$player{'ts'}<0){
    $tilestamp=$cstamp;
    @tileset=(&randmap,&randmap,&randmap,&randmap);
  }
  if($tileset){
    print "t0=$tileset[0]\n"; print "t1=$tileset[1]\n"; print "t2=$tileset[2]\n"; print "t3=$tileset[3]\n"; print "RMap=1\n";
    $player{'ts'}=$tilestamp;
  }
} else {
$a2=$a1; $a2++; if ($a2>$MapEdgeY) { $a2="A"; }
$b2=$b1; $b2++; if ($b2>$MapEdgeX) { $b2="0"; }
$map1="$a1$b1"; $map2="$a1$b2"; $map3="$a2$b1"; $map4="$a2$b2";

## $token="[name] [level] [object] [z] [timestamp] ";

$items=""; $static="";

opendir(DIR,"$datadir/tokens/$map1/"); @data=readdir(DIR); closedir(DIR); &players(1);
opendir(DIR,"$datadir/dynamic/$map1/"); @data=readdir(DIR); closedir(DIR); &items(1);
opendir(DIR,"$datadir/static/$map1/"); @data=readdir(DIR); closedir(DIR); &static(1);
if ($items) { print "i0=$items\n"; $items=""; }
if ($static) { print "s0=$static\n"; $static=""; }

opendir(DIR,"$datadir/tokens/$map2/"); @data=readdir(DIR); closedir(DIR); &players(2);
opendir(DIR,"$datadir/dynamic/$map2/"); @data=readdir(DIR); closedir(DIR); &items(2);
opendir(DIR,"$datadir/static/$map2/"); @data=readdir(DIR); closedir(DIR); &static(2);
if ($items) { print "i1=$items\n"; $items=""; }
if ($static) { print "s1=$static\n"; $static=""; }

opendir(DIR,"$datadir/tokens/$map3/"); @data=readdir(DIR); closedir(DIR); &players(3);
opendir(DIR,"$datadir/dynamic/$map3/"); @data=readdir(DIR); closedir(DIR); &items(3);
opendir(DIR,"$datadir/static/$map3/"); @data=readdir(DIR); closedir(DIR); &static(3);
if ($items) { print "i2=$items\n"; $items=""; }
if ($static) { print "s2=$static\n"; $static=""; }

opendir(DIR,"$datadir/tokens/$map4/"); @data=readdir(DIR); closedir(DIR); &players(4);
opendir(DIR,"$datadir/dynamic/$map4/"); @data=readdir(DIR); closedir(DIR); &items(4);
opendir(DIR,"$datadir/static/$map4/"); @data=readdir(DIR); closedir(DIR); &static(4);
if ($items) { print "i3=$items\n"; $items=""; }
if ($static) { print "s3=$static\n"; $static=""; }

$tileset0='';
if (-e "$datadir/maps/$player{'tmap'}/s.txt") {
  open (FILE, "$datadir/maps/$player{'tmap'}/s.txt"); $tilestamp=<FILE>; close FILE;
  chomp($tilestamp);
  if ($tilestamp) {
    if ($player{'ts'} ne $tilestamp) {
      do "token.pl";
      $map0="$a1$b1"; $map1="$a1$b2"; $map2="$a2$b1"; $map3="$a2$b2";
      $tileset0=&loadvalidmap($map0); $tileset1=&loadvalidmap($map1); $tileset2=&loadvalidmap($map2); $tileset3=&loadvalidmap($map3);
      # print "pop=tileset update \n";
    }
  } 
}
if(!$tilestamp&&$player{'ts'}<0){
  $tilestamp=$cstamp;
  $tileset0=&randmap($map0); $tileset1=&randmap($map1); $tileset2=&randmap($map2); $tileset3=&randmap($map3);
}
if($tileset0){
  $player{'ts'}=$tilestamp;
  print "t0=$tileset0\n"; print "t1=$tileset1\n"; print "t2=$tileset2\n"; print "t3=$tileset3\n"; print "RMap=1\n";
}
}
print "RStatic=1\n";

sub players {
  foreach $line (@data) {
    chomp($line);
    if (length($line)<3) { next; }
    @tokens = split(/ /, $line);  
    if ($cstamp>$tokens[4]) {
      ## expired
      if ($_[0] eq "1") { unlink "$datadir/tokens/$map1/$line"; }
      if ($_[0] eq "2") { unlink "$datadir/tokens/$map2/$line"; }
      if ($_[0] eq "3") { unlink "$datadir/tokens/$map3/$line"; }
      if ($_[0] eq "4") { unlink "$datadir/tokens/$map4/$line"; }
    } else {  
      print "p=$tokens[0] $tokens[1] $tokens[2] $_[0]-$tokens[3]\n";
      #print "pop=$tokens[0] $tokens[1] $tokens[2] $_[0]-$tokens[3]\n";
    }
  }
}

sub items {
  # is item ... object=owner
  # $token="[name] [expires] [z]";
  # $items.=$token[0].sprintf("%02x", $token[3]);

  if ($_[0] eq "1") { $dir="$datadir/dynamic/$map1"; }
  if ($_[0] eq "2") { $dir="$datadir/dynamic/$map2"; }
  if ($_[0] eq "3") { $dir="$datadir/dynamic/$map3"; }
  if ($_[0] eq "4") { $dir="$datadir/dynamic/$map4"; }

  foreach $line (@data) {
    chomp($line);
    $line=~s/.txt//;
    if (length($line)<3) { next; }
    @tokens = split(/ /, $line);
    
    $tokens[1]=sprintf("%d", hex($tokens[1]));
    
    #print "pop=$tokens 0=$tokens[0] 1=$tokens[1] 2=$tokens[2] 4=$tokens[4]\n";
    if ($cstamp>$tokens[1]) {
      # need routine to change or delete item, for now delete
      # print "pop=$token[0] deleted $cstamp > $tokens[1].\n";
      
      #print "pop=$tokens 0=$tokens[0] 1=$tokens[1] 2=$tokens[2] 4=2=$tokens[4]\n";
      
      if ($tokens[0] eq "Ia") { do "g-Ia.pl"; }
      if ($tokens[0] eq "Fa") { do "g-Fa.pl"; }
      if ($tokens[0] eq "Fb") { do "g-Fb.pl"; }
      if ($tokens[0] eq "Fc") { do "g-Fc.pl"; }
      if ($tokens[0] eq "Fd") { do "g-Fd.pl"; }

      unlink "$dir/$line.txt";

    } else {
      $items.=$tokens[0].sprintf("%02x", $tokens[2]);
    }
  }  
}

sub static {
  # timestamp object z-location  
  foreach $line (@data) {
    chomp($line);
    if (length($line)<3) { next; }
    $line =~ s/.txt//;
    @tokens = split(/ /, $line);
    $static.="$tokens[0]=$tokens[2] ";
    #print "pop=here: $tokens[0]=$tokens[2]\n"; 
  }  
}

#sub zconv {
#  my $q=1,$y=int($_[0]/$MapWide),$x=$_[0]-($y*$MapWide);
#  if($y>$MapSizeY){$q=3;$y-=$y1;}
#  if($x>$MapSizeX){$q++;$x-=$x1;}
#  return($q,$y*$x1+$x);
#}

1;
