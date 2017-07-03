# external, plants seed

if ($player{'inven'}=~/Ei/) {
  ($slot,$item)=split(/\-/, $form{'j'});

  if ($slot<24) {
    if (length($item)==2) {
      if (substr($player{'inven'},$slot*10,2) eq $item) {
        
        if ($item eq "Fa") { $plant="Ia"; $estamp=60; $new="Za00000000"; }
        if ($item eq "Fb") { $plant="Ia"; $estamp=60; $new="Fa".substr($player{'inven'},($slot*10)+2,8); }
        if ($item eq "Fc") { $plant="Ia"; $estamp=60; $new="Fb".substr($player{'inven'},($slot*10)+2,8); }
        if ($item eq "Fd") { $plant="Ia"; $estamp=60; $new="Fc".substr($player{'inven'},($slot*10)+2,8); }
      
        if ($plant) {
          if (!-d "$datadir/dynamic/$player{'tmap'}") { mkdir "$datadir/dynamic/$player{'tmap'}"; }
          if (!-w "$datadir/dynamic/$player{'tmap'}") { chmod 0777, "$datadir/dynamic/$player{'tmap'}" }
          $estamp=$cstamp+$estamp;
          $estamp=sprintf("%08x", $estamp);
          open (FILE,">$datadir/dynamic/$player{'tmap'}/$plant $estamp $player{'tz'}.txt");
          print FILE "\n";
          close FILE;
          substr($player{'inven'},$slot*10,10)="$new";
          $player{'inven'}=~s/Ei/Bd/;
          do 'inv.pl';#print "inv=$player{'inven'}\n";
          print "pop=Planted!\n";
        }
      }
    }
  }
} else {
  print "pop=Need Water!\n";
}

1;
