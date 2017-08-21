# external, fills map tileset with grass

if ($form{'j'} ne "yes") {
  print "pop=Confirm\n";
} else {
  print "pop=Terraformed\n";
}

$tileset="";

for ($i=0; $i<(14*10)*4; $i++) {
  $a=int(rand(100));
  $tile="Ga";
  if ($a>94) { $tile="Gg"; }
  if ($a>95) { $tile="Ge"; }        
  if ($a>96) { $tile="Gb"; }
  if ($a>97) { $tile="Gd"; }
  if ($a>98) { $tile="Og"; }
  if ($a>99) { $tile="Re"; }
  $tileset.="$tile";
}

if (!-d "$datadir/maps/$player{'tmap'}") { mkdir "$datadir/maps/$player{'tmap'}"; }
if (!-w "$datadir/maps/$player{'tmap'}") { chmod 0755, "$datadir/maps/$player{'tmap'}"; }
open (FILE, ">$datadir/maps/$player{'tmap'}/t.txt"); print FILE "$tileset\n"; close FILE;
open (FILE, ">$datadir/maps/$player{'tmap'}/s.txt"); print FILE "$cstamp\n"; close FILE;

1;
