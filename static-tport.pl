# internal, telerpots player
$version="1.0";
print "pop=tport\n";
if (-e "$datadir/static/$player{'tmap'}/$line.txt") {
  open (FILE, "$datadir/static/$player{'tmap'}/$line.txt"); $data=<FILE>; close FILE;
}
if ($data=~/\-/) {
  ($player{'map'},$player{'z'})=split(/-/, $data);
  do "loadmap.pl"; do "token.pl";
  $map0="$a1$b1"; $map1="$a1$b2"; $map2="$a2$b1"; $map3="$a2$b2";
  $tileset0=&loadmap($map0); $tileset1=&loadmap($map1); $tileset2=&loadmap($map2); $tileset3=&loadmap($map3);
  print "t0=$tileset0\n"; print "t1=$tileset1\n"; print "t2=$tileset2\n"; print "t3=$tileset3\n"; print "RMap=1\n";
} else {
  if ($player{'name'} eq $data) {
    if ($player{'inven'}=~/Zd/) {
      if (-e "$datadir/quests/$player{'name'}-Ze.txt") {
        print "pop=linking this teleport to that teleport...\n";
        open (FILE, "$datadir/quests/$player{'name'}-Ze.txt");
        $dest=<FILE>;
        close FILE;
        #
        # using tmap creates problem here
        #
        open (FILE, ">$datadir/static/$player{'tmap'}/$line.txt");
        print FILE "$dest";
        close FILE;
        ($destmap,$destz)=split(/\-/, $dest);
        print "pop=linking that teleport to this teleport...\n";
        open (FILE, ">$datadir/static/$destmap/TPORT 00000000 $destz.txt");
        print FILE "$player{'map'}-$player{'z'}";
        close FILE;
        unlink "$datadir/quests/$player{'name'}-Ze.txt";
        print "pop=teleport completed.\n";
      } else {
        open (FILE, ">$datadir/quests/$player{'name'}-Ze.txt");
        print FILE "$player{'map'}-$player{'z'}";
        close FILE;
        print "pop=add another teleport for destination\n";
      }
    } else {
      print "pop=player does not have sysop key\n";
    }
  } else {
    print "pop=player name does not matches\n";
  }
}
1;