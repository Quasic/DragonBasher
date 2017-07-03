# g-expires Ia tomato plant

# $z=$tokens[2];

# get x and y
# tomato fit on screen?
# is there item left?
# is there item right?
# is there item up?
# is there item down?

$estamp=$cstamp+60; $estamp=sprintf("%08x", $estamp);

$y=int($tokens[2]/$MapWide);
$x=$tokens[2]-($y*$MapWide);

$gz=$tokens[2];

#if (glob "$dir/????????????$gz.txt") {} else {
#  open (FILE,">$dir/Dh $estamp $gz.txt"); print FILE "\n"; close FILE;
#}

if (rand(100)<25) {
  if ($x<$MapWide-1) {
    $gz=$tokens[2]+1;
    if (glob "$dir/????????????$gz.txt") {} else {
      $f="F".chr(int(rand(4)+97));
      open (FILE,">$dir/$f $estamp $gz.txt"); print FILE "\n"; close FILE;
      $items.="$f".sprintf("%02x", $gz);
    }
  }
}
if (rand(100)<25) {
  if ($x>0) {
    $gz=$tokens[2]-1;
    if (glob "$dir/????????????$gz.txt") {} else {
      $f="F".chr(int(rand(4)+97));
      open (FILE,">$dir/$f $estamp $gz.txt"); print FILE "\n"; close FILE;
      $items.="$f".sprintf("%02x", $gz);
    }
  }
}

if (rand(100)<25) {
  if ($y<$MapSizeY-1) {
    $gz=$tokens[2]+$MapSizeX+1;
    if (glob "$dir/????????????$gz.txt") {} else {
      $f="F".chr(int(rand(4)+97));
      open (FILE,">$dir/$f $estamp $gz.txt"); print FILE "\n"; close FILE;
      $items.="$f".sprintf("%02x", $gz);
    }
  }
}
if (rand(100)<25) {
  if ($y>0) {
    $gz=$tokens[2]-$MapSizeX-1;
    if (glob "$dir/????????????$gz.txt") {} else {
      $f="F".chr(int(rand(4)+97));
      open (FILE,">$dir/$f $estamp $gz.txt"); print FILE "\n"; close FILE;
      $items.="$f".sprintf("%02x", $gz);
    }
  }
}

if (rand(100)<50) {
  # tomato plant lives
  open (FILE,">$dir/Ia $estamp $tokens[2].txt");
  print FILE "\n";
  close FILE;
  $items.=$tokens[0].sprintf("%02x", $tokens[2]);
} else {
  if (rand(100)<50) {
    $f="F".chr(int(rand(4)+97));
    open (FILE,">$dir/$f $estamp $tokens[2].txt");
    print FILE "\n";
    close FILE;
    $items.="$f".sprintf("%02x", $tokens[2]);
  }
}

# check if item is on ground left right up down
# if not, randomly place new tomato

1;
