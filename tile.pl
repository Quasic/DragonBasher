# external, changes tile player is standing on
$version="1.0";

if ($player{'inven'}=~/Zd/) {
  if (substr($form{'j'},0,1) ge "A") {
    if (substr($form{'j'},0,1) le "Z") {
      if (substr($form{'j'},1,1) ge "a") {
        if (substr($form{'j'},1,1) le "z") {
          if (length($form{'j'})==2) {
            open (FILE, "$datadir/maps/$player{'tmap'}/t.txt");
			if(substr($player{'map'},1,1)ge'a'){
			  @tileset=<FILE>;
			  close FILE;

		      if(!$tileset[0]){
			  do'loadmap.pl';
			    $tileset[0]=&randmap;
		        $tileset[1]=&randmap;
		        $tileset[2]=&randmap;
		        $tileset[3]=&randmap;
			  }

		      $x1=$MapSizeX+1;
              $y1=$MapSizeY+1;
              $q=0;
	          $z=$player{'z'};
              $y=int($z/$MapWide);
              $x=$z-($y*$MapWide);
	          if($y>$MapSizeY){$q=2;$y-=$y1;}
	          if($x>$MapSizeX){$q++;$x-=$x1;}
	          $z=$y*$x1+$x;
              substr($tileset[$q],$z*2,2)="$form{'j'}";
              open (FILE, ">$datadir/maps/$player{'tmap'}/t.txt"); print FILE join('',@tileset);
			}else{
            $tileset=<FILE>;
            close (FILE);
            substr($tileset,$player{'tz'}*2,2)="$form{'j'}";
			}
			close FILE;
            open (FILE, ">$datadir/maps/$player{'tmap'}/s.txt"); print FILE "$cstamp\n"; close FILE;
            # send new $tileset to client
          }
        }
      }
    }
  }
} else {
  print "pop=Need Sysop Key\n";
}

1;
