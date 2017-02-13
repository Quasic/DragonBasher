# external, add or delete static object
$version="1.0";
if ($player{'inven'}=~/Zc/) {
  print "pop=delete\n";
  opendir(DIR,"$datadir/static/$player{'tmap'}"); @static=readdir(DIR); closedir(DIR);
  foreach $line (@static) {
    chomp($line); $line=~s/.txt//;
    if (length($line)<3) { next; }
    ($item,$expires,$itemz)=split(/ /, $line);
    if ($itemz eq $player{'tz'}) {
      if ($form{'j'} eq $item) {
        unlink "$datadir/static/$player{'tmap'}/$item $expires $itemz.txt";
        print "pop=$item\n";
      }
    }
  }
}
1;
