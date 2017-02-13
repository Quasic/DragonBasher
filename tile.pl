# external, changes tile player is standing on
$version="1.0";

if ($player{'inven'}=~/Zd/) {
  if (substr($form{'j'},0,1) ge "A") {
    if (substr($form{'j'},0,1) le "Z") {
      if (substr($form{'j'},1,1) ge "a") {
        if (substr($form{'j'},1,1) le "z") {
          if (length($form{'j'})==2) {
            open (FILE, "$datadir/maps/$player{'tmap'}/t.txt");
            $tileset=<FILE>;
            close (FILE);
            substr($tileset,$player{'tz'}*2,2)="$form{'j'}";
            open (FILE, ">$datadir/maps/$player{'tmap'}/t.txt"); print FILE "$tileset\n"; close FILE;
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
