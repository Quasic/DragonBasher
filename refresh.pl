## external, refresh all data (main loop)
$version="1.0";

do "loadmap.pl";

## get maps player is on
$a1=substr($player{'map'},0,1); $b1=substr($player{'map'},1,1);
if($a1 lt 'A'||$a1 gt 'Z'||$b1 lt '0'||($b1 gt '9'&&$b1 lt 'a')){
  print "pop=Invalid map $a1$b1";
}elsif($b1 gt '9'){#city
  $map="$a1$b1";
  opendir(DIR,"$datadir/tokens/$map/"); @data=readdir(DIR); closedir(DIR);
  foreach $line (@data) {
    chomp($line);
    if (length($line)<3) { next; }
    @tokens = split(/ /, $line);  
    if ($cstamp>$tokens[4]) {
      ## expired
      unlink "$datadir/tokens/$map/$line";
    } else {
	  $q=0;
	  $z=$tokens[3];
      print "p=$tokens[0] $tokens[1] $tokens[2] $q-$z\n";
    }
  }
  #opendir(DIR,"$datadir/dynamic/$map/"); @data=readdir(DIR); closedir(DIR); &items(1);
  #opendir(DIR,"$datadir/static/$map/"); @data=readdir(DIR); closedir(DIR); &static(1);
  ##need to split to 4 client screens
  #if ($items) { print "i0=$items[0]\n"; $items=""; }
  #if ($items) { print "i1=$items[1]\n"; $items=""; }
  #if ($items) { print "i2=$items[2]\n"; $items=""; }
  #if ($items) { print "i3=$items[3]\n"; $items=""; }
  #if ($static) { print "s0=$static[0]\n"; $static=""; }
  #if ($static) { print "s1=$static[1]\n"; $static=""; }
  #if ($static) { print "s2=$static[2]\n"; $static=""; }
  #if ($static) { print "s3=$static[3]\n"; $static=""; }
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
          #if (!-d "$datadir/maps/$_[0]") { mkdir "$datadir/maps/$_[0]"; }
          #if (!-w "$datadir/maps/$_[0]") { chmod 0755, "$datadir/maps/$_[0]"; }
          #open (FILE, ">$datadir/maps/$_[0]/t.txt"); print FILE "$tileset\n"; close FILE;
          #open (FILE, ">$datadir/maps/$_[0]/s.txt"); print FILE "$cstamp\n"; close FILE;
        } else {
          open (FILE, "$datadir/maps/$_[0]/t.txt"); @tileset=<FILE>; close (FILE);
        }
		if(!$tileset[0]){$tileset[0]=&makevalidmap;}
		if(!$tileset[1]){$tileset[1]=&makevalidmap;}
		if(!$tileset[2]){$tileset[2]=&makevalidmap;}
		if(!$tileset[3]){$tileset[3]=&makevalidmap;}
        $player{'ts'}=$cstamp;
        print "t0=$tileset[0]\n"; print "t1=$tileset[1]\n"; print "t2=$tileset[2]\n"; print "t3=$tileset[3]\n"; print "RMap=1\n";
        $player{'ts'}=$tilestamp;
      }
    } 
  }
}else{
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

if (-e "$datadir/maps/$player{'tmap'}/s.txt") {
  open (FILE, "$datadir/maps/$player{'tmap'}/s.txt"); $tilestamp=<FILE>; close FILE;
  chomp($tilestamp);
  if ($tilestamp) {
    if ($player{'ts'} ne $tilestamp) {
      do "token.pl";
      $map0="$a1$b1"; $map1="$a1$b2"; $map2="$a2$b1"; $map3="$a2$b2";
      $tileset0=&loadvalidmap($map0); $tileset1=&loadvalidmap($map1); $tileset2=&loadvalidmap($map2); $tileset3=&loadvalidmap($map3);
      print "t0=$tileset0\n"; print "t1=$tileset1\n"; print "t2=$tileset2\n"; print "t3=$tileset3\n"; print "RMap=1\n";
      $player{'ts'}=$tilestamp;
      # print "pop=tileset update \n";
    }
  } 
}
if(!$tilestamp){
  print "t0=\nt1=\nt2=\nt3=\n";
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
  foreach $line (@data) {
    chomp($line);
    $line=~s/.txt//;
    if (length($line)<3) { next; }
    @tokens = split(/ /, $line);
    
    $tokens[1]=sprintf("%d", hex($tokens[1]));
    
    if ($cstamp>$tokens[1]) {
      # need routine to change or delete item, for now delete
      # print "pop=$token[0] deleted $cstamp > $tokens[1].\n";
      if ($_[0] eq "1") { unlink "$datadir/dynamic/$map1/$line.txt"; }
      if ($_[0] eq "2") { unlink "$datadir/dynamic/$map2/$line.txt"; }
      if ($_[0] eq "3") { unlink "$datadir/dynamic/$map3/$line.txt"; }
      if ($_[0] eq "4") { unlink "$datadir/dynamic/$map4/$line.txt"; }
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



1;
