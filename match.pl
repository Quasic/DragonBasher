# external, lights match

print "pop=light match\n";

$new="";
($slot,$item)=split(/\-/, $form{'j'});
if ($slot<24) {
  if (length($item)==2) {
    if (substr($player{'inven'},$slot*10,2) eq $item) {
      $fire=0; $slot=$slot*10;
      if ($item eq "Dj") { $fire=1; $player{'inven'}=substr($player{'inven'},0,$slot)."Za00000000".substr($player{'inven'},$slot+10); }
      if ($item eq "Dk") { $fire=1; $player{'inven'}=substr($player{'inven'},0,$slot)."Dj".substr($player{'inven'},$slot+2); }
      if ($item eq "Dl") { $fire=1; $player{'inven'}=substr($player{'inven'},0,$slot)."Dk".substr($player{'inven'},$slot+2); }
      if ($fire) {
        do 'inv.pl'; print "dinv=1\n"; $new="Zj"; do "newstamp.pl"; 
        open (FILE,">$datadir/dynamic/$player{'tmap'}/Zj $e $player{'tz'}.txt");
        print FILE "\n";
        close FILE;
      }
    }
  }
}

1;
