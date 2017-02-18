# external, execute sign
open (FILE,"$datadir/static/$player{'tmap'}/Zf 00000000 $player{'tz'}.txt");
$sign=<FILE>;
close FILE;
chomp($sign);
print "pop=$sign\n";
1;
