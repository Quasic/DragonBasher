# internal, fill bucket from well
$version="1.0";
print "pop=Well\n";

if ($player{'inven'}=~/Bd/) {
  $player{'inven'}=~s/Bd/Ei/;
  do 'inv.pl'; print "dinv=1v\n";
}

1;