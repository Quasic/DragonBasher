# external, get an object from ground
$version="1.0";

$filestamp=glob "$datadir/dynamic/$player{'tmap'}/$form{'j'}??????????$player{'tz'}.txt";
#print "pop=$form{'j'} - $filestamp\n";
if ($filestamp) {
  $f=index($player{'inven'}, "Za");
  if ($f>-1) {
    ($item,$filestamp,$z)=split(/ /, $filestamp);
    $item=substr($item,-2);
    if ($item eq $form{'j'}) {
      $player{'inven'}=substr($player{'inven'},0,$f).$item.$filestamp.substr($player{'inven'},$f+10);
      do 'inv.pl';#print "inv=$player{'inven'}\n";
      print "dinv=1\n";
      unlink "$datadir/dynamic/$player{'tmap'}/$item $filestamp $player{'tz'}.txt";
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
