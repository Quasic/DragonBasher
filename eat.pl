# external, eats food

($slot,$item)=split(/\-/, $form{'j'});

if ($slot<24) {
  if (length($item)==2) {
    if (substr($player{'inven'},$slot*10,2) eq $item) {
      if ($item eq "Fa") { $food="Fa"; $health=4; $new="Za00000000"; }
      if ($item eq "Fb") { $food="Fb"; $health=4; $new="Fa".substr($player{'inven'},($slot*10)+2,8); }
      if ($item eq "Fc") { $food="Fc"; $health=4; $new="Fb".substr($player{'inven'},($slot*10)+2,8); }
      if ($item eq "Fd") { $food="Fd"; $health=4; $new="Fc".substr($player{'inven'},($slot*10)+2,8); }
      if ($item eq "Ja") { $food="Ja"; $health=1; $new="Za00000000"; }
      if ($item eq "Jd") { $food="Jd"; $health=4; $new="Za00000000"; }
      if ($item eq "Je") { $food="Je"; $health=8; $new="Za00000000"; }
      if ($food) {
        $slot=$slot*10;
        $player{'inven'}=substr($player{'inven'},0,$slot)."$new".substr($player{'inven'},$slot+10);
        do 'inv.pl';
        $player{'h'}=$player{'h'}+$health;
        if ($player{'h'}>99) { $player{'h'}=99; }  
        print "h=$player{'h'}\n";
        print "dinv=1\n";
      } else {
        print "pop=Not Editable!\n";
      }
    } else {
      print "pop=No Food!\n";
    }
  }
}

1;
