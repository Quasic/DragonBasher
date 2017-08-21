# external, drops object on ground
$version="1.0";

($slot, $item)=split(/-/, $form{'j'});
$invitem=substr($player{'inven'},$slot*10,2);
$invstamp=substr($player{'inven'},($slot*10)+2,8);

if ($invitem eq $item) {
  $filestamp=glob "$datadir/dynamic/$player{'tmap'}/????????????$player{'z'}.txt";
  if (!$filestamp) {
    if ($invitem=~/F/) {
      # food convert timestamp from minutes to seconds
      $invstamp=int((sprintf("%d", hex($invstamp))-$cstamp)/60);
      if ($invstamp>60) { $invstamp=60; }
      $invstamp=sprintf("%08x", $cstamp+($invstamp));
    }
    if (!-d "$datadir/dynamic/$player{'tmap'}") { mkdir "$datadir/dynamic/$player{'tmap'}"; }
    if (!-w "$datadir/dynamic/$player{'tmap'}") { chmod 0777, "$datadir/dynamic/$player{'tmap'}" }
    open (FILE,">$datadir/dynamic/$player{'tmap'}/$item $invstamp $player{'tz'}.txt");
    print FILE "$player{'name'}";
    close FILE;
    substr($player{'inven'},$slot*10,10)="Za00000000";
    do 'inv.pl';
    if ($player{'inven'}=~/$item/) {
      #print "dinv=\n";
    } else {
      $form{'j'}=$item;
      do "remove.pl";
    }
  }
}  

# do "token.pl"; ## do we need this here now??
$form{'c'}="refresh";

1;
