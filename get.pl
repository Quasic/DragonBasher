# external, get an object from ground
$version="1.0";
$filestamp=glob "$datadir/dynamic/$player{'tmap'}/$form{'j'}??????????$player{'tz'}.txt";
if ($filestamp) {
  $f=index($player{'inven'}, "Za");
  if ($f>-1) {
    ($item,$invstamp,$z)=split(/ /, $filestamp);
    $item=substr($item,-2);
    if ($item eq $form{'j'}) {
      if ($item=~/F/) {
        # convert food timestamp from seconds to minutes
        $a=hex($invstamp)-$cstamp; if ($a>60) { $a=60; } $a=($a*60)+$cstamp; $invstamp=sprintf("%08x", $a);
      }
      $player{'inven'}=substr($player{'inven'},0,$f).$item.$invstamp.substr($player{'inven'},$f+10);
      do 'inv.pl'; print "dinv=1\n";
      unlink "$filestamp";
    } else {
      print "pop=mismatch\n";
    }
  } else {
    print "pop=no space $f\n";
  }
} else {
  if (glob "$datadir/static/$player{'tmap'}/$form{'j'}??????????$player{'tz'}.txt") {
    do "static.pl";
  }
}

1;
