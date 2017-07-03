# external, execute static object
$version="1.0";
opendir(DIR,"$datadir/static/$player{'tmap'}"); @static=readdir(DIR); closedir(DIR);
foreach $line (@static) {
  chomp($line); $line=~s/.txt//;
  if (length($line)<3) { next; }
  ($item,$expires,$itemz)=split(/ /, $line);
  if ($itemz eq $player{'tz'}) {
    if (length($item)==2) {
      if (substr($item,0,1) eq "Z") {
        ## special items such as fire pits
        ## do another check for y items
        if ($item eq "Zf") { do "static-Zf.pl"; } # sign
        if ($item eq "Zg") { do "static-Zg.pl"; } # pier
        if ($item eq "Zh") { do "static-Zh.pl"; } # city
        if ($item eq "Zi") { do "static-Zi.pl"; } # fire pit
        if ($item eq "Zj") { do "static-Zj.pl"; } # fire
      } else {
        $f=index($player{'inven'}, "Za");
        # converts filestamp to decimal, add cstamp, convert back to hex
        $estamp=sprintf("%d", hex($expires));
        $estamp=$cstamp+$estamp;
        $estamp=sprintf("%08x", $estamp);
        $player{'inven'}=substr($player{'inven'},0,$f).$item.$estamp.substr($player{'inven'},$f+10);
        do 'inv.pl'; print "dinv=1v\n";
      }
    } else {
      if (substr($item,0,3) eq "NPC") {
        ## npc
        ## if ($item eq "NPCKing") { NPCKing(a) }    
      }  else {
        if ($item) {
         ## buildings
          if ($item eq "TPORT") { do "static-tport.pl"; }
          if ($item eq "WELL") { do "static-well.pl"; }
          if ($item eq "FOUNTAIN") { do "static-fountain.pl"; }          
        } else {
          print "pop=invalid static object\n";
        }
      }
    }  
  }
}

$form{'c'}="refresh";

1;
