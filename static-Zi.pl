# external, execute fire pit
$f=index($player{'inven'}, "Cg");
$estamp=sprintf("%08x", $cstamp+60);
$player{'inven'}=substr($player{'inven'},0,$f)."Zj".$estamp.substr($player{'inven'},$f+10);
do 'inv.pl'; print "dinv=1v\n";
1;
