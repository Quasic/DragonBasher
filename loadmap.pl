## internal, loads map into memory
$version=1.0;

sub loadmap {
  ## validate $map as capital letter and numeral 
  ## skip this and assume map is correct for performance?
  $f=0;
  if (substr($_[0],0,1) ge "A") {
    if (substr($_[0],0,1) le "Z") {
      if (substr($_[0],1,1) ge "0") {
        if (substr($_[0],1,1) le "9") {
          if (length($_[0])==2) { $f=1; }
          if (length($_[0])==3) {
            if (substr($_[0],3,1) le "d") { $f=1; }
            if (substr($_[0],3,1) le "e") { $f=1; }
          }
        }
      }
    }
  }
  if ($f) {
    if (!-e "$datadir/maps/$_[0]/t.txt") {
      $tileset="";
      for ($i=0; $i<(14*10)*4; $i++) {
        $a=int(rand(100));
        $tile="Ua";
        #if ($a>94) { $tile="Gg"; }
        #if ($a>95) { $tile="Ge"; }        
        #if ($a>96) { $tile="Gb"; }
        #if ($a>97) { $tile="Gd"; }
        #if ($a>98) { $tile="Og"; }
        #if ($a>99) { $tile="Re"; }
        $tileset.="$tile";
      }
      #if (!-d "$datadir/maps/$_[0]") { mkdir "$datadir/maps/$_[0]"; }
      #if (!-w "$datadir/maps/$_[0]") { chmod 0755, "$datadir/maps/$_[0]"; }
      #open (FILE, ">$datadir/maps/$_[0]/t.txt"); print FILE "$tileset\n"; close FILE;
      #open (FILE, ">$datadir/maps/$_[0]/s.txt"); print FILE "$cstamp\n"; close FILE;
    } else {
      open (FILE, "$datadir/maps/$_[0]/t.txt"); $tileset=<FILE>; close (FILE);
    }
    $player{'ts'}=$cstamp;
    return $tileset;
  } else {
    print "pop=invalid map $_[0]\n";
    return "";
  }
}

1;
