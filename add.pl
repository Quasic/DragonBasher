# external, add or delete static object
$version="1.0";

if ($player{'inven'}=~/Zd/) {
  # split $form{'j'} into item and time limit
  # validate $form{'j'} as item
  # $form{'j'}=~s/[^A-Za-z0-9]//g; if (length($form{'j'}<>2) { $form{'j'}=""; }
  if (!-d "$datadir/static/$player{'tmap'}") { mkdir "$datadir/static/$player{'tmap'}"; }
  if (!-w "$datadir/static/$player{'tmap'}") { chmod 0777, "$datadir/static/$player{'tmap'}" }
  ($j,$data)=split(/\-/, $form{'j'});
  $estamp=sprintf("%08x", 0);
  if (length($j)==2) {
    if (substr($j,0,1) ne "Z") {
      $estamp=sprintf("%08x", $data);
      $data=$player{'name'};
    } else {
      if ($j eq "Zf") { $data=substr($form{'j'},2); $data=~s/\-/ /g; }
    }
  } else {
    if (substr($item,0,3) eq "NPC") {
      ## npc
    } else {
      if ($j) {
        ## building
      }
    }  
  }
  if ($j) {
    # go through directory, delete item on z-location
    opendir(DIR, "$datadir/static/$player{'tmap'}");
    while ($item=readdir(DIR)) {
      next if ($item=~m/^\./);
      next unless (substr($item,-4) eq ".txt");
      $item =~ s/.txt//;
      ($ts, $code, $z)=split(/ /,$item);
      if ($player{'tz'} eq $z) {
        unlink "$datadir/static/$player{'tmap'}/$item.txt";
        print "pop=$code deleted\n"; $j="";
      }  
    }  
    closedir DIR;
    # if no item found, add it by creating file
    if ($j) {
      # $token="[name] [expires] [z]";
      if (!-d "$datadir/static/$player{'tmap'}") { mkdir "$datadir/static/$player{'tmap'}"; }
      if (!-w "$datadir/static/$player{'tmap'}") { chmod 0777, "$datadir/static/$player{'tmap'}" }
      open (FILE, ">$datadir/static/$player{'tmap'}/$j $estamp $player{'tz'}.txt");
      print FILE "$data\n";
      close FILE;
      print "pop=$j Added.\n";
    }  
  }
  $form{'c'}='refresh';
}
1;
