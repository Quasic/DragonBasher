# internal, returns $fire if there is fire avaialbe

if (!-d "$datadir/dynamic/$player{'tmap'}") { mkdir "$datadir/dynamic/$player{'tmap'}"; }
if (!-w "$datadir/dynamic/$player{'tmap'}") { chmod 0777, "$datadir/dynamic/$player{'tmap'}" }

$filestamp=glob "$datadir/dynamic/$player{'tmap'}/Zj??????????$player{'tz'}.txt";
if ($filestamp) { $fire=1; } else { $fire=0; }

if (!$fire) { 
  if ($player{'inven'}=~/Zj/) {
    # drop fire
    $s=substr($player{'inven'},index($player{'inven'}, "Zj")+2,8);
    open (FILE,">$datadir/dynamic/$player{'tmap'}/Zj $s $player{'tz'}.txt");
    print FILE "$player{'name'}";
    close FILE;
    substr($player{'inven'},index($player{'inven'},"Zj"),10)="Za00000000";
    do 'inv.pl';
    $fire=1;
  } else {
    if ($player{'inven'}=~/Dj/) {
      $new="Zj"; do "newstamp.pl"; 
      open (FILE,">$datadir/dynamic/$player{'tmap'}/Zj $e $player{'tz'}.txt");
      print FILE "$player{'name'}";
      close FILE;
      substr($player{'inven'},index($player{'inven'},"Dj"),10)="Za00000000";
      do 'inv.pl';
      $fire=1;
    } else {
      if ($player{'inven'}=~/Dk/) {
        $new="Zj"; do "newstamp.pl"; 
        open (FILE,">$datadir/dynamic/$player{'tmap'}/Zj $e $player{'tz'}.txt");
        print FILE "$player{'name'}";
        close FILE;
        substr($player{'inven'},index($player{'inven'},"Dk"),2)="Dj";
        do 'inv.pl';
        $fire=1;
      } else {
        if ($player{'inven'}=~/Dl/) {
          $new="Zj"; do "newstamp.pl"; 
          open (FILE,">$datadir/dynamic/$player{'tmap'}/Zj $e $player{'tz'}.txt");
          print FILE "$player{'name'}";
          close FILE;
          substr($player{'inven'},index($player{'inven'},"Dl"),2)="Dk";
          do 'inv.pl';
          $fire=1;
        }
      }
    }
  }
}

1;
