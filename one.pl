## internal, executed every "one minute" player is online

# print "pop=one minute\n";

## check all items in inventory for anything that expires

$inv='';
for ($i=0; $i<$NumInven;$i++) {
  #$invstamp=substr($player{'inven'},($i*10)+2,8);
  $estamp=sprintf("%d", hex(substr($player{'inven'},($i*10)+2,8)));
  $invitem=substr($player{'inven'},$i*10,2);
  if ($estamp && $cstamp>$estamp) {
    print "pop=^$invitem expired\n";
    substr($player{'inven'},$i*10,10)="Za00000000";
    if ($player{'inven'}=~/$invitem/) {} else {
      $form{'j'}=$invitem;
      do "remove.pl";
    }
    $inv.='Za';
  }else{
    $inv.=$invitem;
  }
}
print "inv=$inv\n";

## reduce health
$player{'h'}=$player{'h'}-1;

## ultimately move this to the main 11-dragon.cgi script
if ($player{'h'}<1) {
  print "pop=You have died\n";
  $player{'h'}=60;
}

$player{'one'}=$cstamp+60;

1;
