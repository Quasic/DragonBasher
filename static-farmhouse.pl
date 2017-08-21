# internal, farm house building
$version="1.0";
print "pop=Farm House\n";
$f=0;
if ($player{'inven'}=~/Fd/) { $f=1; }
if ($player{'inven'}=~/Fc/) { $f=1; }
if ($player{'inven'}=~/Fb/) { $f=1; }
if ($player{'inven'}=~/Fa/) { $f=1; }
if ($f==0) {
  if ($player{'inven'}=~/Za/) {
    $slot=index($player{'inven'},"Za");
    $estamp=sprintf("%08x", $cstamp+3600);
    $player{'inven'}=substr($player{'inven'},0,$slot)."Fd".$estamp.substr($player{'inven'},$slot+10);
    do 'inv.pl'; print "dinv=1v\n";
  }
}
1;
