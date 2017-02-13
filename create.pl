## external, create a new player file
$version="1.0";

if (-e "$datadir/11-dragon/passwords/$filename.txt") {
  print "error=player file already exists\n";
} else {
  if ($form{'d'} ne $form{'p'}) {
    print "error=passwords do not match\n";
  } else {
     open (FILE,">$datadir/11-dragon/passwords/$filename.txt");
     print FILE "$form{'p'}";
     close FILE;
  }
}

##
## Player Array Notes:
##
##  $player{'map'} always equals map in upper-left hand, the first
##  $player {'z'} equals z of all four maps combined into one
##  Thus, $player{'map'} may be B1, but player may be on C2
##  So while $player{'map'} may be B1, $token may be C2
##

1;
