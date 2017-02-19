# external, eats food

if ($form{'j'} eq "Ja") { $food="Ja"; $health=1; }
if ($form{'j'} eq "Jd") { $food="Jd"; $health=4; }
if ($form{'j'} eq "Je") { $food="Je"; $health=8; }

if ($food) {
  if ($player{'inven'}=~/$food/) {
    $f=index($player{'inven'}, "$form{'j'}");
    $player{'inven'}=substr($player{'inven'},0,$f)."Za00000000".substr($player{'inven'},$f+10);
    do 'inv.pl'; print "pop=Yummy!\n";
    $player{'h'}=$player{'h'}+$health;
    if ($player{'h'}>99) { $player{'h'}=99; }  
    print "h=$player{'h'}\n";
    print "dinv=1\n";
  } else {
    print "pop=No Food!\n";
  }
} else {
  print "pop=Not Editable!\n";
}

1;
