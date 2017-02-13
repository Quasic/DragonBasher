# external, create an object in inventory
$version="1.0";

if($player{'inven'}=~/Zd/){
  ($slot,$item,$estamp)=split(/\-/,$form{'j'});
  print "pop=/newitem $slot $item $estamp\n";
  $f=$slot*10;
  if (substr($player{'inven'},$f,2)eq'Za') {
    if($item=~/^[A-Z][0-9a-z]$/){
      $player{'inven'}=substr($player{'inven'},0,$f).$item.sprintf("%08x",+$cstamp+$estamp).substr($player{'inven'},$f+10);
      do 'inv.pl';
      print "dinv=1\n";
    } else {
      print "pop=mismatch\n";
    }
  } else {
    print "pop=no space $f\n";
  }
}

 1;
