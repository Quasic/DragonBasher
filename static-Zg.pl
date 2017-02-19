# external, execute pier

##
## need to validate $form{'k'} as valid object (upper case char and lower case char)
##

## fish that require net or pole to catch
$net="GaGd";
$pole="Ge";

if ($player{'inven'}=~/Za/) {
  open (FILE,"$datadir/static/$player{'tmap'}/Zg 00000000 $player{'tz'}.txt");
  $fish=<FILE>;
  close FILE;
  chomp ($fish);

  $odds=0;
  if ($net=~$fish) {
    if ($player{'inven'}=~/Bj/) {
      if ($fish eq "Ga") { $odds=10; $bait="";  }  # minnow
      if ($fish eq "Gd") { $odds=10; $bait="GaGd"; } # crab
    } else {
      print "pop=Need Net\n";
    }
  } else {
    if ($pole=~$fish) {
      if ($player{'inven'}=~/Bk/) {
        if ($fish eq "Ge") { $odds=10; $bait="GaGd"; } # carp
      } else {
        print "pop=Need Pole\n";
      }
    }
  }
  
  if ($bait) {
    if ($player{'inven'}=~/$form{'k'}/) {
      if ($bait=~/$form{'k'}/) {
        if (int(rand(100))<$odds) {
          $f=index($player{'inven'}, "$form{'k'}");
          $player{'inven'}=substr($player{'inven'},0,$f)."Za00000000".substr($player{'inven'},$f+10);
          do 'inv.pl'; print "pop=Lost Bait!\n";
        }
      } else {
        $odds=0;
        print "pop=Need Bait\n";
      }
    } else {
      print "pop=Need Bait\n";
    }    
  }
  
  if ($odds) {
    # catch fish
    if (int(rand(100))<$odds) {
      if ($fish eq "Ga") { $estamp=3600; }
      if ($fish eq "Gd") { $estamp=86400; }
      if ($fish eq "Ge") { $estamp=86400; }
      $f=index($player{'inven'}, "Za");
      $estamp=$cstamp+$estamp; $estamp=sprintf("%08x", $estamp);
      $player{'inven'}=substr($player{'inven'},0,$f).$fish.$estamp.substr($player{'inven'},$f+10);
      do 'inv.pl'; 
      print "pop=You catch a Fish! $a\n";
    } else {
      print "pop=Nothing$a\n";
    }
  }
  
} else {
  print "pop=Full Inventory\n";
}



1;
