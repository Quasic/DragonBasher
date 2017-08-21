# external, examine item

print "pop=examine $form{'j'}\n";

($slot, $item)=split(/-/, $form{'j'});
$invitem=substr($player{'inven'},$slot*10,2);
$invstamp=substr($player{'inven'},($slot*10)+2,8);

if ($invitem eq $item) {
  $invstamp=sprintf("%d", hex($invstamp))-$cstamp;
  print "pop=^$item\n";
  if ($invstamp>86400) {
   $a=int($invstamp/86400); print "pop=$a days\n";
  } else {
   if ($invstamp>3600) {
    $a=int($invstamp/3600); print "pop=$a hours\n";
   } else {  
    if ($invstamp>120) {
     $a=int($invstamp/60); print "pop=$a minutes\n";
    } else {
     print "pop=$invstamp seconds\n";
    }
   }
  }
}

1;
