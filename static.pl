# external, execute static object
$version="1.0";
print "pop=static\n";
opendir(DIR,"$datadir/static/$player{'tmap'}"); @static=readdir(DIR); closedir(DIR);
foreach $line (@static) {
  chomp($line); $line=~s/.txt//;
  if (length($line)<3) { next; }
  ($item,$expires,$itemz)=split(/ /, $line);
  if ($itemz eq $player{'tz'}) {
    if (length($item)==2) {
      $f=index($player{'inven'}, "Za");
      # converts filestamp to decimal, add cstamp, convert back to hex
      $estamp=sprintf("%d", hex($expires));
      $estamp=$cstamp+$estamp;
      $estamp=sprintf("%08x", $estamp);
      $player{'inven'}=substr($player{'inven'},0,$f).$item.$estamp.substr($player{'inven'},$f+10);
      do 'inv.pl';#print "inv=$player{'inven'}\n";
      print "dinv=1v\n";
    } else {
      if (substr($item,0,3) eq "NPC") {
        ## npc
        ## if ($item eq "NPCKing") { NPCKing(a) }    
      }  else {
        if ($item) {
         ## buildings
          if ($item eq "TPORT") { do "static-tport.pl"; }
        } else {
          print "pop=invalid static object\n";
        }
      }
    }  
  }
}

$form{'c'}="refresh";

1;
