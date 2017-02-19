# external, cooks food

do "fire.pl";

$odds=0;
if ($player{'inven'}=~/$form{'k'}/) {
  if ($form{'j'} eq "Ga") { $odds=90; $fish="Ja"; $estamp=86400; } # minnows
  if ($form{'j'} eq "Gd") { $odds=90; $fish="Jd"; $estamp=86400; } # crab
  if ($form{'j'} eq "Ge") { $odds=90; $fish="Je"; $estamp=86400; } # carp
}
if ($fire<1) {
  print "pop=Need Fire!\n";
  $odds=0;
}
if ($odds) {
  $f=index($player{'inven'}, "$form{'j'}");
  # confirm it exists
  if (int(rand(100))<$odds) {
    $player{'inven'}=substr($player{'inven'},0,$f)."Za00000000".substr($player{'inven'},$f+10);
    $f=index($player{'inven'}, "Za");
    $estamp=$cstamp+$estamp; $estamp=sprintf("%08x", $estamp);
    $player{'inven'}=substr($player{'inven'},0,$f).$fish.$estamp.substr($player{'inven'},$f+10);
    do 'inv.pl'; print "dinv=1\n";
  } else {
    $player{'inven'}=substr($player{'inven'},0,$f)."Za00000000".substr($player{'inven'},$f+10);
    do 'inv.pl'; print "pop=Burnt!\n";
  }
}
1;
