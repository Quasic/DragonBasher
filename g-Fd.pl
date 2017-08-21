# g-expires Fd tomato

if (rand(100)<60) {
  # tomato plant grows
  $g=substr($tileset,$tokens[2]*2,1);
  if ($g eq "F" || $g eq "G") { 
    $estamp=$cstamp+60; $estamp=sprintf("%08x", $estamp);
    open (FILE,">$dir/Ia $estamp $tokens[2].txt");
    print FILE "\n";
    close FILE;
    $items.="Ia".sprintf("%02x", $tokens[2]);
  }
}

1;
