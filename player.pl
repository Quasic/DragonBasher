## internal, player file routines to save and load
$version="1.0";
sub saveplayer {
  if ($filename) {
    open (FILE,">$datadir/players/$filename.tmp") or die "$datadir/players/$filename.tmp\n\n$!\n\n";
    flock(FILE,$LOCK);
    print FILE "name=$player{'name'}\n";
    print FILE "level=$player{'level'}\n";
    print FILE "h=$player{'h'}\n";
    print FILE "map=$player{'map'}\n";
    print FILE "z=$player{'z'}\n";
    print FILE "object=$player{'object'}\n";
    print FILE "inven=$player{'inven'}\n";
    print FILE "token=$player{'token'}\n";
    print FILE "tz=$player{'tz'}\n";
    print FILE "tmap=$player{'tmap'}\n";
    print FILE "ts=$player{'ts'}\n";
    print FILE "one=$player{'one'}\n";
    print FILE "lastchat-global=$player{'lastchat-global'}\n";
    print FILE "lastchat-team=$player{'lastchat-team'}\n";
    print FILE "lastchat-view=$player{'lastchat-view'}\n";
    flock(FILE,$UNLOCK);
    close(FILE);
    unlink ("$datadir/players/$filename.txt");
    rename("$datadir/players/$filename.tmp", "$datadir/players/$filename.txt");
  }
}
sub loadplayer {
  foreach $playerline (@player) { @player{$playerline}=""; }
  if (-e "$datadir/players/$_[0].txt") {} else {
    $player{'name'}=$form{'n'};
    $player{'level'}="3";
    $player{'h'}="60";    
    $player{'map'}="B2";
    $player{'z'}=88;
    $player{'object'}="new";
    $player{'inven'}="Za00000000";
    $player{'inven'}.="$player{'inven'}$player{'inven'}$player{'inven'}$player{'inven'}$player{'inven'}";
    $player{'inven'}.="$player{'inven'}$player{'inven'}$player{'inven'}";
    $player{'token'}="";
    $player{'tz'}=88;
    $player{'tmap'}="B2";
    $player{'ts'}=$cstamp;
    $player{'one'}=$cstamp+60;
    print "create=$filename\n";
    &saveplayer;
  }
  open (FILE,"$datadir/players/$_[0].txt");
  @playerfile=<FILE>;
  close FILE;
  foreach $playerline (@playerfile) {
    chomp ($playerline);
    ($playervariable,$playerdata)=split(/=/, $playerline);
    @player{$playervariable}=$playerdata;
  }
  if ($player{'inven'}=~/Z0/) { $player{'inven'}=~s/Z0/Za/g; }
}

1;
