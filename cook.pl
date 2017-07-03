# external, cooks food
$odds=0;
($slot,$item)=split(/\-/, $form{'j'});
do "fire.pl";
if ($fire<1) {
  print "pop=Need Fire!\n";
  $odds=0;
} else {
  if ($slot<24) {
    if (length($item)==2) {
      if (substr($player{'inven'},$slot*10,2) eq $item) {
        if ($player{'inven'}=~/$item/) {
          if ($item eq "Ga") { $odds=90; $new="Ja"; do "newstamp.pl"; } # minnows
          if ($item eq "Gd") { $odds=90; $new="Jd"; do "newstamp.pl"; } # crab
          if ($item eq "Ge") { $odds=90; $new="Je"; do "newstamp.pl"; } # carp
        }
      }
    }
  }
}

if ($odds) {
  $slot=$slot*10;
  print "pop=slot $slot\n";
  if (int(rand(100))<$odds) {
    $player{'inven'}=substr($player{'inven'},0,$slot).$new.$e.substr($player{'inven'},$slot+10);
    do 'inv.pl'; print "dinv=1\n";
  } else {
    $player{'inven'}=substr($player{'inven'},0,$slot)."Za00000000".substr($player{'inven'},$slot+10);
    do 'inv.pl'; print "pop=Burnt!\n";
  }
}

1;
